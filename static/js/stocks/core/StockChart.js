class StockChart {
    /**
     * Initialize StockChart instance
     * @param containerId - ID of the container element to render the chart in
     * @param symbol - Stock symbol to display
     * @param options - Chart options (chartType, period, interval, start, end, ohlc)
     * @param options.chartType - 'line', 'line-filled', 'candlestick' (default: 'line')
     * @param options.period - Data period ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max') (default: '1mo')
     * @param options.interval - Data interval ('1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo') (default: '1d')
     * @param options.start - Start date for data in 'YYYY-MM-DD' format (optional)
     * @param options.end - End date for data in 'YYYY-MM-DD' format (optional)
     * @param options.ohlc - Whether to use OHLC data (boolean, default: false; forced true for candlestick charts)
     */
    constructor(containerId, symbol, options = {}) {
        this.containerID = containerId;
        this.container = document.getElementById(containerId);
        this.symbol = symbol;
        this.chartType = options.chartType || 'line'; // 'line', 'line-filled', 'candlestick'
        this.chart = null;

        // Settings for data fetching and chart rendering
        this.options = {
            period: options.period || '1mo', // '1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'
            start: options.start || null, // 'YYYY-MM-DD'
            end: options.end || null, // 'YYYY-MM-DD'
            interval: options.interval || '1d', // '1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'
            dataOnly: false
        };
        if (options.ohlc || options.chartType === 'candlestick') this.options.ohlc = true; // Use OHLC data for candlestick charts

        // Ensure Chart.js is loaded
        this._chartJsLoadedPromise = this.ensureChartJsLoaded();
    }

    // Setters and getters
    /**
     * Change the container element for rendering the chart
     * @param containerId
     */
    setContainer(containerId) {
        this.containerID = containerId;
        this.container = document.getElementById(containerId);
    }

    /**
     * Get the current container element
     * @returns {HTMLElement}
     */
    getContainer() {
        return this.container;
    }

    /**
     * Change the stock symbol for the chart & re-render chart
     * @param symbol
     */
    setSymbol(symbol) {
        this.symbol = symbol;
        this.render();
    }

    /**
     * Get the current stock symbol
     * @returns {*}
     */
    getSymbol() {
        return this.symbol;
    }

    /**
     * Change the chart type ('line', 'line-filled', 'candlestick') & re-render chart
     * @param chartType
     */
    setChartType(chartType) {
        this.chartType = chartType;
        if (chartType === 'candlestick') this.options.ohlc = true;
        this.render();
    }

    /**
     * Get the current chart type
     * @returns {*|string}
     */
    getChartType() {
        return this.chartType;
    }

    /**
     * Change chart options (period, interval, start, end, ohlc) & re-render chart
     * @param newOptions
     */
    setOptions(newOptions = {}) {
        this.options = { ...this.options, ...newOptions };
        if (newOptions.ohlc !== undefined) this.options.ohlc = newOptions.ohlc;
        if (newOptions.chartType === 'candlestick') this.options.ohlc = true; // Ensure OHLC for candlestick
        this.render();
    }

    /**
     * Get current chart options
     * @returns {*|{period: (*|string), start: null, end: (*|null), interval: (*|string), dataOnly: boolean}}
     */
    getOptions() {
        return this.options;
    }

    // Main Code Part
    // Main render method to fetch data and display chart
    /**
     * Render the stock chart in the specified container
     * @returns {Promise<void>}
     */
    async render() {
        // Validate required parameters
        if (!this.container) return console.error('No container specified for chart rendering');
        if (!this.symbol) return console.error('No symbol specified for chart rendering');
        if (!this.options) return console.error('No options specified for chart rendering');

        // Show loading message while fetching data
        this.showChartLoading('Fetching data...');

        // Data fetch - use StockAPI for fetching historical data
        const data = await this.fetchHistoryData(this.symbol, this.options);
        if (!data) return console.error('No data returned for chart rendering');

        // Show loading message while rendering chart
        this.showChartLoading('Rendering chart...');

        // Render chart with fetched data
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${this.symbol}-${Date.now()}`;
        canvas.style.width = '100%';
        canvas.style.height = '400px';
        this.container.innerHTML = '';
        this.container.appendChild(canvas);

        await this.createChartJsChart(canvas, data['data'], data['metadata']);
    }

    /**
     * Create and render Chart.js chart in the given canvas element
     * @param canvas
     * @param data
     * @param metadata
     * @returns {Promise<void>}
     */
    async createChartJsChart(canvas, data, metadata = {}) {
        // Ensure Chart.js is loaded
        await this._chartJsLoadedPromise;
        if (!this.isChartJsLoaded()) {
            console.error('Chart.js is not loaded');
            this.showChartError('Failed to load Chart.js. Please try again later');
            return;
        }

        // Use metadata for chart configuration with StockFormatters, but prioritize instance settings
        const symbol = StockFormatters.formatSymbol(metadata.symbol || 'N/A');
        const currency = metadata.currency || 'USD';
        const period = metadata.period || 'N/A';
        const interval = metadata.interval;
        const ohlc = metadata.ohlc || false;

        // Convert interval string like '1d', '1wk' to milliseconds
        const intervalMs = getIntervalInMs(interval);

        // Prepare chart data based on type
        const chartData = prepareChartData(data, ohlc);

        // Check if financial plugin is available, if candlestick chart is requested
        if (this.chartType === 'candlestick' && !this.isChartJsLoaded(['candlestick'])) {
            this.showChartError('Candlestick chart requires Chart.js Financial plugin. Please try line or filled chart types.');
            return console.warn('Financial plugin not available');
        }
        // Create chart configuration based on type
        const chartConfig = createChartConfig(symbol, currency, period, intervalMs, chartData, this.chartType);

        // Create and render Chart.js chart
        const ctx = canvas.getContext('2d');
        this.chart = new Chart(ctx, chartConfig);
    }


    // Render chart loading message
    showChartLoading(message = 'Loading...') {
        this.container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100">
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h5 class="text-muted">${message}</h5>
                </div>
            </div>
        `;
    }

    // Render chart error message
    showChartError(message = 'An error occurred while loading the chart.') {
        this.container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100 text-danger">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h5>${message}</h5>
                    <button class="btn btn-outline-primary mt-2" onclick="this.render()"><i class="fas fa-redo me-1"></i>Retry</button>
                </div>
            </div>
        `;
    }


    // Check and load Chart.js library and required plugins
    // Dynamically load Chart.js and required plugins if not already loaded
    async ensureChartJsLoaded() {
        if (!this.isChartJsLoaded()) {
            // Load Chart.js and required adapters
            await new Promise((resolve, reject) => {
                // First load Chart.js
                const chartScript = document.createElement('script');
                chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                chartScript.onload = () => {
                    console.log('Chart.js loaded dynamically');

                    // Load date adapter for time series
                    const dateAdapter = document.createElement('script');
                    dateAdapter.src = 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns';
                    dateAdapter.onload = () => {
                        console.log('Chart.js Date adapter loaded');

                        // Load financial plugin for candlestick charts
                        const financialPlugin = document.createElement('script');
                        financialPlugin.src = 'https://cdn.jsdelivr.net/npm/chartjs-chart-financial/dist/chartjs-chart-financial.min.js';
                        financialPlugin.onload = () => {
                            console.log('Chart.js Financial plugin loaded');
                            resolve();
                        };
                        financialPlugin.onerror = () => {
                            console.warn('Failed to load Chart.js Financial plugin, using simplified candlestick');
                            resolve(); // Continue without financial plugin
                        };
                        document.head.appendChild(financialPlugin);
                    };
                    dateAdapter.onerror = () => {
                        console.warn('Failed to load Chart.js Date adapter, using simplified charts');
                        resolve(); // Continue without time series support
                    };
                    document.head.appendChild(dateAdapter);
                };
                chartScript.onerror = () => {
                    console.error('Failed to load Chart.js');
                    reject(new Error('Failed to load Chart.js'));
                };
                document.head.appendChild(chartScript);
            });
        }
        return Promise.resolve();
    }

    // Utility method to check if Chart.js is available, and optionally if specific controllers are loaded
    isChartJsLoaded(controllers = []) {
        if (typeof Chart === 'undefined') return false;
        return controllers.every(ctrl => typeof Chart.controllers[ctrl] !== 'undefined');
    }


    // Data Fetching.
    // Fetch historical stock data using StockAPI
    fetchHistoryData(symbol, options) {
        return StockAPI.getStockHistory(symbol, options)
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('Error fetching stock history:', error);
                this.showChartError('Failed to fetch stock data. Please try again later.');
                return null;
            });
    }

    // TEST
    generateMockData() {
        // Generate mock historical data for past 30 days
        const data = [];
        let basePrice = 100 + Math.random() * 400; // Random base price between $100-500
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        for (let i = 0; i < 30; i++) {
            // Random walk with slight upward bias
            const change = (Math.random() - 0.48) * 20; // Slight positive bias
            basePrice += change;
            basePrice = Math.max(basePrice, 10); // Keep price positive

            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);

            data.push({
                price: parseFloat(basePrice.toFixed(2)),
                timestamp: currentDate.getTime()
            });
        }

        return data;
    }
}

/**
 * Create Chart.js configuration based on chart type
 * @param symbol
 * @param currency
 * @param period
 * @param intervalMs
 * @param chartData
 * @param chartType
 * @returns {{type: string, data: {datasets: [{label: string, data: *, borderColor: {up: string, down: string, unchanged: string}, backgroundColor: {up: string, down: string, unchanged: string}, borderSkipped: boolean}]}, options: *&{plugins: *&{tooltip: *&{callbacks: {title: function(*): string, label: function(*): string[]}}}}}|{type: string, data: {labels: *, datasets: [{label: string, data, borderColor, backgroundColor: null, borderWidth: number, fill: boolean, tension: number, pointBackgroundColor, pointBorderColor: string, pointBorderWidth: number, pointRadius: number, pointHoverBackgroundColor, pointHoverBorderColor: string, pointHoverBorderWidth: number, pointHoverRadius: number}]}, options: (*&{plugins: (*&{tooltip: (*&{callbacks: {label: (function(*): string)}})})})}}
 */
function createChartConfig(symbol, currency, period, intervalMs, chartData, chartType = 'line') {
    // Determine colors based on price trend
    const prices = chartData.map(d => (d.price ? d.price : d.close ? d.close : null)).filter(p => p !== null);
    const lineColor = [...prices].reverse() > [...prices] ? '#28a745' : [...prices].reverse() < [...prices] ? '#dc3545' : '#6c757d';
    const fillColor = [...prices].reverse() > [...prices] ? 'rgba(40, 167, 69, 0.1)' : [...prices].reverse() < [...prices] ? 'rgba(220, 53, 69, 0.1)' : 'rgba(108, 117, 125, 0.1)';

    // Create base configuration that's common to all chart types
    const baseConfig = createBaseChartConfig(symbol, period, currency, intervalMs, lineColor);

    // Extend base config with chart type-specific configuration
    if (chartType === 'line' || chartType === 'line-filled')
        return extendConfigForLine(baseConfig, chartData, prices, intervalMs, symbol, lineColor, chartType === 'line-filled' ? fillColor : null);
    else if (chartType === 'candlestick')
        return extendConfigForCandlestick(baseConfig, chartData);
}

/**
 * Create base Chart.js configuration shared across chart types
 * @param symbol
 * @param period
 * @param currency
 * @param intervalMs
 * @param lineColor
 * @returns {{options: {responsive: boolean, maintainAspectRatio: boolean, interaction: {intersect: boolean, mode: string}, plugins: {title: {display: boolean, text: string, font: {size: number, weight: string}, color: string}, legend: {display: boolean}, tooltip: {backgroundColor: string, borderWidth: number, borderColor, displayColors: boolean}}, scales: {x: {display: boolean, title: {display: boolean, text: (string), color: string}, grid: {color: string}, ticks: {color: string}}, y: {display: boolean, title: {display: boolean, text: string, color: string}, grid: {color: string}, ticks: {color: string, callback: (function(*): string)}}}, animation: {duration: number, easing: string}, hover: {animationDuration: number}}}}
 */
function createBaseChartConfig(symbol, period, currency, intervalMs, lineColor) {
    return {
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: `${symbol} Stock Price Chart (${period})`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#495057'
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    borderWidth: 1,
                    borderColor: lineColor,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: period === '1d' ? 'Time' : intervalMs < 24 * 60 * 60 * 1000 ? 'Date & Time' : 'Date',
                        color: '#6c757d'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: `Price (${currency})`,
                        color: '#6c757d'
                    },
                    grid: { color: 'rgba(0,0,0,0.1)' },
                    ticks: {
                        color: '#6c757d',
                        callback: function(value) { return StockFormatters.formatPrice(value, { currency }); }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            hover: {
                animationDuration: 200
            }
        }
    };
}

/**
 * Extend base configuration for line or filled line chart
 * @param baseConfig
 * @param chartData
 * @param prices
 * @param intervalMs
 * @param symbol
 * @param lineColor
 * @param fillColor
 * @returns {{type: string, data: {labels: *, datasets: [{label: string, data, borderColor, backgroundColor: null, borderWidth: number, fill: boolean, tension: number, pointBackgroundColor, pointBorderColor: string, pointBorderWidth: number, pointRadius: number, pointHoverBackgroundColor, pointHoverBorderColor: string, pointHoverBorderWidth: number, pointHoverRadius: number}]}, options: (*&{plugins: (*&{tooltip: (*&{callbacks: {label: (function(*): string)}})})})}}
 */
function extendConfigForLine(baseConfig, chartData, prices, intervalMs, symbol, lineColor, fillColor = null) {
    const labels = chartData.map(point => {
        return StockFormatters.formatDate(new Date(point.timestamp), { format: intervalMs && intervalMs < 24 * 60 * 60 * 1000 ? 'medium' : 'short' });
    });

    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${symbol} Price`,
                data: prices,
                borderColor: lineColor,
                backgroundColor: fillColor,
                borderWidth: 2,
                fill: !!fillColor,
                tension: 0.1,
                pointBackgroundColor: lineColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointRadius: 2,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: '#000',
                pointHoverBorderWidth: 1,
                pointHoverRadius: 4
            }]
        },
        options: {
            ...baseConfig.options,
            plugins: {
                ...baseConfig.options.plugins,
                tooltip: {
                    ...baseConfig.options.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const currency = baseConfig.options.scales.y.title.text.match(/\(([^)]+)\)/)?.[1] || '';
                            const price = StockFormatters.formatPrice(context.parsed.y, { currency });
                            return `${context.dataset.label}: ${price}`;
                        }
                    }
                }
            }
        }
    };
}

/**
 * Extend base configuration for candlestick chart
 * @param baseConfig
 * @param chartData
 * @returns {{type: string, data: {datasets: [{label: string, data: *, borderColor: {up: string, down: string, unchanged: string}, backgroundColor: {up: string, down: string, unchanged: string}, borderSkipped: boolean}]}, options: (*&{plugins: (*&{tooltip: (*&{callbacks: {title: (function(*): string), label: (function(*): string[])}})})})}}
 */
function extendConfigForCandlestick(baseConfig, chartData) {
    return {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'OHLC',
                data: chartData.map(point => ({ x: point.timestamp, o: point.open, h: point.high, l: point.low, c: point.close })),
                borderSkipped: false
            }]
        },
        options: {
            ...baseConfig.options,
            plugins: {
                ...baseConfig.options.plugins,
                tooltip: {
                    ...baseConfig.options.plugins.tooltip,
                    callbacks: {
                        title: function (context) {
                            return new Date(context[0].parsed.x).toLocaleString();
                        },
                        label: function (context) {
                            const data = context.parsed;
                            const currency = baseConfig.options.scales.y.title.text.match(/\(([^)]+)\)/)?.[1] || '';
                            return [
                                `Open: ${data.o.toFixed(2)} ${currency}`,
                                `High: ${data.h.toFixed(2)} ${currency}`,
                                `Low: ${data.l.toFixed(2)} ${currency}`,
                                `Close: ${data.c.toFixed(2)} ${currency}`
                            ];
                        },
                    }
                }
            }
        }
    };
}
