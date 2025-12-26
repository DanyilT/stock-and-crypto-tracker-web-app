/**
 * CryptoSearch - Search component for cryptocurrencies
 */
class CryptoSearch {
    /**
     * CryptoSearch component for searching cryptos and displaying results
     * @param {string} inputId - The ID of the search input element
     * @param {string} outputId - The ID of the output container element
     * @param {boolean} makeItATable - Whether to display results in a table
     * @param {Object} options - Additional options
     * @param {string} options.tableId - The ID for the results table
     * @param {CryptoWatchlistManager} options.watchlistManager - Watchlist manager instance
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

        // Initialize CryptoTable for table-based results
        if (this.makeItATable) this.resultsTable = new CryptoTable(this.tableId || 'search-results-table', this.watchlistManager);

        this.setupEventListeners();
    }

    /** Setup event listeners */
    setupEventListeners() {
        // Search on input with debouncing
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (this.searchTimeout) clearTimeout(this.searchTimeout);

            if (query.length < 2) {
                if (query.length === 0) this.clearResults();
                return;
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
            document.addEventListener('click', (e) => {
                if (!this.searchInput.contains(e.target) && !this.outputContainer.contains(e.target)) {
                    this.hideOutputContainer();
                }
            });
            this.searchInput.addEventListener('focus', () => {
                if (this.searchInput.value.trim().length > 0) this.showOutputContainer();
            });
        }
    }

    /**
     * Perform the crypto search
     * @param {string} query - The search query
     */
    search(query) {
        if (this.isSearching) return;
        this.isSearching = true;

        this.showOutputContainer();
        this.showLoading();

        CryptoAPI.searchCryptos(query)
            .then(results => {
                this.displayResults(results);
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
     * Display the search results
     * @param {Array} results - Array of crypto search results
     */
    displayResults(results) {
        if (!results || results.length === 0) {
            this.showNoResults();
            return;
        }

        if (this.makeItATable) {
            // For table-based display, we need to fetch full data for each result
            Promise.all(results.slice(0, 5).map(r => CryptoAPI.getCrypto(r.id)))
                .then(cryptoData => {
                    this.resultsTable.data = cryptoData.filter(d => d && !d.error);
                    this.resultsTable.render();
                });
        } else {
            // For div-based display (like ChartPage)
            this.outputContainer.innerHTML = results.slice(0, 5).map(crypto => `
                <div class="search-result-item p-2 border rounded mb-1 cursor-pointer" 
                     data-crypto-id="${crypto.id}" 
                     style="cursor: pointer;">
                    <div class="d-flex align-items-center">
                        ${crypto.image ? `<img src="${crypto.image}" alt="${crypto.symbol}" width="24" height="24" class="me-2 rounded-circle">` : ''}
                        <div>
                            <strong>${CryptoFormatters.formatSymbol(crypto.symbol)}</strong>
                            <div class="text-muted small">${CryptoFormatters.formatName(crypto.name, 20)}</div>
                        </div>
                        ${crypto.rank ? `<span class="badge bg-secondary ms-auto">#${crypto.rank}</span>` : ''}
                    </div>
                </div>
            `).join('');

            // Add click handlers to results
            this.outputContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const cryptoId = item.dataset.cryptoId;
                    window.dispatchEvent(new CustomEvent('crypto:selected', { detail: { cryptoId } }));
                });
            });
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

    /** Show loading state */
    showLoading() {
        if (this.makeItATable) {
            const tbody = document.getElementById(this.tableId);
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Searching...</td></tr>';
        } else {
            this.outputContainer.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
        }
    }

    /** Show no results message */
    showNoResults() {
        if (this.makeItATable) {
            const tbody = document.getElementById(this.tableId);
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No cryptocurrencies found</td></tr>';
        } else {
            this.outputContainer.innerHTML = '<div class="text-center p-3 text-muted">No cryptocurrencies found</div>';
        }
    }

    /** Show error message */
    showError(message) {
        if (this.makeItATable) {
            const tbody = document.getElementById(this.tableId);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${message}</td></tr>`;
        } else {
            this.outputContainer.innerHTML = `<div class="text-center p-3 text-danger">${message}</div>`;
        }
    }

    /** Show output container */
    showOutputContainer() {
        if (this.outputContainer) this.outputContainer.style.display = '';
    }

    /** Hide output container */
    hideOutputContainer() {
        if (this.outputContainer && !this.makeItATable) this.outputContainer.style.display = 'none';
    }
}
