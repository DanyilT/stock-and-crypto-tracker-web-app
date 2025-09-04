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
            const response = await fetch(`/api/stocks/popular?top=${this.top}`);
            if (!response.ok) throw new Error(`Failed to fetch popular stocks: ${response.status}`);

            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Popular stocks fetch error:', error);
            throw error;
        }
    }

    async fetchStockData(symbol) {
        try {
            const response = await fetch(`/api/stock/${symbol}`);
            if (!response.ok) throw new Error(`Failed to fetch stock data for ${symbol}: ${response.status}`);
            return await response.json();
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
