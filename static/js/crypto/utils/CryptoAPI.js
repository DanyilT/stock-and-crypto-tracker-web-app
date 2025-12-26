/**
 * Crypto API Utility - Unified API request system for cryptocurrency data
 * Contains all available API endpoints and request functions
 */

// API Endpoints Configuration
const CRYPTO_API_ENDPOINTS = {
    // Crypto Search & Popular
    cryptoSearch: {
        method: 'GET',
        url: '/api/crypto/search',
        params: ['q']
    },
    popularCryptos: {
        method: 'GET',
        url: '/api/crypto/popular',
        params: ['top']
    },
    popularCryptosList: {
        method: 'GET',
        url: '/api/crypto/popular/list',
        params: ['top', 'symbols-only']
    },

    // Individual Crypto Data
    cryptoInfo: {
        method: 'GET',
        url: '/api/crypto/{cryptoId}',
        pathParams: ['cryptoId'],
        params: ['full-data']
    },
    cryptoHistory: {
        method: 'GET',
        url: '/api/crypto/{cryptoId}/history',
        pathParams: ['cryptoId'],
        params: ['days', 'interval', 'ohlc', 'data-only']
    },
    cryptoBySymbol: {
        method: 'GET',
        url: '/api/crypto/symbol/{symbol}',
        pathParams: ['symbol'],
        params: ['full-data']
    }
};


/**
 * Unified API request function for crypto endpoints
 * @param {string} endpointKey - Key from CRYPTO_API_ENDPOINTS
 * @param {Object} options - Request options
 * @param {Object} options.pathParams - Path parameters (e.g., {cryptoId: 'bitcoin'})
 * @param {Object} options.queryParams - Query parameters (e.g., {days: '30'})
 * @param {Object} options.fetchOptions - Additional fetch options
 * @returns {Promise<Object>} - Parsed JSON response
 */
async function cryptoApiRequest(endpointKey, options = {}) {
    const endpoint = CRYPTO_API_ENDPOINTS[endpointKey];
    if (!endpoint) {
        throw new Error(`Unknown crypto API endpoint: ${endpointKey}`);
    }

    let url = endpoint.url;

    // Replace path parameters
    if (endpoint.pathParams && options.pathParams) {
        for (const param of endpoint.pathParams) {
            if (options.pathParams[param]) {
                url = url.replace(`{${param}}`, encodeURIComponent(options.pathParams[param]));
            }
        }
    }

    // Add query parameters
    if (endpoint.params && options.queryParams) {
        const queryString = Object.entries(options.queryParams)
            .filter(([key, value]) => endpoint.params.includes(key) && value !== undefined && value !== null)
            .map(([key, value]) => {
                // Handle boolean flags (like 'ohlc', 'data-only')
                if (value === true) return key;
                return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join('&');

        if (queryString) {
            url += `?${queryString}`;
        }
    }

    // Make the request
    const fetchOptions = {
        method: endpoint.method,
        headers: {
            'Content-Type': 'application/json',
            ...options.fetchOptions?.headers
        },
        ...options.fetchOptions
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}


/**
 * CryptoAPI - High-level API wrapper for crypto-related operations
 */
const CryptoAPI = {
    /**
     * Search for cryptocurrencies by name or symbol
     * @param {string} query - Search query
     * @returns {Promise<Array>} - Array of matching cryptos
     */
    async searchCryptos(query) {
        return cryptoApiRequest('cryptoSearch', {
            queryParams: { q: query }
        });
    },

    /**
     * Get popular cryptocurrencies
     * @param {number} top - Number of cryptos to fetch
     * @returns {Promise<Array>} - Array of crypto data
     */
    async getPopularCryptos(top = 10) {
        return cryptoApiRequest('popularCryptos', {
            queryParams: { top }
        });
    },

    /**
     * Get list of popular crypto IDs/names for dropdowns
     * @param {number} top - Number of cryptos to fetch
     * @param {boolean} symbolsOnly - Return only IDs
     * @returns {Promise<Array>} - Array of crypto info
     */
    async getPopularCryptosList(top = 10, symbolsOnly = false) {
        return cryptoApiRequest('popularCryptosList', {
            queryParams: {
                top,
                'symbols-only': symbolsOnly ? true : undefined
            }
        });
    },

    /**
     * Get individual crypto data
     * @param {string} cryptoId - CoinGecko crypto ID (e.g., 'bitcoin')
     * @param {boolean} fullData - Include comprehensive data
     * @returns {Promise<Object>} - Crypto data
     */
    async getCrypto(cryptoId, fullData = false) {
        return cryptoApiRequest('cryptoInfo', {
            pathParams: { cryptoId },
            queryParams: { 'full-data': fullData ? true : undefined }
        });
    },

    /**
     * Get crypto by symbol (e.g., BTC, ETH)
     * @param {string} symbol - Crypto symbol
     * @param {boolean} fullData - Include comprehensive data
     * @returns {Promise<Object>} - Crypto data
     */
    async getCryptoBySymbol(symbol, fullData = false) {
        return cryptoApiRequest('cryptoBySymbol', {
            pathParams: { symbol },
            queryParams: { 'full-data': fullData ? true : undefined }
        });
    },

    /**
     * Get crypto historical data
     * @param {string} cryptoId - CoinGecko crypto ID
     * @param {Object} options - History options
     * @param {string} options.days - Number of days (1, 7, 14, 30, 90, 180, 365, max)
     * @param {string} options.interval - Data interval (daily, hourly)
     * @param {boolean} options.ohlc - Get OHLC data for candlestick charts
     * @param {boolean} options.dataOnly - Return only data array
     * @returns {Promise<Object>} - Historical data with metadata
     */
    async getCryptoHistory(cryptoId, options = {}) {
        return cryptoApiRequest('cryptoHistory', {
            pathParams: { cryptoId },
            queryParams: {
                days: options.days || '30',
                interval: options.interval,
                ohlc: options.ohlc ? true : undefined,
                'data-only': options.dataOnly ? true : undefined
            }
        });
    }
};
