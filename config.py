class Config:
    CACHE_DURATION = 3600  # 1 hour
    MAX_TOP_STOCKS = 100
    DEFAULT_TOP_STOCKS = 10
    REQUEST_TIMEOUT = 10

    # API endpoints
    MARKET_CAP_URL = 'https://companiesmarketcap.com/'

    # Valid periods and intervals
    VALID_PERIODS = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
    VALID_INTERVALS = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']

    # Market configuration
    US_EXCHANGES = ['NYQ', 'NAS', 'NMS', 'ASE', 'PCX', 'BATS', 'ARCX']
    EU_EXCHANGES = ['AMS', 'XETRA', 'FRA', 'PAR', 'LSE', 'SWX', 'VIE', 'MIL', 'BRU', 'STO', 'CPH', 'HEL', 'MCE']
