/**
 * AssetChart - Handles all chart-related functionality for stock assets
 */
class AssetChart {
    constructor(chartContainerId, options = {}) {
        // Chart container element ID
        this.chartContainerId = chartContainerId;

        // Chart-related element IDs
        this.elements = {
            chartContainerId: chartContainerId,
            chartTitleId: 'chart-title',
            chartControlsId: 'chart-controls',
            chartTypeSelectId: 'chart-type-select',
            periodSelectId: 'period-select',
            intervalSelectId: 'interval-select',
            customDateRangeId: 'custom-date-range',
            startDateId: 'start-date',
            endDateId: 'end-date',
        };

        // Current state
        this.currentSymbol = null;
        this.chart = null;

        // Options
        this.options = {
            onSymbolClick: options.onSymbolClick || null,
            onStateChange: options.onStateChange || null,
            linkTitle: options.linkTitle || 'Go to stock page',
            ...options
        };

        this.initializeElements();
        this.setupEventListeners();
    }

    /** Initialize DOM elements */
    initializeElements() {
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
    }

    /** Setup event listeners for chart controls */
    setupEventListeners() {
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
    }

    /**
     * Load chart state from URL parameters
     * @returns {string|null} - The symbol from URL params or null if not present
     */
    loadFromURLParams() {
        const urlParams = new URLSearchParams(window.location.search);

        const symbol = urlParams.get('symbol');
        const chartType = urlParams.get('chartType');
        const period = urlParams.get('period');
        const interval = urlParams.get('interval');
        const start = urlParams.get('start');
        const end = urlParams.get('end');

        // Set form values from URL params
        if (chartType) this.chartTypeSelect.value = chartType;
        if (period) this.periodSelect.value = period;
        if (interval) this.intervalSelect.value = interval;
        if (start) this.startDate.value = start;
        if (end) this.endDate.value = end;

        // Show custom date range if start/end are provided
        if (start && end) {
            this.periodSelect.value = 'custom';
            this.customDateRange.style.display = 'flex';
        }

        return symbol;
    }

    /**
     * Update URL parameters with current chart state
     */
    updateURLParams() {
        const urlParams = new URLSearchParams(window.location.search);

        // Update parameters
        if (this.currentSymbol) urlParams.set('symbol', this.currentSymbol);
        else urlParams.delete('symbol');

        if (this.chartTypeSelect.value) urlParams.set('chartType', this.chartTypeSelect.value);
        if (this.periodSelect.value) urlParams.set('period', this.periodSelect.value);
        if (this.intervalSelect.value) urlParams.set('interval', this.intervalSelect.value);

        if (this.startDate.value && this.endDate.value) {
            urlParams.set('start', this.startDate.value);
            urlParams.set('end', this.endDate.value);
        } else {
            urlParams.delete('start');
            urlParams.delete('end');
        }

        // Update URL without chart reload
        const newURL = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newURL);

        // Notify parent component of state change
        if (this.options.onStateChange) {
            this.options.onStateChange(this.getState());
        }
    }

    /**
     * Load and render the stock chart for the selected symbol
     * @param symbol {string} - The stock symbol to load the chart for
     * @returns {Promise<void>} - Resolves when the chart is loaded and rendered
     */
    async loadChart(symbol) {
        if (!symbol) return;

        this.currentSymbol = symbol;

        // Update chart title and show controls
        this.chartTitle.textContent = `${symbol} Chart`;
        this.chartTitle.parentElement.onclick = () => {
            if (this.options.onSymbolClick) {
                this.options.onSymbolClick(symbol);
            } else {
                window.location.href = `/stock/${symbol}`;
            }
        };
        this.chartTitle.parentElement.style.cursor = 'pointer';
        this.chartTitle.parentElement.title = this.options.linkTitle;
        this.chartControls.style.display = 'flex';

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
        await this.chart.render();

        // Update URL parameters
        this.updateURLParams();

        // Notify parent that chart is loaded (so it can show action buttons)
        if (this.options.onChartLoaded) {
            this.options.onChartLoaded(symbol);
        }
    }

    /**
     * Update the existing chart with new options
     * @param options {object} - Chart options to update: {chartType, period, interval, start, end}
     */
    updateChart(options = {}) {
        if (!this.chart) return;

        if ('chartType' in options) this.chart.setChartType(options.chartType);
        if (['period', 'interval', 'start', 'end'].some(key => key in options)) this.chart.setOptions(options);

        // Update url parameters
        this.updateURLParams();
    }

    /**
     * Clear the chart and reset to initial state
     */
    clearChart() {
        this.currentSymbol = null;
        this.chartTitle.textContent = 'Stock Chart';
        this.chartTitle.parentElement.onclick = null;
        this.chartTitle.parentElement.style.cursor = 'default';
        this.chartTitle.parentElement.title = '';
        this.chartControls.style.display = 'none';

        // Update URL parameters to clear symbol
        this.updateURLParams();

        // Notify parent that chart is cleared
        if (this.options.onChartCleared) {
            this.options.onChartCleared();
        }

        // Clear chart container
        if (this.chart) {
            this.chartContainer.innerHTML = `
                <div class="d-flex justify-content-center align-items-center h-100 text-muted">
                    <div class="text-center">
                        <i class="fas fa-chart-area fa-3x mb-3 opacity-50"></i>
                        <h5>Select a stock to view its chart</h5>
                        <p class="mb-0">Use the search box or dropdown above to choose a stock</p>
                    </div>
                </div>
            `;
            this.chart = null;
        }
    }

    /**
     * Check if chart is currently loaded
     */
    isChartLoaded() {
        return this.chart !== null && this.currentSymbol !== null;
    }

    /**
     * Get current symbol
     */
    getCurrentSymbol() {
        return this.currentSymbol;
    }

    /**
     * Get current chart state
     */
    getState() {
        return {
            symbol: this.currentSymbol,
            chartType: this.chartTypeSelect.value,
            period: this.periodSelect.value,
            interval: this.intervalSelect.value,
            startDate: this.startDate.value,
            endDate: this.endDate.value
        };
    }

    /**
     * Set chart control values
     */
    setChartControls(chartType, period, interval, startDate, endDate) {
        if (chartType) this.chartTypeSelect.value = chartType;
        if (period) this.periodSelect.value = period;
        if (interval) this.intervalSelect.value = interval;
        if (startDate) this.startDate.value = startDate;
        if (endDate) this.endDate.value = endDate;

        // Show custom date range if needed
        if (period === 'custom' && startDate && endDate) {
            this.customDateRange.style.display = 'flex';
        }
    }
}
