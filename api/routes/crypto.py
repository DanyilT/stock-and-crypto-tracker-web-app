from flask import request, jsonify
from services.crypto_service import CryptoService
from utils.validators import validate_top_stocks_count, validate_crypto_days

# Initialize the crypto service
crypto_service = CryptoService()

def register_crypto_routes(app):
    """Register all crypto-related API routes"""

    @app.route('/api/crypto/search')
    def search_crypto():
        """Search cryptocurrencies by name or symbol"""
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify([])

        results = crypto_service.search_crypto(query)
        return jsonify(results)

    @app.route('/api/crypto/popular')
    def get_popular_cryptos():
        """Get top N cryptocurrencies by market cap (default 10)"""
        try:
            top_param = request.args.get('top', default=10, type=int)
            top, error = validate_top_stocks_count(top_param)

            cryptos_data = crypto_service.get_top_cryptos(top)

            if not cryptos_data:
                return jsonify({'error': 'Failed to fetch popular cryptocurrencies'}), 500

            return jsonify(cryptos_data)
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500

    @app.route('/api/crypto/popular/list')
    def get_popular_cryptos_list():
        """Get list of popular crypto symbols only or with basic info"""
        try:
            symbols_only = request.args.get('symbols-only') is not None
            top_param = request.args.get('top', default=10, type=int)
            top, error = validate_top_stocks_count(top_param)

            cryptos_data = crypto_service.get_top_cryptos(top)

            if not cryptos_data:
                return jsonify({'error': 'Failed to fetch popular cryptos list'}), 500

            if symbols_only:
                return jsonify([crypto['id'] for crypto in cryptos_data])

            # Return basic info for dropdown
            return jsonify([{
                'id': crypto['id'],
                'symbol': crypto['symbol'],
                'name': crypto['name'],
                'price': crypto['price'],
                'image': crypto.get('image')
            } for crypto in cryptos_data])
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500

    @app.route('/api/crypto/<crypto_id>')
    def get_crypto_info(crypto_id):
        """Get individual cryptocurrency data"""
        try:
            full_data = request.args.get('full-data') is not None
            data = crypto_service.get_crypto_data(crypto_id.lower(), full_data=full_data)
            if data:
                return jsonify(data)
            return jsonify({'error': f'Cryptocurrency {crypto_id} not found or data unavailable'}), 404
        except Exception as e:
            return jsonify({'error': f'Error fetching crypto data: {str(e)}'}), 500

    @app.route('/api/crypto/<crypto_id>/history')
    def get_crypto_history(crypto_id):
        """Get cryptocurrency historical data for charts"""
        try:
            days = request.args.get('days', '30')
            interval = request.args.get('interval')
            ohlc = request.args.get('ohlc') is not None
            data_only = request.args.get('data-only') is not None

            # Validate days parameter
            is_valid, error_msg = validate_crypto_days(days)
            if not is_valid:
                return jsonify({'error': error_msg}), 400

            if ohlc:
                historical_data = crypto_service.get_historical_ohlc(crypto_id.lower(), days=days)
            else:
                historical_data = crypto_service.get_historical_data(crypto_id.lower(), days=days, interval=interval)

            if historical_data is None:
                return jsonify({'error': f'No historical data available for {crypto_id}'}), 404

            if data_only:
                return jsonify(historical_data['data'])
            else:
                return jsonify(historical_data)

        except Exception as e:
            return jsonify({'error': f'Error fetching historical data: {str(e)}'}), 500

    @app.route('/api/crypto/symbol/<symbol>')
    def get_crypto_by_symbol(symbol):
        """Get cryptocurrency data by symbol (e.g., BTC, ETH)"""
        try:
            full_data = request.args.get('full-data') is not None
            data = crypto_service.get_crypto_by_symbol(symbol.upper())
            if data:
                if full_data:
                    data = crypto_service.get_crypto_data(data['id'], full_data=True)
                return jsonify(data)
            return jsonify({'error': f'Cryptocurrency with symbol {symbol.upper()} not found'}), 404
        except Exception as e:
            return jsonify({'error': f'Error fetching crypto data: {str(e)}'}), 500
