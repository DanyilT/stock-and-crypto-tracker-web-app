/**
 * Stock Data Formatters - Utility functions for formatting stock-related data
 * Provides consistent formatting for prices, percentages, market cap, volume, etc.
 */

/**
 * Format currency values (prices, market cap, etc.)
 * @param {number} value - The numeric value to format
 * @param {Object} options - Formatting options
 * @param {string} options.currency - Currency code (default: 'USD')
 * @param {number} options.minimumFractionDigits - Minimum decimal places
 * @param {number} options.maximumFractionDigits - Maximum decimal places
 * @param {boolean} options.compact - Use compact notation for large numbers
 * @param {string} options.locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, options = {}) {
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
}

/**
 * Format stock price with appropriate decimal places
 * @param {number} price - Stock price
 * @param {Object} options - Formatting options
 * @returns {string} Formatted price string
 */
function formatPrice(price, options = {}) {
    if (price === null || price === undefined || isNaN(price)) return 'N/A';

    // Determine appropriate decimal places based on price
    let decimals = 2;
    if (price < 1) decimals = 4;
    else if (price < 10) decimals = 3;

    return formatCurrency(price, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, ...options });
}

/**
 * Format percentage values
 * @param {number} percentage - Percentage value (as decimal or percentage)
 * @param {Object} options - Formatting options
 * @param {boolean} options.isDecimal - Whether input is decimal (0.05) or percentage (5)
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @param {boolean} options.showSign - Always show + or - sign
 * @param {boolean} options.colored - Return object with color class
 * @returns {string|Object} Formatted percentage string or object with color
 */
function formatPercentage(percentage, options = {}) {
    if (percentage === null || percentage === undefined || isNaN(percentage)) return options.colored ? { value: 'N/A', color: 'neutral' } : 'N/A';

    const {
        isDecimal = true,
        decimals = 2,
        showSign = true,
        colored = false
    } = options;

    // Convert decimal to percentage if needed
    const percentValue = isDecimal ? percentage * 100 : percentage;

    // Format the number
    const formattedValue = Math.abs(percentValue).toFixed(decimals);

    // Determine sign and color
    const isPositive = percentValue > 0;
    const isNegative = percentValue < 0;
    const isZero = percentValue === 0;

    let sign = '';
    let color = 'neutral';

    if (showSign || isNegative) {
        if (isPositive) {
            sign = '+';
            color = 'positive';
        } else if (isNegative) {
            sign = '-';
            color = 'negative';
        } else {
            color = 'neutral';
        }
    } else if (isPositive) {
        color = 'positive';
    }

    const result = `${sign}${formattedValue}%`;

    return colored ? { value: result, color: color } : result;
}

/**
 * Format market capitalization
 * @param {number} marketCap - Market cap value
 * @param {Object} options - Formatting options
 * @param {boolean} options.compact - Use compact notation (B, M, T) (default: true)
 * @param {string} options.locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted market cap string
 */
function formatMarketCap(marketCap, options = {}) {
    if (marketCap === null || marketCap === undefined || isNaN(marketCap)) return 'N/A';

    const {
        compact = true,
        locale = 'en-US',
        ...rest
    } = options;

    return formatCurrency(marketCap, { compact, locale, ...rest });

    // Custom compact formatting for better readability
    // const absValue = Math.abs(volume);
    // if (absValue >= 1e12) {
    //     return `$${(marketCap / 1e12).toFixed(2)}T`;
    // } else if (absValue >= 1e9) {
    //     return `$${(marketCap / 1e9).toFixed(2)}B`;
    // } else if (absValue >= 1e6) {
    //     return `$${(marketCap / 1e6).toFixed(2)}M`;
    // } else if (absValue >= 1e3) {
    //     return `$${(marketCap / 1e3).toFixed(2)}K`;
    // } else {
    //     return formatCurrency(marketCap);
    // }
}

/**
 * Format trading volume
 * @param {number} volume - Trading volume
 * @param {Object} options - Formatting options
 * @param {number} options.minimumFractionDigits - Minimum decimal places (default: 2)
 * @param {number} options.maximumFractionDigits - Maximum decimal places (default: 2)
 * @param {boolean} options.compact - Use compact notation for large numbers (default: true)
 * @param {string} options.locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted volume string
 */
function formatVolume(volume, options = {}) {
    if (volume === null || volume === undefined || isNaN(volume)) return 'N/A';

    const {
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
        compact = true,
        locale = 'en-US',
    } = options;

    const formatOptions = { minimumFractionDigits: minimumFractionDigits, maximumFractionDigits: maximumFractionDigits };
    if (compact && Math.abs(volume) >= 1000) {
        formatOptions.notation = 'compact';
        formatOptions.compactDisplay = 'short';
    }

    try {
        return new Intl.NumberFormat(locale, formatOptions).format(volume);
    } catch (error) {
        console.warn('Volume formatting error:', error);
        return `${volume.toFixed(2)}`;
    }

    // Custom compact formatting
    // const absValue = Math.abs(volume);
    // if (absValue >= 1e9) {
    //     return `${(volume / 1e9).toFixed(2)}B`;
    // } else if (absValue >= 1e6) {
    //     return `${(volume / 1e6).toFixed(2)}M`;
    // } else if (absValue >= 1e3) {
    //     return `${(volume / 1e3).toFixed(2)}K`;
    // } else {
    //     return new Intl.NumberFormat('en-US').format(volume);
    // }
}

/**
 * Format stock symbol for display
 * @param {string} symbol - Stock symbol
 * @param {Object} options - Formatting options
 * @param {boolean} options.uppercase - Convert to uppercase
 * @param {number} options.maxLength - Maximum length to display
 * @returns {string} Formatted symbol
 */
function formatSymbol(symbol, options = {}) {
    if (!symbol || typeof symbol !== 'string') return 'N/A';

    const { uppercase = true, maxLength = null } = options;

    let formatted = symbol.trim();
    if (uppercase) formatted = formatted.toUpperCase();
    if (maxLength && formatted.length > maxLength) formatted = formatted.substring(0, maxLength) + '...';
    return formatted;
}

/**
 * Format company name for display
 * @param {string} name - Company name
 * @param {number} maxLength - Maximum length to display
 * @returns {string} Formatted company name
 */
function formatCompanyName(name, maxLength = 50) {
    if (!name || typeof name !== 'string') return 'N/A';

    name = name.trim();
    if (maxLength && name.length > maxLength) return name.substring(0, maxLength - 3) + '...';
    return name;
}

/**
 * Format date for stock data
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options
 * @param {string} options.format - Format type ('short', 'medium', 'long', 'time')
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
    if (!date) return 'N/A';

    const { format = 'medium', locale = 'en-US' } = options;

    const formatOptions = {
        short: { month: 'short', day: 'numeric', year: 'numeric' },
        medium: { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
        long: { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' },
        time: { hour: 'numeric', minute: '2-digit', second: '2-digit' }
    };

    let dateObj;
    if (date instanceof Date) dateObj = date;
    else dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    try {
        return new Intl.DateTimeFormat(locale, formatOptions[format] || formatOptions.medium).format(dateObj);
    } catch (error) {
        console.warn('Date formatting error:', error);
        return dateObj.toLocaleDateString();
    }
}

/**
 * Format price change (absolute and percentage)
 * @param {Object} changeData - Change data object
 * @param {number} changeData.absolute - Absolute price change
 * @param {number} changeData.percentage - Percentage change (as decimal)
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted change data with color
 */
function formatPriceChange(changeData, options = {}) {
    if (!changeData || typeof changeData !== 'object') {
        return {
            absolute: { value: 'N/A', color: 'neutral' },
            percentage: { value: 'N/A', color: 'neutral' },
            combined: { value: 'N/A', color: 'neutral' }
        };
    }

    const { absolute, percentage } = changeData;
    const { showCurrency = true, showSign = true, showChangeIcon = false, colored = true } = options;

    // Format absolute change
    const absFormatted = absolute !== null && !isNaN(absolute) ? (showCurrency ? formatCurrency(Math.abs(absolute), options) : Math.abs(absolute).toFixed(2)) : 'N/A';

    // Format percentage change
    const pctFormatted = formatPercentage(percentage, { showSign, colored, ...options });

    // Determine color based on change direction
    let color = 'neutral';
    if (absolute > 0) color = 'positive';
    else if (absolute < 0) color = 'negative';

    // Create sign prefix for absolute value
    const sign = absolute > 0 ? '+' : absolute < 0 ? '-' : '';
    const changeIcon = absolute > 0 ? '↗' : absolute < 0 ? '↘' : '→';

    return {
        absolute: {
            value: absolute !== null && !isNaN(absolute) ? `${showChangeIcon ? changeIcon : ''}${showSign ? sign : ''}${absFormatted}` : 'N/A',
            color: color
        },
        percentage: pctFormatted,
        combined: {
            value: absolute !== null && !isNaN(absolute) && percentage !== null && !isNaN(percentage) ? `${showChangeIcon ? changeIcon + ' ' : ''}${showSign ? sign : ''}${absFormatted} (${pctFormatted.value})` : 'N/A',
            color: color
        }
    };
}

/**
 * Format large numbers with appropriate units
 * @param {number} value - The number to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number string
 */
function formatLargeNumber(value, options = {}) {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';

    const { decimals = 2, units = ['', 'K', 'M', 'B', 'T'] } = options;

    let unitIndex = 0;
    let displayValue = Math.abs(value);

    while (displayValue >= 1000 && unitIndex < units.length - 1) {
        displayValue /= 1000;
        unitIndex++;
    }

    const formatted = displayValue.toFixed(decimals);
    const sign = value < 0 ? '-' : '';

    return `${sign}${formatted}${units[unitIndex]}`;
}


/**
 * Get CSS class for color-coded values
 * @param {string} colorType - Color type ('positive', 'negative', 'neutral')
 * @param {string} prefix - CSS class prefix (default: 'text')
 * @returns {string} CSS class name
 */
function getColorClass(colorType, prefix = 'text') {
    const colorMap = {
        positive: `${prefix}-success`,
        negative: `${prefix}-danger`,
        neutral: `${prefix}-muted`
    };

    return colorMap[colorType] || colorMap.neutral;
}


// Export all formatting functions
window.StockFormatters = {
    // Core formatters
    formatCurrency,
    formatPrice,
    formatPercentage,
    formatMarketCap,
    formatVolume,

    // Text formatters
    formatSymbol,
    formatCompanyName,

    // Date formatting
    formatDate,

    // Complex formatters
    formatPriceChange,
    formatLargeNumber,

    // Utilities
    getColorClass
};
