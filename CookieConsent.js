// // static/js/CookieConsent.js
//
// class CookieConsent {
//     constructor() {
//         this.cookieTypes = [
//             {
//                 id: 'essential',
//                 name: 'Essential Cookies',
//                 description: 'These cookies are absolutely essential for the website to function. Like the foundation of a house, but for your browser.',
//                 required: true,
//                 purposes: ['Session management', 'Security tokens', 'Basic functionality']
//             },
//             {
//                 id: 'watchlist',
//                 name: 'Watchlist Storage',
//                 description: 'Stores your precious stock picks so you don\'t have to remember them yourself. Because let\'s face it, you probably won\'t.',
//                 required: false,
//                 purposes: ['Save watchlist items', 'Remember your favorite stocks', 'Persist across sessions']
//             },
//             {
//                 id: 'preferences',
//                 name: 'User Preferences',
//                 description: 'Remembers how you like your charts, tables, and other settings. It\'s like having a personal butler, but digital.',
//                 required: false,
//                 purposes: ['Theme preferences', 'Chart settings', 'Display options', 'Auto-refresh settings']
//             },
//             {
//                 id: 'analytics',
//                 name: 'Analytics & Performance',
//                 description: 'Helps us understand how you use the site so we can make it better. No, we don\'t know what you had for breakfast.',
//                 required: false,
//                 purposes: ['Usage statistics', 'Performance monitoring', 'Error tracking', 'Feature usage analysis']
//             }
//         ];
//
//         this.consent = this.loadConsent();
//         this.createModal();
//         this.bindEvents();
//     }
//
//     loadConsent() {
//         try {
//             const saved = localStorage.getItem('cookieConsent');
//             return saved ? JSON.parse(saved) : {};
//         } catch {
//             return {};
//         }
//     }
//
//     saveConsent() {
//         try {
//             localStorage.setItem('cookieConsent', JSON.stringify(this.consent));
//             this.consent.lastUpdated = Date.now();
//         } catch (e) {
//             console.warn('Could not save cookie consent:', e);
//         }
//     }
//
//     hasConsent(type) {
//         return this.consent[type] === true || (type === 'essential');
//     }
//
//     requestConsent(type, action = 'perform this action') {
//         if (this.hasConsent(type)) return Promise.resolve(true);
//
//         return new Promise((resolve) => {
//             this.showModal(type, action, resolve);
//         });
//     }
//
//     createModal() {
//         const modalHtml = `
//             <div class="modal fade" id="cookieConsentModal" tabindex="-1" aria-hidden="true">
//                 <div class="modal-dialog modal-lg">
//                     <div class="modal-content">
//                         <div class="modal-header">
//                             <h5 class="modal-title">
//                                 <i class="fas fa-cookie-bite me-2"></i>
//                                 Cookie Consent & Digital Privacy Notice
//                             </h5>
//                             <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
//                         </div>
//                         <div class="modal-body">
//                             <div id="cookie-action-notice" class="alert alert-info" style="display:none;">
//                                 <i class="fas fa-info-circle me-2"></i>
//                                 <span id="cookie-action-text"></span>
//                             </div>
//
//                             <div class="mb-4">
//                                 <h6>🍪 What Are Cookies Anyway?</h6>
//                                 <p class="small text-muted">
//                                     Cookies are tiny text files that websites store on your device. Think of them as digital Post-it notes
//                                     that help websites remember things about you - like your preferences, login status, or that time you
//                                     spent 3 hours analyzing Tesla's stock chart at 2 AM. They're not actual cookies (sadly), so they won't
//                                     satisfy your sweet tooth, but they do make the internet a lot more convenient.
//                                 </p>
//                                 <p class="small text-muted">
//                                     These digital crumbs help us provide you with a personalized experience. Without them, every visit
//                                     would be like meeting us for the first time - awkward and repetitive. We promise we only use them
//                                     for legitimate purposes, not for tracking your late-night stock market anxiety sessions (though we
//                                     understand they happen).
//                                 </p>
//                             </div>
//
//                             <div id="cookie-types-list">
//                                 <!-- Cookie types will be inserted here -->
//                             </div>
//
//                             <div class="mt-4 p-3 bg-light rounded">
//                                 <h6>🔒 Your Privacy Matters</h6>
//                                 <p class="small mb-2">
//                                     We take your privacy seriously. All cookie preferences are stored locally on your device.
//                                     You can change these settings at any time by clicking the cookie settings button in the footer.
//                                 </p>
//                                 <p class="small mb-0">
//                                     <strong>Pro tip:</strong> If you disable all cookies and then forget your settings,
//                                     that's a paradox we call "The Cookie Conundrum." Choose wisely! 🤔
//                                 </p>
//                             </div>
//                         </div>
//                         <div class="modal-footer">
//                             <button type="button" class="btn btn-outline-secondary" id="cookie-reject-all">
//                                 Reject All (Minimal Experience)
//                             </button>
//                             <button type="button" class="btn btn-outline-primary" id="cookie-accept-selected">
//                                 Accept Selected
//                             </button>
//                             <button type="button" class="btn btn-success" id="cookie-accept-all">
//                                 Accept All (Recommended)
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;
//
//         document.body.insertAdjacentHTML('beforeend', modalHtml);
//         this.modal = new bootstrap.Modal(document.getElementById('cookieConsentModal'));
//         this.renderCookieTypes();
//     }
//
//     renderCookieTypes() {
//         const container = document.getElementById('cookie-types-list');
//         container.innerHTML = this.cookieTypes.map(type => `
//             <div class="card mb-3">
//                 <div class="card-body">
//                     <div class="d-flex justify-content-between align-items-start">
//                         <div class="flex-grow-1">
//                             <h6 class="card-title mb-2">
//                                 ${type.name}
//                                 ${type.required ? '<span class="badge bg-danger ms-2">Required</span>' : ''}
//                             </h6>
//                             <p class="card-text small text-muted mb-2">${type.description}</p>
//                             <div class="small">
//                                 <strong>Used for:</strong>
//                                 <ul class="mb-0 mt-1">
//                                     ${type.purposes.map(purpose => `<li>${purpose}</li>`).join('')}
//                                 </ul>
//                             </div>
//                         </div>
//                         <div class="form-check form-switch ms-3">
//                             <input class="form-check-input" type="checkbox" id="cookie-${type.id}"
//                                    ${type.required ? 'checked disabled' : ''}
//                                    ${this.hasConsent(type.id) ? 'checked' : ''}>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `).join('');
//     }
//
//     showModal(requiredType = null, action = 'perform this action', callback = null) {
//         const actionNotice = document.getElementById('cookie-action-notice');
//         const actionText = document.getElementById('cookie-action-text');
//
//         if (requiredType && requiredType !== 'essential') {
//             actionNotice.style.display = 'block';
//             actionText.textContent = `To ${action}, we need permission to use "${this.cookieTypes.find(t => t.id === requiredType)?.name}" cookies.`;
//
//             // Highlight the required cookie type
//             setTimeout(() => {
//                 const requiredCard = document.querySelector(`#cookie-${requiredType}`).closest('.card');
//                 requiredCard.classList.add('border-primary');
//                 requiredCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
//             }, 100);
//         } else {
//             actionNotice.style.display = 'none';
//         }
//
//         this.currentCallback = callback;
//         this.modal.show();
//     }
//
//     bindEvents() {
//         document.getElementById('cookie-accept-all').addEventListener('click', () => {
//             this.cookieTypes.forEach(type => {
//                 this.consent[type.id] = true;
//             });
//             this.saveConsent();
//             this.handleModalClose(true);
//         });
//
//         document.getElementById('cookie-reject-all').addEventListener('click', () => {
//             this.cookieTypes.forEach(type => {
//                 this.consent[type.id] = type.required;
//             });
//             this.saveConsent();
//             this.handleModalClose(false);
//         });
//
//         document.getElementById('cookie-accept-selected').addEventListener('click', () => {
//             this.cookieTypes.forEach(type => {
//                 const checkbox = document.getElementById(`cookie-${type.id}`);
//                 this.consent[type.id] = checkbox.checked;
//             });
//             this.saveConsent();
//             this.handleModalClose(this.hasConsent('watchlist')); // Return true if watchlist is enabled
//         });
//
//         // Add footer button functionality
//         this.addFooterButton();
//     }
//
//     handleModalClose(granted) {
//         this.modal.hide();
//         if (this.currentCallback) {
//             this.currentCallback(granted);
//             this.currentCallback = null;
//         }
//         // Remove highlighting
//         document.querySelectorAll('.card.border-primary').forEach(card => {
//             card.classList.remove('border-primary');
//         });
//     }
//
//     addFooterButton() {
//         // Add cookie settings button to footer
//         const footer = document.querySelector('footer') || document.body;
//         const footerButton = document.createElement('button');
//         footerButton.innerHTML = '<i class="fas fa-cookie-bite me-1"></i>Cookie Settings';
//         footerButton.className = 'btn btn-sm btn-outline-secondary ms-2';
//         footerButton.addEventListener('click', () => this.showModal());
//
//         // Find or create a footer container
//         let footerContainer = footer.querySelector('.cookie-settings-container');
//         if (!footerContainer) {
//             footerContainer = document.createElement('div');
//             footerContainer.className = 'cookie-settings-container text-center mt-2';
//             footer.appendChild(footerContainer);
//         }
//         footerContainer.appendChild(footerButton);
//     }
//
//     // Helper method for watchlist functionality
//     async requestWatchlistConsent() {
//         return await this.requestConsent('watchlist', 'save stocks to your watchlist');
//     }
// }
//
// // Initialize global cookie consent manager
// window.cookieConsent = new CookieConsent();



// static/js/CookieConsent.js

class SimpleCookieConsent {
    constructor() {
        this.watchlistConsent = this.loadWatchlistConsent();
        this.createModal();
        this.bindEvents();
        this.addFooterButton();
    }

    loadWatchlistConsent() {
        try {
            return localStorage.getItem('watchlistConsent') === 'true';
        } catch {
            return false;
        }
    }

    saveWatchlistConsent(granted) {
        try {
            localStorage.setItem('watchlistConsent', granted.toString());
            return true;
        } catch {
            return false;
        }
    }

    hasWatchlistConsent() {
        return this.watchlistConsent;
    }

    requestWatchlistConsent() {
        if (this.hasWatchlistConsent()) {
            return Promise.resolve(true);
        }

        return new Promise((resolve) => {
            this.showModal(resolve);
        });
    }

    createModal() {
        const modalHtml = `
            <div class="modal fade" id="watchlistConsentModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-cookie-bite me-2"></i>
                                Watchlist Permission
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                To save stocks to your watchlist, we need to store data in your browser.
                            </div>
                            
                            <h6>🍪 What we'll store:</h6>
                            <ul class="mb-3">
                                <li>Your watchlist stock symbols</li>
                                <li>When you added each stock</li>
                                <li>This permission preference</li>
                            </ul>
                            
                            <p class="small text-muted">
                                We use browser storage (localStorage) to remember your watchlist between visits.
                                No data is sent to our servers - it stays on your device.
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" id="watchlist-deny">
                                No Thanks
                            </button>
                            <button type="button" class="btn btn-success" id="watchlist-allow">
                                Allow Watchlist Storage
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = new bootstrap.Modal(document.getElementById('watchlistConsentModal'));
    }

    showModal(callback) {
        this.currentCallback = callback;
        this.modal.show();
    }

    bindEvents() {
        document.getElementById('watchlist-allow').addEventListener('click', () => {
            this.watchlistConsent = true;
            this.saveWatchlistConsent(true);
            this.handleModalClose(true);
        });

        document.getElementById('watchlist-deny').addEventListener('click', () => {
            this.watchlistConsent = false;
            this.saveWatchlistConsent(false);
            this.handleModalClose(false);
        });
    }

    handleModalClose(granted) {
        this.modal.hide();
        if (this.currentCallback) {
            this.currentCallback(granted);
            this.currentCallback = null;
        }
    }

    addFooterButton() {
        const footer = document.querySelector('footer') || document.body;
        const footerButton = document.createElement('button');
        footerButton.innerHTML = '<i class="fas fa-cookie-bite me-1"></i>Cookie Settings';
        footerButton.className = 'btn btn-sm btn-outline-secondary ms-2';
        footerButton.addEventListener('click', () => {
            // Reset consent and show modal
            this.watchlistConsent = false;
            this.saveWatchlistConsent(false);
            this.showModal((granted) => {
                if (granted) {
                    showNotification('Watchlist storage enabled', 'success');
                } else {
                    showNotification('Watchlist storage disabled', 'info');
                }
            });
        });

        let footerContainer = footer.querySelector('.cookie-settings-container');
        if (!footerContainer) {
            footerContainer = document.createElement('div');
            footerContainer.className = 'cookie-settings-container text-center mt-2';
            footer.appendChild(footerContainer);
        }
        footerContainer.appendChild(footerButton);
    }
}

// Initialize global cookie consent manager
window.cookieConsent = new SimpleCookieConsent();
