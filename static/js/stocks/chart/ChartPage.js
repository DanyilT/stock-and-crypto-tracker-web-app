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

            chartContainerId: 'chart-container',
            chartTitleId: 'chart-title',
            chartControlsId: 'chart-controls',
            chartTypeSelectId: 'chart-type-select',
            periodSelectId: 'period-select',
            intervalSelectId: 'interval-select',
            customDateRangeId: 'custom-date-range',
            startDateId: 'start-date',
            endDateId: 'end-date',

            fullscreenChartBtnId: 'fullscreen-chart-btn',
            exportChartBtnId: 'export-chart-btn'
        };

        this.currentSymbol = null;
        this.stockSearch = null;
        this.chart = null;
        this.watchlistManager = new StocksWatchlistManager();

        this.init();
    }

    /** Initialize the ChartPage */
    init() {
        this.initializeElements();
        this.setupEventListeners();
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

        // Chart elements
        this.chartContainer = document.getElementById(this.elements.chartContainerId);
        this.chartTitle = document.getElementById(this.elements.chartTitleId);
        this.chartControls = document.getElementById(this.elements.chartControlsId);
        this.chartTypeSelect = document.getElementById(this.elements.chartTypeSelectId);
        this.periodSelect = document.getElementById(this.elements.periodSelectId);
        this.intervalSelect = document.getElementById(this.elements.intervalSelectId);
        this.customDateRange = document.getElementById(this.elements.customDateRangeId);
        this.startDate = document.getElementById(this.elements.startDateId);
        this.endDate = document.getElementById(this.elements.endDateId);

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
                    this.selectStock(firstResult.dataset.symbol);
                    this.stockSearch.hideOutputContainer();
                    this.searchInput.value = '';
                }
            }
        });

        // Add click event listener for search results
        this.searchResultsContainer.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.search-result-item[data-symbol]');
            if (resultItem && resultItem.dataset.symbol) {
                this.selectStock(resultItem.dataset.symbol);
                this.stockSearch.hideOutputContainer();
                this.searchInput.value = '';
            }
        });

        // Stock source selection
        this.stockSourceSelect.addEventListener('change', (e) => this.handleSourceChange(e.target.value));
        this.stockListSelect.addEventListener('change', (e) => this.handleStockListChange(e.target.value));

        // Load chart button
        this.loadChartBtn.addEventListener('click', () => this.loadChart());

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

        // Chart controls - use updateChart instead of loadChart
        this.chartTypeSelect.addEventListener('change', () => this.updateChart({ chartType: this.chartTypeSelect.value }));
        this.periodSelect.addEventListener('change', (e) => {
            this.customDateRange.style.display = e.target.value === 'custom' ? 'flex' : 'none';
            if (e.target.value !== 'custom') this.updateChart({ period: e.target.value });
        });
        this.intervalSelect.addEventListener('change', () => this.updateChart({ interval: this.intervalSelect.value }));
        this.startDate.addEventListener('change', () => {
            if (this.startDate.value && this.endDate.value) this.updateChart({ start: this.startDate.value, end: this.endDate.value });
        });
        this.endDate.addEventListener('change', () => {
            if (this.startDate.value && this.endDate.value) this.updateChart({ start: this.startDate.value, end: this.endDate.value });
        });

        // Fullscreen chart button
        this.fullscreenChartBtn.addEventListener('click', () => {
            if (this.chart) new ChartFullscreenHelper(this.chartContainer, this.chart).enter();
        });

        // Export chart button
        this.exportChartBtn.addEventListener('click', (e) => {
            if (this.chart) new ChartExportMenuHelper(this.exportChartBtn, new ChartExportHelper(this.chart)).show(e);
        });
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

        const priceChange = StockFormatters.formatPriceChange({ absolute: stockData.change, percentage: stockData.changePercent }, { isDecimal: false });
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
        this.chartTitle.textContent = 'Stock Chart';
        this.chartControls.style.display = 'none';
        this.loadChartBtn.disabled = true;

        this.fullscreenChartBtn.style.display = 'none';
        this.exportChartBtn.style.display = 'none';

        // Clear chart
        if (this.chart) {
            this.chartContainer.innerHTML = `
                <div class="d-flex justify-content-center align-items-center h-100 text-muted">
                    <div class="text-center">
                        <i class="fas fa-chart-line fa-3x mb-3"></i>
                        <h5>Select a stock to view its chart</h5>
                        <p class="mb-0">Use the search box or dropdown above to choose a stock</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Load and render the stock chart for the selected symbol (create new StockChart instance - this.chart)
     * @param symbol {string} - The stock symbol to load the chart for (defaults to currentSymbol)
     * @returns {Promise<void>} - Resolves when the chart is loaded and rendered
     */
    async loadChart(symbol = this.currentSymbol) {
        if (!symbol) return;

        // Update chart title and show controls
        this.chartTitle.textContent = `${symbol} Chart`;
        this.chartControls.style.display = 'flex';

        // Show action buttons
        this.fullscreenChartBtn.style.display = '';
        this.exportChartBtn.style.display = '';

        // Prepare chart parameters
        let options = {
            chartType: this.chartTypeSelect.value,
            period: this.periodSelect.value,
            interval: this.intervalSelect.value
        };

        if (options.period === 'custom' && (this.startDate.value && this.endDate.value)) {
            options.period = null;
            options.start = this.startDate.value;
            options.end = this.endDate.value;
        }

        // Create new chart instance
        this.chart = new StockChart(this.elements.chartContainerId, symbol, options);

        // Render the chart
        this.chart.render();
    }

    /**
     * Update the existing chart with new options (without reloading data if possible)
     * @param options {object} - Chart options to update: {chartType, period, interval, start, end}
     */
    updateChart(options = {}) {
        if (!this.chart) return;

        if ('chartType' in options) this.chart.setChartType(options.chartType);
        if (['period', 'interval', 'start', 'end'].some(key => key in options)) this.chart.setOptions(options);
    }
}
