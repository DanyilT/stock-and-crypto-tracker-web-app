class CookieManager {
    constructor() {
        this.definitions = this.loadDefinitions()
        this.consentTypes = {};
        this.loadStoredConsent();
    }

    async loadDefinitions() {
        try {
            return await (await fetch('/static/data/cookies.json')).json();
        } catch (error) {
            console.warn('Failed to load cookie definitions:', error);
            return null;
        }
    }

    loadStoredConsent() {
        try {
            const cookieConsent = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
            cookieConsent.forEach(type => {
                if (this.definitions.includes(type) && cookieConsent[type].granted) {
                    this.consentTypes[type] = this.consentTypes[type] || {};
                    this.consentTypes[type].granted = cookieConsent[type].granted;
                }
            });
        } catch (e) {
            console.warn('Failed to load stored consent:', e);
        }
    }











    saveConsent() {
        try {
            const consent = {};
            Object.keys(this.consentTypes).forEach(type => {
                consent[type] = this.consentTypes[type].granted;
            });
            consent.timestamp = Date.now();

            localStorage.setItem('cookieConsent', JSON.stringify(consent));
            this.updateEnabledCookiesList();

            // Track which specific cookies are enabled
            this.trackEnabledCookies();

        } catch (e) {
            console.warn('Failed to save cookie consent:', e);
        }
    }

    updateEnabledCookiesList() {
        this.enabledCookiesList = [];
        Object.keys(this.consentTypes).forEach(type => {
            if (this.consentTypes[type].granted) {
                this.enabledCookiesList.push(...this.consentTypes[type].cookies);
            }
        });
    }

    trackEnabledCookies() {
        try {
            // Store list of enabled cookies with timestamps
            const cookieStatus = {};
            Object.keys(this.consentTypes).forEach(type => {
                if (this.consentTypes[type].granted) {
                    this.consentTypes[type].cookies.forEach(cookieName => {
                        cookieStatus[cookieName] = {
                            enabled: true,
                            category: type,
                            enabledAt: Date.now()
                        };
                    });
                }
            });

            localStorage.setItem('enabledCookies', JSON.stringify(this.enabledCookiesList));
            localStorage.setItem('cookieStatus', JSON.stringify(cookieStatus));
        } catch (e) {
            console.warn('Failed to track enabled cookies:', e);
        }
    }

    hasConsent(type) {
        return this.consentTypes[type]?.granted || false;
    }

    async grantConsent(type) {
        if (this.consentTypes[type]) {
            this.consentTypes[type].granted = true;
            this.saveConsent();

            // Show notification about what cookies were enabled
            const cookies = this.consentTypes[type].cookies;
            if (cookies.length > 0) {
                showNotification(
                    `${this.consentTypes[type].name} enabled: ${cookies.join(', ')}`,
                    'success'
                );
            }

            return true;
        }
        return false;
    }

    revokeConsent(type) {
        if (this.consentTypes[type] && !this.consentTypes[type].required) {
            this.consentTypes[type].granted = false;
            this.saveConsent();
            this.clearCookieData(type);

            // Show notification about what cookies were disabled
            const cookies = this.consentTypes[type].cookies;
            if (cookies.length > 0) {
                showNotification(
                    `${this.consentTypes[type].name} disabled: ${cookies.join(', ')}`,
                    'info'
                );
            }

            return true;
        }
        return false;
    }

    clearCookieData(type) {
        // Get cookies for this category from definitions
        const categoryData = this.definitions?.categories[type];
        if (categoryData?.cookies) {
            Object.keys(categoryData.cookies).forEach(cookieName => {
                const cookie = categoryData.cookies[cookieName];
                if (cookie.type === 'localStorage') {
                    localStorage.removeItem(cookieName);
                } else if (cookie.type === 'sessionStorage') {
                    sessionStorage.removeItem(cookieName);
                }
            });
        }

        // Fallback for known storage keys
        const storageKeys = {
            watchlist: ['stockWatchlist', 'stock_watchlist'],
            preferences: ['userPreferences', 'chartSettings', 'user_theme'],
            analytics: ['analyticsData', 'performance_metrics']
        };

        (storageKeys[type] || []).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    getAllConsent() {
        return { ...this.consentTypes };
    }

    getEnabledCookies() {
        return this.enabledCookiesList || [];
    }

    getCookieStatus() {
        try {
            return JSON.parse(localStorage.getItem('cookieStatus') || '{}');
        } catch {
            return {};
        }
    }

    getConsentReport() {
        return {
            consentTypes: this.getAllConsent(),
            enabledCookies: this.getEnabledCookies(),
            cookieStatus: this.getCookieStatus(),
            definitions: this.definitions,
            reportGenerated: Date.now()
        };
    }

    resetAllConsent() {
        Object.keys(this.consentTypes).forEach(type => {
            if (!this.consentTypes[type].required) {
                this.consentTypes[type].granted = false;
                this.clearCookieData(type);
            }
        });
        this.saveConsent();
        showNotification('All non-essential cookie consent revoked', 'warning');
    }

    // Check if specific cookie is enabled
    isCookieEnabled(cookieName) {
        const status = this.getCookieStatus();
        return status[cookieName]?.enabled || false;
    }

    // Log cookie usage for tracking
    logCookieUsage(cookieName, action = 'used') {
        if (!this.isCookieEnabled(cookieName)) return;

        try {
            let usage = JSON.parse(localStorage.getItem('cookieUsage') || '{}');
            if (!usage[cookieName]) {
                usage[cookieName] = {
                    count: 0,
                    firstUsed: Date.now(),
                    actions: []
                };
            }

            usage[cookieName].count++;
            usage[cookieName].lastUsed = Date.now();
            usage[cookieName].actions.push({
                action: action,
                timestamp: Date.now()
            });

            // Keep only last 10 actions per cookie
            if (usage[cookieName].actions.length > 10) {
                usage[cookieName].actions = usage[cookieName].actions.slice(-10);
            }

            localStorage.setItem('cookieUsage', JSON.stringify(usage));
        } catch (e) {
            console.warn('Failed to log cookie usage:', e);
        }
    }
}

// Initialize cookie manager when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.cookieManager = new CookieManager();
});
