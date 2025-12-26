/**
 * CryptoActions - Manages crypto-related actions (chart display, watchlist, etc)
 */
class CryptoActions {
    constructor(watchlistManager, pageContext = 'chart-row') {
        this.watchlistManager = watchlistManager;
        this.pageContext = pageContext;
        this.selectedCrypto = null;
        this.cryptoChart = null;
    }

    /**
     * Handle toggling chart display for a crypto
     * @param {string} cryptoId - Crypto ID
     * @returns {boolean} Whether chart display was toggled
     */
    handleToggleShowChart(cryptoId) {
        // If clicking the same crypto, close the chart
        if (this.selectedCrypto === cryptoId) {
            this.selectedCrypto = null;
            const chartRow = document.getElementById('chart-row');
            if (chartRow) chartRow.remove();
            return true;
        }

        // Otherwise open chart for this crypto
        this.selectedCrypto = cryptoId;
        this.loadChart(cryptoId);
        return true;
    }

    /**
     * Load and display chart for a crypto
     * @param {string} cryptoId - Crypto ID
     */
    async loadChart(cryptoId) {
        const chartRow = document.getElementById('chart-row');
        if (!chartRow) return;

        // Create chart container cell
        const chartCell = document.createElement('td');
        chartCell.colSpan = 7;
        chartCell.style.padding = '15px';
        chartRow.appendChild(chartCell);

        // Create the chart container div
        const chartContainer = document.createElement('div');
        chartContainer.style.height = '400px';
        chartContainer.style.position = 'relative';
        chartCell.appendChild(chartContainer);

        // Create canvas for chart
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);

        chartCell.innerHTML = '<div style="height: 400px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-spinner fa-spin fa-3x"></i></div>';

        try {
            // Fetch historical data
            const historyData = await CryptoAPI.getCryptoHistory(cryptoId, { days: '30' });

            if (!historyData || !historyData.data || historyData.data.length === 0) {
                throw new Error('No chart data available');
            }

            // Render the chart
            chartCell.innerHTML = '';
            const newCanvas = document.createElement('canvas');
            chartCell.appendChild(newCanvas);

            const ctx = newCanvas.getContext('2d');
            this.renderChart(ctx, historyData.data, cryptoId);
        } catch (error) {
            console.error('Error loading chart:', error);
            chartCell.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #dc3545;">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Failed to load chart</p>
                </div>
            `;
        }
    }

    /**
     * Render line chart using Chart.js
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} data - Historical data points
     * @param {string} cryptoId - Crypto ID
     */
    renderChart(ctx, data, cryptoId) {
        // Destroy existing chart if any
        if (this.cryptoChart) {
            this.cryptoChart.destroy();
        }

        const labels = data.map(d => new Date(d.datetime));
        const prices = data.map(d => d.price);

        this.cryptoChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price (USD)',
                    data: prices,
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Price: ${CryptoFormatters.formatPrice(context.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                day: 'MMM d',
                                hour: 'HH:mm'
                            }
                        }
                    },
                    y: {
                        ticks: {
                            callback: (value) => CryptoFormatters.formatPrice(value)
                        }
                    }
                }
            }
        });
    }

    /**
     * Handle toggling watchlist
     * @param {string} cryptoId - Crypto ID
     * @returns {boolean} Whether successfully toggled
     */
    handleToggleWatchlist(cryptoId) {
        try {
            this.watchlistManager.toggleWatchlist(cryptoId);
            return true;
        } catch (error) {
            console.error('Failed to toggle watchlist:', error);
            return false;
        }
    }
}
