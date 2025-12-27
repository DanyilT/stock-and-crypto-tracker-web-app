class Config:
    CACHE_DURATION = 3600  # 1 hour
    MAX_TOP_STOCKS = 100
    DEFAULT_TOP_STOCKS = 10
    REQUEST_TIMEOUT = 10

    # API endpoints
    MARKET_CAP_URL = 'https://companiesmarketcap.com/'
    COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

    DEFAULT_TOP_STOCKS_LIST = ['NVDA', 'AAPL', 'GOOG', 'MSFT', 'AMZN', 'META', 'AVGO', 'TSLA', 'TSM', 'BRK-B']  # Based on companiesmarketcap.com 27/12/2025 (skip 2222.SR)

    # Valid periods and intervals for stocks
    VALID_PERIODS = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
    VALID_INTERVALS = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']

    # Market configuration
    US_EXCHANGES = ['NYQ', 'NAS', 'NMS', 'ASE', 'PCX', 'BATS', 'ARCX']
    EU_EXCHANGES = ['AMS', 'XETRA', 'FRA', 'PAR', 'LSE', 'SWX', 'VIE', 'MIL', 'BRU', 'STO', 'CPH', 'HEL', 'MCE']

    # Crypto configuration
    MAX_TOP_CRYPTOS = 100
    DEFAULT_TOP_CRYPTOS = 10
    CRYPTO_CACHE_DURATION = 120  # 2 minutes - respects CoinGecko rate limits (~30/min)
    VALID_CRYPTO_DAYS = ['1', '7', '14', '30', '90', '180', '365', 'max']
