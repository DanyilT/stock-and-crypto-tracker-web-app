/**
 * CryptoTable - Renders cryptocurrency data in a table format
 */
class CryptoTable {
    /**
     * Initializes the CryptoTable instance
     * @param {string} tableId - ID of the table body element
     * @param {CryptoWatchlistManager} watchlistManager - Instance of CryptoWatchlistManager
     */
    constructor(tableId, watchlistManager) {
        this.tableId = tableId;
        this.data = [];
        this.watchlistManager = watchlistManager;
        this.currentChartCryptoId = null;
        this.selectedCrypto = null;
        this.cryptoActions = new CryptoActions(watchlistManager);

        this.init();
    }

    /**
     * Set table ID and reinitialize
     * @param {string} tableId - New table body ID
     */
    setTableId(tableId) {
        this.tableId = tableId;
        this.init();
    }

    /**
     * Get current table ID
     * @returns {string} Current table body ID
     */
    getTableId() {
        return this.tableId;
    }

    /**
     * Initialize the table
     */
    init() {
        this.tbody = document.getElementById(this.tableId);
        if (!this.tbody) console.error(`Table body not found for ${this.tableId}`);
    }

    /**
     * Render the crypto data into the table
     */
    render() {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';
        this.data.forEach((item, idx) => { this.tbody.appendChild(this.createTableRow(item, idx)) });
    }

    /**
     * Create a table row for a crypto item
     * @param {Object} item - Crypto data
     * @param {number} index - Row index
     * @returns {HTMLElement} Table row element
     */
    createTableRow(item, index) {
        // Format values using CryptoFormatters
        const formattedSymbol = CryptoFormatters.formatSymbol(item.symbol);
        const formattedName = CryptoFormatters.formatName(item.name, 25);
        const formattedPrice = CryptoFormatters.formatPrice(item.price);
        const formattedMarketCap = CryptoFormatters.formatMarketCap(item.marketCap);

        // Format price change with color
        const priceChange = CryptoFormatters.formatPriceChange(
            { absolute: item.change, percentage: item.changePercent },
            { colored: true, showSign: true, showChangeIcon: true }
        );

        const row = document.createElement('tr');
        row.dataset.cryptoId = item.id;
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <td><span class="badge bg-primary">${item.rank || index + 1}</span></td>
            <td>
                ${item.image ? `<img src="${item.image}" alt="${item.symbol}" width="24" height="24" class="me-2 rounded-circle">` : ''}
                <strong class="crypto-symbol" data-crypto-id="${item.id}" title="View ${item.name}">${formattedSymbol}</strong>
            </td>
            <td><span class="text-truncate" title="${item.name}">${formattedName}</span></td>
            <td><strong>${formattedPrice}</strong></td>
            <td><span class="${CryptoFormatters.getColorClass(priceChange.combined.color)}">${priceChange.combined.value}</span></td>
            <td><span title="${item.marketCap}">${formattedMarketCap}</span></td>
            <td class="action-buttons"></td>
        `;

        // Create action buttons
        const actionButtonsCell = row.querySelector('.action-buttons');

        // Watchlist button
        const isInWatchlist = this.watchlistManager.isInWatchlist(item.id);
        const watchlistBtn = this.createButton(
            isInWatchlist ? 'fas fa-star' : 'far fa-star',
            isInWatchlist ? 'btn-warning' : 'btn-outline-warning',
            isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist',
            () => this.handleWatchlistToggle(item.id, watchlistBtn)
        );
        watchlistBtn.dataset.inWatchlist = isInWatchlist;

        // Chart button
        const chartBtn = this.createButton(
            'fas fa-chart-line',
            'btn-outline-primary',
            'View chart',
            () => this.handleShowChart(item.id)
        );
        chartBtn.updateState = function(isActive) {
            if (isActive) {
                this.classList.remove('btn-outline-primary');
                this.classList.add('btn-primary');
            } else {
                this.classList.remove('btn-primary');
                this.classList.add('btn-outline-primary');
            }
        };

        // Open button
        const openBtn = this.createButton(
            'fas fa-external-link-alt',
            'btn-outline-secondary',
            'Open details page',
            () => window.location.href = `/crypto/${item.id}`
        );

        actionButtonsCell.appendChild(watchlistBtn);
        actionButtonsCell.appendChild(chartBtn);
        actionButtonsCell.appendChild(openBtn);

        // Store button references for later use
        row._cryptoButtons = {
            watchlist: watchlistBtn,
            chart: chartBtn,
            open: openBtn
        };

        // Row click handlers
        this.setupRowEventHandlers(row, item);

        return row;
    }

    /**
     * Create an action button
     * @param {string} iconClass - Font Awesome icon class
     * @param {string} btnClass - Bootstrap button class
     * @param {string} title - Button title/tooltip
     * @param {Function} clickHandler - Click event handler
     * @returns {HTMLElement} Button element
     */
    createButton(iconClass, btnClass, title, clickHandler) {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${btnClass} me-1`;
        btn.title = title;
        btn.innerHTML = `<i class="${iconClass}"></i>`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            clickHandler();
        });
        return btn;
    }

    /**
     * Handle watchlist toggle
     * @param {string} cryptoId - Crypto ID
     * @param {HTMLElement} btn - Button element
     */
    handleWatchlistToggle(cryptoId, btn) {
        try {
            const isNowInWatchlist = this.watchlistManager.toggleWatchlist(cryptoId);
            btn.dataset.inWatchlist = isNowInWatchlist;
            btn.className = `btn btn-sm ${isNowInWatchlist ? 'btn-warning' : 'btn-outline-warning'} me-1`;
            btn.innerHTML = `<i class="${isNowInWatchlist ? 'fas' : 'far'} fa-star"></i>`;
            btn.title = isNowInWatchlist ? 'Remove from watchlist' : 'Add to watchlist';
        } catch (error) {
            // Consent was denied, don't update button
        }
    }

    /**
     * Handle showing chart for a crypto
     * @param {string} cryptoId - Crypto ID
     */
    handleShowChart(cryptoId) {
        this.currentChartCryptoId = cryptoId;
        this.prepareToShowChart(cryptoId);
        if (this.cryptoActions.handleToggleShowChart(cryptoId)) {
            // Update ALL chart buttons to reflect current state
            this.updateAllChartButtons();
        }
    }

    /**
     * Prepare to show chart by inserting a chart row
     * @param {string} cryptoId - Crypto ID
     */
    prepareToShowChart(cryptoId) {
        const targetRow = this.tbody.querySelector(`tr[data-crypto-id="${cryptoId}"]`);
        if (!targetRow) return;

        // Remove existing chart row if any
        const existingChartRow = document.getElementById('chart-row');
        if (existingChartRow) existingChartRow.remove();

        targetRow.parentNode.insertBefore(
            Object.assign(document.createElement('tr'), { id: 'chart-row' }),
            targetRow.nextSibling
        );
    }

    /**
     * Update all chart buttons to reflect current chart state
     */
    updateAllChartButtons() {
        let highlightedRow = null;

        this.tbody.querySelectorAll('tr[data-crypto-id]').forEach(row => {
            const cryptoId = row.dataset.cryptoId;
            if (row._cryptoButtons && row._cryptoButtons.chart) {
                const isChartOpen = this.cryptoActions.selectedCrypto === cryptoId;
                row._cryptoButtons.chart.updateState(isChartOpen);

                if (isChartOpen) highlightedRow = row;
            }
        });

        this.highlightSelectedRow(highlightedRow);
    }

    /**
     * Highlight the selected row
     * @param {HTMLElement} selectedRow - Row to highlight
     */
    highlightSelectedRow(selectedRow) {
        this.tbody.querySelectorAll('tr.table-active').forEach(row => {
            row.classList.remove('table-active');
        });
        if (selectedRow) selectedRow.classList.add('table-active');
    }

    /**
     * Setup row event handlers
     * @param {HTMLElement} row - Table row element
     * @param {Object} item - Crypto data
     */
    setupRowEventHandlers(row, item) {
        // Row click - show chart
        row.addEventListener('click', (e) => {
            if (e.target.closest('.action-buttons') || e.target.closest('.crypto-symbol')) return;
            this.handleShowChart(item.id);
        });

        // Symbol click - open detail page
        const symbolElement = row.querySelector('.crypto-symbol');
        if (symbolElement) {
            symbolElement.style.cursor = 'pointer';
            symbolElement.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `/crypto/${item.id}`;
            });
        }
    }

    /**
     * Update a specific row in the table
     * @param {Object} newData - Updated crypto data
     */
    updateRow(newData) {
        const index = this.data.findIndex(item => item.id === newData.id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...newData };
            this.render();
        }
    }

    /**
     * Clear all data from the table
     */
    clear() {
        this.data = [];
        if (this.tbody) this.tbody.innerHTML = '';
    }
}
