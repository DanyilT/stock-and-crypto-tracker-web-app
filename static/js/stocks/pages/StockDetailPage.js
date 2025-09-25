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
        this.initStockChart();
        this.initStockTabs();
    }

    /**
     * Initialize stock chart
     */
    initStockChart() {
        this.assetChart = new AssetChart('chart-container');
        this.assetChart.loadFromURLParams();
        this.assetChart.loadChart(this.symbol);
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
