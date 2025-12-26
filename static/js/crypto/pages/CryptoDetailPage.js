class CryptoDetailPage {
    constructor(cryptoId) {
        this.cryptoId = cryptoId;
        this.cryptoData = null;
        this.chart = null;
        this.init();
    }

    async init() {
        await this.loadCryptoData();
        this.initChart();
        this.setupBackButton();
    }

    async loadCryptoData() {
        try {
            const data = await CryptoAPI.getCrypto(this.cryptoId, true);
            if (!data || data.error) throw new Error('Failed to fetch crypto data');

            this.cryptoData = data;
            this.updateHeader(data);
            this.updateStats(data);
            this.updateDescription(data);
        } catch (error) {
            console.error('Error loading crypto data:', error);
            document.getElementById('crypto-content').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Failed to load cryptocurrency data. Please try again later.
                </div>
            `;
        }
    }

    updateHeader(data) {
        // Image
        const imgEl = document.getElementById('crypto-image');
        if (data.image) {
            imgEl.src = data.image;
            imgEl.style.display = '';
        }

        // Name and symbol
        document.getElementById('crypto-name').textContent = data.name;
        document.getElementById('crypto-symbol').textContent = CryptoFormatters.formatSymbol(data.symbol);
        document.getElementById('crypto-rank').textContent = data.rank ? `Rank #${data.rank}` : '';

        // Price
        document.getElementById('current-price').textContent = CryptoFormatters.formatPrice(data.price);

        // Change
        const change = CryptoFormatters.formatPriceChange(
            { absolute: data.change, percentage: data.changePercent },
            { colored: true, showChangeIcon: true }
        );
        const priceChangeEl = document.getElementById('price-change');
        priceChangeEl.innerHTML = change.combined.value;
        priceChangeEl.className = `mb-0 ${CryptoFormatters.getColorClass(change.combined.color)}`;
    }

    updateStats(data) {
        document.getElementById('stat-market-cap').textContent = CryptoFormatters.formatMarketCap(data.marketCap);
        document.getElementById('stat-volume').textContent = CryptoFormatters.formatVolume(data.volume);
        document.getElementById('stat-high-24h').textContent = CryptoFormatters.formatPrice(data.high24h);
        document.getElementById('stat-low-24h').textContent = CryptoFormatters.formatPrice(data.low24h);
        document.getElementById('stat-circulating-supply').textContent = CryptoFormatters.formatSupply(data.circulatingSupply, data.symbol);
        document.getElementById('stat-total-supply').textContent = CryptoFormatters.formatSupply(data.totalSupply, data.symbol);
        document.getElementById('stat-ath').textContent = CryptoFormatters.formatPrice(data.ath);

        const athChange = CryptoFormatters.formatPercentage(data.athChangePercent, { colored: true });
        const athChangeEl = document.getElementById('stat-ath-change');
        athChangeEl.textContent = athChange.value || athChange;
        athChangeEl.className = `fw-bold ${CryptoFormatters.getColorClass(athChange.color || 'neutral')}`;
    }

    updateDescription(data) {
        if (data.description) {
            document.getElementById('crypto-description').innerHTML = data.description;
            document.getElementById('description-section').style.display = '';
        }
    }

    async initChart() {
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DOM to be ready

        const chartContainer = document.getElementById('chart-container');
        const chartControls = document.getElementById('chart-controls');
        const chartTitle = document.getElementById('chart-title');
        const periodSelect = document.getElementById('period-select');

        // Ensure elements exist
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }

        // Update period options for crypto
        if (periodSelect) {
            periodSelect.innerHTML = `
                <option value="1">1 Day</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30" selected>30 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
                <option value="365">1 Year</option>
                <option value="max">Max</option>
            `;
            periodSelect.addEventListener('change', () => this.loadChart(periodSelect.value));
        }

        // Hide interval select for crypto
        const intervalSelect = document.getElementById('interval-select');
        if (intervalSelect) intervalSelect.closest('.d-flex')?.remove();

        // Update chart title
        if (chartTitle) {
            chartTitle.textContent = `${this.cryptoData?.name || this.cryptoId} Price Chart`;
            chartTitle.onclick = () => window.location.href = `/crypto/chart?crypto=${this.cryptoData?.name || this.cryptoId}`;
            chartTitle.title = 'Go to cryptocurrency chart page';
            chartTitle.style.cursor = 'pointer';
        }

        // Load initial chart
        await this.loadChart('30');

        // Show chart controls
        if (chartControls) chartControls.style.display = '';
    }

    async loadChart(days) {
        const chartContainer = document.getElementById('chart-container');
        chartContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><i class="fas fa-spinner fa-spin fa-3x"></i></div>';

        try {
            const historyData = await CryptoAPI.getCryptoHistory(this.cryptoId, { days });

            if (!historyData || !historyData.data || historyData.data.length === 0) {
                throw new Error('No chart data available');
            }

            this.renderChart(historyData.data);
        } catch (error) {
            console.error('Error loading chart:', error);
            chartContainer.innerHTML = `
                <div class="d-flex justify-content-center align-items-center h-100 text-danger">
                    <div class="text-center">
                        <i class="fas fa-exclamation-circle fa-3x mb-3"></i>
                        <h5>Failed to load chart</h5>
                    </div>
                </div>
            `;
        }
    }

    renderChart(data) {
        const chartContainer = document.getElementById('chart-container');
        chartContainer.innerHTML = '<canvas id="crypto-chart"></canvas>';
        const ctx = document.getElementById('crypto-chart').getContext('2d');

        if (this.chart) this.chart.destroy();

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
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Price: ${CryptoFormatters.formatPrice(context.raw)}`
                        }
                    }
                },
                scales: {
                    x: { type: 'time', time: { displayFormats: { day: 'MMM d', hour: 'HH:mm' } } },
                    y: { ticks: { callback: (value) => CryptoFormatters.formatPrice(value) } }
                }
            }
        });
    }

    setupBackButton() {
        const backBtn = document.getElementById('back-btn');
        const backBtnText = document.getElementById('back-btn-text');

        if (document.referrer && document.referrer !== window.location.href) {
            const referrerUrl = new URL(document.referrer);
            let pageName = 'Previous Page';

            if (referrerUrl.pathname === '/') pageName = 'Home';
            else if (referrerUrl.pathname === '/crypto') pageName = 'Crypto';
            else if (referrerUrl.pathname.endsWith('/chart')) pageName = 'Chart';

            backBtnText.textContent = `Back to ${pageName}`;
            backBtn.addEventListener('click', (e) => { e.preventDefault(); window.history.back(); });
        } else {
            backBtnText.textContent = 'Back to Crypto';
            backBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/crypto'; });
        }
    }
}
