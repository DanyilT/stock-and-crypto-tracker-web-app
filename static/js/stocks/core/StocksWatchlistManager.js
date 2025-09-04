class StocksWatchlistManager {
    constructor() {
        this.watchlistKey = 'stocksWatchlist';
        this.cookieConsentKey = 'cookieConsent';
        this.watchlistConsentKey = 'stocksWatchlistConsent';
    }

    ensureConsents() {
        // Get or initialize cookie consent structure
        const stored = localStorage.getItem(this.cookieConsentKey);
        let cookieConsent = stored ? JSON.parse(stored) : { granted: false, cookies: {} };

        // Check general cookie/localStorage consent
        if (!cookieConsent.granted) {
            const ok = confirm('Do you allow cookies/localStorage to store preferences?');
            if (!ok) {
                showNotification('You must allow cookies/localStorage to use the watchlist.', 'danger', { timeout: 2500 });
                console.warn('Cookie consent not granted.');
                throw new Error('Cookie consent not granted.');
            }

            // Store general consent
            cookieConsent.granted = true;
            cookieConsent.timestamp = new Date().toLocaleString(undefined, { hour12: false, timeZoneName: 'short' });
            localStorage.setItem(this.cookieConsentKey, JSON.stringify(cookieConsent));
        }

        // Check specific watchlist consent for Watchlist usage
        if (!cookieConsent.cookies[this.watchlistConsentKey] || !cookieConsent.cookies[this.watchlistConsentKey].granted) {
            const ok = confirm('Do you allow using cookies(localStorage) to store your stocks watchlist?');
            if (!ok) {
                showNotification('Watchlist requires cookie(localStorage) consent.', 'danger', { timeout: 2000 });
                console.warn('Watchlist consent not granted.');
                throw new Error('Watchlist consent not granted.');
            }

            // Store watchlist consent
            cookieConsent.cookies[this.watchlistConsentKey] = {
                localStorageKeyName: this.watchlistKey,
                granted: true,
                timestamp: new Date().toLocaleString(undefined, { hour12: false, timeZoneName: 'short' })
            };
            localStorage.setItem(this.cookieConsentKey, JSON.stringify(cookieConsent));
        }

        // Ensure list exists if consent was granted
        let cookieConsentGranted = cookieConsent.granted && cookieConsent.cookies[this.watchlistConsentKey].granted;
        if (cookieConsentGranted && !localStorage.getItem(this.watchlistKey)) {
            localStorage.setItem(this.watchlistKey, JSON.stringify([]));
        }
    }

    getWatchlist() {
        try {
            const raw = localStorage.getItem(this.watchlistKey);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    isInWatchlist(symbol) {
        return this.getWatchlist().includes(symbol.trim().toUpperCase());
    }

    addToWatchlist(symbol) {
        if (!symbol) return;
        symbol = symbol.trim().toUpperCase();

        try {
            this.ensureConsents();
            const list = this.getWatchlist();
            if (!this.isInWatchlist(symbol)) {
                list.push(symbol);
                localStorage.setItem(this.watchlistKey, JSON.stringify(list));
                showNotification(`${symbol} added to watchlist`, 'success', { timeout: 1000 });
                // window.dispatchEvent(new CustomEvent('watchlist:updated', { detail: { symbols: list.slice() } }));  // Emit a copy of the list
            } else {
                showNotification('Stock is already in your watchlist.', 'warning', { timeout: 2000 } );
            }
        } catch (error) {
            // Notification already shown in ensureConsents
            console.error('Failed to add to watchlist (localStorage) due to consent issues. Failed to add symbol:', symbol, ', watchlistKey:', this.watchlistKey);
            // Re-throw the error
            throw error;
        }
    }

    removeFromWatchlist(symbol) {
        if (!symbol) return;
        symbol = symbol.trim().toUpperCase();

        try {
            this.ensureConsents();
            const list = this.getWatchlist();
            if (this.isInWatchlist(symbol)) {
                const next = list.filter(x => x !== symbol);
                localStorage.setItem(this.watchlistKey, JSON.stringify(next));
                showNotification(`${symbol} removed from watchlist`, 'info', {timeout: 1000});
                // window.dispatchEvent(new CustomEvent('watchlist:updated', { detail: { symbols: next.slice() } }));  // Emit a copy of the list
            } else {
                showNotification('Stock is not in your watchlist.', 'warning', { timeout: 2000 } );
            }
        } catch (error) {
            // Notification already shown in ensureConsents
            console.error('Failed to remove from watchlist (localStorage) due to consent issues. Failed to remove symbol:', symbol, ', watchlistKey:', this.watchlistKey);
            // Re-throw the error
            throw error;
        }
    }
}
