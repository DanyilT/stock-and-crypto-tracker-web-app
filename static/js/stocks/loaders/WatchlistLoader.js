class WatchlistLoader extends TableLoader {
    constructor(table, watchlistManager, autoLoad = true) {
        super(table, autoLoad);
        this.watchlistManager = watchlistManager;
    }

    async fetchData() {
        return await this.fetchWatchlistStocks();
    }

    async fetchWatchlistStocks() {
        try {
            const watchlistSymbols = this.watchlistManager.getWatchlist();
            if (!watchlistSymbols || watchlistSymbols.length === 0) return [];

            // Fetch data for each symbol in the watchlist using StockAPI
            const stockPromises = watchlistSymbols.map(async (symbol) => {
                try {
                    return await StockAPI.getStock(symbol);
                } catch (error) {
                    console.warn(`Error fetching ${symbol}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(stockPromises);

            // Filter out null results and errors
            return results.filter(result => result && !result.error);
        } catch (error) {
            console.error('Watchlist stocks fetch error:', error);
            throw error;
        }
    }

    async fetchStockData(symbol) {
        try {
            // Use StockAPI for fetching individual stock data
            return await StockAPI.getStock(symbol);
        } catch (error) {
            console.error(`Stock data fetch error for ${symbol}:`, error);
            throw error;
        }
    }

    // Method to refresh when watchlist changes
    onWatchlistUpdated() {
        this.loadFullData();
    }
}
