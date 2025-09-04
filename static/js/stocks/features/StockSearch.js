class StockSearch {
    constructor(inputId, resultsTableContainerId, resultsTableTbodyId, watchlistManager) {
        this.inputId = inputId;
        this.resultsTableContainerId = resultsTableContainerId;
        this.resultsTableTbody = document.getElementById(resultsTableTbodyId);
        this.watchlistManager = watchlistManager;
        this.searchInput = null;
        this.resultsContainer = null;
        this.resultsTable = null;
        this.searchTimeout = null;
        this.isSearching = false;

        this.init();
    }

    init() {
        this.searchInput = document.getElementById(this.inputId);
        if (!this.searchInput) return console.error(`Search input not found: ${this.inputId}`);

        // Setup results table
        this.resultsContainer = document.getElementById(this.resultsTableContainerId);
        if (!this.resultsContainer) return console.error(`Results container not found: ${this.resultsTableContainerId}`);

        // Initialize StocksTable for results - use the tbody ID from template
        this.resultsTable = new StocksTable('search-results-table', this.watchlistManager);

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search on input with debouncing
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Clear previous timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            if (query.length === 0) {
                this.clearResults();
                return;
            }

            if (query.length < 2) {
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
                if (query.length >= 2) {
                    if (this.searchTimeout) {
                        clearTimeout(this.searchTimeout);
                    }
                    this.search(query);
                }
            }
        });
    }

    async search(query) {
        if (this.isSearching) return;

        this.isSearching = true;
        this.showLoading();

        try {
            const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error(`Search failed: ${response.status}`);
            const result = await response.json();
            this.displayResult(result);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        } finally {
            this.isSearching = false;
        }
    }

    displayResult(result) {
        this.resultsContainer.style.display = 'block';

        if (!result || Array.isArray(result) && result.length === 0 || result.error) {
            this.showNoResults();
            return;
        }

        // Since API returns single result, wrap in array for StocksTable
        this.resultsTable.data = [result];
        this.resultsTable.render();
    }

    clearResults() {
        this.resultsContainer.style.display = 'none';
        this.resultsTable.data = [];
        this.resultsTable.render();
    }

    showLoading() {
        this.resultsContainer.style.display = 'block';
        // Render loading state in the table
        this.resultsTableTbody.innerHTML = `<tr><td colspan="7" class="text-center p-2"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Searching...</span></div><span class="ms-2">Searching...</span></td></tr>`;
    }

    showNoResults() {
        // Render no results state in the table
        this.resultsTableTbody.innerHTML = `<tr><td colspan="7" class="text-center p-2 text-muted">No results found</td></tr>`;
    }

    showError(message) {
        // Render error state in the table
        this.resultsTableTbody.innerHTML = `<tr><td colspan="7" class="text-center p-2 text-danger">${message}</td></tr>`;
    }
}
