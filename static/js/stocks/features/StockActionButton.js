class StockActionButton {
    constructor(symbol, action, options = {}) {
        this.symbol = symbol;
        this.action = action; // 'watchlist', 'chart', 'open'
        this.options = {
            size: options.size || 'sm', // 'sm', 'md', 'lg'
            baseStyle: options.baseStyle || 'btn-outline-primary',
            activeStyle: options.activeStyle || 'btn-success',
            activeHoverStyle: options.activeHoverStyle || 'btn-outline-danger',
            baseIcon: options.baseIcon || 'fa-plus',
            activeIcon: options.activeIcon || 'fa-check',
            activeHoverIcon: options.activeHoverIcon || 'fa-minus',
            baseTitle: options.baseTitle || 'Action',
            activeTitle: options.activeTitle || 'Active Action',
            enableHoverEffects: options.enableHoverEffects !== false,
            customClasses: options.customClasses || '',
            ...options
        };
        this.isActive = options.isActive || false;
        this.element = null;
        this.clickHandler = options.clickHandler || null;
    }

    create() {
        const button = document.createElement('button');
        const btnStyle = this.isActive ? this.options.activeStyle : this.options.baseStyle;
        const btnIcon = this.isActive ? this.options.activeIcon : this.options.baseIcon;
        const btnTitle = this.isActive ? this.options.activeTitle : this.options.baseTitle;

        button.className = `btn btn-${this.options.size} ${btnStyle} ${this.options.customClasses}`.trim();
        button.setAttribute('data-action', this.action);
        button.setAttribute('data-symbol', this.symbol);
        button.setAttribute('title', btnTitle);
        button.innerHTML = `<i class="fas ${btnIcon}"></i>`;

        this.element = button;
        this.setupEventListeners();
        return button;
    }

    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
    }

    setupEventListeners() {
        if (!this.element) return;

        // Setup click handler
        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.clickHandler) {
                this.clickHandler(this.symbol, this.action, this);
            }
        });

        // Setup hover effects if enabled
        if (this.options.enableHoverEffects) {
            this.setupHoverEffects();
        }
    }

    removeEventListeners() {
        if (this.element) {
            // Clone element to remove all event listeners
            const newElement = this.element.cloneNode(true);
            this.element.parentNode.replaceChild(newElement, this.element);
            this.element = newElement;
        }
    }

    setupHoverEffects() {
        if (!this.element) return;

        this.element.addEventListener('mouseenter', () => {
            if (this.isActive && this.options.activeHoverStyle && this.options.activeHoverIcon) {
                this.element.classList.remove(this.options.activeStyle);
                this.element.classList.add(this.options.activeHoverStyle);
                this.element.querySelector('i').className = `fas ${this.options.activeHoverIcon}`;
            }
        });

        this.element.addEventListener('mouseleave', () => {
            if (this.isActive && this.options.activeStyle && this.options.activeIcon) {
                this.element.classList.remove(this.options.activeHoverStyle);
                this.element.classList.add(this.options.activeStyle);
                this.element.querySelector('i').className = `fas ${this.options.activeIcon}`;
            }
        });
    }

    updateState(isActive) {
        if (!this.element) return;

        this.isActive = isActive;
        const btnStyle = isActive ? this.options.activeStyle : this.options.baseStyle;
        const btnIcon = isActive ? this.options.activeIcon : this.options.baseIcon;
        const btnTitle = isActive ? this.options.activeTitle : this.options.baseTitle;

        // Update classes
        this.element.className = `btn btn-${this.options.size} ${btnStyle} ${this.options.customClasses}`.trim();
        this.element.setAttribute('title', btnTitle);
        this.element.querySelector('i').className = `fas ${btnIcon}`;
    }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        if (this.element) {
            this.updateState(this.isActive);
        }
    }

    setClickHandler(handler) {
        this.clickHandler = handler;
        if (this.element) {
            // Remove existing click listeners and add new one
            this.removeEventListeners();
            this.setupEventListeners();
        }
    }

    // Utility methods
    getElement() {
        return this.element;
    }

    isCreated() {
        return this.element !== null;
    }

    getSymbol() {
        return this.symbol;
    }

    getAction() {
        return this.action;
    }

    getState() {
        return this.isActive;
    }

    // Static factory methods for common button types
    static createWatchlistButton(symbol, isInWatchlist, options = {}) {
        const defaultOptions = {
            baseStyle: 'btn-outline-primary',
            activeStyle: 'btn-success',
            activeHoverStyle: 'btn-outline-danger',
            baseIcon: 'fa-plus',
            activeIcon: 'fa-check',
            activeHoverIcon: 'fa-minus',
            baseTitle: 'Add to Watchlist',
            activeTitle: 'Remove from Watchlist',
            isActive: isInWatchlist,
            ...options
        };
        return new StockActionButton(symbol, 'watchlist', defaultOptions);
    }

    static createChartButton(symbol, isChartOpen, options = {}) {
        const defaultOptions = {
            baseStyle: 'btn-outline-secondary',
            activeStyle: 'btn-outline-danger',
            activeHoverStyle: 'btn-outline-danger',
            baseIcon: 'fa-chart-line',
            activeIcon: 'fa-chart-line',
            activeHoverIcon: 'fa-times',
            baseTitle: 'View Chart',
            activeTitle: 'Close Chart',
            isActive: isChartOpen,
            ...options
        };
        return new StockActionButton(symbol, 'chart', defaultOptions);
    }

    static createOpenButton(symbol, options = {}) {
        const defaultOptions = {
            baseStyle: 'btn-outline-info',
            baseIcon: 'fa-external-link-alt',
            baseTitle: 'Open Details',
            enableHoverEffects: false,
            ...options
        };
        return new StockActionButton(symbol, 'open', defaultOptions);
    }
}
