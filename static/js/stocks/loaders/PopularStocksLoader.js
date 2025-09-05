class PopularStocksLoader extends TableLoader {
    constructor(table, top = 10, autoLoad = true) {
        super(table, autoLoad);
        this.top = top;
    }

    async fetchData() {
        return await this.fetchPopularStocks();
    }

    async fetchPopularStocks() {
        try {
            // Use StockAPI for fetching popular stocks
            const data = await StockAPI.getPopularStocks(this.top);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Popular stocks fetch error:', error);
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

    setTop(newTop) {
        this.top = newTop;
        // Trigger immediate update with new top value
        this.loadFullData();
    }
}
