// static/js/cookies/PreferencesConsent.js

class PreferencesConsent {
    static async request(action = 'save your preferences') {
        if (window.cookieManager.hasConsent('preferences')) {
            return true;
        }

        const modal = new ConsentModal('preferences', {
            title: 'Preferences Storage Permission',
            action: action,
            description: 'Remember your display settings and customizations.'
        });

        const granted = await modal.show();

        if (granted) {
            showNotification('Preferences storage enabled!', 'success');
        } else {
            showNotification('Preferences won\'t be saved.', 'warning');
        }

        return granted;
    }

    static hasPermission() {
        return window.cookieManager.hasConsent('preferences');
    }

    static async savePreference(key, value) {
        const hasConsent = await this.request(`save ${key} preference`);
        if (hasConsent) {
            try {
                const prefs = JSON.parse(localStorage.getItem('userPreferences') || '{}');
                prefs[key] = value;
                localStorage.setItem('userPreferences', JSON.stringify(prefs));
                return true;
            } catch (e) {
                console.warn('Failed to save preference:', e);
                return false;
            }
        }
        return false;
    }

    static getPreference(key, defaultValue = null) {
        if (!this.hasPermission()) return defaultValue;
        try {
            const prefs = JSON.parse(localStorage.getItem('userPreferences') || '{}');
            return prefs[key] !== undefined ? prefs[key] : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }
}

window.PreferencesConsent = PreferencesConsent;