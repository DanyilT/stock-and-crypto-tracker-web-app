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

    @app.route('/stock/<symbol>')
    def stock_detail(symbol):
        """Stock detail page"""
        return render_template('stock_detail.html', symbol=symbol.upper())
