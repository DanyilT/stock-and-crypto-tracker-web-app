from .stocks import register_stock_routes
from .crypto import register_crypto_routes
from .pages import register_page_routes

def register_routes(app):
    """Register all routes with the Flask app"""
    register_page_routes(app)
    register_stock_routes(app)
    register_crypto_routes(app)
