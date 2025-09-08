/**
 * Stock utility functions
 *
 * Helpers for handling StockChart:
 * - getIntervalInMs: Convert stock's history interval string to milliseconds
 * - prepareChartData: Prepare stock chart data from API response
 */

/**
 * Convert stock's history interval string to milliseconds
 * @param interval {string} Interval string ('1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo')
 * @returns {number|null} Interval in milliseconds or null if invalid
 */
function getIntervalInMs(interval) {
    const match = interval?.match(/^(\d+)(m|h|d|wk|mo)$/);
    if (!match) return null;
    const value = Math.max(parseInt(match[1], 10), 0);
    const unit = match[2];
    switch (unit) {
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        case 'wk': return value * 7 * 24 * 60 * 60 * 1000;
        case 'mo': return value * 30 * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

/**
 * Prepare stock chart data from API response
 * @param data {Array} Array of data points with datetime and price/ohlc
 * @param ohlc {boolean} Whether data includes OHLC values
 * @returns {Array|null} Formatted data array or null if input is invalid
 */
function prepareChartData(data, ohlc = false) {
    if (Array.isArray(data) && data.length > 0 && data[0].datetime) {
        data = data.map(point => {
            const base = {
                // Convert ISO datetime to user's local time (timestamp in ms)
                timestamp: new Date(point.datetime).getTime()
            };
            if (ohlc) {
                base.open = point.open;
                base.high = point.high;
                base.low = point.low;
                base.close = point.close;
            } else {
                base.price = point.price || point.close;
            }
            return base;
        });
        // Sort by timestamp to ensure proper order
        return data.sort((a, b) => a.timestamp - b.timestamp);
    }
}
