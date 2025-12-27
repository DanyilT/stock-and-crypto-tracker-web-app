from flask import render_template, request
from utils.validators import validate_top_stocks_count

def register_page_routes(app):
    """Register all page routes"""

    @app.route('/')
    def index():
        """Home page with popular stocks and cryptos"""
        top = request.args.get('top', default=10, type=int)
        top, _ = validate_top_stocks_count(top)  # Ensure top is between 1 and 100
        return render_template('index.html', top=top)

    @app.route('/stocks')
    def stocks():
        """Stocks page with popular stocks and search stocks ability"""
        top = request.args.get('top', default=10, type=int)
        top, _ = validate_top_stocks_count(top)  # Ensure top is between 1 and 100
        return render_template('stocks.html', top=top)

    @app.route('/stocks/chart')
    def stocks_chart():
        """Stocks chart page with stock search and chart visualization"""
        return render_template('stocks_chart.html')

    @app.route('/stocks/<symbol>')
    @app.route('/stock/<symbol>')
    def stock_detail(symbol):
        """Stock detail page"""
        return render_template('stock_detail.html', symbol=symbol.upper())

    @app.route('/crypto')
    def crypto():
        """Crypto page with popular cryptocurrencies and search ability"""
        top = request.args.get('top', default=10, type=int)
        top, _ = validate_top_stocks_count(top)  # Ensure top is between 1 and 100
        return render_template('crypto.html', top=top)

    @app.route('/crypto/chart')
    def crypto_chart():
        """Crypto chart page with crypto search and chart visualization"""
        return render_template('crypto_chart.html')

    @app.route('/crypto/<crypto_id>')
    def crypto_detail(crypto_id):
        """Crypto detail page"""
        return render_template('crypto_detail.html', crypto_id=crypto_id.lower())

    @app.route('/terms')
    def terms():
        """Terms and Conditions page"""
        # Use the 'doge' template for an open-source feel
        # Format: https://api.memegen.link/images/<template>/<top>/<bottom>.png
        meme_url = "https://api.memegen.link/images/doge/very_open_source/i_don't_care_how_you_use_it.png"
        return render_template('terms.html', meme_url=meme_url)
