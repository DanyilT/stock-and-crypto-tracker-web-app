/**
 * CryptoWatchlistManager - Manages cryptocurrency watchlist with localStorage
 */
class CryptoWatchlistManager {
    constructor() {
        this.watchlistKey = 'cryptoWatchlist';
        this.cookieConsentKey = 'cookieConsent';
        this.watchlistConsentKey = 'cryptoWatchlistConsent';
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
            const ok = confirm('Do you allow using cookies(localStorage) to store your crypto watchlist?');
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

    isInWatchlist(cryptoId) {
        return this.getWatchlist().includes(cryptoId.trim().toLowerCase());
    }

    addToWatchlist(cryptoId) {
        if (!cryptoId) return;
        cryptoId = cryptoId.trim().toLowerCase();

        try {
            this.ensureConsents();
            const list = this.getWatchlist();
            if (!this.isInWatchlist(cryptoId)) {
                list.push(cryptoId);
                localStorage.setItem(this.watchlistKey, JSON.stringify(list));
                showNotification(`${cryptoId} added to watchlist`, 'success', { timeout: 1000 });
            } else {
                showNotification('Crypto is already in your watchlist.', 'warning', { timeout: 2000 });
            }
        } catch (error) {
            console.error('Failed to add to watchlist:', cryptoId);
            throw error;
        }
    }

    removeFromWatchlist(cryptoId) {
        if (!cryptoId) return;
        cryptoId = cryptoId.trim().toLowerCase();

        try {
            this.ensureConsents();
            const list = this.getWatchlist();
            if (this.isInWatchlist(cryptoId)) {
                const next = list.filter(x => x !== cryptoId);
                localStorage.setItem(this.watchlistKey, JSON.stringify(next));
                showNotification(`${cryptoId} removed from watchlist`, 'info', { timeout: 1000 });
            } else {
                showNotification('Crypto is not in your watchlist.', 'warning', { timeout: 2000 });
            }
        } catch (error) {
            console.error('Failed to remove from watchlist:', cryptoId);
            throw error;
        }
    }

    toggleWatchlist(cryptoId) {
        if (this.isInWatchlist(cryptoId)) {
            this.removeFromWatchlist(cryptoId);
            return false;
        } else {
            this.addToWatchlist(cryptoId);
            return true;
        }
    }

    clearWatchlist() {
        try {
            this.ensureConsents();
            localStorage.setItem(this.watchlistKey, JSON.stringify([]));
            showNotification('Watchlist cleared', 'info', { timeout: 1000 });
        } catch (error) {
            console.error('Failed to clear watchlist');
            throw error;
        }
    }
}
