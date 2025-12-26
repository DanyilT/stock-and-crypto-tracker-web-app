class ChartPage {
    constructor() {
        this.elements = {
            searchInputId: 'crypto-search-input',
            searchResultsContainerId: 'crypto-search-results-container',
            cryptoSourceSelectId: 'crypto-source-select',
            cryptoListSelectId: 'crypto-list-select',
            loadChartBtnId: 'load-chart-btn',
            currentCryptoInfoId: 'current-crypto-info',
            currentCryptoImageId: 'current-crypto-image',
            currentCryptoSymbolId: 'current-crypto-symbol',
            currentCryptoNameId: 'current-crypto-name',
            currentCryptoRankId: 'current-crypto-rank',
            currentCryptoPriceId: 'current-crypto-price',
            currentCryptoChangeId: 'current-crypto-change',
            chartContainerId: 'chart-container',
            chartTitleId: 'chart-title',
            chartControlsId: 'chart-controls',
            periodSelectId: 'period-select',
            chartTypeSelectId: 'chart-type-select',
            fullscreenChartBtnId: 'fullscreen-chart-btn',
            exportChartBtnId: 'export-chart-btn'
        };

        this.currentCryptoId = null;
        this.currentCryptoData = null;
        this.chart = null;
        this.cryptoSearch = null;
        this.watchlistManager = new CryptoWatchlistManager();

        this.init();
    }

    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadFromURLParams();
        this.loadInitialWatchlistData();
        this.setupCryptoPeriodOptions();
    }

    initializeElements() {
        // Initialize search functionality
        this.cryptoSearch = new CryptoSearch(this.elements.searchInputId, this.elements.searchResultsContainerId, false);

        // Search elements
        this.searchInput = document.getElementById(this.elements.searchInputId);
        this.searchResultsContainer = document.getElementById(this.elements.searchResultsContainerId);

        // Selection elements
        this.cryptoSourceSelect = document.getElementById(this.elements.cryptoSourceSelectId);
        this.cryptoListSelect = document.getElementById(this.elements.cryptoListSelectId);
        this.loadChartBtn = document.getElementById(this.elements.loadChartBtnId);

        // Current crypto info elements
        this.currentCryptoInfo = document.getElementById(this.elements.currentCryptoInfoId);
        this.currentCryptoImage = document.getElementById(this.elements.currentCryptoImageId);
        this.currentCryptoSymbol = document.getElementById(this.elements.currentCryptoSymbolId);
        this.currentCryptoName = document.getElementById(this.elements.currentCryptoNameId);
        this.currentCryptoRank = document.getElementById(this.elements.currentCryptoRankId);
        this.currentCryptoPrice = document.getElementById(this.elements.currentCryptoPriceId);
        this.currentCryptoChange = document.getElementById(this.elements.currentCryptoChangeId);

        // Chart elements
        this.chartContainer = document.getElementById(this.elements.chartContainerId);
        this.chartTitle = document.getElementById(this.elements.chartTitleId);
        this.chartControls = document.getElementById(this.elements.chartControlsId);
        this.periodSelect = document.getElementById(this.elements.periodSelectId);
        this.chartTypeSelect = document.getElementById(this.elements.chartTypeSelectId);
        this.fullscreenChartBtn = document.getElementById(this.elements.fullscreenChartBtnId);
        this.exportChartBtn = document.getElementById(this.elements.exportChartBtnId);
    }

    setupCryptoPeriodOptions() {
        // Update period options for crypto (days-based)
        if (this.periodSelect) {
            this.periodSelect.innerHTML = `
                <option value="1">1 Day</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30" selected>30 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
                <option value="365">1 Year</option>
                <option value="max">Max</option>
            `;
        }
        // Hide interval select for crypto (CoinGecko auto-determines)
        const intervalSelect = document.getElementById('interval-select');
        if (intervalSelect) intervalSelect.closest('.d-flex')?.remove();
    }

    setupEventListeners() {
        // Search result selection
        window.addEventListener('crypto:selected', (e) => {
            this.selectCrypto(e.detail.cryptoId).then(() => {
                this.cryptoSearch.hideOutputContainer();
                this.searchInput.value = '';
            });
        });

        // Enter key on search
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const firstResult = this.searchResultsContainer.querySelector('.search-result-item[data-crypto-id]');
                if (firstResult) {
                    this.selectCrypto(firstResult.dataset.cryptoId).then(() => {
                        this.cryptoSearch.hideOutputContainer();
                        this.searchInput.value = '';
                    });
                }
            }
        });

        // Click on search results
        this.searchResultsContainer.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.search-result-item[data-crypto-id]');
            if (resultItem) {
                this.selectCrypto(resultItem.dataset.cryptoId).then(() => {
                    this.cryptoSearch.hideOutputContainer();
                    this.searchInput.value = '';
                });
            }
        });

        // Source selection
        this.cryptoSourceSelect.addEventListener('change', (e) => this.handleSourceChange(e.target.value));
        this.cryptoListSelect.addEventListener('change', (e) => this.handleCryptoListChange(e.target.value));

        // Load chart button
        this.loadChartBtn.addEventListener('click', () => this.loadChart(this.currentCryptoId));

        // Chart controls
        this.periodSelect?.addEventListener('change', () => this.loadChart(this.currentCryptoId));
        this.chartTypeSelect?.addEventListener('change', () => this.loadChart(this.currentCryptoId));

        // Clear selection on info click
        this.currentCryptoInfo.addEventListener('click', () => this.unselectCrypto());
    }

    loadFromURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const cryptoId = urlParams.get('crypto') || urlParams.get('id');
        const days = urlParams.get('days');

        if (days && this.periodSelect) this.periodSelect.value = days;
        if (cryptoId) this.selectCrypto(cryptoId).then(() => this.loadChart(cryptoId));
    }

    loadInitialWatchlistData() {
        const watchlistCount = this.watchlistManager.getWatchlist().length;
        const watchlistOption = this.cryptoSourceSelect.querySelector('option[value="watchlist"]');
        if (watchlistOption) {
            watchlistOption.textContent = `My Watchlist (${watchlistCount})`;
            watchlistOption.disabled = watchlistCount === 0;
        }
    }

    async handleSourceChange(source) {
        this.cryptoListSelect.innerHTML = '<option value="">Loading...</option>';
        this.cryptoListSelect.disabled = true;

        try {
            let cryptos = [];

            if (source === 'popular') {
                cryptos = await CryptoAPI.getPopularCryptosList(20, false);
            } else if (source === 'watchlist') {
                const watchlist = this.watchlistManager.getWatchlist();
                cryptos = await Promise.all(watchlist.map(id => CryptoAPI.getCrypto(id).catch(() => null)));
                cryptos = cryptos.filter(c => c && !c.error);
            }

            this.populateCryptoList(cryptos);
        } catch (error) {
            console.error('Error loading crypto list:', error);
            this.cryptoListSelect.innerHTML = '<option value="">Error loading cryptos</option>';
        }
    }

    populateCryptoList(cryptos) {
        if (!cryptos || cryptos.length === 0) {
            this.cryptoListSelect.innerHTML = '<option value="">No cryptos available</option>';
            this.cryptoListSelect.disabled = true;
            return;
        }

        this.cryptoListSelect.innerHTML = '<option value="">Select a cryptocurrency...</option>';
        cryptos.forEach(crypto => {
            const option = document.createElement('option');
            option.value = crypto.id;
            option.textContent = `${crypto.symbol} - ${crypto.name} (${CryptoFormatters.formatPrice(crypto.price)})`;
            this.cryptoListSelect.appendChild(option);
        });
        this.cryptoListSelect.disabled = false;
    }

    async handleCryptoListChange(cryptoId) {
        if (cryptoId) {
            await this.selectCrypto(cryptoId);
        }
    }

    async selectCrypto(cryptoId) {
        try {
            const data = await CryptoAPI.getCrypto(cryptoId);
            if (!data || data.error) throw new Error('Failed to fetch crypto data');

            this.currentCryptoId = cryptoId;
            this.currentCryptoData = data;
            this.updateCryptoInfo(data);
            this.loadChartBtn.disabled = false;
            this.updateURL(cryptoId);
        } catch (error) {
            console.error('Error selecting crypto:', error);
            showNotification('Failed to load cryptocurrency data', 'danger');
        }
    }

    updateCryptoInfo(data) {
        this.currentCryptoInfo.style.display = '';

        if (data.image) {
            this.currentCryptoImage.src = data.image;
            this.currentCryptoImage.style.display = '';
        } else {
            this.currentCryptoImage.style.display = 'none';
        }

        this.currentCryptoSymbol.textContent = CryptoFormatters.formatSymbol(data.symbol);
        this.currentCryptoName.textContent = data.name;
        this.currentCryptoRank.textContent = data.rank ? `Rank #${data.rank}` : '';
        this.currentCryptoPrice.textContent = CryptoFormatters.formatPrice(data.price);

        const change = CryptoFormatters.formatPriceChange(
            { absolute: data.change, percentage: data.changePercent },
            { colored: true, showChangeIcon: true }
        );
        this.currentCryptoChange.innerHTML = change.combined.value;
        this.currentCryptoChange.className = `small ${CryptoFormatters.getColorClass(change.combined.color)}`;
    }

    unselectCrypto() {
        this.currentCryptoId = null;
        this.currentCryptoData = null;
        this.currentCryptoInfo.style.display = 'none';
        this.loadChartBtn.disabled = true;
        this.clearChart();
        this.updateURL(null);
    }

    updateURL(cryptoId) {
        const url = new URL(window.location);
        if (cryptoId) {
            url.searchParams.set('crypto', cryptoId);
            url.searchParams.set('days', this.periodSelect?.value || '30');
        } else {
            url.searchParams.delete('crypto');
            url.searchParams.delete('days');
        }
        window.history.replaceState({}, '', url);
    }

    async loadChart(cryptoId) {
        if (!cryptoId) return;

        const days = this.periodSelect?.value || '30';
        const chartType = this.chartTypeSelect?.value || 'line';
        const isOHLC = chartType === 'candlestick';

        this.chartContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><i class="fas fa-spinner fa-spin fa-3x"></i></div>';

        try {
            const historyData = await CryptoAPI.getCryptoHistory(cryptoId, { days, ohlc: isOHLC });

            if (!historyData || !historyData.data || historyData.data.length === 0) {
                throw new Error('No chart data available');
            }

            this.renderChart(historyData.data, chartType);
            this.chartControls.style.display = '';
            this.chartTitle.textContent = `${this.currentCryptoData?.name || cryptoId} Chart`;
            this.chartTitle.onclick = () => window.location.href = `/crypto/${this.currentCryptoData?.name || cryptoId}`;
            this.chartTitle.title = 'Go to cryptocurrency page';
            this.chartTitle.style.cursor = 'pointer';
            this.fullscreenChartBtn.style.display = '';
            this.exportChartBtn.style.display = '';
            this.updateURL(cryptoId);
        } catch (error) {
            console.error('Error loading chart:', error);
            this.chartContainer.innerHTML = `
                <div class="d-flex justify-content-center align-items-center h-100 text-danger">
                    <div class="text-center">
                        <i class="fas fa-exclamation-circle fa-3x mb-3"></i>
                        <h5>Failed to load chart</h5>
                        <p class="mb-0">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }

    renderChart(data, chartType) {
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Create canvas
        this.chartContainer.innerHTML = '<canvas id="crypto-chart"></canvas>';
        const ctx = document.getElementById('crypto-chart').getContext('2d');

        if (chartType === 'candlestick') {
            this.renderCandlestickChart(ctx, data);
        } else {
            this.renderLineChart(ctx, data, chartType === 'line-filled');
        }
    }

    renderLineChart(ctx, data, filled) {
        const labels = data.map(d => new Date(d.datetime));
        const prices = data.map(d => d.price);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price (USD)',
                    data: prices,
                    borderColor: '#f7931a',
                    backgroundColor: filled ? 'rgba(247, 147, 26, 0.1)' : 'transparent',
                    fill: filled,
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
                        time: { displayFormats: { day: 'MMM d', hour: 'HH:mm' } }
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

    renderCandlestickChart(ctx, data) {
        const ohlcData = data.map(d => ({
            x: new Date(d.datetime).getTime(),
            o: d.open,
            h: d.high,
            l: d.low,
            c: d.close
        }));

        this.chart = new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: 'OHLC',
                    data: ohlcData,
                    color: {
                        up: '#26a69a',
                        down: '#ef5350',
                        unchanged: '#999'
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { type: 'time' },
                    y: {
                        ticks: {
                            callback: (value) => CryptoFormatters.formatPrice(value)
                        }
                    }
                }
            }
        });
    }

    clearChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.chartContainer.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100 text-muted">
                <div class="text-center">
                    <i class="fas fa-chart-area fa-3x mb-3 opacity-50"></i>
                    <h5>Select a cryptocurrency to view its chart</h5>
                    <p class="mb-0">Use the search box or dropdown above to choose a crypto</p>
                </div>
            </div>
        `;
        this.chartControls.style.display = 'none';
        this.fullscreenChartBtn.style.display = 'none';
        this.exportChartBtn.style.display = 'none';
    }
}
