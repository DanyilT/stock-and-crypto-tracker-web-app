// static/js/cookies/CookieSettings.js

class CookieSettings {
    constructor() {
        this.createSettingsModal();
        this.addFooterButton();
    }

    createSettingsModal() {
        const modalHtml = `
            <div class="modal fade" id="cookieSettingsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-cog me-2"></i>
                                Cookie Settings & Privacy Controls
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Manage your cookie preferences and data storage settings.
                            </div>
                            
                            <div id="cookie-settings-list"></div>
                            
                            <div class="mt-4">
                                <h6>Quick Actions</h6>
                                <div class="d-flex gap-2 flex-wrap">
                                    <button class="btn btn-outline-success btn-sm" id="accept-all-cookies">
                                        <i class="fas fa-check-circle me-1"></i>Accept All
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" id="reject-all-cookies">
                                        <i class="fas fa-times-circle me-1"></i>Reject All
                                    </button>
                                    <button class="btn btn-outline-warning btn-sm" id="clear-all-data">
                                        <i class="fas fa-trash me-1"></i>Clear All Data
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mt-4 p-3 bg-light rounded">
                                <h6>Data Storage Information</h6>
                                <div id="storage-info" class="small text-muted"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="save-cookie-settings">Save Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = new bootstrap.Modal(document.getElementById('cookieSettingsModal'));
        this.bindEvents();
    }

    show() {
        this.renderSettings();
        this.updateStorageInfo();
        this.modal.show();
    }

    renderSettings() {
        const container = document.getElementById('cookie-settings-list');
        const consent = window.cookieManager.getAllConsent();

        const descriptions = {
            essential: 'Required for basic website functionality. Cannot be disabled.',
            watchlist: 'Stores your favorite stocks locally for quick access.',
            preferences: 'Remembers your display settings and customizations.',
            analytics: 'Helps improve the platform with anonymous usage data.'
        };

        container.innerHTML = Object.keys(consent).map(type => {
            const info = consent[type];
            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">
                                    ${type.charAt(0).toUpperCase() + type.slice(1)} Cookies
                                    ${info.required ? '<span class="badge bg-danger ms-2">Required</span>' : ''}
                                </h6>
                                <p class="mb-0 small text-muted">${descriptions[type]}</p>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" 
                                       id="setting-${type}" 
                                       ${info.granted ? 'checked' : ''}
                                       ${info.required ? 'disabled' : ''}>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStorageInfo() {
        const info = document.getElementById('storage-info');
        let totalSize = 0;
        let items = [];

        ['stockWatchlist', 'userPreferences', 'cookieConsent', 'chartSettings'].forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                const size = new Blob([data]).size;
                totalSize += size;
                items.push(`${key}: ${(size / 1024).toFixed(2)} KB`);
            }
        });

        info.innerHTML = `
            <strong>Total Storage Used:</strong> ${(totalSize / 1024).toFixed(2)} KB<br>
            <strong>Stored Data:</strong> ${items.length > 0 ? items.join(', ') : 'None'}
        `;
    }

    bindEvents() {
        document.getElementById('accept-all-cookies').addEventListener('click', () => {
            Object.keys(window.cookieManager.consentTypes).forEach(type => {
                window.cookieManager.grantConsent(type);
            });
            this.renderSettings();
            showNotification('All cookies accepted', 'success');
        });

        document.getElementById('reject-all-cookies').addEventListener('click', () => {
            window.cookieManager.resetAllConsent();
            this.renderSettings();
            showNotification('All non-essential cookies rejected', 'info');
        });

        document.getElementById('clear-all-data').addEventListener('click', () => {
            if (confirm('This will clear all stored data. Are you sure?')) {
                ['stockWatchlist', 'userPreferences', 'chartSettings', 'analyticsData'].forEach(key => {
                    localStorage.removeItem(key);
                });
                this.updateStorageInfo();
                showNotification('All data cleared', 'warning');
            }
        });

        document.getElementById('save-cookie-settings').addEventListener('click', () => {
            Object.keys(window.cookieManager.consentTypes).forEach(type => {
                const checkbox = document.getElementById(`setting-${type}`);
                if (checkbox && !checkbox.disabled) {
                    if (checkbox.checked) {
                        window.cookieManager.grantConsent(type);
                    } else {
                        window.cookieManager.revokeConsent(type);
                    }
                }
            });
            this.modal.hide();
            showNotification('Cookie settings saved', 'success');
        });
    }

    addFooterButton() {
        const footer = document.querySelector('footer') || document.body;
        const footerButton = document.createElement('button');
        footerButton.innerHTML = '<i class="fas fa-cookie-bite me-1"></i>Cookie Settings';
        footerButton.className = 'btn btn-sm btn-outline-secondary ms-2';
        footerButton.addEventListener('click', () => this.show());

        let footerContainer = footer.querySelector('.cookie-settings-container');
        if (!footerContainer) {
            footerContainer = document.createElement('div');
            footerContainer.className = 'cookie-settings-container text-center mt-2';
            footer.appendChild(footerContainer);
        }
        footerContainer.appendChild(footerButton);
    }
}

window.cookieSettings = new CookieSettings();