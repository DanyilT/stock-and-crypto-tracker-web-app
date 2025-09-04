/**
 * Search for stocks by symbol or name
 * @param {string} query - Search query (stock symbol or company name)
 * @returns {Promise<Object|Array>} Stock data or array of stock data
 */
async function searchStocks(query) {
    try {
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Stock search error:', error);
        throw error;
    }
}

/**
 * Get popular stocks
 * @param {number} top - Number of top stocks to fetch (default 10)
 * @returns {Promise<Array>} Array of popular stock data
 */
async function getPopularStocks(top = 10) {
    try {
        const response = await fetch(`/api/stocks/popular?top=${top}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch popular stocks: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Popular stocks error:', error);
        throw error;
    }
}

/**
 * Get individual stock data
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Stock data
 */
async function getStock(symbol) {
    try {
        const response = await fetch(`/api/stock/${symbol}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch stock ${symbol}: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Stock data error:', error);
        throw error;
    }
}

/**
 * Get stock historical data
 * @param {string} symbol - Stock symbol
 * @param {Object} options - Options for historical data (period, start, end, interval, ohlc, dataOnly)
 * @returns {Promise<Object>} Historical data
 */
async function getStockHistory(symbol, options = {}) {
    try {
        const params = new URLSearchParams();

        // Add options as query parameters
        Object.keys(options).forEach(key => {
            if (options[key] !== undefined && options[key] !== null) {
                if (key === 'dataOnly' && options[key]) {
                    params.append('data-only', '');
                } else {
                    params.append(key, options[key]);
                }
            }
        });

        const queryString = params.toString();
        const url = `/api/stock/${symbol}/history${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch stock history for ${symbol}: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Stock history error:', error);
        throw error;
    }
}

/**
 * Get comprehensive stock details
 * @param {string} symbol - Stock symbol
 * @param {string} period - Period for historical data (optional)
 * @returns {Promise<Object>} Detailed stock data
 */
// async function getStockDetails(symbol, period = '1mo') {
//     try {
//         const params = new URLSearchParams();
//         if (period) {
//             params.append('period', period);
//         }
//
//         const queryString = params.toString();
//         const url = `/api/stock/${symbol}/details${queryString ? `?${queryString}` : ''}`;
//
//         const response = await fetch(url);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch stock details for ${symbol}: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Stock details error:', error);
//         throw error;
//     }
// }

/**
 * Get stock quote (real-time price data)
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Real-time quote data
 */
// async function getQuote(symbol) {
//     try {
//         const response = await fetch(`/api/stock/${symbol}/quote`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch quote for ${symbol}: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Stock quote error:', error);
//         throw error;
//     }
// }

/**
 * Get stock news
 * @param {string} symbol - Stock symbol
 * @param {number} limit - Number of news articles to fetch (default 10)
 * @returns {Promise<Array>} Array of news articles
 */
// async function getStockNews(symbol, limit = 10) {
//     try {
//         const response = await fetch(`/api/stock/${symbol}/news?limit=${limit}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch news for ${symbol}: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Stock news error:', error);
//         throw error;
//     }
// }

/**
 * Get market news
 * @param {number} limit - Number of news articles to fetch (default 20)
 * @param {string} category - News category (optional)
 * @returns {Promise<Array>} Array of market news articles
 */
// async function getMarketNews(limit = 20, category = null) {
//     try {
//         const params = new URLSearchParams({ limit });
//         if (category) {
//             params.append('category', category);
//         }
//
//         const response = await fetch(`/api/market/news?${params.toString()}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch market news: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Market news error:', error);
//         throw error;
//     }
// }

/**
 * Get market indices (S&P 500, NASDAQ, DOW, etc.)
 * @param {Array<string>} indices - Array of index symbols (default: major indices)
 * @returns {Promise<Object>} Market indices data
 */
// async function getMarketIndices(indices = ['^GSPC', '^IXIC', '^DJI']) {
//     try {
//         const symbolsParam = indices.join(',');
//         const response = await fetch(`/api/market/indices?symbols=${encodeURIComponent(symbolsParam)}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch market indices: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Market indices error:', error);
//         throw error;
//     }
// }

/**
 * Get stock financials (income statement, balance sheet, cash flow)
 * @param {string} symbol - Stock symbol
 * @param {string} type - Financial type ('income', 'balance', 'cashflow', 'all')
 * @returns {Promise<Object>} Financial data
 */
// async function getStockFinancials(symbol, type = 'all') {
//     try {
//         const response = await fetch(`/api/stock/${symbol}/financials?type=${type}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch financials for ${symbol}: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Stock financials error:', error);
//         throw error;
//     }
// }

/**
 * Get stock options data
 * @param {string} symbol - Stock symbol
 * @param {string} expiration - Expiration date (YYYY-MM-DD format, optional)
 * @returns {Promise<Object>} Options data
 */
// async function getStockOptions(symbol, expiration = null) {
//     try {
//         const params = expiration ? `?expiration=${expiration}` : '';
//         const response = await fetch(`/api/stock/${symbol}/options${params}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch options for ${symbol}: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Stock options error:', error);
//         throw error;
//     }
// }

/**
 * Get sector performance
 * @returns {Promise<Array>} Array of sector performance data
 */
// async function getSectorPerformance() {
//     try {
//         const response = await fetch('/api/market/sectors');
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch sector performance: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Sector performance error:', error);
//         throw error;
//     }
// }

/**
 * Get trending stocks
 * @param {string} region - Region (US, EU, etc.)
 * @param {number} limit - Number of trending stocks (default 10)
 * @returns {Promise<Array>} Array of trending stocks
 */
// async function getTrendingStocks(region = 'US', limit = 10) {
//     try {
//         const response = await fetch(`/api/stocks/trending?region=${region}&limit=${limit}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch trending stocks: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Trending stocks error:', error);
//         throw error;
//     }
// }

/**
 * Get gainers and losers
 * @param {string} type - Type ('gainers', 'losers', 'active')
 * @param {number} limit - Number of stocks (default 10)
 * @returns {Promise<Array>} Array of stocks
 */
// async function getGainersLosers(type = 'gainers', limit = 10) {
//     try {
//         const response = await fetch(`/api/stocks/${type}?limit=${limit}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch ${type}: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error(`${type} error:`, error);
//         throw error;
//     }
// }

/**
 * Get stock recommendations/analyst ratings
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Analyst recommendations
 */
// async function getAnalystRecommendations(symbol) {
//     try {
//         const response = await fetch(`/api/stock/${symbol}/recommendations`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch recommendations for ${symbol}: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Analyst recommendations error:', error);
//         throw error;
//     }
// }

/**
 * Get stock earnings data
 * @param {string} symbol - Stock symbol
 * @param {boolean} calendar - Whether to get earnings calendar (default false)
 * @returns {Promise<Object>} Earnings data
 */
// async function getEarnings(symbol, calendar = false) {
//     try {
//         const endpoint = calendar ? 'earnings-calendar' : 'earnings';
//         const response = await fetch(`/api/stock/${symbol}/${endpoint}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch earnings for ${symbol}: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Earnings error:', error);
//         throw error;
//     }
// }

/**
 * Get market calendar (holidays, trading hours)
 * @param {string} market - Market (US, EU, etc.)
 * @param {number} year - Year (optional, defaults to current year)
 * @returns {Promise<Object>} Market calendar data
 */
// async function getMarketCalendar(market = 'US', year = new Date().getFullYear()) {
//     try {
//         const response = await fetch(`/api/market/calendar?market=${market}&year=${year}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch market calendar: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Market calendar error:', error);
//         throw error;
//     }
// }

/**
 * Check if market is open
 * @param {string} market - Market (US, EU, etc.)
 * @returns {Promise<Object>} Market status
 */
// async function getMarketStatus(market = 'US') {
//     try {
//         const response = await fetch(`/api/market/status?market=${market}`);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch market status: ${response.status}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('Market status error:', error);
//         throw error;
//     }
// }

/**
 * Generic API helper for custom endpoints
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} API response
 */
// async function apiRequest(endpoint, options = {}) {
//     try {
//         const defaultOptions = {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         };
//
//         const response = await fetch(endpoint, { ...defaultOptions, ...options });
//
//         if (!response.ok) {
//             throw new Error(`API request failed: ${response.status} ${response.statusText}`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error('API request error:', error);
//         throw error;
//     }
// }

/**
 * Validate stock symbol format
 * @param {string} symbol - Stock symbol to validate
 * @returns {boolean} Whether symbol is valid
 */
function validateSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') {
        return false;
    }

    // Basic validation: 1-5 characters, letters/numbers/dots/hyphens
    const symbolRegex = /^[A-Z0-9.-]{1,5}$/i;
    return symbolRegex.test(symbol.trim());
}

/**
 * Format symbol for API calls (uppercase, trimmed)
 * @param {string} symbol - Stock symbol
 * @returns {string} Formatted symbol
 */
function formatSymbol(symbol) {
    return symbol ? symbol.toString().toUpperCase().trim() : '';
}
