class StockChart {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.chartInstance = null;
        this.chartType = options.chartType || 'line'; // 'line', 'filled', 'candlestick'

        // Ensure Chart.js is loaded
        this._chartJsLoadedPromise = this.ensureChartJsLoaded();
    }

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

    // Utility method to check if Chart.js is available
    isChartJsLoaded(controllers = []) {
        if (typeof Chart === 'undefined') return false;
        return controllers.every(ctrl => typeof Chart.controllers[ctrl] !== 'undefined');
    }

    renderChart(symbol, data, chartType = null) {
        if (!this.container) return console.error('No container specified for chart rendering');

        // Update chart type if provided
        if (chartType) this.chartType = chartType;

        // Show loading message while chart is being prepared
        this.showLoadingMessage(this.container, 'Preparing chart...');

        // Create canvas element for Chart.js
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${symbol}-${Date.now()}`;
        canvas.style.width = '100%';
        canvas.style.height = '400px';

        this.container.innerHTML = '';
        this.container.appendChild(canvas);

        this.createChartJsChart(canvas, data['data'], data['metadata']);
    }

    // Create Chart.js chart
    async createChartJsChart(canvas, data, metadata = {}) {
        await this._chartJsLoadedPromise;
        if (!this.isChartJsLoaded()) {
            console.error('Chart.js is not loaded');
            this.showErrorMessage(canvas.parentElement, 'Failed to load Chart.js. Please try again later');
            return;
        }

        // Use metadata for chart configuration with StockFormatters
        const symbol = StockFormatters.formatSymbol(metadata.symbol || 'N/A');
        const currency = metadata.currency || 'USD';
        const period = (metadata.period || 'N/A');
        const interval = metadata.interval;
        const ohlc = metadata.ohlc || false;

        // Convert interval string like '1d', '1wk' to milliseconds
        const intervalMs = this.getIntervalInMs(interval);

        // Prepare chart data based on type
        const chartData = this.prepareChartData(data, ohlc);

        // Create chart configuration based on type
        const chartConfig = this.createChartConfig(symbol, currency, period, intervalMs, chartData);

        const ctx = canvas.getContext('2d');
        this.chartInstance = new Chart(ctx, chartConfig);
    }

    getIntervalInMs(interval) {
        const match = interval?.match(/^(\d+)(m|h|d|wk|mo)$/);
        if (!match) return null;
        const value = Math.max(parseInt(match[1], 10), 0);
        const unit = match[2];
        switch (unit) {
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'wk': return value * 7 * 24 * 60 * 60 * 1000;
            case 'mo': return value * 30 * 24 * 60 * 60 * 1000;
            default: return null;
        }
    }

    prepareChartData(data, ohlc = false) {
        if (Array.isArray(data) && data.length > 0 && data[0].datetime) {
            data = data.map(point => {
                const base = {
                    // Convert ISO datetime to user's local time (timestamp in ms)
                    timestamp: new Date(point.datetime).getTime()
                };
                if (ohlc) {
                    base.open = point.open;
                    base.high = point.high;
                    base.low = point.low;
                    base.close = point.close;
                } else {
                    base.price = point.price;
                }
                return base;
            });
            // Sort by timestamp to ensure proper order
            return data.sort((a, b) => a.timestamp - b.timestamp);
        }
    }

    createChartConfig(symbol, currency, period, intervalMs, chartData) {
        // Determine colors based on price trend
        const hasData = Array.isArray(chartData) && chartData.length > 0;
        const prices = chartData.map(d => (d.price != null ? d.price : d.close));
        const isPositive = [...prices].reverse() >= [...prices];
        const lineColor = isPositive ? '#28a745' : '#dc3545';
        const fillColor = isPositive ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';

        // Create base configuration that's common to all chart types
        const baseConfig = this.createBaseChartConfig(symbol, period, currency, intervalMs, lineColor);

        // Extend base config with chart type-specific configuration
        if (this.chartType === 'candlestick') {
            return this.extendConfigForCandlestick(baseConfig, chartData);
        } else {
            return this.extendConfigForLine(baseConfig, chartData, prices, intervalMs, symbol, lineColor, fillColor);
        }
    }

    createBaseChartConfig(symbol, period, currency, intervalMs, lineColor) {
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

    extendConfigForLine(baseConfig, chartData, prices, intervalMs, symbol, lineColor, fillColor) {
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
                    backgroundColor: this.chartType === 'filled' ? fillColor : null,
                    borderWidth: 2,
                    fill: this.chartType === 'filled',
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

    extendConfigForCandlestick(baseConfig, chartData, lineUpColor = '#26a69a', lineDownColor = '#ef5350', lineUnchangedColor = '#999') {
        // Check if financial plugin is available
        if (!this.isChartJsLoaded(['candlestick'])) {
            console.warn('Financial plugin not available');
            this.showErrorMessage(this.container, 'Candlestick chart requires Chart.js Financial plugin. Please try line or filled chart types.');
            return;
        }

        return {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: 'OHLC',
                    data: chartData.map(point => ({ x: point.timestamp, o: point.open, h: point.high, l: point.low, c: point.close })),
                    borderColor: {
                        up: lineUpColor,
                        down: lineDownColor,
                        unchanged: lineUnchangedColor
                    },
                    backgroundColor: {
                        up: lineUpColor,
                        down: lineDownColor,
                        unchanged: lineUnchangedColor
                    },
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

    showLoadingMessage(container, message = 'Loading...') {
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2 text-muted">${message}</div>
                </div>
            </div>
        `;
    }

    showErrorMessage(container, message = 'An error occurred while loading the chart.') {
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger"></i>
                    <div class="mt-2 text-danger">${message}</div>
                </div>
            </div>
        `;
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
