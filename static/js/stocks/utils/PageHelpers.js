function backBtn(btnId = 'back-btn', btnTextId = 'back-btn-text') {
    const backBtn = document.getElementById(btnId);
    const backBtnText = document.getElementById(btnTextId);

    // Check if there's a previous page in history
    if (document.referrer && document.referrer !== window.location.href) {
        const referrerUrl = new URL(document.referrer);

        // Determine the page name based on the referrer path
        let pageName = 'Previous Page';

        if (referrerUrl.pathname === '/') {
            pageName = 'Home';
        } else if (referrerUrl.pathname === '/stocks') {
            pageName = 'Stocks';
        } else if (referrerUrl.pathname.startsWith('/stock/')) {
            pageName = 'Stock Details';
        } else if (referrerUrl.pathname.endsWith('/chart')) {
            pageName = 'Chart';
        }

        backBtnText.textContent = `Back to ${pageName}`;

        // Use history.back() for better navigation
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.history.back();
        });
    } else {
        // Fallback to home page if no referrer
        backBtnText.textContent = 'Back to Home';
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/';
        });
    }
}

function setupTableControls(popularLoader, watchlistLoader) {
    const autoloadToggle = document.getElementById('stocks-autoload-toggle');
    const forceAutoloadToggle = document.getElementById('stocks-force-autoload');
    const reloadButton = document.getElementById('stocks-reload');
    const tabsContainer = document.getElementById('stocks-tabs');

    // Auto-loading toggle handler
    autoloadToggle?.addEventListener('change', (e) => {
        const enabled = e.target.checked;

        if (enabled) {
            popularLoader.enableAutoLoading();
            watchlistLoader.enableAutoLoading();
        } else {
            popularLoader.disableAutoLoading();
            watchlistLoader.disableAutoLoading();
        }

        // Update button state
        if (reloadButton) {
            reloadButton.disabled = enabled;
            reloadButton.textContent = enabled ? 'Auto' : 'Reload';
        }
    });

    // Force autoload toggle handler
    forceAutoloadToggle?.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        popularLoader.setForceAutoload(enabled);
        watchlistLoader.setForceAutoload(enabled);

        if (enabled) {
            showNotification('Force autoload enabled - will update even when markets are closed', 'info', { timestamp: true, timeout: 3000 });
        } else {
            showNotification('Force autoload disabled - will only update when markets are open', 'info', { timestamp: true, timeout: 3000 });
        }
    });

    // Manual reload handler
    reloadButton?.addEventListener('click', async () => {
        const activeTab = document.querySelector('#stocks-tabs .nav-link.active');
        const isPopularTab = activeTab?.id === 'popular-tab';

        reloadButton.disabled = true;
        reloadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

        try {
            if (isPopularTab) {
                await popularLoader.manualReload();
            } else {
                await watchlistLoader.manualReload();
            }
        } finally {
            reloadButton.disabled = autoloadToggle?.checked || false;
            reloadButton.textContent = autoloadToggle?.checked ? 'Auto' : 'Reload';
        }
    });

    // Update loader activity based on active tab
    tabsContainer?.addEventListener('shown.bs.tab', (e) => {
        const isPopularTab = e.target.id === 'popular-tab';
        const isAutoloadEnabled = autoloadToggle?.checked || false;
        const isForceEnabled = forceAutoloadToggle?.checked || false;

        // Only the active tab's loader should be running
        if (isPopularTab) {
            if (isAutoloadEnabled) popularLoader.enableAutoLoading();
            popularLoader.setForceAutoload(isForceEnabled);
            watchlistLoader.disableAutoLoading();
        } else {
            if (isAutoloadEnabled) watchlistLoader.enableAutoLoading();
            watchlistLoader.setForceAutoload(isForceEnabled);
            popularLoader.disableAutoLoading();
        }
    });

    // Initialize button state
    if (reloadButton && autoloadToggle) {
        reloadButton.disabled = autoloadToggle.checked;
        reloadButton.textContent = autoloadToggle.checked ? 'Auto' : 'Reload';
    }
}
