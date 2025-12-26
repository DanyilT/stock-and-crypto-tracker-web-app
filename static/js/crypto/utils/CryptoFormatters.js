/**
 * Crypto Data Formatters - Utility functions for formatting cryptocurrency data
 * Provides consistent formatting for prices, percentages, market cap, volume, etc.
 */

const CryptoFormatters = {
    /**
     * Format currency values (prices, market cap, etc.)
     * @param {number} value - The numeric value to format
     * @param {Object} options - Formatting options
     * @returns {string} Formatted currency string
     */
    formatCurrency(value, options = {}) {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';

        const {
            currency = 'USD',
            minimumFractionDigits = 2,
            maximumFractionDigits = 2,
            compact = false,
            locale = 'en-US'
        } = options;

        const formatOptions = {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: minimumFractionDigits,
            maximumFractionDigits: maximumFractionDigits
        };

        if (compact && Math.abs(value) >= 1000) {
            formatOptions.notation = 'compact';
            formatOptions.compactDisplay = 'short';
        }

        try {
            return new Intl.NumberFormat(locale, formatOptions).format(value);
        } catch (error) {
            console.warn('Currency formatting error:', error);
            return `$${value.toFixed(2)}`;
        }
    },

    /**
     * Format crypto price with appropriate decimal places
     * @param {number} price - Crypto price
     * @param {Object} options - Formatting options
     * @returns {string} Formatted price string
     */
    formatPrice(price, options = {}) {
        if (price === null || price === undefined || isNaN(price)) return 'N/A';

        // Determine appropriate decimal places based on price
        let decimals = 2;
        if (price < 0.0001) decimals = 8;
        else if (price < 0.01) decimals = 6;
        else if (price < 1) decimals = 4;
        else if (price < 10) decimals = 3;

        return this.formatCurrency(price, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, ...options });
    },

    /**
     * Format percentage values
     * @param {number} percentage - Percentage value
     * @param {Object} options - Formatting options
     * @returns {string|Object} Formatted percentage string or object with color
     */
    formatPercentage(percentage, options = {}) {
        if (percentage === null || percentage === undefined || isNaN(percentage)) {
            return options.colored ? { value: 'N/A', color: 'neutral' } : 'N/A';
        }

        const {
            decimals = 2,
            showSign = true,
            colored = false
        } = options;

        const formattedValue = Math.abs(percentage).toFixed(decimals);
        const isPositive = percentage > 0;
        const isNegative = percentage < 0;

        let sign = '';
        let color = 'neutral';

        if (showSign || isNegative) {
            if (isPositive) {
                sign = '+';
                color = 'positive';
            } else if (isNegative) {
                sign = '-';
                color = 'negative';
            }
        } else if (isPositive) {
            color = 'positive';
        }

        const result = `${sign}${formattedValue}%`;
        return colored ? { value: result, color: color } : result;
    },

    /**
     * Format market capitalization
     * @param {number} marketCap - Market cap value
     * @param {Object} options - Formatting options
     * @returns {string} Formatted market cap string
     */
    formatMarketCap(marketCap, options = {}) {
        if (marketCap === null || marketCap === undefined || isNaN(marketCap)) return 'N/A';
        return this.formatCurrency(marketCap, { compact: true, ...options });
    },

    /**
     * Format trading volume
     * @param {number} volume - Volume value
     * @param {Object} options - Formatting options
     * @returns {string} Formatted volume string
     */
    formatVolume(volume, options = {}) {
        if (volume === null || volume === undefined || isNaN(volume)) return 'N/A';
        return this.formatCurrency(volume, { compact: true, ...options });
    },

    /**
     * Format supply (circulating, total, max)
     * @param {number} supply - Supply value
     * @param {string} symbol - Crypto symbol
     * @returns {string} Formatted supply string
     */
    formatSupply(supply, symbol = '') {
        if (supply === null || supply === undefined || isNaN(supply)) return 'N/A';

        const formatOptions = {
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 2
        };

        try {
            const formatted = new Intl.NumberFormat('en-US', formatOptions).format(supply);
            return symbol ? `${formatted} ${symbol}` : formatted;
        } catch (error) {
            return supply.toLocaleString();
        }
    },

    /**
     * Format crypto symbol
     * @param {string} symbol - Crypto symbol
     * @returns {string} Formatted symbol
     */
    formatSymbol(symbol) {
        return symbol ? symbol.toUpperCase() : 'N/A';
    },

    /**
     * Format crypto name with truncation
     * @param {string} name - Crypto name
     * @param {number} maxLength - Maximum length
     * @returns {string} Formatted name
     */
    formatName(name, maxLength = 20) {
        if (!name) return 'N/A';
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    },

    /**
     * Format price change with color indication
     * @param {Object} change - Change object with absolute and percentage values
     * @param {Object} options - Formatting options
     * @returns {Object} Formatted change with color
     */
    formatPriceChange(change, options = {}) {
        const { absolute, percentage } = change;
        const { showChangeIcon = true, showSign = true, colored = true } = options;

        const absFormatted = this.formatCurrency(Math.abs(absolute || 0), { minimumFractionDigits: 2 });
        const pctFormatted = this.formatPercentage(percentage, { showSign, colored });

        const isPositive = (percentage || 0) > 0;
        const isNegative = (percentage || 0) < 0;
        const color = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';

        let icon = '';
        if (showChangeIcon) {
            icon = isPositive ? '<i class="fas fa-caret-up"></i> ' : isNegative ? '<i class="fas fa-caret-down"></i> ' : '';
        }

        const sign = isPositive ? '+' : isNegative ? '-' : '';
        const combinedValue = `${icon}${sign}${absFormatted} (${colored ? pctFormatted.value : pctFormatted})`;

        return {
            absolute: { value: `${sign}${absFormatted}`, color },
            percentage: colored ? pctFormatted : { value: pctFormatted, color },
            combined: { value: combinedValue, color }
        };
    },

    /**
     * Get CSS color class based on color type
     * @param {string} color - Color type (positive, negative, neutral)
     * @returns {string} CSS class
     */
    getColorClass(color) {
        switch (color) {
            case 'positive': return 'text-success';
            case 'negative': return 'text-danger';
            default: return 'text-muted';
        }
    },

    /**
     * Format rank badge
     * @param {number} rank - Market cap rank
     * @returns {string} HTML badge
     */
    formatRank(rank) {
        if (!rank) return '<span class="badge bg-secondary">N/A</span>';
        return `<span class="badge bg-primary">#${rank}</span>`;
    }
};
