import requests
from services.cache_service import CacheService
from config import Config
from datetime import datetime

class CryptoService:
    def __init__(self):
        self.cache = CacheService()
        self.base_url = Config.COINGECKO_API_URL
        self._popular_crypto_cache = {'data': None, 'timestamp': 0}

    def _make_request(self, endpoint, params=None):
        """Make a request to CoinGecko API"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = requests.get(url, params=params, timeout=Config.REQUEST_TIMEOUT)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                print(f"CoinGecko API rate limit exceeded")
                return None
            else:
                print(f"CoinGecko API error: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error making CoinGecko request: {e}")
            return None

    def get_top_cryptos(self, top=10):
        """
        Get top cryptocurrencies by market cap

        Args:
            top: Number of top cryptos to fetch (default 10, max 100)

        Returns:
            List of crypto data or None if error
        """
        import time

        top = min(max(top, 1), Config.MAX_TOP_CRYPTOS)

        # Check cache
        if (self._popular_crypto_cache['data'] and
            time.time() - self._popular_crypto_cache['timestamp'] < Config.CRYPTO_CACHE_DURATION and
            len(self._popular_crypto_cache['data']) >= top):
            print("Returning cached crypto data")
            return self._popular_crypto_cache['data'][:top]

        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': top,
            'page': 1,
            'sparkline': 'false',
            'price_change_percentage': '24h,7d'
        }

        data = self._make_request('/coins/markets', params)

        if data:
            cryptos = []
            for coin in data:
                cryptos.append({
                    'id': coin.get('id'),
                    'symbol': coin.get('symbol', '').upper(),
                    'name': coin.get('name'),
                    'price': coin.get('current_price', 0),
                    'change': round(coin.get('price_change_24h', 0) or 0, 2),
                    'changePercent': round(coin.get('price_change_percentage_24h', 0) or 0, 2),
                    'changePercent7d': round(coin.get('price_change_percentage_7d_in_currency', 0) or 0, 2),
                    'marketCap': coin.get('market_cap', 0),
                    'volume': coin.get('total_volume', 0),
                    'image': coin.get('image'),
                    'rank': coin.get('market_cap_rank'),
                    'high24h': coin.get('high_24h', 0),
                    'low24h': coin.get('low_24h', 0),
                    'circulatingSupply': coin.get('circulating_supply', 0),
                    'totalSupply': coin.get('total_supply', 0),
                    'ath': coin.get('ath', 0),
                    'athChangePercent': round(coin.get('ath_change_percentage', 0) or 0, 2)
                })

            # Update cache
            self._popular_crypto_cache['data'] = cryptos
            self._popular_crypto_cache['timestamp'] = time.time()

            return cryptos

        # Fallback to stale cache if API request failed (rate limited, etc)
        if self._popular_crypto_cache['data']:
            print("API request failed, returning stale cache")
            return self._popular_crypto_cache['data'][:top]

        return None

    def get_crypto_data(self, crypto_id, full_data=False):
        """
        Get detailed data for a specific cryptocurrency

        Args:
            crypto_id: CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
            full_data: If True, returns comprehensive data

        Returns:
            Dictionary with crypto data or None if error
        """
        params = {
            'localization': 'false',
            'tickers': 'false',
            'market_data': 'true',
            'community_data': 'false',
            'developer_data': 'false',
            'sparkline': 'false'
        }

        data = self._make_request(f'/coins/{crypto_id}', params)

        if not data:
            return None

        market_data = data.get('market_data', {})
        current_price = market_data.get('current_price', {}).get('usd', 0)
        price_change_24h = market_data.get('price_change_24h', 0) or 0

        basic_data = {
            'id': data.get('id'),
            'symbol': data.get('symbol', '').upper(),
            'name': data.get('name'),
            'price': current_price,
            'change': round(price_change_24h, 2),
            'changePercent': round(market_data.get('price_change_percentage_24h', 0) or 0, 2),
            'marketCap': market_data.get('market_cap', {}).get('usd', 0),
            'volume': market_data.get('total_volume', {}).get('usd', 0),
            'image': data.get('image', {}).get('large'),
            'rank': data.get('market_cap_rank'),
            'high24h': market_data.get('high_24h', {}).get('usd', 0),
            'low24h': market_data.get('low_24h', {}).get('usd', 0)
        }

        if not full_data:
            return basic_data

        # Full data for detailed views
        full_data_dict = basic_data.copy()
        full_data_dict.update({
            'circulatingSupply': market_data.get('circulating_supply', 0),
            'totalSupply': market_data.get('total_supply', 0),
            'maxSupply': market_data.get('max_supply'),
            'ath': market_data.get('ath', {}).get('usd', 0),
            'athChangePercent': round(market_data.get('ath_change_percentage', {}).get('usd', 0) or 0, 2),
            'athDate': market_data.get('ath_date', {}).get('usd'),
            'atl': market_data.get('atl', {}).get('usd', 0),
            'atlChangePercent': round(market_data.get('atl_change_percentage', {}).get('usd', 0) or 0, 2),
            'atlDate': market_data.get('atl_date', {}).get('usd'),
            'changePercent7d': round(market_data.get('price_change_percentage_7d', 0) or 0, 2),
            'changePercent30d': round(market_data.get('price_change_percentage_30d', 0) or 0, 2),
            'changePercent1y': round(market_data.get('price_change_percentage_1y', 0) or 0, 2),
            'description': data.get('description', {}).get('en', ''),
            'homepage': data.get('links', {}).get('homepage', [None])[0],
            'genesisDate': data.get('genesis_date'),
            'categories': data.get('categories', [])
        })

        return full_data_dict

    def search_crypto(self, query):
        """
        Search for cryptocurrencies by name or symbol

        Args:
            query: Search query string

        Returns:
            List of matching cryptocurrencies or empty list
        """
        data = self._make_request('/search', {'query': query})

        if not data or 'coins' not in data:
            return []

        results = []
        for coin in data['coins'][:10]:  # Limit to 10 results
            results.append({
                'id': coin.get('id'),
                'symbol': coin.get('symbol', '').upper(),
                'name': coin.get('name'),
                'image': coin.get('large'),
                'rank': coin.get('market_cap_rank')
            })

        return results

    def get_historical_data(self, crypto_id, days='30', interval=None):
        """
        Get historical market data for a cryptocurrency

        Args:
            crypto_id: CoinGecko coin ID
            days: Number of days (1, 7, 14, 30, 90, 180, 365, max)
            interval: Data interval (daily, hourly) - auto-determined if not specified (5m, hourly, daily)

        Returns:
            Dictionary with historical data or None if error
        """
        params = {
            'vs_currency': 'usd',
            'days': days
        }

        if interval:
            params['interval'] = interval

        data = self._make_request(f'/coins/{crypto_id}/market_chart', params)

        if not data:
            return None

        prices = data.get('prices', [])
        volumes = data.get('total_volumes', [])

        historical_data = []
        for i, price_point in enumerate(prices):
            timestamp = price_point[0]
            price = price_point[1]
            volume = volumes[i][1] if i < len(volumes) else 0

            historical_data.append({
                'datetime': datetime.fromtimestamp(timestamp / 1000).isoformat(),
                'price': round(price, 2) if price else 0,
                'volume': int(volume) if volume else 0
            })

        return {
            'data': historical_data,
            'metadata': {
                'id': crypto_id,
                'days': days,
                'currency': 'USD',
                'lastUpdated': datetime.now().isoformat()
            }
        }

    def get_historical_ohlc(self, crypto_id, days='30'):
        """
        Get OHLC data for candlestick charts

        Args:
            crypto_id: CoinGecko coin ID
            days: Number of days (1, 7, 14, 30, 90, 180, 365, max)

        Returns:
            Dictionary with OHLC data or None if error
        """
        params = {
            'vs_currency': 'usd',
            'days': days
        }

        data = self._make_request(f'/coins/{crypto_id}/ohlc', params)

        if not data:
            return None

        ohlc_data = []
        for point in data:
            timestamp, open_price, high, low, close = point
            ohlc_data.append({
                'datetime': datetime.fromtimestamp(timestamp / 1000).isoformat(),
                'open': round(open_price, 2) if open_price else 0,
                'high': round(high, 2) if high else 0,
                'low': round(low, 2) if low else 0,
                'close': round(close, 2) if close else 0
            })

        return {
            'data': ohlc_data,
            'metadata': {
                'id': crypto_id,
                'days': days,
                'currency': 'USD',
                'ohlc': True,
                'lastUpdated': datetime.now().isoformat()
            }
        }

    def get_crypto_by_symbol(self, symbol):
        """
        Get crypto data by symbol (searches and returns first match)

        Args:
            symbol: Crypto symbol (e.g., 'BTC', 'ETH')

        Returns:
            Dictionary with crypto data or None if not found
        """
        # First, search for the symbol
        search_results = self.search_crypto(symbol)

        if not search_results:
            return None

        # Find exact symbol match
        for result in search_results:
            if result['symbol'].upper() == symbol.upper():
                return self.get_crypto_data(result['id'])

        # If no exact match, return first result
        return self.get_crypto_data(search_results[0]['id'])
