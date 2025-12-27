import time
import requests
from bs4 import BeautifulSoup
from flask import jsonify
from config import Config

class CacheService:
    def __init__(self):
        self._popular_stocks_cache = {'data': None, 'timestamp': 0}

    def get_or_fetch_popular_stocks(self, top=10):
        """
        Get top market cap companies with caching

        Args:
            top: Number of top companies to fetch (default 10, max 100)

        Returns:
            List of stock symbols or error response
        """
        # Ensure top is within valid range
        top = min(max(top, 1), Config.MAX_TOP_STOCKS)

        # Check cache - only use cache if we have enough data
        if self._popular_stocks_cache['data'] and time.time() - self._popular_stocks_cache['timestamp'] < Config.CACHE_DURATION and len(self._popular_stocks_cache['data']) >= top:
            print("Return the cached data, cache is not expired and top is within cached range")
            return self._popular_stocks_cache['data'][:top]

        try:
            # Fetch top companies from CompaniesMarketCap
            response = requests.get(Config.MARKET_CAP_URL, timeout=Config.REQUEST_TIMEOUT)
            if response.status_code != 200:
                print(f"Failed to fetch data from {Config.MARKET_CAP_URL}: {response.status_code}")
                return jsonify({'error': f'Failed to fetch data from {Config.MARKET_CAP_URL}: {response.status_code}'}), 500

            # Parse the HTML content
            soup = BeautifulSoup(response.text, "html.parser")

            # Look for company symbols
            symbols = []
            selector = '.company-code'

            elements = soup.select(selector)
            if elements:
                for element in elements[:top]:
                    symbol = element.get_text()
                    if symbol:
                        symbols.append(symbol)
            else:
                print(f"No symbols found from {Config.MARKET_CAP_URL}")
                return jsonify({'error': f'No symbols found from the source, {Config.MARKET_CAP_URL}'}), 404

            print(f"Found {len(symbols)} company symbols from {Config.MARKET_CAP_URL}\nTop stocks by market cap: {symbols}")

            # Update cache
            self._popular_stocks_cache['data'] = symbols
            self._popular_stocks_cache['timestamp'] = time.time()

            return symbols

        except Exception as e:
            if Config.DEFAULT_TOP_STOCKS_LIST:
                self._popular_stocks_cache['data'] = Config.DEFAULT_TOP_STOCKS_LIST
                self._popular_stocks_cache['timestamp'] = time.time()
                print(f"Returning default top stocks list due to error. Error: {e}")
                return Config.DEFAULT_TOP_STOCKS_LIST
            else:
                print(f"Error getting stocks from {Config.MARKET_CAP_URL}: {e}")
                return jsonify({'error': f'Error getting stocks from {Config.MARKET_CAP_URL}: {str(e)}'}), 500
