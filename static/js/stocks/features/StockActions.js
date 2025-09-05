class StockActions {
    constructor(watchlistManager, chartContainerId = null) {
        this.watchlistManager = watchlistManager;
        this.selectedStock = null;
        this.chartContainerId = chartContainerId;
    }

    handleToggleWatchlist(symbol) {
        try {
            if (this.watchlistManager.isInWatchlist(symbol)) {
                this.watchlistManager.removeFromWatchlist(symbol);
                return true;
            } else {
                this.watchlistManager.addToWatchlist(symbol);
                return true;
            }
        } catch (error) {
            console.warn(`Failed to ${this.watchlistManager.isInWatchlist(symbol) ? 'add' : 'remove'} watchlist:`, error.message);
            return false;
        }
    }

    handleToggleShowChart(symbol) {
        if (this.selectedStock === symbol) {
            // Remove chart row
            const existingChartRow = document.getElementById(this.chartContainerId);
            if (existingChartRow) existingChartRow.remove();
            this.selectedStock = null;
        } else {
            this.showChart(symbol);
            this.selectedStock = symbol;
        }
        return true;
    }

    handleOpenStockPage(symbol) {
        // Navigate to stock detail page
        window.location.href = `/stocks/${symbol}`;
    }

    showChart(symbol, period = '1mo', interval = '1d', customStart = null, customEnd = null, chartType = 'line') {
        const chartContainer = document.getElementById(this.chartContainerId);
        chartContainer.innerHTML = `
            <td colspan="100%" style="padding: 20px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
                <div class="chart-wrapper">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="d-flex align-items-center">
                            <h6 class="mb-0 text-primary me-4">
                                <i class="fas fa-chart-line me-2"></i>Chart for ${symbol}
                            </h6>
                            <div class="d-flex gap-3 align-items-center">
                                <div class="d-flex gap-1 align-items-center">
                                    <select class="form-select form-select-sm" id="chart-type-select-${symbol}">
                                        <option value="line" ${chartType === 'line' ? 'selected' : ''}>Line</option>
                                        <option value="filled" ${chartType === 'filled' ? 'selected' : ''}>Filled Line</option>
                                        <option value="candlestick" ${chartType === 'candlestick' ? 'selected' : ''}>Candlestick</option>
                                    </select>
                                </div>
                                <div>
                                    <div class="d-flex gap-1 align-items-center">
                                        <label class="form-label small mb-0">Period</label>
                                        <select class="form-select form-select-sm" id="period-select-${symbol}">
                                            <option value="1d" ${period === '1d' ? 'selected' : ''}>1 Day</option>
                                            <option value="5d" ${period === '5d' ? 'selected' : ''}>5 Days</option>
                                            <option value="1mo" ${period === '1mo' ? 'selected' : ''}>1 Month</option>
                                            <option value="3mo" ${period === '3mo' ? 'selected' : ''}>3 Months</option>
                                            <option value="6mo" ${period === '6mo' ? 'selected' : ''}>6 Months</option>
                                            <option value="1y" ${period === '1y' ? 'selected' : ''}>1 Year</option>
                                            <option value="2y" ${period === '2y' ? 'selected' : ''}>2 Years</option>
                                            <option value="5y" ${period === '5y' ? 'selected' : ''}>5 Years</option>
                                            <option value="10y" ${period === '10y' ? 'selected' : ''}>10 Years</option>
                                            <option value="ytd" ${period === 'ytd' ? 'selected' : ''}>Year to Date</option>
                                            <option value="max" ${period === 'max' ? 'selected' : ''}>Max</option>
                                            <option value="custom" ${period === 'custom' ? 'selected' : ''}>Custom Range</option>
                                        </select>
                                    </div>
                                    <div class="custom-range-controls" style="display:${period === 'custom' ? 'block' : 'none'};">
                                        <div class="d-flex gap-1">
                                            <input type="date" class="form-control form-control-sm" id="custom-start-${symbol}" value="${customStart || ''}" title="start" style="width: 120px;" />
                                            <input type="date" class="form-control form-control-sm" id="custom-end-${symbol}" value="${customEnd || ''}" title="end" style="width: 120px;" />
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex gap-1 align-items-center">
                                    <label class="form-label small mb-0">Interval</label>
                                    <select class="form-select form-select-sm" id="interval-select-${symbol}">
                                        <option value="1m" ${interval === '1m' ? 'selected' : ''}>1 Minute</option>
                                        <option value="2m" ${interval === '2m' ? 'selected' : ''}>2 Minutes</option>
                                        <option value="5m" ${interval === '5m' ? 'selected' : ''}>5 Minutes</option>
                                        <option value="15m" ${interval === '15m' ? 'selected' : ''}>15 Minutes</option>
                                        <option value="30m" ${interval === '30m' ? 'selected' : ''}>30 Minutes</option>
                                        <option value="60m" ${interval === '60m' ? 'selected' : ''}>60 Minutes</option>
                                        <option value="90m" ${interval === '90m' ? 'selected' : ''}>90 Minutes</option>
                                        <option value="1h" ${interval === '1h' ? 'selected' : ''}>1 Hour</option>
                                        <option value="1d" ${interval === '1d' ? 'selected' : ''}>1 Day</option>
                                        <option value="1wk" ${interval === '1wk' ? 'selected' : ''}>1 Week</option>
                                        <option value="1mo" ${interval === '1mo' ? 'selected' : ''}>1 Month</option>
                                        <option value="3mo" ${interval === '3mo' ? 'selected' : ''}>3 Months</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="chart-container-${symbol}" style="width:100%;height:400px;"></div>
                </div>
            </td>
        `;

        // Setup chart controls
        this.setupChartControls(chartContainer, symbol);

        // Render the actual chart
        this.renderChart(symbol, period, interval, customStart, customEnd, chartType);
    }

    setupChartControls(chartContainer, symbol) {
        // Handle chart controls with CSS selector escaping for symbols with dots
        const escapedSymbol = symbol.replace(/\./g, '\\\.');
        const chartTypeSelect = chartContainer.querySelector(`#chart-type-select-${escapedSymbol}`);
        const periodSelect = chartContainer.querySelector(`#period-select-${escapedSymbol}`);
        const intervalSelect = chartContainer.querySelector(`#interval-select-${escapedSymbol}`);
        const customStartInput = chartContainer.querySelector(`#custom-start-${escapedSymbol}`);
        const customEndInput = chartContainer.querySelector(`#custom-end-${escapedSymbol}`);

        chartTypeSelect.onchange = () => {
            this.showChart(symbol, periodSelect.value, intervalSelect.value, customStartInput.value, customEndInput.value, chartTypeSelect.value);
        };

        periodSelect.onchange = () => {
            chartContainer.querySelector('.custom-range-controls').style.display = periodSelect.value === 'custom' ? 'block' : 'none';
            this.showChart(symbol, periodSelect.value, intervalSelect.value, customStartInput.value, customEndInput.value, chartTypeSelect.value);
        };

        intervalSelect.onchange = () => {
            this.showChart(symbol, periodSelect.value, intervalSelect.value, customStartInput.value, customEndInput.value, chartTypeSelect.value);
        };

        customStartInput.onchange = customEndInput.onchange = () => {
            if (periodSelect.value === 'custom' && customStartInput.value && customEndInput.value) {
                this.showChart(symbol, periodSelect.value, intervalSelect.value, customStartInput.value, customEndInput.value, chartTypeSelect.value);
            }
        };
    }

    renderChart(symbol, period, interval, customStart, customEnd, chartType) {
        // Show a loading state before fetching data
        const containerId = `chart-container-${symbol}`;
        const chartEl = document.getElementById(containerId);
        if (chartEl) {
            try {
                const tempChart = new StockChart(containerId);
                tempChart.showLoadingMessage(chartEl, 'Loading chart data...');
            } catch (_) {
                chartEl.innerHTML = '<div class="text-muted">Loading chart data...</div>';
            }
        }

        // Fetch chart data and render chart using StockAPI
        const valid_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'];
        const valid_intervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'];

        let options = {};
        if (valid_periods.includes(period) && valid_intervals.includes(interval)) options = { period, interval };
        else if (period === 'custom' && customStart && customEnd) options = { start: customStart, end: customEnd, interval };
        if (chartType === 'candlestick') options.ohlc = true;

        if (Object.keys(options).length > 0) {
            // Use StockAPI for fetching historical data
            StockAPI.getStockHistory(symbol, options)
                .then(data => {
                    new StockChart(containerId, { chartType }).renderChart(symbol, data);
                })
                .catch(error => {
                    console.error('Error fetching stock data:', error);
                    // Show an error message in the chart area
                    if (chartEl) {
                        try {
                            const tempChart = new StockChart(containerId);
                            tempChart.showErrorMessage(chartEl, 'Failed to load chart data.');
                        } catch (_) {
                            chartEl.innerHTML = '<div class="text-danger">Failed to load chart data.</div>';
                        }
                    }
                });
        }
    }
}
