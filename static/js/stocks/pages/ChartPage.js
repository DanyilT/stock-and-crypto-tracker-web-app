class ChartPage {
    constructor() {
        // Elements IDs
        this.elements = {
            searchInputId: 'stock-search-input',
            searchResultsContainerId: 'stock-search-results-container',

            stockSourceSelectId: 'stock-source-select',
            stockListSelectId: 'stock-list-select',
            loadChartBtnId: 'load-chart-btn',

            currentStockInfoId: 'current-stock-info',
            currentStockSymbolId: 'current-stock-symbol',
            currentStockNameId: 'current-stock-name',
            currentStockExchangeId: 'current-stock-exchange',
            currentStockPriceId: 'current-stock-price',
            currentStockChangeId: 'current-stock-change',

            fullscreenChartBtnId: 'fullscreen-chart-btn',
            exportChartBtnId: 'export-chart-btn'
        };

        this.currentSymbol = null;
        this.stockSearch = null;
        this.assetChart = new AssetChart('chart-container', {
            onSymbolClick: (symbol) => window.location.href = `/stock/${symbol}`,
            onStateChange: (state) => this.onChartStateChange(state),
            onChartLoaded: (symbol) => this.onChartLoaded(symbol),
            onChartCleared: () => this.onChartCleared(),
            linkTitle: 'Go to stock details page'
        });
        this.watchlistManager = new StocksWatchlistManager();

        this.init();
    }

    /** Initialize the ChartPage */
    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadFromURLParams();
        this.loadInitialWatchlistData();
    }

    /** Initialize DOM elements */
    initializeElements() {
        // Initialize search functionality
        this.stockSearch = new StockSearch(this.elements.searchInputId, this.elements.searchResultsContainerId, false);

        // Search elements
        this.searchInput = document.getElementById(this.elements.searchInputId);
        this.searchResultsContainer = document.getElementById(this.elements.searchResultsContainerId);

        // Selection elements
        this.stockSourceSelect = document.getElementById(this.elements.stockSourceSelectId);
        this.stockListSelect = document.getElementById(this.elements.stockListSelectId);
        this.loadChartBtn = document.getElementById(this.elements.loadChartBtnId);

        // Current stock info elements
        this.currentStockInfo = document.getElementById(this.elements.currentStockInfoId);
        this.currentStockSymbol = document.getElementById(this.elements.currentStockSymbolId);
        this.currentStockName = document.getElementById(this.elements.currentStockNameId);
        this.currentStockExchange = document.getElementById(this.elements.currentStockExchangeId);
        this.currentStockPrice = document.getElementById(this.elements.currentStockPriceId);
        this.currentStockChange = document.getElementById(this.elements.currentStockChangeId);

        // Chart action buttons
        this.fullscreenChartBtn = document.getElementById(this.elements.fullscreenChartBtnId);
        this.exportChartBtn = document.getElementById(this.elements.exportChartBtnId);
    }

    setupEventListeners() {
        // Enhanced search input handling with Tab navigation
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Enter on input - select first result if available
                const firstResult = this.searchResultsContainer.querySelector('.search-result-item[data-symbol]');
                if (firstResult && firstResult.dataset.symbol) {
                    this.selectStock(firstResult.dataset.symbol).then(() => {
                        this.stockSearch.hideOutputContainer();
                        this.searchInput.value = '';
                    });
                }
            }
        });

        // Add click event listener for search results
        this.searchResultsContainer.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.search-result-item[data-symbol]');
            if (resultItem && resultItem.dataset.symbol) {
                this.selectStock(resultItem.dataset.symbol).then(() => {
                    this.stockSearch.hideOutputContainer();
                    this.searchInput.value = '';
                });
            }
        });

        // Stock source selection
        this.stockSourceSelect.addEventListener('change', (e) => this.handleSourceChange(e.target.value));
        this.stockListSelect.addEventListener('change', (e) => this.handleStockListChange(e.target.value));

        // Load chart button
        this.loadChartBtn.addEventListener('click', () => this.assetChart.loadChart(this.currentSymbol));

        // Stock info hover and click to unselect
        this.currentStockInfo.addEventListener('mouseover', () => {
            if (this.currentSymbol) {
                this.currentStockInfo.style.opacity = '0.7';
                this.currentStockInfo.style.cursor = 'pointer';
                this.currentStockInfo.title = 'Click to clear selection';
                if (!this.currentStockInfo.querySelector('.fa-minus')) {
                    this.currentStockInfo.insertAdjacentHTML('beforeend', '<i class="fas fa-minus position-absolute top-50 start-50 translate-middle fs-2 text-secondary"></i>');
                }
            }
        });
        this.currentStockInfo.addEventListener('mouseout', () => {
            this.currentStockInfo.style.opacity = '1';
            this.currentStockInfo.style.cursor = 'default';
            this.currentStockInfo.title = '';
            this.currentStockInfo.querySelectorAll('.fa-minus').forEach(icon => icon.remove());
        });
        this.currentStockInfo.addEventListener('click', () => this.unselectStock());

        // Fullscreen chart button
        this.fullscreenChartBtn.addEventListener('click', () => {
            if (this.assetChart.chart) new ChartFullscreenHelper(this.assetChart.chartContainer, this.assetChart.chart).enter();
        });

        // Export chart button
        this.exportChartBtn.addEventListener('click', (e) => {
            if (this.assetChart.chart) new ChartExportMenuHelper(this.exportChartBtn, new ChartExportHelper(this.assetChart.chart)).show(e);
        });
    }

    /**
     * Load chart state from URL parameters
     */
    loadFromURLParams() {
        const symbol = this.assetChart.loadFromURLParams();

        // Load symbol if provided
        if (symbol) this.selectStock(symbol).then(() => this.assetChart.loadChart(symbol));
    }

    /**
     * Handle chart state changes
     */
    onChartStateChange(state) {
        // Handle any additional logic when chart state changes, later... probably....
        console.log('Chart state changed:', state);
    }

    /**
     * Handle when chart is loaded
     */
    onChartLoaded(symbol) {
        // Show action buttons when chart is loaded
        this.fullscreenChartBtn.style.display = '';
        this.exportChartBtn.style.display = '';
    }

    /**
     * Handle when chart is cleared
     */
    onChartCleared() {
        // Hide action buttons when chart is cleared
        this.fullscreenChartBtn.style.display = 'none';
        this.exportChartBtn.style.display = 'none';
    }

    /**
     * Load initial watchlist data and update the watchlist option in the stock source select
     */
    loadInitialWatchlistData() {
        // Load watchlist count for display
        const watchlistCount = this.watchlistManager.getWatchlist().length;
        const watchlistOption = this.stockSourceSelect.querySelector('option[value="watchlist"]');
        if (watchlistOption) {
            watchlistOption.textContent = `My Watchlist (${watchlistCount})`;
            watchlistOption.disabled = watchlistCount === 0;
        }
    }

    /**
     * Handle changes to the stock source selection, then populateStockList(stocks)
     * @async await StockAPI.getStock(symbol) - Fetch stock data by symbol
     * @param source {string} - The selected stock source ('popular' or 'watchlist')
     * @returns {Promise<void>} - Resolves when the stock list is updated
     */
    async handleSourceChange(source) {
        this.stockListSelect.innerHTML = '<option value="">Loading...</option>';
        this.stockListSelect.disabled = true;

        try {
            let stocks = [];

            if (source === 'popular') {
                stocks = await StockAPI.getPopularStocksList(20, false);
            } else if (source === 'watchlist') {
                stocks = await Promise.all(
                    this.watchlistManager.getWatchlist().map(async (symbol) => {
                        try {
                            const data = await StockAPI.getStock(symbol);
                            return { symbol: data.symbol, name: data.name, price: data.price };
                        } catch (error) {
                            console.warn(`Failed to load ${symbol}:`, error);
                            showNotification(`Failed to load data for ${symbol}`, 'warning');
                            return { symbol, name: symbol, price: 0 };
                        }
                    })
                );
            } else {
                this.stockListSelect.innerHTML = '<option value="">Invalid source</option>';
                console.error('Invalid stock source selected:', source);
                showNotification('Invalid stock source selected', 'danger');
                return;
            }

            this.populateStockList(stocks);
        } catch (error) {
            this.stockListSelect.innerHTML = '<option value="">Error loading stocks</option>';
            console.error('Error loading stocks:', error);
            showNotification('Error loading stocks. Please try again.', 'danger');
        }
    }

    /**
     * Populate the stock list dropdown with given stocks
     * @todo FIX: HAVE A BUG ! 👀 LOOK AT THE COMMENT BELOW
     * @param stocks {Array} - Array of stock objects (<option>) with {symbol, name, price}
     */
    populateStockList(stocks) {
        if (!stocks || stocks.length === 0) {
            this.stockListSelect.innerHTML = '<option value="">No stocks available</option>';
            return;
        }

        const options = ['<option value="">Select a stock...</option>'];
        stocks.forEach(stock => {
            if (stock && stock.symbol) {
                // Format: SYMBOL - Name (Price)
                const formattedPrice = StockFormatters.formatPrice(stock.price); // FIX: There is a bug, with which I don't want to deal now. This (`StockFormatters.formatPrice()`) format price is using default currency (USD), but the currency for the stock can be different (e.g. look at 2222.SR - SAR currency).)
                options.push(`<option value="${stock.symbol}">${stock.symbol} - ${stock.name} (${formattedPrice})</option>`);
            }
        });

        this.stockListSelect.innerHTML = options.join('');
        this.stockListSelect.disabled = false;
    }

    /**
     * Change handler for stock list selection
     * @param symbol {string} - The selected stock symbol
     */
    handleStockListChange(symbol) {
        this.loadChartBtn.disabled = !symbol;
        if (symbol) this.selectStock(symbol);
    }

    /**
     * Select a stock by symbol and update the current stock info display
     * @param symbol
     * @returns {Promise<void>}
     */
    async selectStock(symbol) {
        try {
            const stockData = await StockAPI.getQuote(symbol);
            this.updateCurrentStockInfo(stockData);
            this.currentSymbol = symbol;
            this.loadChartBtn.disabled = false;
        } catch (error) {
            console.error('Error selecting stock:', error);
            showNotification(`Failed to load data for ${symbol}`, 'danger');
        }
    }

    /**
     * Update the current stock info display
     * @param stockData {object} - The stock data object with {symbol, name, exchange, price, change, changePercent, currency}
     */
    updateCurrentStockInfo(stockData) {
        this.currentStockSymbol.textContent = StockFormatters.formatSymbol(stockData.symbol);
        this.currentStockName.textContent = StockFormatters.formatCompanyName(stockData.name);
        this.currentStockExchange.textContent = stockData.exchange || 'N/A';
        this.currentStockPrice.textContent = StockFormatters.formatPrice(stockData.price, { currency: stockData.currency });

        const priceChange = StockFormatters.formatPriceChange({ absolute: stockData.change, percentage: stockData.changePercent }, { isDecimal: false }); // TODO: FIX: same issue as above.. with currency
        this.currentStockChange.className = `small ${StockFormatters.getColorClass(priceChange.combined.color)}`;
        this.currentStockChange.textContent = priceChange.combined.value;

        this.currentStockInfo.style.display = 'block';
    }

    /**
     * Unselect the current stock and reset the display
     */
    unselectStock() {
        this.currentSymbol = null;
        this.currentStockInfo.style.display = 'none';
        this.loadChartBtn.disabled = true;

        // Clear chart using AssetChart
        this.assetChart.clearChart();
    }
}
