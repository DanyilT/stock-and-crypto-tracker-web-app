from flask import request, jsonify
from services.stock_service import StockService
from utils.validators import validate_period, validate_interval, validate_date_format, validate_top_stocks_count

# Initialize the stock service
stock_service = StockService()

def register_stock_routes(app):
    """Register all stock-related API routes"""

    @app.route('/api/stocks/search')
    def search_stocks():
        """Search stocks by symbol (simple search)"""
        query = request.args.get('q', '').strip().upper()
        if not query:
            return jsonify([])

        data = stock_service.get_stock_data(query)
        return jsonify(data) if data else jsonify([])

    @app.route('/api/stocks/popular')
    def get_popular_stocks():
        """Get top N stocks by market capitalization (default 10, can override with ?top=N)"""
        try:
            top_param = request.args.get('top', default=10, type=int)
            top, error = validate_top_stocks_count(top_param)

            popular_symbols = stock_service.get_top_popular_stocks_list(top)

            if isinstance(popular_symbols, tuple):
                return popular_symbols
            elif not popular_symbols:
                return jsonify({'error': 'Failed to fetch popular stocks'}), 500

            stocks_data = []
            for symbol in popular_symbols:
                data = stock_service.get_stock_data(symbol)
                if data:
                    stocks_data.append(data)
                else:
                    stocks_data.append({'error': f'No data available for {symbol}'})

            if not stocks_data:
                return jsonify({'error': 'No stock data available'}), 500

            return jsonify(stocks_data)
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500

    @app.route('/api/stocks/popular/list')
    def get_popular_stocks_list():
        """Get list of popular stock symbols only or with basic info (name, price)"""
        try:
            symbols_only = request.args.get('symbols-only') is not None
            top_param = request.args.get('top', default=10, type=int)
            top, error = validate_top_stocks_count(top_param)

            popular_symbols = stock_service.get_top_popular_stocks_list(top)

            if isinstance(popular_symbols, tuple):
                return popular_symbols
            elif not popular_symbols:
                return jsonify({'error': 'Failed to fetch popular stocks list'}), 500

            # Return just the symbols list
            if symbols_only:
                return jsonify(popular_symbols)

            # Return just the symbols list with basic info for dropdown
            symbols_list = []
            for symbol in popular_symbols:
                basic_data = stock_service.get_stock_data(symbol)
                if basic_data:
                    symbols_list.append({
                        'symbol': symbol,
                        'name': basic_data.get('name', symbol),
                        'price': basic_data.get('price', 0)
                    })

            return jsonify(symbols_list)
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500

    @app.route('/api/stock/<symbol>')
    def get_stock_info(symbol):
        """Get individual stock data"""
        try:
            full_data = request.args.get('full-data') is not None
            data = stock_service.get_stock_data(symbol.upper(), full_data=full_data)
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
            is_valid, error_msg = validate_period(period)
            if not is_valid:
                return jsonify({'error': error_msg}), 400

            # Validate interval
            is_valid, error_msg = validate_interval(interval)
            if not is_valid:
                return jsonify({'error': error_msg}), 400

            # Validate date format if start and end are provided
            if start and end:
                is_valid, error_msg = validate_date_format(start)
                if not is_valid:
                    return jsonify({'error': f'Start date {error_msg}'}), 400

                is_valid, error_msg = validate_date_format(end)
                if not is_valid:
                    return jsonify({'error': f'End date {error_msg}'}), 400

            historical_data = stock_service.get_historical_data(symbol.upper(), period=period, start=start, end=end, interval=interval, ohlc=ohlc)
            if historical_data is None:
                return jsonify({'error': f'No historical data available for {symbol.upper()}'}), 404

            if data_only is not None:
                return jsonify(historical_data['data'])
            else:
                return jsonify(historical_data)

        except Exception as e:
            return jsonify({'error': f'Error fetching historical data: {str(e)}'}), 500

    @app.route('/api/stock/<symbol>/quote')
    def get_stock_quote(symbol):
        """Get real-time stock quote with essential trading information"""
        try:
            quote = stock_service.get_stock_quote(symbol.upper())
            if not quote:
                return jsonify({'error': f'No quote data available for {symbol.upper()}'}), 404

            return jsonify(quote)

        except Exception as e:
            return jsonify({'error': f'Error fetching quote: {str(e)}'}), 500

    @app.route('/api/stock/<symbol>/splits')
    def get_stock_splits(symbol):
        """Get stock split history"""
        try:
            splits = stock_service.get_stock_splits(symbol.upper())
            return jsonify(splits)

        except Exception as e:
            return jsonify({'error': f'Error fetching stock splits: {str(e)}'}), 500

    @app.route('/api/stock/<symbol>/dividends')
    def get_dividend_history(symbol):
        """Get dividend payment history"""
        try:
            period = request.args.get('period', '5y')
            valid_periods = ['1y', '3y', '5y', 'max']

            if period not in valid_periods:
                return jsonify({'error': f'Invalid period. Use: {", ".join(valid_periods)}'}), 400

            dividends = stock_service.get_dividend_history(symbol.upper(), period=period)
            return jsonify(dividends)

        except Exception as e:
            return jsonify({'error': f'Error fetching dividend history: {str(e)}'}), 500

    @app.route('/api/stock/<symbol>/financials')
    def get_financial_statements(symbol):
        """Get financial statements"""
        try:
            statement_type = request.args.get('type', 'income')
            quarterly = request.args.get('quarterly') is not None

            valid_types = ['income', 'balance', 'cashflow']
            if statement_type not in valid_types:
                return jsonify({'error': f'Invalid statement type. Use: {", ".join(valid_types)}'}), 400

            financials = stock_service.get_financial_statements(symbol.upper(), statement_type=statement_type, quarterly=quarterly)

            if not financials:
                return jsonify({'error': f'No financial data available for {symbol.upper()}'}), 404

            return jsonify(financials)

        except Exception as e:
            return jsonify({'error': f'Error fetching financial statements: {str(e)}'}), 500

    @app.route('/api/stock/<symbol>/holders')
    def get_institutional_holders(symbol):
        """Get institutional ownership information"""
        try:
            holders = stock_service.get_institutional_holders(symbol.upper())
            if not holders:
                return jsonify({'error': f'No institutional holder data available for {symbol.upper()}'}), 404

            return jsonify(holders)

        except Exception as e:
            return jsonify({'error': f'Error fetching institutional holders: {str(e)}'}), 500

    @app.route('/api/stock/<symbol>/options')
    def get_options_data(symbol):
        """Get options chain data"""
        try:
            expiration = request.args.get('expiration', None)
            options = stock_service.get_options_data(symbol.upper(), expiration=expiration)
            if not options:
                return jsonify({'error': f'No options data available for {symbol.upper()}'}), 404

            return jsonify(options)

        except Exception as e:
            return jsonify({'error': f'Error fetching options data: {str(e)}'}), 500

    @app.route('/api/stock/<symbol>/news')
    def get_stock_news(symbol):
        """Get recent news for a stock"""
        try:
            limit = request.args.get('limit', default=10, type=int) # Default 10 (max 10)
            limit = min(max(limit, 1), 50)  # Between 1 and 50

            news = stock_service.get_stock_news(symbol.upper(), limit=limit)
            return jsonify(news)

        except Exception as e:
            return jsonify({'error': f'Error fetching news: {str(e)}'}), 500

    @app.route('/api/market/indices')
    def get_market_indices_route():
        """Get major market indices data"""
        try:
            indices = stock_service.get_market_indices()
            if not indices:
                return jsonify({'error': 'No market indices data available'}), 404

            return jsonify(indices)

        except Exception as e:
            return jsonify({'error': f'Error fetching market indices: {str(e)}'}), 500

    @app.route('/api/market/news')
    def get_market_news():
        """Get general market news"""
        try:
            limit = request.args.get('limit', default=20, type=int)
            limit = min(max(limit, 1), 100)  # Between 1 and 100

            category = request.args.get('category', 'general')

            news = stock_service.get_market_news(limit=limit, category=category)
            return jsonify(news)

        except Exception as e:
            return jsonify({'error': f'Error fetching market news: {str(e)}'}), 500
