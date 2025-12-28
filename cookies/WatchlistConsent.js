// static/js/cookies/WatchlistConsent.js

class WatchlistConsent {
    static async request(action = 'save stocks to your watchlist') {
        if (window.cookieManager.hasConsent('watchlist')) {
            return true;
        }

        const modal = new ConsentModal('watchlist', {
            title: 'Watchlist Storage Permission',
            action: action,
            description: 'Save your favorite stocks locally for quick access later.'
        });

        const granted = await modal.show();

        if (granted) {
            showNotification('Watchlist storage enabled! Your stocks will be saved.', 'success');
        } else {
            showNotification('Watchlist storage denied. Stocks won\'t be saved.', 'warning');
        }

        return granted;
    }

    static hasPermission() {
        return window.cookieManager.hasConsent('watchlist');
    }

    static revoke() {
        window.cookieManager.revokeConsent('watchlist');
        showNotification('Watchlist storage disabled and data cleared.', 'info');
    }
}

window.WatchlistConsent = WatchlistConsent;