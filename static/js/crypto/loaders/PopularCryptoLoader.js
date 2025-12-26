/**
 * PopularCryptoLoader - Loads and manages popular cryptocurrency data
 */
class PopularCryptoLoader {
    constructor(table, top = 10, autoLoad = true) {
        this.table = table;
        this.top = top;
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
     * Load full data from API
     */
    async loadFullData() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const data = await CryptoAPI.getPopularCryptos(this.top);
            if (Array.isArray(data)) {
                this.table.data = data;
                this.table.render();
            }
        } catch (error) {
            console.error('Error loading popular cryptos:', error);
        } finally {
            this.isLoading = false;
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
     * Set new top value and reload
     * @param {number} newTop - New number of cryptos to fetch
     */
    setTop(newTop) {
        this.top = newTop;
        this.loadFullData();
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopAutoLoading();
    }
}
