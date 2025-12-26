/**
 * WatchlistCryptoLoader - Loads and manages cryptocurrency watchlist data
 */
class WatchlistCryptoLoader {
    constructor(table, watchlistManager, autoLoad = true) {
        this.table = table;
        this.watchlistManager = watchlistManager;
        this.autoLoadEnabled = autoLoad;
        this.isLoading = false;
        this.intervalId = null;
        this.loadInterval = 120000; // 2 minutes - matches backend cache duration

        if (autoLoad) {
            this.loadFullData();
            this.startAutoLoading();
        }
    }

    /**
     * Load full data from API for all watchlist items
     */
    async loadFullData() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const watchlist = this.watchlistManager.getWatchlist();

            if (!watchlist || watchlist.length === 0) {
                this.table.data = [];
                this.table.render();
                this.showEmptyMessage();
                return;
            }

            const cryptoPromises = watchlist.map(async (cryptoId) => {
                try {
                    return await CryptoAPI.getCrypto(cryptoId);
                } catch (error) {
                    console.warn(`Error fetching ${cryptoId}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(cryptoPromises);
            this.table.data = results.filter(r => r && !r.error);
            this.table.render();
        } catch (error) {
            console.error('Error loading watchlist cryptos:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Show empty watchlist message
     */
    showEmptyMessage() {
        const tbody = document.getElementById(this.table.tableId);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Your watchlist is empty. Add cryptocurrencies to your watchlist to see them here.</td></tr>';
        }
    }

    /**
     * Start auto-loading data at intervals
     */
    startAutoLoading() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => {
            if (this.autoLoadEnabled) {
                this.loadFullData();
            }
        }, this.loadInterval);
    }

    /**
     * Stop auto-loading
     */
    stopAutoLoading() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Enable auto-loading
     */
    enableAutoLoading() {
        this.autoLoadEnabled = true;
        this.startAutoLoading();
    }

    /**
     * Disable auto-loading
     */
    disableAutoLoading() {
        this.autoLoadEnabled = false;
    }

    /**
     * Manual reload
     */
    async manualReload() {
        await this.loadFullData();
    }

    /**
     * Called when watchlist is updated
     */
    onWatchlistUpdated() {
        this.loadFullData();
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopAutoLoading();
    }
}
