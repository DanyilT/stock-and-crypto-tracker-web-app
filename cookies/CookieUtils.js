// static/js/cookies/CookieUtils.js

class CookieUtils {
    // Check if any specific consent is needed
    static async requireConsent(types, action = 'continue') {
        const typesArray = Array.isArray(types) ? types : [types];
        const missing = typesArray.filter(type => !window.cookieManager.hasConsent(type));

        if (missing.length === 0) return true;

        for (const type of missing) {
            const modal = new ConsentModal(type, { action });
            const granted = await modal.show();
            if (!granted) return false;
        }

        return true;
    }

    // Safely store data with consent check
    static async safeStore(key, data, consentType = 'preferences') {
        const hasConsent = await this.requireConsent(consentType, `save ${key}`);
        if (hasConsent) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.warn('Failed to store data:', e);
                return false;
            }
        }
        return false;
    }

    // Safely retrieve data
    static safeRetrieve(key, consentType = 'preferences', defaultValue = null) {
        if (!window.cookieManager.hasConsent(consentType)) return defaultValue;
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    // Get storage usage
    static getStorageUsage() {
        let total = 0;
        let details = {};

        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = new Blob([localStorage[key]]).size;
                total += size;
                details[key] = size;
            }
        }

        return { total, details };
    }

    // Export consent settings
    static exportSettings() {
        return {
            consent: window.cookieManager.getAllConsent(),
            timestamp: Date.now(),
            version: '1.0'
        };
    }

    // Import consent settings
    static importSettings(settings) {
        try {
            if (settings.consent) {
                Object.keys(settings.consent).forEach(type => {
                    if (settings.consent[type].granted) {
                        window.cookieManager.grantConsent(type);
                    } else {
                        window.cookieManager.revokeConsent(type);
                    }
                });
                showNotification('Settings imported successfully', 'success');
                return true;
            }
        } catch (e) {
            showNotification('Failed to import settings', 'danger');
        }
        return false;
    }
}

window.CookieUtils = CookieUtils;