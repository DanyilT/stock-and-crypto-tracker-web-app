class ConsentModal {
    constructor(type, options = {}) {
        this.type = type;
        this.options = {
            title: options.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Cookie Consent`,
            description: options.description || `Allow ${type} cookies?`,
            action: options.action || 'perform this action',
            ...options
        };
        this.createModal();
    }

    createModal() {
        const modalId = `${this.type}ConsentModal`;
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        // Get descriptions from cookie manager if available
        const categoryData = window.cookieManager?.definitions?.categories[this.type];
        const description = categoryData?.description || this.options.description;
        const cookies = categoryData?.cookies || {};

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-cookie-bite me-2"></i>
                                ${this.options.title}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                To ${this.options.action}, we need permission to use <strong>${this.type}</strong> cookies.
                            </div>
                            <p>${descriptions[this.type] || this.options.description}</p>
                            <div class="bg-light p-3 rounded">
                                <h6>What this means:</h6>
                                <ul class="mb-0 small">
                                    ${this.getTypeDetails(this.type)}
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" id="${this.type}-deny">
                                <i class="fas fa-times me-1"></i>Deny
                            </button>
                            <button type="button" class="btn btn-success" id="${this.type}-allow">
                                <i class="fas fa-check me-1"></i>Allow
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = new bootstrap.Modal(document.getElementById(modalId));
        this.bindEvents();
    }

    getCookiesList(cookies) {
        return Object.values(cookies)
            .map(cookie => `<li><strong>${cookie.name}:</strong> ${cookie.purpose}</li>`)
            .join('') || '<li>No specific cookies defined for this category</li>';
    }

    show() {
        return new Promise((resolve) => {
            this.callback = resolve;
            this.modal.show();
        });
    }

    bindEvents() {
        document.getElementById(`${this.type}-allow`).addEventListener('click', () => {
            window.cookieManager.grantConsent(this.type);
            this.handleClose(true);
        });

        document.getElementById(`${this.type}-deny`).addEventListener('click', () => {
            this.handleClose(false);
        });
    }

    handleClose(granted) {
        this.modal.hide();
        if (this.callback) {
            this.callback(granted);
        }
    }
}

window.ConsentModal = ConsentModal;
