class MarketStatusBanner {
    constructor(market, options = {}) {
        this.market = market.toUpperCase().trim();
        this.marketStatusBannerContainerId = options.containerId || 'market-status-banners-container';
        this.updateInterval = options.updateInterval || 1000; // Default 1 second

        this.marketStatusBannerContainer = null;
        this.bannerElement = null;
        this.statusElement = null;
        this.countdownElement = null;
        this.infoElement = null;
        this.closeButton = null;
        this.updateTimer = null;

        // Global trading hours data
        this.tradingHoursData = null;

        // Track last update date for new day detection
        this.lastUpdateDate = new Date().toISOString().split('T')[0];

        this.init();
    }

    init() {
        this.setupContainer();
        this.loadTradingHoursData();
        this.createBanner();
        this.setupEventListeners();
        this.startUpdates();
    }

    setupContainer() {
        this.marketStatusBannerContainer = document.getElementById(this.marketStatusBannerContainerId);
        if (!this.marketStatusBannerContainer) console.error(`Container with ID '${this.marketStatusBannerContainerId}' not found`);
    }

    loadTradingHoursData() {
        if (this.market === 'US') this.tradingHoursData = window.getUSMarketTradingHours({year: new Date().getFullYear()});
        else if (this.market === 'EU') this.tradingHoursData = window.getEUMarketTradingHours({year: new Date().getFullYear()});
        else {
            this.tradingHoursData = null;
            console.warn(`No trading hours data available for market: ${this.market}`);
        }
    }

    createBanner() {
        if (!this.marketStatusBannerContainer) return;

        // Create banner element
        this.bannerElement = document.createElement('div');
        this.bannerElement.className = 'alert text-center py-2 d-flex flex-column align-items-center justify-content-center position-relative market-status-banner';
        this.bannerElement.style.cssText = 'cursor:pointer; min-width: 350px; flex: 1;';
        this.bannerElement.setAttribute('role', 'alert');
        this.bannerElement.dataset.market = this.market;

        // Create banner content
        this.bannerElement.innerHTML = `
            <div class="d-flex align-items-center justify-content-center w-100">
                <div class="market-status-main">
                    <div class="market-status-text fw-bold fs-6 mb-1"></div>
                    <div class="market-countdown-text small text-muted"></div>
                </div>
            </div>
            <div class="market-status-info card shadow-sm p-3 position-absolute" style="display:none; top:110%; left:50%; transform:translateX(-50%); min-width:350px; cursor: default;">
                <strong>${this.market} Market Information:</strong>
                <div class="market-hours-info mt-2 mb-2">${this.generateMarketHoursInfo()}</div>
                <div class="market-next-event mt-2"></div>
                <div class="text-muted small mt-2">Status updates automatically every second.</div>
            </div>
            <button type="button" class="btn-close market-status-close" style="display:none; position:absolute; right:10px; top:10px;" aria-label="Close"></button>
        `;

        this.statusElement = this.bannerElement.querySelector('.market-status-text');
        this.countdownElement = this.bannerElement.querySelector('.market-countdown-text');
        this.infoElement = this.bannerElement.querySelector('.market-status-info');
        this.closeButton = this.bannerElement.querySelector('.market-status-close');

        // Add to container
        this.marketStatusBannerContainer.appendChild(this.bannerElement);
    }

    generateMarketHoursInfo() {
        const regularHours = 'Mon-Fri, ' + (this.market === 'US' ? window.US_MARKET_HOURS.REGULAR_OPEN.hour.toString().padStart(2, '0')  + ':' + window.US_MARKET_HOURS.REGULAR_OPEN.minute.toString().padStart(2, '0')  + ' - ' + window.US_MARKET_HOURS.REGULAR_CLOSE.hour.toString().padStart(2, '0')  + ':' + window.US_MARKET_HOURS.REGULAR_CLOSE.minute.toString().padStart(2, '0')  + ' ET' : this.market === 'EU' ? window.EU_MARKET_HOURS.REGULAR_OPEN.hour.toString().padStart(2, '0')  + ':' + window.EU_MARKET_HOURS.REGULAR_OPEN.minute.toString().padStart(2, '0')  + ' - ' + window.EU_MARKET_HOURS.REGULAR_CLOSE.hour.toString().padStart(2, '0') + ':' + window.EU_MARKET_HOURS.REGULAR_CLOSE.minute.toString().padStart(2, '0') + ' GMT' : 'N/A');

        const todayData = this.tradingHoursData?.get(new Date().toISOString().split('T')[0]);
        const openTime = todayData?.openTime ? todayData.openTime.hour.toString().padStart(2, '0') + ':' + todayData.openTime.minute.toString().padStart(2, '0') : null;
        const closeTime = todayData?.closeTime ? todayData.closeTime.hour.toString().padStart(2, '0') + ':' + todayData.closeTime.minute.toString().padStart(2, '0') : null;
        const totalTradingMinutes = todayData?.totalTradingMinutes;
        const [openPreMarketTime, closePreMarketTime] = todayData?.preMarket ? [todayData.preMarket.openTime?.hour.toString().padStart(2, '0') + ':' + todayData.preMarket.openTime?.minute.toString().padStart(2, '0'), todayData.preMarket.closeTime?.hour.toString().padStart(2, '0') + ':' + todayData.preMarket.closeTime?.minute.toString().padStart(2, '0')] : [null, null];
        const [openAfterHoursTime, closeAfterHoursTime] = todayData?.afterHours ? [todayData.afterHours.openTime?.hour.toString().padStart(2, '0') + ':' + todayData.afterHours.openTime?.minute.toString().padStart(2, '0'), todayData.afterHours.closeTime?.hour.toString().padStart(2, '0') + ':' + todayData.afterHours.closeTime?.minute.toString().padStart(2, '0')] : [null, null];
        const status = todayData?.status;
        const holidayName = todayData?.holidayName;
        const reason = todayData?.reason;

        return `
            <div><strong>Regular Hours:</strong> ${regularHours}</div>
            <div title="Total Trading Minutes Today: ${totalTradingMinutes}"><strong>Today's Trading Hours:</strong> ${openTime && closeTime ? `${openTime} - ${closeTime} ${this.market === 'US' ? 'ET' : this.market === 'EU' ? 'GMT' : ''}` : 'N/A'}</div>
            ${openPreMarketTime && closePreMarketTime ? `<div><strong>Pre-Market:</strong> ${openPreMarketTime} - ${closePreMarketTime} ${this.market === 'US' ? 'ET' : this.market === 'EU' ? 'GMT' : ''}</div>` : ''}
            ${openAfterHoursTime && closeAfterHoursTime ? `<div><strong>After Hours:</strong> ${openAfterHoursTime} - ${closeAfterHoursTime} ${this.market === 'US' ? 'ET' : this.market === 'EU' ? 'GMT' : ''}</div>` : ''}
            ${status === 'HOLIDAY' ? `<div class="text-danger" title="${reason ? reason : 'Market closed for holiday'}"><strong>Holiday:</strong> ${holidayName || 'Market Closed'}</div>` : ''}
            ${status === 'WEEKEND' ? `<div class="text-muted"><em>${reason ? reason : 'Market closed on weekends'}</em></div>` : ''}
            `;
    }

    updateStatus() {
        if (!this.statusElement || !this.countdownElement) return;

        // Check if it's a new day and update accordingly
        if (new Date().toISOString().split('T')[0] !== this.lastUpdateDate) {
            this.lastUpdateDate = new Date().toISOString().split('T')[0];
            this.loadTradingHoursData(); // Reload trading hours for new day

            // Update info panel with new day's information
            if (this.infoElement) {
                const marketHoursInfo = this.infoElement.querySelector('.market-hours-info');
                if (marketHoursInfo) marketHoursInfo.innerHTML = this.generateMarketHoursInfo();
            }
        }

        const todayData = this.tradingHoursData?.get(new Date().toISOString().split('T')[0]);
        const marketStatus = window.isMarketOpenForStock(this.market);
        if (!marketStatus) return;

        // Update market status
        this.statusElement.innerHTML = `${this.market} Market: ${marketStatus.isOpen ? 'OPEN' : 'CLOSED'}` + (todayData?.status === 'HOLIDAY' ? ` <span class="badge bg-warning text-dark">Holiday</span>` : '');

        // Update countdown
        this.countdownElement.innerHTML = this.formatCountdown(marketStatus.timeToEvent);
        this.countdownElement.querySelector('.countdown').title = marketStatus.isOpen ? 'Time until market closes' : 'Time until market opens';

        // Update alert type based on status
        this.bannerElement.className = this.bannerElement.className.replace(/alert-\w+/g, '');
        this.bannerElement.classList.add(`alert-${marketStatus.isOpen ? 'success' : todayData?.status === 'HOLIDAY' ? 'warning' : todayData?.status === 'WEEKEND' ? 'secondary' : 'info'}`);

        // Update info panel with next events
        this.updateNextEventsInfo(marketStatus);
    }

    updateNextEventsInfo(marketStatus) {
        const marketNextEvent = this.infoElement?.querySelector('.market-next-event');
        if (!marketNextEvent) return;

        if (marketStatus.timeToEvent) {
            marketNextEvent.innerHTML = `
                <div><strong>Next Event:</strong></div>
                <div class="ms-2">${marketStatus.isOpen ? 'Market Closes' : 'Market Opens'}: ${this.formatEventTime(new Date(Date.now() + marketStatus.timeToEvent))}</div>
                ${marketStatus.timeToEvent > 0 ? `<div class="ms-2 text-muted small">In ${this.formatCountdown(marketStatus.timeToEvent)}</div>` : ''}
            `;
        } else {
            marketNextEvent.innerHTML = '<div class="text-muted"><em>Next event information not available</em></div>';
        }
    }

    formatCountdown(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `<span class="countdown" style="font-family:monospace;">${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s</span>`;
    }

    formatEventTime(date, includeDate = false) {
        const now = new Date();
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        if (!includeDate) {
            // Check if today or tomorrow
            if (date.toDateString() === now.toDateString() || date.toDateString() === new Date(now.getTime() + 86400000).toDateString()) return time;
        }

        // Include date info
        return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${time}`;
    }

    startUpdates() {
        // Initial update
        this.updateStatus();

        // Update every second
        this.updateTimer = setInterval(() => {
            this.updateStatus();
        }, this.updateInterval);
    }

    setupEventListeners() {
        if (!this.bannerElement) return;

        // Show/hide close button on banner hover
        this.bannerElement.addEventListener('mouseenter', () => { if (this.closeButton) this.closeButton.style.display = 'block'; });
        this.bannerElement.addEventListener('mouseleave', () => { if (this.closeButton) this.closeButton.style.display = 'none'; });

        // Close banner functionality
        if (this.closeButton) {
            this.closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.destroy();
            });
        }

        // Show/hide info panel on banner click
        this.bannerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.infoElement) {
                // Hide all other info panels first
                document.querySelectorAll('.market-status-info').forEach(info => { if (info !== this.infoElement) info.style.display = 'none'; });
                // Toggle this info panel
                this.infoElement.style.display = this.infoElement.style.display === 'block' ? 'none' : 'block';
            }
        });

        // Hide info panel when clicking outside
        document.addEventListener('click', (e) => { if (this.infoElement && !this.bannerElement.contains(e.target)) { this.infoElement.style.display = 'none'; } });

        // Prevent closing when clicking inside info panel
        if (this.infoElement) { this.infoElement.addEventListener('click', (e) => { e.stopPropagation(); }); }
    }

    destroy() {
        // Clear timer
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }

        // Remove banner element
        if (this.bannerElement && this.bannerElement.parentNode) {
            this.bannerElement.parentNode.removeChild(this.bannerElement);
        }

        // Clean up container reference
        this.marketStatusBannerContainer = null;
    }
}

// Static method to create multiple banners
MarketStatusBanner.createBanners = function(markets, options = {}) {
    const banners = [];
    markets.forEach(market => {
        banners.push(new MarketStatusBanner(market, options));
    });
    return banners;
};
