/**
 * ChartFullscreenHelper - Helper class for fullscreen functionality
 */
class ChartFullscreenHelper {
    constructor(chartContainer, chartInstance) {
        this.container = chartContainer;
        this.chart = chartInstance;

        // Bind event listeners
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for fullscreen functionality
     */
    setupEventListeners() {
        // ESC key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen()) this.exit();
        });
    }

    /**
     * Enter fullscreen mode
     */
    async enter() {
        try {
            // Request fullscreen
            await this.container.requestFullscreen();
            showNotification('Press ESC to exit fullscreen', 'info');
        } catch (err) {
            console.error('Error entering fullscreen mode:', err);
            showNotification('Failed to enter fullscreen mode', 'danger');
        }
    }

    /**
     * Exit fullscreen mode
     */
    async exit() {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
        } catch (err) {
            console.error('Error exiting fullscreen mode:', err);
            showNotification('Failed to exit fullscreen mode', 'danger');
        }
    }

    /**
     * Check if currently in fullscreen mode
     * @returns {boolean}
     */
    isFullscreen() {
        return document.fullscreenElement !== null;
    }
}

/**
 * ChartExportHelper - Helper class for chart export and fullscreen functionality
 */
class ChartExportHelper {
    constructor(chartInstance) {
        this.chart = chartInstance;
    }

    /**
     * Export chart as image
     * @param {string} format - 'png' or 'jpeg'
     */
    async exportImage(format) {
        if (!this.chart || !this.chart.chart) {
            showNotification('No chart available to export', 'warning');
            return;
        }

        try {
            // Get canvas from Chart.js
            const canvas = this.chart.chart.canvas;
            const url = canvas.toDataURL(`image/${format}`);
            console.log(url);

            // Create download link
            const link = document.createElement('a');
            link.download = `${this.chart.getSymbol()}_chart_${new Date().toISOString().split('T')[0]}.${format}`;
            link.href = url;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification(`Chart exported as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('Image export error:', error);
            showNotification('Failed to export chart image', 'danger');
        }
    }

    /**
     * Export chart data
     * @param {string} format - 'json' or 'csv'
     */
    async exportData(format) {
        try {
            // Get chart data from the StockChart instance
            const chartData = await this.getChartData();

            if (!chartData) {
                showNotification('No chart data available to export', 'warning');
                return;
            }

            let content, filename, mimeType;

            if (format === 'json') {
                content = JSON.stringify(chartData, null, 2);
                filename = `${this.chart.getSymbol()}_data_${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
            } else if (format === 'csv') {
                content = this.convertToCSV(chartData);
                filename = `${this.chart.getSymbol()}_data_${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
            }

            // Create and download file
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            console.log(url);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            showNotification(`Chart data exported as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('Data export error:', error);
            showNotification('Failed to export chart data', 'danger');
        }
    }

    /**
     * Get chart data for export
     * @returns {Promise<Object>}
     */
    async getChartData() {
        if (!this.chart) return null;

        // Fetch fresh data using the same parameters
        try {
             // Get the current chart options and symbol
            const data = await StockAPI.getStockHistory(this.chart.getSymbol(), this.chart.getOptions());
            return {
                symbol: this.chart.getSymbol(),
                metadata: data.metadata || {},
                data: data.data || [],
                exportedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching chart data for export:', error);
            return null;
        }
    }

    /**
     * Convert chart data to CSV format
     * @param {Object} chartData
     * @returns {string}
     */
    convertToCSV(chartData) {
        if (!chartData.data || !Array.isArray(chartData.data)) return '';

        const data = chartData.data;

        // Determine headers based on available data
        let headers = ['datetime'];

        // Check if OHLC data is available
        if (data.length > 0 && data[0].open !== undefined) {
            headers.push('open', 'high', 'low', 'close');
        } else {
            headers.push('price');
        }

        // Add volume if available
        if (data.length > 0 && data[0].volume !== undefined) {
            headers.push('volume');
        }

        // Create CSV content
        let csv = headers.join(',') + '\n';

        data.forEach(row => {
            // Start with datetime
            let line = [row.datetime];

            // Add OHLC or price data
            if (row.open !== undefined) {
                line.push(row.open, row.high, row.low, row.close);
            } else {
                line.push(row.price || row.close || '');
            }

            // Add volume if available
            if (row.volume !== undefined) {
                line.push(row.volume);
            }

            csv += line.join(',') + '\n';
        });

        return csv;
    }
}

/**
 * ChartExportMenuHelper - Helper class for creating and managing export menus
 */
class ChartExportMenuHelper {
    constructor(exportButton, exportHelper) {
        this.button = exportButton;
        this.exportHelper = exportHelper;
    }

    /**
     * Show the export menu
     * @param {MouseEvent} event
     */
    show(event) {
        event.preventDefault();

        if (!this.exportHelper.chart) {
            showNotification('No chart available to export', 'warning');
            return;
        }

        // Create export menu
        this.createMenu();
    }

    /**
     * Create and show the export dropdown menu
     */
    createMenu() {
        // Remove existing export menu
        document.querySelectorAll('.export-menu').forEach(menu => menu.remove());
        console.log('Opening export menu');

        // Create menu
        const menu = document.createElement('div');
        menu.className = 'export-menu dropdown-menu show position-absolute';

        // Position menu
        const rect = this.button.getBoundingClientRect();
        menu.style.left = `${rect.right - menu.offsetWidth}px`;
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.transform = 'translateX(-100%)';

        // Menu content
        menu.innerHTML = `
            <h6 class="dropdown-header">Export Chart</h6>
            <button class="dropdown-item" data-export="image-png">
                <i class="fas fa-image me-2"></i>Save as PNG Image
            </button>
            <button class="dropdown-item" data-export="image-jpeg">
                <i class="fas fa-image me-2"></i>Save as JPEG Image
            </button>
            <div class="dropdown-divider"></div>
            <h6 class="dropdown-header">Export Data</h6>
            <button class="dropdown-item" data-export="data-json">
                <i class="fas fa-code me-2"></i>Save as JSON Data
            </button>
            <button class="dropdown-item" data-export="data-csv">
                <i class="fas fa-table me-2"></i>Save as CSV Data
            </button>
        `;

        // Add event listeners
        menu.addEventListener('click', (e) => {
            const exportType = e.target.closest('[data-export]')?.dataset.export;
            if (exportType) {
                this.handleExport(exportType);
                menu.remove();
            }
        });

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== this.button) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);

        // Add to DOM
        document.body.appendChild(menu);
    }

    /**
     * Handle different export types
     * @param {string} exportType
     */
    async handleExport(exportType) {
        try {
            switch (exportType) {
                case 'image-png':
                    await this.exportHelper.exportImage('png');
                    break;
                case 'image-jpeg':
                    await this.exportHelper.exportImage('jpeg');
                    break;
                case 'data-json':
                    await this.exportHelper.exportData('json');
                    break;
                case 'data-csv':
                    await this.exportHelper.exportData('csv');
                    break;
                default:
                    showNotification('Invalid export type', 'danger');
            }
        } catch (error) {
            console.error('Export error:', error);
            showNotification('Export failed. Please try again.', 'danger');
        }
    }
}
