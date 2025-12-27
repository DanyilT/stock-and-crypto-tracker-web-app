import os

from flask import Flask
from config import Config
from api.routes import register_routes
from api.middleware.error_handlers import register_error_handlers

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'qwerty')   # used only for session['qwerty_mode'] - pages.py, index.html
    app.config.from_object(Config)

    # Register routes and error handlers
    register_routes(app)
    register_error_handlers(app)

    return app

if __name__ == '__main__':
    app = create_app()
