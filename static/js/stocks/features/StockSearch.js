class StockSearch {
    /**
     * StockSearch component for searching stocks and displaying results
     * Can display results in a div or as a table
     * @param inputId - The ID of the search input element
     * @param outputId - The ID of the output container element
     * @param makeItATable - Whether to display results in a table (true) or div (false)
     * @param options - Additional options for table creation (if makeItATable == true) (tableId, watchlistManager)
     * @param options.tableId - The ID for the results table (if makeItATable is true)
     * @param options.watchlistManager - Instance of WatchlistManager for table actions (if makeItATable is true)
     */
    constructor(inputId, outputId, makeItATable = false, options = {}) {
        this.inputId = inputId;
        this.outputId = outputId;

        this.makeItATable = makeItATable;
        this.tableId = options.tableId;
        this.watchlistManager = options.watchlistManager || null;

        this.searchInput = null;
        this.outputContainer = null;
        this.resultsTable = null;
        this.searchTimeout = null;
        this.isSearching = false;

        this.init();
    }

    /** Initialize the search component */
    init() {
        this.searchInput = document.getElementById(this.inputId);
        if (!this.searchInput) return console.error(`Search input not found: ${this.inputId}`);

        this.outputContainer = document.getElementById(this.outputId);
        if (!this.outputContainer) return console.error(`Output container not found: ${this.outputId}`);

        // Initialize StocksTable for table-based results
        if (this.makeItATable) this.resultsTable = new StocksTable(this.tableId || 'search-results-table', this.watchlistManager);

        // Setup event listeners
        this.setupEventListeners();
    }

    /** Setup event listeners for search input and interactions */
    setupEventListeners() {
        // Search on input with debouncing
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (this.searchTimeout) clearTimeout(this.searchTimeout);

            if (query.length < 2) {
                if (query.length === 0) this.clearResults();
                return; // Don't search for single characters
            }

            // Debounce search by 300ms
            this.searchTimeout = setTimeout(() => {
                this.search(query);
            }, 300);
        });

        // Search on Enter key
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query.length === 0) this.clearResults();
                if (query.length >= 2) {
                    if (this.searchTimeout) clearTimeout(this.searchTimeout);
                    this.search(query);
                }
            }
        });

        // Hide results when clicking outside (for div-based only)
        if (!this.makeItATable) {
            document.addEventListener('click', (e) => { if (!this.searchInput.contains(e.target) && !this.outputContainer.contains(e.target)) this.hideOutputContainer() });
            this.searchInput.addEventListener('focus', () => { if (this.searchInput.value.trim().length > 0) this.showOutputContainer() });
        }
    }

    /**
     * Perform the stock search
     * @param query {string} - The search query
     */
    search(query) {
        if (this.isSearching) return;
        this.isSearching = true;

        this.showOutputContainer();
        this.showLoading();

        // Use StockAPI for search
        StockAPI.searchStocks(query)
            .then(result => {
                this.displayResult(result);
            })
            .catch(error => {
                console.error('Search error:', error);
                this.showError('Search failed. Please try again.');
            })
            .finally(() => {
                this.isSearching = false;
            });
    }

    /**
     * Display the search result
     * @param result {object|array} - The stock data object or array of objects
     */
    displayResult(result) {
        if (!result || Array.isArray(result) && result.length === 0 || result.error) {
            this.showNoResults();
            return;
        }

        if (this.makeItATable) {
            // For table-based display
            this.resultsTable.data = [result];
            this.resultsTable.render();
        } else {
            // For div-based display (like ChartPage)
            const stock = Array.isArray(result) ? result[0] : result;
            this.outputContainer.innerHTML = `
                <div class="search-result-item p-2 border rounded cursor-pointer hover-bg-light" id="search-result-${Date.now()}" data-symbol="${stock.symbol}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${StockFormatters.formatSymbol(stock.symbol)}</strong>
                            <div class="text-muted small">${StockFormatters.formatCompanyName(stock.name, 10)}</div>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">${StockFormatters.formatPrice(stock.price)}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /** Clear the current results */
    clearResults() {
        this.hideOutputContainer();
        if (this.makeItATable && this.resultsTable) {
            this.resultsTable.data = [];
            this.resultsTable.render();
        } else {
            this.outputContainer.innerHTML = '';
        }
    }

    /** Show the output container */
    showOutputContainer() {
        this.outputContainer.style.display = 'block';
    }

    /** Hide the output container */
    hideOutputContainer() {
        this.outputContainer.style.display = 'none';
    }

    /**
     * Show a loading spinner/message in the output container
     * @param message {string} - The loading message to display (Defaults to 'Searching...')
     */
    showLoading(message = 'Searching...') {
        if (this.makeItATable) {
            // Table-based loading
            const tbody = this.outputContainer.querySelector('tbody') || document.querySelector(`#${this.tableId} tbody`);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center p-2"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Searching...</span></div><span class="ms-2">${message}</span></td></tr>`;
        } else {
            // Div-based loading
            this.outputContainer.innerHTML = `<div class="text-center p-3"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Searching...</span></div><span class="ms-2">${message}</span></div>`;
        }
    }

    /**
     * Show a no results message in the output container
     * @param message {string} - The no results message to display (Defaults to 'No stocks found')
     */
    showNoResults(message = 'No stocks found') {
        if (this.makeItATable) {
            // Table-based no results
            const tbody = this.outputContainer.querySelector('tbody') || document.querySelector(`#${this.tableId} tbody`);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-2"><i class="fas fa-search me-2"></i>${message}</td></tr>`;
        } else {
            // Div-based no results
            this.outputContainer.innerHTML = `<div class="text-center text-muted p-3"><i class="fas fa-search me-2"></i>${message}</div>`;
        }
    }

    /**
     * Show an error message in the output container
     * @param message {string} - The error message to display (Defaults to a generic message)
     */
    showError(message = 'An error occurred while searching') {
        if (this.makeItATable) {
            // Table-based error
            const tbody = this.outputContainer.querySelector('tbody') || document.querySelector(`#${this.tableId} tbody`);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger p-2"><i class="fas fa-exclamation-triangle me-2"></i>${message}</td></tr>`;
        } else {
            // Div-based error
            this.outputContainer.innerHTML = `<div class="text-center text-danger p-3"><i class="fas fa-exclamation-triangle me-2"></i>${message}</div>`;
        }
    }
}
