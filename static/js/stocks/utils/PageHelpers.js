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
