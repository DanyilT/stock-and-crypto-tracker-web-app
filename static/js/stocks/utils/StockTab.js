/**
 * Base class for stock tabs
 */
class StockTab {
    /**
     * Constructor
     * @param symbol {string} - Stock symbol
     */
    constructor(symbol) {
        this.symbol = symbol;
        this.title = 'Base Tab';
        this.icon = 'fas fa-folder';
        this.id = 'base-tab';
        this.container = null;  // HTML container element (initialized in `setContainer`, `init`)
        this.content = null;    // HTML content (generated in `generateContent`)
        this.data = {};         // Data fetched from the API (loaded in `loadData`)

        this.apiParams = {};   // Options for the API function (set in `setAPI`)
        this.api = null;
    }

    /**
     * Initialize the tab
     * @param containerId {string} - The ID of the HTML container element
     */
    init(containerId) {
        this.setContainer(containerId);
        this.loadData().then(() => {
            this.generateContent();
            this.render();
        });
    }

    /**
     * Set the API function and options for data fetching
     * @param apiFunction {Function} - The API function to fetch data (should return a Promise)
     * @param apiParams {Object} - Options for the API function
     */
    setAPI(apiFunction, apiParams = {}) {
        this.api = () => apiFunction(...Object.values(apiParams));
        this.apiParams = apiParams;
    }

    /**
     * Load data using the specified API function
     * The `this.api` property should be set to a function that returns a Promise resolving to the data.
     */
    async loadData() {
        try {
            this.loading();
            this.data = await this.api();
        } catch (error) {
            this.error(error.message || 'Failed to load data');
            console.error(`Error loading data for ${this.id}:`, error);
            console.log(`API used: ${this.api}`);
            console.log(`Allowed APIs:`, StockAPI);
            throw error;
        }
    }

    /**
     * Generate the HTML content for the tab
     * Override this method in subclasses to create custom content based on `this.data`
     */
    generateContent() {
        this.content = '<p>Override this method in subclasses</p>';
    }

    /**
     * Set the HTML container for the tab
     * @param containerId {string} - The ID of the HTML container element
     */
    setContainer(containerId) {
        this.container = document.getElementById(containerId);
    }

    /**
     * Render the tab content
     * @param additionalElements {string|null} - Additional HTML elements to include above the main content (e.g., buttons, filters)
     */
    render(additionalElements = null) {
        this.renderContainer();
        this.renderContent(additionalElements);
    }

    /**
     * Render the main container structure
     */
    renderContainer() {
        if (!this.container) {
            console.error('Container not set. Please call `setContainer(containerId)` before rendering.');
            return;
        }

        this.container.innerHTML = `
            <div class='card' id="${this.id}">
                <div class='card-header'>
                    <h5 class='card-title mb-0'>
                        <i class='${this.icon} me-2'></i>${this.title}
                    </h5>
                </div>
                <div class='card-body'></div>
            </div>
        `;
    }

    /**
     * Render the content (card-body) element
     */
    renderContent() {
        if (!this.content) {
            this.error('No content to display. Please load data first.');
            console.error(`No content for ${this.id}. Data loaded:`, this.data);
            console.warn('Use `this.generateContent()` to create content after loading data (`this.loadData()`).');
            return;
        }

        this.container.querySelector('.card-body').innerHTML = this.content;

        // Attach pending event handlers if they exist
        if (this._pendingEventHandlers) this._pendingEventHandlers();
    }

    /**
     * Show loading state
     * @param container {HTMLElement|null} - The container to show loading state in (defaults to card-body or main container)
     */
    loading(container = this.container ? this.container.querySelector('.card-body') ? this.container.querySelector('.card-body') : this.container : null) {
        if (container)
            container.innerHTML = `<div class="text-center my-4"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
    }

    /**
     * Show informational note
     * @param message {string} - The message to display
     * @param container {HTMLElement|null} - The container to show the note in (defaults to card-body or main container)
     */
    note(message, container = this.container ? this.container.querySelector('.card-body') ? this.container.querySelector('.card-body') : this.container : null) {
        if (container)
            container.innerHTML = `<div class="alert alert-info my-4"><i class="fas fa-info-circle me-2"></i>${message}</div>`;
    }

    /**
     * Show error message
     * @param message {string} - The error message to display
     * @param container {HTMLElement|null} - The container to show the error in (defaults to card-body or main container)
     */
    error(message, container = this.container ? this.container.querySelector('.card-body') ? this.container.querySelector('.card-body') : this.container : null) {
        if (container)
            container.innerHTML = `<div class="alert alert-danger my-4"><i class="fas fa-exclamation-triangle me-2"></i>Error loading ${this.title.toLowerCase()}: ${message}</div>`;
    }
}


/**
 * Overview tab implementation with configurable content sections
 */
class StockOverviewTab extends StockTab {
    /**
     * Constructor
     * @param symbol {string} - Stock symbol
     * @param options {object} - Configuration options
     * @param options.title {string} - Custom title for the tab (default: 'Overview')
     * @param options.icon {string} - Custom icon class for the tab (default: 'fas fa-chart-line')
     * @param options.sections {Array} - Array of sections to include: ['header', 'stats', 'market', 'company', 'summary']
     */
    constructor(symbol, options = {}) {
        super(symbol);
        this.title = options.title || 'Overview';
        this.icon = options.icon || 'fas fa-chart-line';
        this.id = 'overview-tab';

        // Available sections
        const availableSections = ['header', 'stats', 'market', 'company', 'summary'];
        this.selectedSections = options.sections || availableSections; // Default to all sections
        // If selected sections (not all) set id as "overview-<sections>-tab"
        if (this.selectedSections.length !== availableSections.length) this.id = `overview-${this.selectedSections.join('-')}-tab`;

        this.api = () => StockAPI.getStock(symbol, true);
    }

    /**
     * Generate the HTML content for the overview tab
     */
    generateContent() {
        if (!this.data || typeof this.data !== 'object') {
            this.error('No data available for this stock.');
            return;
        }

        this.content = this.generateMainElements();
    }

    /**
     * Generate the main HTML elements (overview content)
     * @returns {string} - HTML string
     */
    generateMainElements() {
        // Helper function to generate header section
        function generateHeader(data) {
            // Format change data
            const formattedChangeData = StockFormatters.formatPriceChange({ absolute: data.change, percentage: data.changePercent }, { currency: data.currency, isDecimal: false });

            return `
                <div class="row mb-4">
                    <div class="d-flex justify-content-between mb-3">
                        <div>
                            <h3 class="mb-1">${StockFormatters.formatCompanyName(data.name)}</h3>
                            <div class="d-flex gap-3 text-muted align-items-center">
                                <h3 class="h5 mb-0 me-2" title="Symbol">${StockFormatters.formatSymbol(data.symbol)}</h3>
                                <span title="Exchange">${data.exchange}</span>
                                <span title="Currency">${data.currency}</span>
                                <span class="badge bg-secondary" title="Market">${data.market} Market</span>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="h4 mb-1">${StockFormatters.formatPrice(data.price, { currency: data.currency })}</div>
                            <div class="${StockFormatters.getColorClass(formattedChangeData.combined.color)}">${formattedChangeData.combined.value}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Helper function to generate stats cards
        function generateStats(data) {
            // Generate individual stat cards
            function generateStatCard(title, value) {
                return `
                    <div class="col-md-6 col-lg-3 mb-3">
                        <div class="card border-0 bg-light h-100">
                            <div class="card-body text-center">
                                <div class="text-muted small mb-1">${title}</div>
                                <div class="h6 mb-0">${value}</div>
                            </div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="row mb-4">
                    ${generateStatCard('Previous Close', StockFormatters.formatPrice(data.previousClose, { currency: data.currency }))}
                    ${generateStatCard('Open', StockFormatters.formatPrice(data.openPrice, { currency: data.currency }))}
                    ${generateStatCard('Day Range', `${StockFormatters.formatPrice(data.dayLow, { currency: data.currency })} - ${StockFormatters.formatPrice(data.dayHigh, { currency: data.currency })}`)}
                    ${generateStatCard('52 Week Range', `${StockFormatters.formatPrice(data.fiftyTwoWeekLow, { currency: data.currency })} - ${StockFormatters.formatPrice(data.fiftyTwoWeekHigh, { currency: data.currency })}`)}
                </div>
            `;
        }

        // Helper function to generate market data section
        function generateMarketData(data) {
            // Helper function to format market cap size descr (Large Cap, Mid Cap, etc.)
            function formatMarketCapSize(marketCap) {
                if (!marketCap || marketCap === 0) return 'N/A';
                if (marketCap >= 200e9) return 'Large Cap';
                if (marketCap >= 10e9) return 'Mid Cap';
                if (marketCap >= 2e9) return 'Small Cap';
                return 'Micro Cap';
            }

            return `
                <div class="col-lg-6 mb-4">
                    <h5><i class="fas fa-chart-bar me-2"></i>Market Data</h5>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <tbody>
                                <tr>
                                    <td>Market Cap</td>
                                    <td class="text-end" title="${data.marketCap}">${StockFormatters.formatMarketCap(data.marketCap, { currency: data.currency })}<small class="text-muted ms-2">(${formatMarketCapSize(data.marketCap)})</small></td>
                                </tr>
                                <tr>
                                    <td>Volume</td>
                                    <td class="text-end" title="${data.volume}">${StockFormatters.formatVolume(data.volume)}</td>
                                </tr>
                                <tr>
                                    <td>Average Volume</td>
                                    <td class="text-end" title="${data.avgVolume}">${StockFormatters.formatVolume(data.avgVolume)}</td>
                                </tr>
                                <tr>
                                    <td title="Price to Earnings Ratio">P/E Ratio</td>
                                    <td class="text-end">${data.peRatio}</td>
                                </tr>
                                <tr>
                                    <td title="Earnings Per Share">EPS</td>
                                    <td class="text-end">${StockFormatters.formatCurrency(data.eps, { currency: data.currency })}</td>
                                </tr>
                                <tr>
                                    <td title="Dividend Yield">Dividend Yield</td>
                                    <td class="text-end">${data.dividendYield !== 'N/A' ? data.dividendYield + '%' : 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td title="Stock beta measures a stock's volatility or risk relative to the overall market, with a beta of 1 indicating the stock moves in line with the market, a beta above 1 suggesting higher volatility and risk, and a beta below 1 indicating lower volatility and risk">Beta</td>
                                    <td class="text-end">${data.beta}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // Helper function to generate company info section
        function generateCompanyInfo(data) {
            return `
                <div class="col-lg-6 mb-4">
                    <h5><i class="fas fa-building me-2"></i>Company Info</h5>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <tbody>
                                <tr>
                                    <td>Sector</td>
                                    <td class="text-end">${data.sector || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>Industry</td>
                                    <td class="text-end">${data.industry || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>Exchange</td>
                                    <td class="text-end">${data.exchange || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>Currency</td>
                                    <td class="text-end">${data.currency || 'idk, probably USD'}</td>
                                </tr>
                                ${data.website ? `<tr><td>Website</td><td class="text-end"><a href="${data.website}" target="_blank" rel="noopener noreferrer" class="text-decoration-none"><i class="fas fa-external-link-alt me-1"></i>Visit</a></td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // Helper function to generate company summary section
        function generateCompanySummary(summary) {
            return summary ? `
            <div class="row">
                <div class="col-12">
                    <h5><i class="fas fa-info-circle me-2"></i>Business Summary</h5>
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <p class="mb-0">${summary}</p>
                        </div>
                    </div>
                </div>
            </div>
            ` : '';
        }

        return `
            ${this.selectedSections.includes('header') ? generateHeader(this.data) : ''}
            ${this.selectedSections.includes('stats') ? generateStats(this.data) : ''}

            ${this.selectedSections.includes('market') || this.selectedSections.includes('company') ? `<div class="row mb-4">
                ${this.selectedSections.includes('market') ? generateMarketData(this.data) : ''}
                ${this.selectedSections.includes('company') ? generateCompanyInfo(this.data) : ''}
            </div>` : ''}

            ${this.selectedSections.includes('summary') ? generateCompanySummary(this.data.businessSummary) : ''}
        `;
    }
}

/**
 * Dividends tab implementation
 */
class StockDividendsTab extends StockTab {
    /**
     * Constructor
     * @param symbol {string} - Stock symbol
     * @param options {Object} - Options for the tab (e.g., { period: '5y' })
     * @param options.period {string} - Time period for dividend history ('1y', '3y', '5y', 'max') (default: '5y')
     */
    constructor(symbol, options = {}) {
        super(symbol);
        this.title = 'Dividends';
        this.icon = 'fas fa-coins';
        this.id = 'dividends-tab';

        this.apiParams = { period: options.period || '5y' };
        this.api = () => StockAPI.getStockDividends(symbol, ...Object.values(this.apiParams));
    }

    /**
     * Generate the HTML content for the dividends tab
     */
    generateContent() {
        if (!this.data || !this.data.dividends || this.data.dividends.length === 0) {
            this.note('No dividend data available');
            return;
        }

        this.content = this.generateAdditionalElements() + this.generateMainElements();
    }

    /**
     * Generate additional HTML elements (period selector, summary stats) above the main content
     * @returns {string} - HTML string
     */
    generateAdditionalElements() {
        // Store event handlers to be attached after rendering
        this._pendingEventHandlers = () => {
            const periodSelector = this.container.querySelector('#dividend-period-selector');

            if (periodSelector) {
                periodSelector.addEventListener('change', (e) => {
                    this.setAPI(this.api, { period: e.target.value });
                    this.loadData().then(() => {
                        this.generateContent();
                        this.renderContent();
                    });
                });
            }
        };

        // Calculate summary statistics
        const currency = this.data?.metadata?.currency;
        const latestDividend = this.data.dividends[0]; // Data is sorted by date (most recent first)
        const totalDividends = this.data.dividends.reduce((sum, div) => sum + div.amount, 0);
        const averageDividend = totalDividends / this.data.dividends.length;
        const yearsWithDividends = [...new Set(this.data.dividends.map(div => div.year))].length;

        return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex gap-3 align-items-center">
                    <select id="dividend-period-selector" class="form-select form-select-sm w-auto">
                        <option value="1y" ${this.apiParams.period === '1y' ? 'selected' : ''}>1 Year</option>
                        <option value="3y" ${this.apiParams.period === '3y' ? 'selected' : ''}>3 Years</option>
                        <option value="5y" ${this.apiParams.period === '5y' ? 'selected' : ''}>5 Years</option>
                        <option value="max" ${this.apiParams.period === 'max' ? 'selected' : ''}>All Time</option>
                    </select>
                </div>
                <div class="text-muted small">
                    <i class="fas fa-info-circle me-1"></i>
                    ${this.data.dividends.length} payments over ${yearsWithDividends} years
                </div>
            </div>
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-light border-0 h-100">
                        <div class="card-body text-center p-3">
                            <h6 class="text-muted mb-1">Latest Dividend</h6>
                            <h5 class="mb-0 text-success">${StockFormatters.formatPrice(latestDividend.amount, { currency })}</h5>
                            <small class="text-muted">${latestDividend.date}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-light border-0 h-100">
                        <div class="card-body text-center p-3">
                            <h6 class="text-muted mb-1">Total Paid</h6>
                            <h5 class="mb-0 text-primary">${StockFormatters.formatPrice(totalDividends, { currency })}</h5>
                            <small class="text-muted">${this.apiParams.period.toUpperCase()}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-light border-0 h-100">
                        <div class="card-body text-center p-3">
                            <h6 class="text-muted mb-1">Average Payment</h6>
                            <h5 class="mb-0 text-info">${StockFormatters.formatPrice(averageDividend, { currency })}</h5>
                            <small class="text-muted">Per quarter</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-light border-0 h-100">
                        <div class="card-body text-center p-3">
                            <h6 class="text-muted mb-1">Years Paying</h6>
                            <h5 class="mb-0 text-warning">${yearsWithDividends}</h5>
                            <small class="text-muted">Consecutive</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate the main HTML elements (dividend history table and trend chart)
     * @returns {string} - HTML string
     */
    generateMainElements() {
        // Helper function to generate table rows
        function generateTableRows(data, currency) {
            return data.map(dividend => {
                const growthIndicator = data.indexOf(dividend) < data.length - 1 ? (dividend.amount > data[data.indexOf(dividend) + 1].amount ? '<i class="fas fa-arrow-up text-success"></i>' : dividend.amount < data[data.indexOf(dividend) + 1].amount ? '<i class="fas fa-arrow-down text-danger"></i>' : '<i class="fas fa-minus text-muted"></i>') : '';

                return `
                    <tr>
                        <td>${StockFormatters.formatDate(dividend.date, { format: 'short' })}</td>
                        <td class="text-end fw-bold">${StockFormatters.formatPrice(dividend.amount, { currency })}</td>
                        <td class="text-center"><span class="badge bg-secondary">${dividend.quarter}</span></td>
                        <td class="text-center">${dividend.year}</td>
                        <td class="text-center">${growthIndicator}</td>
                    </tr>
                `;
            }).join('');
        }

        // Generate yearly summary rows
        function generateYearlySummary(dividendsByYear, currency) {
            return Object.entries(dividendsByYear).sort(([a], [b]) => b - a) // Sort by year descending
                .map(([year, dividends]) => {
                    return `
                        <tr class="table-light">
                            <td class="fw-bold">${year} Total</td>
                            <td class="text-end fw-bold text-primary">${StockFormatters.formatPrice(dividends.reduce((sum, div) => sum + div.amount, 0), { currency })}</td>
                            <td class="text-center">${dividends.length} payments</td>
                            <td class="text-center">-</td>
                            <td class="text-center">${dividends.length > 1 ? (dividends[dividends.length - 1].amount < dividends[0].amount ? '<i class="fas fa-arrow-up text-success"></i>' : dividends[dividends.length - 1].amount > dividends[0].amount ? '<i class="fas fa-arrow-down text-danger"></i>' : '<i class="fas fa-minus text-muted"></i>') : '-'}</td>
                        </tr>
                    `;
                }).join('');
        }

        // Group dividends by year for summary
        const dividendsByYear = this.data.dividends.reduce((acc, div) => {
            if (!acc[div.year]) acc[div.year] = [];
            acc[div.year].push(div);
            return acc;
        }, {});

        // Generate and return the full HTML content
        return `
            <div class="row">
                <div class="table-responsive">
                    <table class="table table-sm table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Payment Date</th>
                                <th class="text-end">Amount</th>
                                <th class="text-center">Quarter</th>
                                <th class="text-center">Year</th>
                                <th class="text-center">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateTableRows(this.data.dividends, this.data?.metadata.currency)}
                            ${Object.keys(dividendsByYear).length > 1 ? `<tr><td colspan="5" class="border-0 p-1"></td></tr>${generateYearlySummary(dividendsByYear, this.data?.metadata.currency)}` : ''}
                        </tbody>
                    </table>
                </div>
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        Dividend amounts are shown in the stock's trading currency. 
                        Trend indicators compare to previous payment.
                    </small>
                </div>
            </div>
        `;
    }
}

/**
 * Financials tab implementation
 */
class StockFinancialsTab extends StockTab {
    /**
     * Constructor
     * @param symbol {string} - Stock symbol
     * @param options {Object} - Options for the tab (e.g., { type: 'income', quarterly: false })
     * @param options.type {string} - Statement type: 'income', 'balance', or 'cashflow' (default: 'income')
     * @param options.quarterly {boolean} - Whether to show quarterly data (default: false for annual)
     */
    constructor(symbol, options = {}) {
        super(symbol);
        this.title = 'Financials';
        this.icon = 'fas fa-calculator';
        this.id = 'financials-tab';

        this.apiParams = { type: options.type || 'income' };
        if (options.quarterly) this.apiParams.quarterly = true;
        this.api = () => StockAPI.getStockFinancials(symbol, ...Object.values(this.apiParams));
    }

    /**
     * Generate the HTML content for the financials tab
     */
    generateContent() {
        if (!this.data || !this.data.data || !this.data.periods || this.data.periods.length === 0) {
            this.note('No financial data available');
            return;
        }

        this.content = this.generateAdditionalElements() + this.generateMainElements();
    }

    /**
     * Generate additional HTML elements (statement type selector, quarterly toggle) above the main content
     * @returns {string} - HTML string
     */
    generateAdditionalElements() {
        // Store event handlers to be attached after rendering
        this._pendingEventHandlers = () => {
            const typeSelector = this.container.querySelector('#financials-type-selector');
            const quarterlyToggle = this.container.querySelector('#financials-quarterly-toggle');

            if (typeSelector) {
                typeSelector.addEventListener('change', (e) => {
                    this.setAPI(this.api, { type: e.target.value });
                    this.loadData().then(() => {
                        this.generateContent();
                        this.renderContent();
                    });
                });
            }

            if (quarterlyToggle) {
                quarterlyToggle.addEventListener('change', (e) => {
                    if (e.target.checked) this.apiParams.quarterly = true;
                    else delete this.apiParams.quarterly;
                    this.loadData().then(() => {
                        this.generateContent();
                        this.renderContent();
                    });
                });
            }
        };

        return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex gap-2 align-items-center">
                    <label class="form-label mb-0" for="financials-type-selector">Statement Type:</label>
                    <select class="form-select form-select-sm w-auto" id="financials-type-selector">
                        <option value="income" ${this.apiParams.type === 'income' ? 'selected' : ''}>Income Statement</option>
                        <option value="balance" ${this.apiParams.type === 'balance' ? 'selected' : ''}>Balance Sheet</option>
                        <option value="cashflow" ${this.apiParams.type === 'cashflow' ? 'selected' : ''}>Cash Flow</option>
                    </select>
                </div>
                <div class="form-check form-switch mb-0">
                    <input class="form-check-input" type="checkbox" id="financials-quarterly-toggle" ${this.apiParams?.quarterly ? 'checked' : ''}>
                    <label class="form-check-label" for="financials-quarterly-toggle">Quarterly Data</label>
                </div>
            </div>
        `;
    }

    /**
     * Generate the main HTML elements (financials table)
     * @returns {string} - HTML string
     */
    generateMainElements() {
        // Helper function to generate table header
        function generateTableHeader(periods) {
            return `
                <thead class="table-dark">
                    <tr>
                        <th class="text-start" style="width: 300px;">Item</th>
                        ${periods.map(period => `<th class="text-end">${StockFormatters.formatDate(period, { format: 'short' })}</th>`).join('')}
                    </tr>
                </thead>
            `;
        }

        // Helper function to populate table rows
        const populateTable = (data, periods) => {
            const rows = [];

            // Key financial metrics to prioritize and group
            const keyMetrics = { income: ['total_revenue', 'operating_revenue', 'cost_of_revenue', 'gross_profit', 'operating_expense', 'operating_income', 'ebit', 'ebitda', 'interest_expense', 'pretax_income', 'tax_provision', 'net_income'], balance: ['total_assets', 'current_assets', 'cash_and_equivalents', 'inventory', 'total_liabilities', 'current_liabilities', 'total_debt', 'stockholders_equity'], cashflow: ['operating_cash_flow', 'investing_cash_flow', 'financing_cash_flow', 'free_cash_flow', 'capital_expenditure', 'dividends_paid'] };

            // Get available fields in order of importance
            [ ...keyMetrics[this.apiParams.type]?.filter(field => Object.keys(data).includes(field)) || [], ...Object.keys(data).filter(field => !keyMetrics[this.apiParams.type]?.includes(field)) ].forEach(field => {
                const values = data[field];
                if (!values || !Array.isArray(values)) return;

                rows.push(`
                    <tr>
                        <td class="fw-medium">${field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').trim()}</td>
                        ${values.map(value => `<td class="text-end ${value < 0 ? 'text-danger' : ''}" title="${value || ''}">${StockFormatters.formatLargeNumber(value)}</td>`).join('')}
                    </tr>
                `);
            });

            return rows.join('');
        };

        // Generate and return the full HTML content
        return `
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    ${generateTableHeader(this.data.periods)}
                    <tbody>
                        ${populateTable(this.data.data, this.data.periods)}
                    </tbody>
                </table>
            </div>

            <div class="mb-3 text-muted small">
                <h6>${this.data.symbol} - ${{ 'income': 'Income Statement', 'balance': 'Balance Sheet', 'cashflow': 'Cash Flow Statement' }[this.apiParams.type]} (${this.apiParams?.quarterly ? 'Quarterly' : 'Annual'})</h6>
                <i class="fas fa-info-circle me-1"></i>
                <small>All figures in original currency</small>
            </div>
        `;
    }
}

/**
 * Holders tab implementation
 */
class StockHoldersTab extends StockTab {
    /**
     * Constructor
     * @param symbol {string} - Stock symbol
    */
    constructor(symbol) {
        super(symbol);
        this.title = 'Holders';
        this.icon = 'fas fa-user-friends';
        this.id = 'holders-tab';

        this.api = () => StockAPI.getStockHolders(symbol);
    }

    /**
     * Generate the HTML content for the holders tab
     */
    generateContent() {
        if (!this.data || !this.data.institutional || this.data.institutional.length === 0)
            return this.note('No holders data available');

        this.content = this.generateMainElements();
    }

    /**
     * Generate the main HTML elements (holders table)
     * @returns {string} - HTML string
     */
    generateMainElements() {
        // Helper function to generate table header
        function generateTableHeader() {
            return `
                <thead class="table-light">
                    <tr>
                        <th>Holder</th>
                        <th class="text-end">Shares</th>
                        <th class="text-end">Value</th>
                        <!-- <th class="text-end">Percent Out</th> -->
                        <th class="text-end">Date Reported</th>
                    </tr>
                </thead>
            `;
        }

        // Helper function to populate table rows
        function populateTable(holders) {
            return holders.map(holder => `
                <tr>
                    <td title="${holder.holder}">${holder?.holder ? StockFormatters.formatCompanyName(holder.holder, 30) : '-'}</td>
                    <td class="text-end" title="${holder?.shares || ''}">${holder.shares ? StockFormatters.formatLargeNumber(holder.shares) : '-'}</td>
                    <td class="text-end" title="${holder?.value ? StockFormatters.formatVolume(holder.value, { compact: true }) : ''}">${holder.value ? StockFormatters.formatVolume(holder.value, { compact: false }) : '-'}</td>
                    <!-- <td class="text-end" title="${holder?.percentOut || ''}">${holder.percentOut ? StockFormatters.formatPercentage(holder.percentOut) : '-'}</td> -->
                    <td class="text-end" title="${holder?.dateReportedTimestamp ? StockFormatters.formatDate(holder.dateReportedTimestamp * 1000, { format: 'long' }) : ''}">${holder.dateReportedTimestamp ? StockFormatters.formatDate(holder.dateReportedTimestamp * 1000, { format: 'short' }) : '-'}</td>
                </tr>
            `).join('');
        }

        // Generate and return the full HTML content
        return `
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    ${generateTableHeader()}
                    <tbody class="small">
                        ${populateTable(this.data.institutional)}
                    </tbody>
                </table>
            </div>
        `;
    }
}

/**
 * Options tab implementation
 */
class StockOptionsTab extends StockTab {
    /**
     * Constructor
     * @param symbol {string} - Stock symbol
     * @param options {Object} - Options for the tab (e.g., { expiration: null })
     * @param options.expiration {string|null} - Specific expiration date to load (default: null for first available), format: 'YYYY-MM-DD'
     */
    constructor(symbol, options = {}) {
        super(symbol);
        this.title = 'Options';
        this.icon = 'fas fa-file-contract';
        this.id = 'options-tab';

        this.apiParams = { expiration: options.expiration || null };
        this.api = () => StockAPI.getStockOptions(symbol, ...Object.values(this.apiParams));
    }

    /**
     * Generate the HTML content for the options tab
     */
    generateContent() {
        if (!this.data || !this.data.availableExpirations || this.data.availableExpirations.length === 0)
            return this.note('No options data available');

        this.content = this.generateAdditionalElements() + this.generateMainElements();
    }

    /**
     * Generate additional HTML elements (expiration selector) above the main content
     * @returns {string} - HTML string
     */
    generateAdditionalElements() {
        // Store event handlers to be attached after rendering
        this._pendingEventHandlers = () => {
            const expirationSelect = this.container.querySelector('#options-expiration-select');

            if (expirationSelect) {
                expirationSelect.addEventListener('change', (event) => {
                    this.setAPI(this.api, { expiration: event.target.value });
                    this.loadData().then(() => {
                        this.generateContent();
                        this.renderContent();
                    });
                });
            }
        };

        return `
            <div class="mb-3">
                <label for="options-expiration-select" class="form-label">Expiration Date:</label>
                <select class="form-select" id="options-expiration-select">
                    ${this.data.availableExpirations.map(date => `<option value="${date}" ${date === this.data.metadata?.expiration ? 'selected' : ''}>${StockFormatters.formatDate(date, { format: 'short' })}</option>`).join('')}
                </select>
            </div>
        `;
    }

    /**
     * Generate the main HTML elements (options table)
     * @returns {string} - HTML string
     */
    generateMainElements() {
        // Helper function to generate table header
        function generateTableHeader() {
            return `
                <thead class="table-light">
                    <tr>
                        <th colspan="9" class="text-center text-success">CALLS</th>
                        <th class="text-center fw-bold">Strike</th>
                        <th colspan="9" class="text-center text-danger">PUTS</th>
                    </tr>
                    <tr class="small">
                        <th title="Contract Name">Contract</th>
                        <th title="Last Trade Date">Date</th>
                        <th title="Last Price">Price</th>
                        <th title="Bid">Bid</th>
                        <th title="Ask">Ask</th>
                        <th title="Change (% Change)">Change</th>
                        <th title="Volume">Volume</th>
                        <th title="Open Interest">OI</th>
                        <th title="Implied Volatility">IV</th>
                        <th title="Strike Price" class="fw-bold">Price</th>
                        <th title="Contract Name">Contract</th>
                        <th title="Last Trade Date">Date</th>
                        <th title="Last Price">Price</th>
                        <th title="Bid">Bid</th>
                        <th title="Ask">Ask</th>
                        <th title="Change (% Change)">Change</th>
                        <th title="Volume">Volume</th>
                        <th title="Open Interest">OI</th>
                        <th title="Implied Volatility">IV</th>
                    </tr>
                </thead>
            `;
        }

        // Helper function to populate table rows
        function populateTable(allStrikes, calls, puts, currency) {
            const rows = [];

            allStrikes.forEach(strike => {
                const call = calls.find(c => c.strike === strike);
                const put = puts.find(p => p.strike === strike);

                const formattedCallChange = call ? StockFormatters.formatPriceChange({ absolute: call.change, percentage: call.changePercent }, { colored: true, isDecimal: false }).combined : { value: '-', color: 'neutral' };
                const formattedPutChange = put ? StockFormatters.formatPriceChange({ absolute: put.change, percentage: put.changePercent }, { colored: true, isDecimal: false }).combined : { value: '-', color: 'neutral' };

                rows.push(`
                    <tr>
                        <!-- CALLS -->
                        <td class="text-success" title="${call?.contractName || ''}">${call ? '...' + call.contractName.slice(-12) : '-'}</td>
                        <td class="text-success" title="${call?.lastTradeDateTimestamp ? StockFormatters.formatDate(call.lastTradeDateTimestamp * 1000) : ''}">${call ? StockFormatters.formatDate(call.lastTradeDateTimestamp * 1000, { format: 'short' }) || 'N/A' : '-'}</td>
                        <td class="text-success fw-bold">${call ? StockFormatters.formatPrice(call.lastPrice, { currency }) : '-'}</td>
                        <td class="text-success">${call ? StockFormatters.formatPrice(call.bid, { currency }) : '-'}</td>
                        <td class="text-success">${call ? StockFormatters.formatPrice(call.ask, { currency }) : '-'}</td>
                        <td class="${getColorClass(formattedCallChange.color)}">${formattedCallChange.value}</td>
                        <td class="text-success" title="${call?.volume ? StockFormatters.formatVolume(call.volume, { compact: false }) : ''}">${call ? StockFormatters.formatVolume(call.volume, { compact: true }) : '-'}</td>
                        <td class="text-success" title="${call?.openInterest || ''}">${call ? StockFormatters.formatLargeNumber(call.openInterest) : '-'}</td>
                        <td class="text-success">${call ? StockFormatters.formatPercentage(call.impliedVolatility, { isDecimal: false }) : '-'}</td>
                        <!-- STRIKE -->
                        <td class="text-center fw-bold bg-light">${StockFormatters.formatPrice(strike)}</td>
                        <!-- PUTS -->
                        <td class="text-danger" title="${put?.contractName || ''}">${put ? '...' + put.contractName.slice(-12) : '-'}</td>
                        <td class="text-danger" title="${put?.lastTradeDateTimestamp ? StockFormatters.formatDate(put.lastTradeDateTimestamp * 1000) : ''}">${put ? StockFormatters.formatDate(put.lastTradeDateTimestamp * 1000, { format: 'short' }) || 'N/A' : '-'}</td>
                        <td class="text-danger fw-bold">${put ? StockFormatters.formatPrice(put.lastPrice, { currency }) : '-'}</td>
                        <td class="text-danger">${put ? StockFormatters.formatPrice(put.bid, { currency }) : '-'}</td>
                        <td class="text-danger">${put ? StockFormatters.formatPrice(put.ask, { currency }) : '-'}</td>
                        <td class="${getColorClass(formattedPutChange.color)}">${formattedPutChange.value}</td>
                        <td class="text-danger" title="${put?.volume ? StockFormatters.formatVolume(put.volume, { compact: false }) : ''}">${put ? StockFormatters.formatVolume(put.volume, { compact: true }) : '-'}</td>
                        <td class="text-danger" title="${put?.openInterest || ''}">${put ? StockFormatters.formatLargeNumber(put.openInterest) : '-'}</td>
                        <td class="text-danger">${put ? StockFormatters.formatPercentage(put.impliedVolatility, { isDecimal: false }) : '-'}</td>
                    </tr>
                `);
            });
            return rows.join('');
        }

        // Get all unique strikes
        const callStrikes = new Set(this.data.calls.map(c => c.strike));
        const putStrikes = new Set(this.data.puts.map(p => p.strike));
        const allStrikes = [...new Set([...callStrikes, ...putStrikes])].sort((a, b) => a - b);

        // Generate and return the full HTML content
        return `
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    ${generateTableHeader()}
                    <tbody class="small">
                        ${populateTable(allStrikes, this.data.calls, this.data.puts, this.data.metadata?.currency)}
                    </tbody>
                </table>
            </div>

            <div class="mb-3 text-muted small">
                <i class="fas fa-info-circle me-1"></i>
                Symbol: ${this.data.metadata?.symbol || this.symbol} | 
                Expiration: ${StockFormatters.formatDate(this.data.metadata?.expiration || this.data.availableExpirations[0])}
            </div>
        `;
    }
}

/**
 * News tab implementation
 */
class StockNewsTab extends StockTab {
    /**
     * Constructor
     * @param symbol {string} - Stock symbol
     * @param options {Object} - Options for the tab (e.g., { limit: 10 })
     * @param options.limit {number} - Number of news articles to fetch (default: 10)
     */
    constructor(symbol, options = {}) {
        super(symbol);
        this.title = 'News';
        this.icon = 'fas fa-newspaper';
        this.id = 'news-tab';

        this.apiParams = { limit: options.limit || 10 };
        this.api = () => StockAPI.getStockNews(symbol, ...Object.values(this.apiParams));
    }

    /**
     * Generate the HTML content for the news tab
     * This method creates a responsive grid of news articles with expandable summaries
     */
    generateContent() {
        if (!this.data || !Array.isArray(this.data) || this.data.length === 0)
            return this.note('No news articles found for this stock.');

        this.content = this.generateAdditionalElements() + this.generateMainElements();
    }

    /**
     * Generate additional HTML elements (refresh button, limit selector, search link) above the main content
     * @returns {string} - HTML string
     */
    generateAdditionalElements() {
        // Store event handlers to be attached after rendering
        this._pendingEventHandlers = () => {
            const refreshBtn = this.container.querySelector('#news-refresh-btn');
            const limitSelect = this.container.querySelector('#news-limit-select');

            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadData().then(() => {
                        this.generateContent();
                        this.renderContent();
                    });
                });
            }

            if (limitSelect) {
                limitSelect.addEventListener('change', (event) => {
                    this.setAPI(this.api, { limit: parseInt(event.target.value, 10) });
                    this.loadData().then(() => {
                        this.generateContent();
                        this.renderContent();
                    });
                });
            }
        };

        return `
            <div class="d-flex justify-content-end align-items-center gap-2 mb-3">
                <button class="btn btn-sm btn-outline-secondary" id="news-refresh-btn"><i class="fas fa-sync-alt me-1"></i>Refresh</button>
                <select class="form-select form-select-sm w-auto" id="news-limit-select">
                    ${Array.from({length: 10}, (_, i) => i + 1).map(i => `<option value="${i}" ${this.apiParams.limit === i ? 'selected' : ''}>${i} Articles</option>`).join('')}
                </select>
                <a href="https://www.google.com/search?q=${encodeURIComponent(this.symbol)}+news" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-search me-1"></i>Search More News</a>
            </div>
        `;
    }

    /**
     * Generate the main HTML elements (grid of news articles)
     * @returns {string} - HTML string
     */
    generateMainElements() {
        // Helper function to generate individual article cards
        function generateArticles(data) {
            let articlesHTML = [];

            data.forEach((article, index) => {
                const thumbnail = article.thumbnail && article.thumbnail.length > 0 ? article.thumbnail : null;
                const url = article.link || '#';
                const title = article.title || 'No title';
                const source = article.publisher || 'Unknown source';
                const publishDate = article.published ? StockFormatters.formatDate(article.published * 1000) : 'Unknown date';
                const summary = article.summary || 'No summary available';

                articlesHTML.push(`
                    <div class="col-md-3 mb-3">
                        <div class="card h-100">
                            ${thumbnail ? `<img src="${thumbnail}" class="card-img-top" alt="${title}">` : ''}
                            <div class="card-body">
                                <h6 class="card-title"><a href="${url}" target="_blank" class="text-decoration-none">${title}</a></h6>
                                <p class="card-text small text-muted">${source} • ${publishDate}</p>
                                ${createSummary(summary, index)}
                            </div>
                        </div>
                    </div>
                `);
            });
            return articlesHTML.join('');
        }

        // Helper function to create expandable summary
        function createSummary(summary, index) {
            if (summary.length > 150) {
                const shortSummaryId = `summary-short-${index}`;
                const fullSummaryId = `summary-full-${index}`;

                return `
                    <div class="collapse show" id="${shortSummaryId}">
                        <p class="card-text">
                            ${summary.substring(0, 150)}...
                            <a class="text-decoration-none small" data-bs-toggle="collapse" data-bs-target="#${shortSummaryId}, #${fullSummaryId}" href="#${fullSummaryId}" role="button" aria-expanded="false" aria-controls="${shortSummaryId} ${fullSummaryId}">Read more</a>
                        </p>
                    </div>
                    <div class="collapse" id="${fullSummaryId}">
                        <p class="card-text">${summary}</p>
                        <a class="text-decoration-none small" data-bs-toggle="collapse" data-bs-target="#${shortSummaryId}, #${fullSummaryId}" href="#${shortSummaryId}" role="button" aria-expanded="true" aria-controls="${shortSummaryId} ${fullSummaryId}">Show less</a>
                    </div>
                `;
            } else {
                return `<p class="card-text">${summary}</p>`;
            }
        }

        // Generate the grid of articles
        return `<div class="row">${generateArticles(this.data)}</div>`;
    }
}
