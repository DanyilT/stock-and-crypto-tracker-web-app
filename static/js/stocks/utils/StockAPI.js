/**
 * Stock API Utility - Unified API request system
 * Contains all available API endpoints and a single request function
 */

// API Endpoints Configuration
const API_ENDPOINTS = {
    // Stock Search & Popular
    stockSearch: {
        method: 'GET',
        url: '/api/stocks/search',
        params: ['q']
    },
    popularStocks: {
        method: 'GET',
        url: '/api/stocks/popular',
        params: ['top']
    },
    popularStocksList: {
        method: 'GET',
        url: '/api/stocks/popular/list',
        params: ['top', 'symbols-only']
    },

    // Individual Stock Data
    stockInfo: {
        method: 'GET',
        url: '/api/stock/{symbol}',
        pathParams: ['symbol']
    },
    stockHistory: {
        method: 'GET',
        url: '/api/stock/{symbol}/history',
        pathParams: ['symbol'],
        params: ['period', 'start', 'end', 'interval', 'ohlc', 'data-only']
    },
    stockDetails: {
        method: 'GET',
        url: '/api/stock/{symbol}/details',
        pathParams: ['symbol'],
        params: ['period', 'interval', 'ohlc']
    },
    stockQuote: {
        method: 'GET',
        url: '/api/stock/{symbol}/quote',
        pathParams: ['symbol']
    },

    // Stock Historical & Financial Data
    stockSplits: {
        method: 'GET',
        url: '/api/stock/{symbol}/splits',
        pathParams: ['symbol']
    },
    stockDividends: {
        method: 'GET',
        url: '/api/stock/{symbol}/dividends',
        pathParams: ['symbol'],
        params: ['period']
    },
    stockFinancials: {
        method: 'GET',
        url: '/api/stock/{symbol}/financials',
        pathParams: ['symbol'],
        params: ['type', 'quarterly']
    },

    // Stock Additional Data
    stockHolders: {
        method: 'GET',
        url: '/api/stock/{symbol}/holders',
        pathParams: ['symbol']
    },
    stockOptions: {
        method: 'GET',
        url: '/api/stock/{symbol}/options',
        pathParams: ['symbol']
    },
    stockNews: {
        method: 'GET',
        url: '/api/stock/{symbol}/news',
        pathParams: ['symbol'],
        params: ['limit']
    },

    // Market Data
    marketIndices: {
        method: 'GET',
        url: '/api/market/indices'
    },
    marketNews: {
        method: 'GET',
        url: '/api/market/news',
        params: ['limit', 'category']
    }
};


/**
 * Unified API request function
 * @param {string} endpointKey - Key from API_ENDPOINTS
 * @param {Object} options - Request options
 * @param {Object} options.pathParams - Path parameters (e.g., {symbol: 'AAPL'})
 * @param {Object} options.queryParams - Query parameters (e.g., {period: '1mo'})
 * @param {Object} options.fetchOptions - Additional fetch options
 * @returns {Promise<any>} API response data
 */
async function apiRequest(endpointKey, options = {}) {
    try {
        const endpoint = API_ENDPOINTS[endpointKey];
        if (!endpoint) throw new Error(`Unknown endpoint: ${endpointKey}`);

        const {
            pathParams = {},
            queryParams = {},
            fetchOptions = {}
        } = options;

        // Build URL with path parameters
        let url = endpoint.url;
        if (endpoint.pathParams) {
            endpoint.pathParams.forEach(param => {
                const value = pathParams[param];
                if (value !== undefined && value !== null) {
                    url = url.replace(`{${param}}`, encodeURIComponent(formatSymbol(value)));
                }
            });
        }

        // Build query string
        const params = new URLSearchParams();
        if (endpoint.params && queryParams) {
            endpoint.params.forEach(param => {
                const value = queryParams[param];
                if (value !== undefined && value !== null) {
                    if (param === 'symbols-only' && value) params.append('symbols-only', '');
                    else if (param === 'data-only' && value) params.append('data-only', '');
                    else if (param === 'ohlc' && value) params.append('ohlc', '');
                    else if (param === 'quarterly' && value) params.append('quarterly', '');
                    else params.append(param, value);
                }
            });
        }

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        // Default fetch options
        const defaultOptions = {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(url, { ...defaultOptions, ...fetchOptions });
        if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);

        return await response.json();
    } catch (error) {
        console.error(`API request error for ${endpointKey}:`, error);
        throw error;
    }
}

/**
 * Batch request multiple endpoints
 * @param {Array} requests - Array of request objects {endpoint, options}
 * @returns {Promise<Array>} Array of responses
 */
async function batchApiRequest(requests) {
    try {
        const promises = requests.map(req => apiRequest(req.endpoint, req.options).catch(error => ({ error: error.message })));
        return await Promise.all(promises);
    } catch (error) {
        console.error('Batch API request error:', error);
        throw error;
    }
}


// Individual API functions for each endpoint

/**
 * Search for stocks by symbol or name
 * @param {string} query - Search query (stock symbol or company name)
 * @returns {Promise<Object|Array>} Stock data or array of stock data
 */
async function searchStocks(query) {
    return apiRequest('stockSearch', {
        queryParams: { q: query }
    });
}

/**
 * Get popular stocks
 * @param {number} top - Number of top stocks to fetch (default 10)
 * @returns {Promise<Array>} Array of popular stock data
 */
async function getPopularStocks(top = 10) {
    return apiRequest('popularStocks', {
        queryParams: { top }
    });
}

/**
 * Get popular stocks list (symbols only or with basic info)
 * @param {number} top - Number of top stocks to fetch (default 10)
 * @param {boolean} symbolsOnly - Whether to return only symbols (default false)
 * @returns {Promise<Array>} Array of popular stock symbols with basic info
 */
async function getPopularStocksList(top = 10, symbolsOnly = false) {
    return apiRequest('popularStocksList', {
        queryParams: { top, 'symbols-only': symbolsOnly }
    });
}

/**
 * Get individual stock data
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Stock data
 */
async function getStock(symbol) {
    return apiRequest('stockInfo', {
        pathParams: { symbol }
    });
}

/**
 * Get stock historical data
 * @param {string} symbol - Stock symbol
 * @param {Object} options - Options for historical data (period, start, end, interval, ohlc, dataOnly)
 * @returns {Promise<Object>} Historical data
 */
async function getStockHistory(symbol, options = {}) {
    const queryParams = { ...options };

    // Handle dataOnly parameter conversion
    if (options.dataOnly) {
        queryParams['data-only'] = true;
        delete queryParams.dataOnly;
    }

    return apiRequest('stockHistory', {
        pathParams: { symbol },
        queryParams
    });
}

/**
 * Get comprehensive stock details
 * @param {string} symbol - Stock symbol
 * @param {string} options - Options for historical data (period, interval, ohlc)
 * @returns {Promise<Object>} Detailed stock data
 */
async function getStockDetails(symbol, options = {}) {
    return apiRequest('stockDetails', {
        pathParams: { symbol },
        queryParams: { ...options }
    });
}

/**
 * Get stock quote (real-time price data)
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Real-time quote data
 */
async function getQuote(symbol) {
    return apiRequest('stockQuote', {
        pathParams: { symbol }
    });
}

/**
 * Get stock splits history
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Array>} Stock splits data
 */
async function getStockSplits(symbol) {
    return apiRequest('stockSplits', {
        pathParams: { symbol }
    });
}

/**
 * Get stock dividend history
 * @param {string} symbol - Stock symbol
 * @param {string} period - Period for dividends (1y, 3y, 5y, max)
 * @returns {Promise<Array>} Dividend history data
 */
async function getStockDividends(symbol, period = '5y') {
    return apiRequest('stockDividends', {
        pathParams: { symbol },
        queryParams: { period }
    });
}

/**
 * Get stock financial statements
 * @param {string} symbol - Stock symbol
 * @param {string} type - Financial type ('income', 'balance', 'cashflow')
 * @param {boolean} quarterly - Whether to get quarterly data
 * @returns {Promise<Object>} Financial data
 */
async function getStockFinancials(symbol, type = 'income', quarterly = false) {
    return apiRequest('stockFinancials', {
        pathParams: { symbol },
        queryParams: { type, quarterly }
    });
}

/**
 * Get institutional holders data
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Institutional holders data
 */
async function getStockHolders(symbol) {
    return apiRequest('stockHolders', {
        pathParams: { symbol }
    });
}

/**
 * Get stock options data
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Options data
 */
async function getStockOptions(symbol) {
    return apiRequest('stockOptions', {
        pathParams: { symbol }
    });
}

/**
 * Get stock news
 * @param {string} symbol - Stock symbol
 * @param {number} limit - Number of news articles to fetch (default 10)
 * @returns {Promise<Array>} Array of news articles
 */
async function getStockNews(symbol, limit = 10) {
    return apiRequest('stockNews', {
        pathParams: { symbol },
        queryParams: { limit }
    });
}

/**
 * Get market indices (S&P 500, NASDAQ, DOW, etc.)
 * @returns {Promise<Object>} Market indices data
 */
async function getMarketIndices() {
    return apiRequest('marketIndices');
}

/**
 * Get market news
 * @param {number} limit - Number of news articles to fetch (default 20)
 * @param {string} category - News category (optional)
 * @returns {Promise<Array>} Array of market news articles
 */
async function getMarketNews(limit = 20, category = 'general') {
    return apiRequest('marketNews', {
        queryParams: { limit, category }
    });
}


// Utility functions

/**
 * Get all available API endpoints
 * @returns {Object} Available endpoints configuration
 */
function getAvailableEndpoints() {
    return { ...API_ENDPOINTS };
}


// Export all functions for use in other modules
window.StockAPI = {
    // Core API function
    apiRequest,
    batchApiRequest,

    // Stock search and popular
    searchStocks,
    getPopularStocks,
    getPopularStocksList,

    // Individual stock data
    getStock,
    getStockHistory,
    getStockDetails,
    getQuote,

    // Stock financial data
    getStockSplits,
    getStockDividends,
    getStockFinancials,

    // Stock additional data
    getStockHolders,
    getStockOptions,
    getStockNews,

    // Market data
    getMarketIndices,
    getMarketNews,

    // Utilities
    getAvailableEndpoints,

    // Direct access to endpoints config
    endpoints: API_ENDPOINTS
};
