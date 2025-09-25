class StockDetailPage {
    constructor(symbol, tabsContainerId = 'tabs-container') {
        this.symbol = symbol;
        this.tabsContainerId = tabsContainerId;
        this.init();
    }

    /**
     * Initialize the stock detail page
     */
    init() {
        this.initStockHeader();
        this.initStockChart();
        this.initKeyStats();
        this.initStockTabs();
    }

    /**
     * Initialize stock header with name, symbol, price, and change (and industry if available)
     * @returns {Promise<void>}
     */
    async initStockHeader() {
        try {
            // Fetch stock data for the header
            const stockData = await StockAPI.getStock(this.symbol, true);
            if (!stockData) return console.error('Failed to load stock header data');

            // Update stock name and symbol
            const stockName = document.getElementById('stock-name');
            const stockSymbol = document.getElementById('stock-symbol');
            const sectorIndustry = document.getElementById('sector-industry');

            if (stockName) stockName.textContent = stockData.name || this.symbol;
            if (stockSymbol) stockSymbol.textContent = this.symbol;
            if (sectorIndustry) sectorIndustry.textContent = stockData.industry || '';

            // Update current price and change
            const currentPrice = document.getElementById('current-price');
            const priceChangeElement = document.getElementById('price-change');

            if (currentPrice && stockData.price) currentPrice.textContent = StockFormatters.formatPrice(stockData.price, { currency: stockData.currency });
            if (priceChangeElement && stockData.change !== undefined && stockData.changePercent !== undefined) {
                const change = StockFormatters.formatPriceChange({ absolute: stockData.change, percentage: stockData.changePercent }, { currency: stockData.currency, isDecimal: false }).combined;
                priceChangeElement.textContent = change.value;
                priceChangeElement.classList.add(StockFormatters.getColorClass(change.color));
            }
        } catch (error) {
            console.error('Error initializing stock header:', error);
        }
    }

    /**
     * Initialize stock chart
     */
    initStockChart() {
        this.assetChart = new AssetChart('chart-container', {
            onSymbolClick: (symbol) => {
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('symbol', symbol);
                urlParams.set('chartType', urlParams.get('chartType') || '');
                urlParams.set('period', urlParams.get('period') || '');
                urlParams.set('interval', urlParams.get('interval') || '');
                window.location.href = `/stocks/chart?${urlParams.toString()}`;
        }});
        this.assetChart.loadFromURLParams();
        this.assetChart.loadChart(this.symbol);
    }

    /**
     * Initialize key statistics section
     */
    initKeyStats() {
        this.keyStats = new StockOverviewTab(this.symbol, { title: 'Key Statistics', icon: 'fas fa-info-circle', sections: ['stats', 'market']});
        this.keyStats.init('key-stats-card');

        this.adjustKeyStatsLayout();
    }

    /**
     * Adjust key statistics layout for better readability
     * @returns {Promise<void>}
     */
    async adjustKeyStatsLayout() {
        // Wait for elements to be available in the DOM
        const waitForElements = (selector, timeout = 5000) => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const checkForElements = () => {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        resolve(elements);
                    } else if (Date.now() - startTime > timeout) {
                        reject(new Error(`Timeout waiting for elements: ${selector}`));
                    } else {
                        setTimeout(checkForElements, 100);
                    }
                };
                checkForElements();
            });
        };

        try {
            // Wait for the key stats card to be rendered
            await waitForElements('#key-stats-card .card');

            // Add close button to key stats card
            const keyStatsCard = document.querySelector('#key-stats-card .card');
            if (keyStatsCard) {
                const cardHeader = keyStatsCard.querySelector('.card-header');
                if (cardHeader) {
                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'btn-close btn-sm ms-auto';
                    closeBtn.setAttribute('aria-label', 'Close');
                    closeBtn.addEventListener('click', this.toggleKeyStats.bind(this));

                    // Make header flex to position close button
                    cardHeader.style.display = 'flex';
                    cardHeader.style.alignItems = 'center';
                    cardHeader.appendChild(closeBtn);
                }
            }

            // Wait for col-lg-6 elements and change to col-lg-12
            const lg6Elements = await waitForElements('#key-stats-card .col-lg-6');
            lg6Elements.forEach(element => {
                element.classList.remove('col-lg-6');
                element.classList.add('col-lg-12');
            });

            // Wait for col-lg-3 elements and change to col-lg-6
            const lg3Elements = await waitForElements('#key-stats-card .col-lg-3');
            lg3Elements.forEach(element => {
                element.classList.remove('col-lg-3');
                element.classList.add('col-lg-6');
            });

            // Remove mb-4 from the last row and its child
            const lastRow = document.querySelector('#key-stats-card .row:last-child');
            if (lastRow) {
                lastRow.classList.remove('mb-4');
                lastRow.querySelector('.mb-4').classList.remove('mb-4');
            }
        } catch (error) {
            console.warn('Failed to adjust key stats layout:', error.message);
        }
    }

    /**
     * Toggle visibility of key statistics section
     */
    toggleKeyStats() {
        const keyStatsCard = document.querySelector('#key-stats-card');
        const chartCol = keyStatsCard.parentElement.parentElement.querySelector('.col-lg-8');

        if (keyStatsCard && chartCol) {
            keyStatsCard.classList.toggle('d-none');

            if (keyStatsCard.classList.contains('d-none')) {
                chartCol.classList.remove('col-lg-8');
                chartCol.classList.add('col-lg-12');
            } else {
                chartCol.classList.remove('col-lg-12');
                chartCol.classList.add('col-lg-8');
            }
        }
    }

    /**
     * Initialize stock tabs
     */
    initStockTabs() {
        // Initialize all available stock tabs
        this.stockTabs = new Map([
            ['overview', new StockOverviewTab(symbol)],
            ['dividends', new StockDividendsTab(symbol)],
            ['financials', new StockFinancialsTab(symbol)],
            ['holders', new StockHoldersTab(symbol)],
            ['options', new StockOptionsTab(symbol)],
            ['news', new StockNewsTab(symbol)]
        ]);

        this.activeTab = 'overview';
        this.renderTabsNavigation();
        this.setActiveTab(this.activeTab);
    }

    /**
     * Render tabs navigation and container
     */
    renderTabsNavigation() {
        document.getElementById(this.tabsContainerId).innerHTML = `
            <div class="card border-0">
                <div class="card-header bg-transparent border-0 p-2">
                    <ul class="nav nav-tabs card-header-tabs small" id="stock-tabs" role="tablist">
                        ${Array.from(this.stockTabs.entries()).map(([tabId, tab]) => `
                            <li class="nav-item" role="presentation">
                                <button class="nav-link ${tabId === this.activeTab ? 'active' : ''} py-1 px-2" 
                                        id="${tabId}-tab" 
                                        data-tab-id="${tabId}" 
                                        type="button" 
                                        role="tab">
                                    <i class="${tab.icon} me-1"></i>${tab.title}
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="card-body p-0">
                    <div class="tab-content" id="stock-tab-content">
                        ${Array.from(this.stockTabs.entries()).map(([tabId, tab]) => `
                            <div class="tab-pane fade ${tabId === this.activeTab ? 'show active' : ''}" 
                                 id="${tabId}-content" 
                                 role="tabpanel">
                                <div class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.setupTabEventListeners();
    }

    /**
     * Setup event listeners for tab switching
     */
    setupTabEventListeners() {
        document.querySelectorAll('#stock-tabs button[data-tab-id]').forEach(button => {
            button.addEventListener('click', (e) => { this.setActiveTab(e.target.closest('button').dataset.tabId) });
        });
    }

    /**
     * Set active tab and load its content
     */
    async setActiveTab(tabId) {
        if (!this.stockTabs.has(tabId)) return console.error(`Tab ${tabId} not found`);

        // Update active tab state
        this.activeTab = tabId;

        // Update UI - tab buttons
        document.querySelectorAll('#stock-tabs .nav-link').forEach(btn => { btn.classList.remove('active') });
        document.getElementById(`${tabId}-tab`).classList.add('active');

        // Update UI - tab content
        document.querySelectorAll('.tab-pane').forEach(pane => { pane.classList.remove('show', 'active') });
        document.getElementById(`${tabId}-content`).classList.add('show', 'active');

        // Load tab content
        await this.stockTabs.get(tabId).init(`${tabId}-content`);
    }
}
