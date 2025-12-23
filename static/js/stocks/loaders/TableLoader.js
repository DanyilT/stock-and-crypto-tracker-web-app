class TableLoader {
    constructor(table, autoLoad = true) {
        this.table = table;
        this.autoLoadEnabled = autoLoad;
        this.forceAutoload = false; // Force autoload even when markets are closed
        this.isLoading = false;
        this.isPageVisible = true;
        this.isTableVisible = false;
        this.intervalId = null;
        this.marketTimers = new Map();
        this.loadInterval = 1000; // 1 second
        this.justBecameVisible = false; // Track when table becomes visible for full reload

        this.init();
    }

    init() {
        this.setupVisibilityDetection();
        this.checkTableVisibility();

        if (this.autoLoadEnabled) {
            this.startAutoLoading();
        }
    }

    setupVisibilityDetection() {
        // Page visibility API
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
            this.onVisibilityChange();
            this.checkTableVisibility();
        });

        // Window focus/blur events
        window.addEventListener('focus', () => {
            this.isPageVisible = true;
            this.onVisibilityChange();
            this.checkTableVisibility();
        });

        window.addEventListener('blur', () => {
            this.isPageVisible = false;
            this.onVisibilityChange();
        });

        // Scroll events to detect table visibility
        window.addEventListener('scroll', this.debounce(() => {
            this.checkTableVisibility();
        }, 100));

        // Resize events
        window.addEventListener('resize', this.debounce(() => {
            this.checkTableVisibility();
        }, 100));

        // Bootstrap tab events for switching between tables
        document.addEventListener('shown.bs.tab', () => {
            this.checkTableVisibility();
        });

        // Generic click events that might switch tabs/tables
        document.addEventListener('click', this.debounce(() => {
            this.checkTableVisibility();
        }, 200));

        // DOM mutations that might affect visibility (like tab switching)
        if (typeof MutationObserver !== 'undefined') {
            this.mutationObserver = new MutationObserver(this.debounce(() => {
                this.checkTableVisibility();
            }, 300));

            // Observe changes that might affect table visibility
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class', 'hidden', 'aria-hidden']
            });
        }
    }

    checkTableVisibility() {
        if (!this.table || !this.table.tbody) {
            this.isTableVisible = false;
            return false;
        }

        const tableElement = this.table.tbody.closest('table') || this.table.tbody;
        const rect = tableElement.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        // Check if table is visible in viewport
        const wasVisible = this.isTableVisible;
        this.isTableVisible = (
            rect.top < windowHeight &&
            rect.bottom > 0 &&
            rect.left < windowWidth &&
            rect.right > 0 &&
            getComputedStyle(tableElement).visibility !== 'hidden' &&
            getComputedStyle(tableElement).display !== 'none'
        );

        // If table just became visible, set flag and trigger visibility change
        if (!wasVisible && this.isTableVisible) {
            this.justBecameVisible = true;
            this.onVisibilityChange();
        }

        return this.isTableVisible;
    }

    onVisibilityChange() {
        /*console.log('TableLoader visibility change:', {
            isPageVisible: this.isPageVisible,
            isTableVisible: this.isTableVisible
        });*/

        // Handle autoloading based on visibility
        if (this.isPageVisible && this.isTableVisible) {
            // Only start autoloading if it's explicitly enabled
            if (this.autoLoadEnabled && !this.intervalId) {
                this.startAutoLoading();
            }
            // When table becomes visible, do a full reload only if autoloading is enabled
            // or if it's the first time the table becomes visible
            if (this.autoLoadEnabled || this.justBecameVisible) {
                this.loadFullData();
            }
        } else {
            // Only stop if autoloading is running, but don't change the enabled state
            if (this.intervalId) {
                this.stopAutoLoading();
            }
        }
    }

    checkMarketStatusForAllRows() {
        if (!this.table || !this.table.tbody) return { openMarkets: [], closedMarkets: [] };

        const rows = this.table.tbody.querySelectorAll('tr[data-symbol]');
        const openMarkets = [];
        const closedMarkets = [];

        rows.forEach(row => {
            const marketElement = row.querySelector('.stock-market-status');
            if (marketElement && marketElement.dataset.market) {
                const market = marketElement.dataset.market;
                const symbol = row.dataset.symbol;

                if (typeof window.isMarketOpenForStock === 'function') {
                    const marketStatus = window.isMarketOpenForStock(market);

                    if (marketStatus.isOpen) {
                        openMarkets.push({ market, symbol, row });
                    } else {
                        closedMarkets.push({ market, symbol, row, timeToEvent: marketStatus.timeToEvent });
                    }
                }
            }
        });

        return { openMarkets, closedMarkets };
    }

    handleClosedMarkets(closedMarkets) {
        if (!this.autoLoadEnabled || closedMarkets.length === 0) return;

        // Group by market to avoid duplicate timers
        const marketGroups = new Map();
        closedMarkets.forEach(item => {
            if (!marketGroups.has(item.market)) {
                marketGroups.set(item.market, item);
            }
        });

        // Set timers for each closed market
        marketGroups.forEach((item, market) => {
            // Clear existing timer for this market
            if (this.marketTimers.has(market)) {
                clearTimeout(this.marketTimers.get(market));
            }

            if (item.timeToEvent && item.timeToEvent > 0) {
                // Set timer to check when market opens
                const timer = setTimeout(() => {
                    if (this.autoLoadEnabled && typeof window.isMarketOpenForStock === 'function') {
                        const marketStatus = window.isMarketOpenForStock(market);
                        if (marketStatus.isOpen) {
                            showNotification(`${market} market has opened! Resuming auto-loading.`, 'success', { timestamp: true });

                            // Resume autoloading if not already running and conditions are met
                            if (!this.intervalId && this.isPageVisible && this.isTableVisible && this.autoLoadEnabled) {
                                this.startAutoLoading();
                            }
                            // Perform immediate data load
                            this.loadData();
                        }
                    }
                    this.marketTimers.delete(market);
                }, item.timeToEvent + 1000); // Add 1 second buffer

                this.marketTimers.set(market, timer);
            }
        });
    }

    startAutoLoading() {
        if (this.intervalId) return; // Already running

        // Load immediately if visible
        if (this.isPageVisible && this.isTableVisible) {
            this.loadData();
        }

        this.intervalId = setInterval(() => {
            if (this.isPageVisible && this.isTableVisible && this.autoLoadEnabled && !this.isLoading) {
                this.loadData();
            }
        }, this.loadInterval);

        showNotification('Auto-loading enabled', 'info', { timestamp: true, timeout: 3000 });
    }

    stopAutoLoading() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async loadData() {
        if (this.isLoading) return; // Prevent concurrent loads

        this.isLoading = true;

        try {
            // Force full reload when table just became visible or has no data
            const shouldFullReload = !this.table.data || this.table.data.length === 0 || this.justBecameVisible;

            if (shouldFullReload) {
                // Load full table data
                const data = await this.fetchData();
                if (data && this.table) {
                    this.table.updateData(data);
                }
                // Reset the flag after full reload
                this.justBecameVisible = false;
            } else {
                // Load row by row for autoloading
                await this.loadRowByRow();
            }
        } catch (error) {
            console.error('Failed to load table data:', error);
            showNotification('Failed to load table data. Will retry automatically.', 'danger', { timestamp: true });
        } finally {
            this.isLoading = false;
        }
    }

    async loadFullData() {
        if (this.isLoading) return;

        this.isLoading = true;
        try {
            const data = await this.fetchData();
            if (data && this.table) {
                this.table.updateData(data);
            }
            // Reset the flag after full reload
            this.justBecameVisible = false;
        } catch (error) {
            console.error('Failed to load table data:', error);
            showNotification('Failed to load table data', 'danger', { timestamp: true });
        } finally {
            this.isLoading = false;
        }
    }

    async manualReload() {
        showNotification('Reloading data...', 'info', { timestamp: true, timeout: 2000 });
        await this.loadFullData();
    }

    async loadRowByRow() {
        if (!this.table || !this.table.tbody) return;

        const marketStatus = this.checkMarketStatusForAllRows();
        const hasOpenMarkets = marketStatus.openMarkets.length > 0;
        const hasClosedMarkets = marketStatus.closedMarkets.length > 0;

        // Determine which rows to update
        const rowsToUpdate = this.forceAutoload ? [...marketStatus.openMarkets, ...marketStatus.closedMarkets] : marketStatus.openMarkets;

        // Update rows (open markets only, or all if forceAutoload is enabled)
        for (const item of rowsToUpdate) {
            if (this.autoLoadEnabled) {
                try {
                    const stockData = await this.fetchStockData(item.symbol);
                    if (stockData) {
                        // Update just this row's data
                        const currentIndex = Array.from(item.row.parentNode.children).indexOf(item.row);
                        const newRow = this.table.createTableRow(stockData, currentIndex);
                        item.row.parentNode.replaceChild(newRow, item.row);
                    }
                } catch (error) {
                    console.warn(`Failed to update ${item.symbol}:`, error);
                }
            }
        }

        // Handle closed markets (set timers for market open)
        if (hasClosedMarkets && !this.forceAutoload) {
            this.handleClosedMarkets(marketStatus.closedMarkets);
        }

        // Only stop autoloading if ALL markets are closed AND no timers are pending AND forceAutoload is disabled
        if (!hasOpenMarkets && hasClosedMarkets && this.autoLoadEnabled && !this.forceAutoload && this.marketTimers.size === 0) {
            this.stopAutoLoading();
            showNotification('All markets are closed. Auto-loading paused.', 'info', { timestamp: true });
        }
    }

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Cleanup method
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Clear all market timers
        if (this.marketTimers) {
            this.marketTimers.forEach(timer => clearTimeout(timer));
            this.marketTimers.clear();
        }

        // Disconnect mutation observer if it exists
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
    }

    enableAutoLoading() {
        const wasDisabled = !this.autoLoadEnabled;
        this.autoLoadEnabled = true;

        if (this.isPageVisible && this.isTableVisible) {
            this.startAutoLoading();
        }

        if (wasDisabled) {
            showNotification('Auto-loading enabled', 'success', { timestamp: true, timeout: 3000 });
        }
    }

    disableAutoLoading() {
        const wasEnabled = this.autoLoadEnabled;
        this.autoLoadEnabled = false;
        this.stopAutoLoading();

        // Clear all market timers
        this.marketTimers.forEach(timer => clearTimeout(timer));
        this.marketTimers.clear();

        if (wasEnabled) {
            showNotification('Auto-loading disabled', 'warning', { timestamp: true, timeout: 3000 });
        }
    }

    setForceAutoload(enabled) {
        this.forceAutoload = enabled;

        if (enabled && this.autoLoadEnabled && !this.intervalId && this.isPageVisible && this.isTableVisible) {
            // If force is enabled and autoload is on, restart autoloading
            this.startAutoLoading();
        }
    }

    getForceAutoload() {
        return this.forceAutoload;
    }

    // Abstract methods - to be implemented by child classes
    async fetchData() {
        throw new Error('fetchData method must be implemented by child class');
    }

    async fetchStockData(symbol) {
        throw new Error('fetchStockData method must be implemented by child class');
    }
}
