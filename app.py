import re
import time

import pandas as pd
import requests
import yfinance as yf
from bs4 import BeautifulSoup
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Cache for a list of popular stocks (refresh every hour)
_popular_stocks_cache = {'data': None, 'timestamp': 0}
CACHE_DURATION = 3600    # 1 hour


# Page Routes
@app.route('/')
def index():
    """Home page with popular stocks and cryptos"""
    top = request.args.get('top', default=10, type=int)
    top = min(max(top, 1), 100)  # Ensure top is between 1 and 100
    return render_template('index.html', top=top)

@app.route('/stocks')
def stocks():
    """Stocks page with popular stocks and search stocks ability"""
    return render_template('stocks.html')

@app.route('/stock/<symbol>')
def stock_detail(symbol):
    """Stock detail page"""
    return render_template('stock_detail.html', symbol=symbol.upper())


# API Routes
# Stocks
@app.route('/api/stocks/popular')
def get_popular_stocks():
    """Get top N stocks by market capitalization (default 10, can override with ?top=N)"""
    try:
        popular_symbols = get_stock_top_market_cap_companies_symbols(top=request.args.get('top', default=10, type=int))

        if isinstance(popular_symbols, tuple):
            return popular_symbols
        elif not popular_symbols:
            return jsonify({'error': 'Failed to fetch popular stocks'}), 500

        stocks_data = []
        for symbol in popular_symbols:
            data = get_stock_data(symbol)
            if data:
                stocks_data.append(data)
            else:
                stocks_data.append({'error': f'No data available for {symbol}'})

        if not stocks_data:
            return jsonify({'error': 'No stock data available'}), 500

        return jsonify(stocks_data)
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/stocks/search')
def search_stocks():
    """Search stocks by symbol or name (simple search)"""
    query = request.args.get('q', '').strip().upper()
    if not query:
        return jsonify([])

    data = get_stock_data(query.upper())
    return jsonify(data) if data else jsonify([])

@app.route('/api/stock/<symbol>')
def get_stock_info(symbol):
    """Get individual stock data"""
    try:
        data = get_stock_data(symbol.upper())
        if data:
            return jsonify(data)
        return jsonify({'error': f'Stock {symbol.upper()} not found or data unavailable'}), 404
    except Exception as e:
        return jsonify({'error': f'Error fetching stock data: {str(e)}'}), 500

@app.route('/api/stock/<symbol>/history')
def get_stock_history(symbol):
    """Get stock historical data for charts"""
    try:
        period = request.args.get('period', '1mo')
        start = request.args.get('start')
        end = request.args.get('end')
        interval = request.args.get('interval', '1d')
        ohlc = request.args.get('ohlc') is not None
        data_only = request.args.get('data-only')

        # Validate period
        valid_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
        if period not in valid_periods: return jsonify({'error': f'Invalid period: \"{period}\". Use: {", ".join(valid_periods)}'}), 400

        # Validate interval
        valid_intervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']
        if interval not in valid_intervals: return jsonify({'error': f'Invalid interval: \"{interval}\". Use: {", ".join(valid_intervals)}'}), 400

        # If start & end set, check if the correct format (yyyy-mm-dd)
        if start and end and not re.match(r'^\d{4}-\d{2}-\d{2}$', start) and not re.match(r'^\d{4}-\d{2}-\d{2}$', end): return jsonify({'error': 'Start date and end date are invalid. Use (yyyy-mm-dd) format'}), 400

        historical_data = get_stock_historical_data(symbol, period=period, start=start, end=end, interval=interval, ohlc=ohlc)
        if historical_data is None: return jsonify({'error': f'No historical data available for {symbol.upper()}'}), 404

        if data_only is not None: return jsonify(historical_data['data'])
        else: return jsonify(historical_data)
    except Exception as e:
        return jsonify({'error': f'Error fetching historical data: {str(e)}'}), 500

@app.route('/api/stock/<symbol>/details')
def get_stock_details(symbol):
    """Get comprehensive stock details"""
    try:
        data = get_stock_data(symbol.upper(), full_data=True)
        if not data:
            return jsonify({'error': f'No data available for {symbol.upper()}'}), 404

        # Add historical data for mini chart using helper function
        historical_data = get_stock_historical_data(symbol, period='1mo' if request.args.get('period') is None or request.args.get('period') not in ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'] else request.args.get('period'))
        if historical_data is not None:
            data['historicalData'] = historical_data
        else:
            data['historicalData'] = []

        return jsonify(data)

    except Exception as e:
        return jsonify({'error': f'Error fetching detailed stock data: {str(e)}'}), 500


# Helper Functions
# Stocks
def get_stock_top_market_cap_companies_symbols(top=10):
    """
    Get top market cap companies with caching

    Args:
        top: Number of top companies to fetch (default 10, max 100)

    Returns:
        List of stock symbols or error response
    """
    # Check cache - only use cache if we have enough data
    if _popular_stocks_cache['data'] and time.time() - _popular_stocks_cache['timestamp'] < CACHE_DURATION and len(_popular_stocks_cache['data']) >= top:
        print("Return the cached data, cache is not expired and top is within cached range")
        return _popular_stocks_cache['data'][:top]

    try:
        # Fetch top companies from CompaniesMarketCap
        url = 'https://companiesmarketcap.com/'

        # Make a request to the URL
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch data from {url}: {response.status_code}")
            return jsonify({'error': f'Failed to fetch data from {url}: {response.status_code}'}), 500

        # Parse the HTML content
        soup = BeautifulSoup(response.text, "html.parser")

        # Look for company symbols in different possible selectors
        symbols = []
        selector = '.company-code'

        elements = soup.select(selector)
        if elements:
            for element in elements[:top]:
                symbol = element.get_text()
                if symbol:
                    symbols.append(symbol)
        else:
            print(f"No symbols found from {url}")
            return jsonify({'error': f'No symbols found from the source, {url}'}), 404

        print(f"Found {len(symbols)} company symbols from {url}\nTop stocks by market cap: {symbols}")

        # Update cache
        _popular_stocks_cache['data'] = symbols
        _popular_stocks_cache['timestamp'] = time.time()

        return symbols

    except Exception as e:
        print(f"Error getting stocks from {url}: {e}")
        return jsonify({'error': f'Error getting stocks from {url}: {str(e)}'}), 500

def get_stock_data(symbol, full_data=False):
    """Fetch stock data using yfinance

    Args:
        symbol: Stock symbol to fetch
        full_data: If True, returns comprehensive data. If False, returns basic data for listings.

    Returns:
        Dictionary with stock data or None if error
    """
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info

        # Check if we have valid data
        current_price = info.get('regularMarketPrice') or info.get('currentPrice')
        if not current_price:
            print(f"No price data available for {symbol}")
            return None

        # Detect market
        exchange = info.get('exchange', '').upper()
        if exchange in ['NYQ', 'NAS', 'NMS', 'ASE', 'PCX', 'BATS', 'ARCX']:
            market = 'US'
            currency = 'USD'
        elif exchange in ['AMS', 'XETRA', 'FRA', 'PAR', 'LSE', 'SWX', 'VIE', 'MIL', 'BRU', 'STO', 'CPH', 'HEL', 'MCE']:
            market = 'EU'
            currency = info.get('currency', 'EUR')
        else:
            market = 'OTHER'
            currency = info.get('currency', 'USD')

        previous_close = info.get('previousClose', current_price)
        change = current_price - previous_close

        # Basic data for stock listings
        basic_data = {
            'symbol': symbol,
            'name': info.get('longName') or symbol,
            'price': round(float(current_price), 2),
            'change': round(float(change), 2),
            'changePercent': round(float((change / previous_close) * 100 if previous_close else 0), 2),
            'volume': info.get('volume', 0),
            'marketCap': info.get('marketCap', 0),
            'market': market,
            'currency': currency,
            'dayHigh': round(float(info.get('dayHigh', 0)), 2),
            'dayLow': round(float(info.get('dayLow', 0)), 2),
            'fiftyTwoWeekHigh': round(float(info.get('fiftyTwoWeekHigh', 0)), 2),
            'fiftyTwoWeekLow': round(float(info.get('fiftyTwoWeekLow', 0)), 2)
        }

        if not full_data:
            return basic_data

        # Full data for detailed views
        full_data_dict = basic_data.copy()
        full_data_dict.update({
            'previousClose': round(float(previous_close), 2),
            'openPrice': round(float(info.get('open', 0)), 2),
            'avgVolume': info.get('averageVolume', 0),
            'peRatio': round(float(info.get('trailingPE', 0)), 2) if info.get('trailingPE') else 'N/A',
            'eps': round(float(info.get('trailingEps', 0)), 2) if info.get('trailingEps') else 'N/A',
            'dividendYield': round(float(info.get('dividendYield', 0) * 100), 2) if info.get('dividendYield') else 'N/A',
            'beta': round(float(info.get('beta', 0)), 2) if info.get('beta') else 'N/A',
            'sector': info.get('sector', 'N/A'),
            'industry': info.get('industry', 'N/A'),
            'website': info.get('website', ''),
            'businessSummary': info.get('longBusinessSummary', '')
        })

        return full_data_dict

    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {e}")
        return None

def get_stock_historical_data(symbol, period='1mo', start=None, end=None, interval='1d', ohlc=False):
    """Get stock historical data

    Args:
        symbol: Stock symbol to fetch
        period: Time period                     (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        start: Start date (p.s.: if no period)  (YYYY-MM-DD)
        end: End date     (p.s.: if no period)  (YYYY-MM-DD)
        interval: Data interval                 (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 1wk, 1mo, 3mo)
        ohlc: If True, include OHLC data for candlestick charts

    Returns:
        Dictionary with 'currency' and 'data' (list of historical data points), or None if error
    """
    try:
        ticker = yf.Ticker(symbol.upper())

        if start and end:
            hist = ticker.history(start=start, end=end, interval=interval)
        else:
            hist = ticker.history(period=period, interval=interval)

        if hist.empty:
            print(f"No historical data available for {symbol.upper()} with given parameters")
            return None

        historical_data = []
        for datetime, row in hist.iterrows():
            data_point = {
                'datetime': datetime.isoformat(),
                'volume': int(row['Volume']) if not pd.isna(row['Volume']) else 0
            }

            # Add OHLC data if available (for candlestick charts)
            if ohlc:
                data_point['open'] = round(float(row['Open']), 2) if not pd.isna(row['Open']) else None
                data_point['high'] = round(float(row['High']), 2) if not pd.isna(row['High']) else None
                data_point['low'] = round(float(row['Low']), 2) if not pd.isna(row['Low']) else None
                data_point['close'] = round(float(row['Close']), 2) if not pd.isna(row['Close']) else None
            else:
                data_point['price'] = round(float(row['Close']), 2)

            historical_data.append(data_point)

        return {
            'data': historical_data,
            'metadata': {
                'symbol': symbol.upper(),
                'period': f'{start} to {end}' if start and end else period,
                'interval': interval,
                'currency': ticker.info.get('currency', 'USD'),
                'ohlc': ohlc
            }
        }

    except Exception as e:
        print(f"Error fetching historical data for {symbol}: {e}")
        return None

# General
def format_market_cap(value):
    """Format market cap values"""
    if not value or value == 0:
        return "N/A"

    try:
        if value >= 1e12:
            return f"${value / 1e12:.2f}T"
        elif value >= 1e9:
            return f"${value / 1e9:.2f}B"
        elif value >= 1e6:
            return f"${value / 1e6:.2f}M"
        else:
            return f"${value:,.0f}"
    except:
        return "N/A"


if __name__ == '__main__':
    app.run(debug=True)
