class StocksTable {
    constructor(tableId, watchlistManager) {
        this.tableId = tableId;
        this.data = [];
        this.watchlistManager = watchlistManager;
        this.stockActions = new StockActions(watchlistManager, 'chart-row');

        this.init();
    }

    init() {
        this.tbody = document.getElementById(this.tableId);
        if (!this.tbody) console.error(`Table body not found for ${this.tableId}`);
    }

    render() {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';

        this.data.forEach((item, idx) => {
            const row = this.createTableRow(item, idx);
            this.tbody.appendChild(row);
        });
    }

    createTableRow(item, index) {
        // Helper values
        const marketStatus = this.getMarketStatus(item.market);  // Market open/close status (true/false/unknown)

        // Format values using StockFormatters
        const formattedSymbol = StockFormatters.formatSymbol(item.symbol);
        const formattedName = StockFormatters.formatCompanyName(item.name, 30);
        const formattedPrice = StockFormatters.formatPrice(item.price, { currency: item.currency });
        const formattedMarketCap = StockFormatters.formatMarketCap(item.marketCap, { currency: item.currency });

        // Format price change with color
        const priceChange = StockFormatters.formatPriceChange({ absolute: item.change, percentage: item.changePercent }, { colored: true, showSign: false, showChangeIcon: true, isDecimal: false });

        const row = document.createElement('tr');
        row.dataset.symbol = item.symbol;
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <td><span id="stock-rank-${item.symbol}" class="badge ${marketStatus === true ? 'bg-success' : 'bg-secondary'}">${index + 1}</span></td>
            <td>
                ${item.market ? `<span id="stock-marketstatus-${item.symbol}" class="stock-market-status" data-market="${item.market}" data-market-status="${marketStatus}">${this.getMarketStatusIcon(marketStatus)}</span>` : ''}
                <strong id="stock-symbol-${item.symbol}" class="stock-symbol" data-symbol="${item.symbol}" title="Open Stock Page">${formattedSymbol}</strong>
            </td>
            <td><span id="stock-name-${item.symbol}" class="text-truncate" title="${item.name}">${formattedName}</span></td>
            <td><strong id="stock-price-${item.symbol}">${formattedPrice}</strong></td>
            <td><span id="stock-change-${item.symbol}" class="${StockFormatters.getColorClass(priceChange.combined.color)}">${priceChange.combined.value}</span></td>
            <td><span id="stock-marketcap-${item.symbol}" title="${item.marketCap}">${formattedMarketCap}</span></td>
            <td class="action-buttons">
            </td>
        `;

        // Create watchlist button
        const watchlistBtn = StockActionButton.createWatchlistButton(item.symbol, this.watchlistManager.isInWatchlist(item.symbol), {
            clickHandler: (symbol, action, button) => {
                if (this.stockActions.handleToggleWatchlist(symbol)) {
                    button.updateState(!button.getState());
                }
            }
        });

        // Create chart button
        const chartBtn = StockActionButton.createChartButton(item.symbol, false, {
            clickHandler: (symbol, action, button) => {
                this.prepareToShowChart(symbol);
                if (this.stockActions.handleToggleShowChart(symbol)) {
                    // Update ALL chart buttons to reflect current state
                    this.updateAllChartButtons();
                }
            }
        });

        // Create open button
        const openBtn = StockActionButton.createOpenButton(item.symbol, {
            clickHandler: (symbol, action, button) => {
                this.stockActions.handleOpenStockPage(symbol);
            }
        });

        // Add buttons to the cell
        const actionButtonsCell = row.querySelector('.action-buttons');
        actionButtonsCell.appendChild(watchlistBtn.create());
        actionButtonsCell.appendChild(chartBtn.create());
        actionButtonsCell.appendChild(openBtn.create());

        // Store button references for later use
        row._stockButtons = {
            watchlist: watchlistBtn,
            chart: chartBtn,
            open: openBtn
        };

        this.setupRowEventHandlers(row, item);
        return row;
    }

    getMarketStatus(market) {
        return typeof isMarketOpenForStock === 'function' && market ? isMarketOpenForStock(market).isOpen : null;
    }

    getMarketStatusIcon(isOpen) {
        return isOpen === true ?
            '<i class="fas fa-circle text-success" title="Market Open"></i>' : isOpen === false ?
            '<i class="fas fa-circle text-secondary" title="Market Closed"></i>' :
            '<i class="fas fa-circle-question text-warning" title="Market Status Unknown"></i>';
    }

    setupRowEventHandlers(row, item) {
        // Handle row clicks (chart on first click, open page on second click)
        row.addEventListener('click', (e) => {
            // Don't trigger row click if clicking on buttons or symbol
            if (e.target.closest('.action-buttons') || e.target.closest('.stock-symbol')) return;

            // Handle row click - Show chart
            this.prepareToShowChart(item.symbol);
            if (this.stockActions.handleToggleShowChart(item.symbol)) {
                // Update ALL chart buttons to reflect current state
                this.updateAllChartButtons();
            }
        });

        // Handle symbol click - Open stock page
        row.querySelector('.stock-symbol').addEventListener('click', (e) => {
            e.stopPropagation();
            this.stockActions.handleOpenStockPage(item.symbol);
        });
    }

    prepareToShowChart(symbol) {
        const targetRow = this.tbody.querySelector(`tr[data-symbol="${symbol}"]`);
        if (!targetRow) return;

        // Remove existing chart row if any
        const existingChartRow = document.getElementById('chart-row');
        if (existingChartRow) existingChartRow.remove();

        targetRow.parentNode.insertBefore(Object.assign(document.createElement('tr'), {id: 'chart-row'}), targetRow.nextSibling);
    }

    updateAllChartButtons() {
        // Update all chart button states to reflect current chart state
        let highlightedRow = null;

        this.tbody.querySelectorAll('tr[data-symbol]').forEach(row => {
            const symbol = row.dataset.symbol;
            if (row._stockButtons && row._stockButtons.chart) {
                const isChartOpen = this.stockActions.selectedStock === symbol;
                row._stockButtons.chart.updateState(isChartOpen);

                // Remember which row should be highlighted
                if (isChartOpen) highlightedRow = row;
            }
        });

        // Apply highlighting once after updating all buttons
        this.highlightSelectedRow(highlightedRow);
    }

    highlightSelectedRow(selectedRow) {
        // Remove previous highlights
        this.tbody.querySelectorAll('tr.table-active').forEach(row => {
            row.classList.remove('table-active');
        });
        // Add selection highlight to current row, or just remove all highlights if null
        if (selectedRow) selectedRow.classList.add('table-active');
    }

    updateData(newData) {
        this.data = newData;
        this.render();
    }
}
