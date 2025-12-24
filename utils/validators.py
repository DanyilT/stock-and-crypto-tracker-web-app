import re
from config import Config

def validate_top_stocks_count(top):
    """Validate and normalize top stocks count"""
    try:
        return min(max(int(top), 1), Config.MAX_TOP_STOCKS), None
    except (ValueError, TypeError):
        return Config.DEFAULT_TOP_STOCKS, 'Invalid top count, using default'

def validate_period(period):
    """Validate stock data period parameter"""
    if period not in Config.VALID_PERIODS:
        return False, f'Invalid period: "{period}". Use: {", ".join(Config.VALID_PERIODS)}'
    return True, None

def validate_interval(interval):
    """Validate stock data interval parameter"""
    if interval not in Config.VALID_INTERVALS:
        return False, f'Invalid interval: "{interval}". Use: {", ".join(Config.VALID_INTERVALS)}'
    return True, None

def validate_date_format(date_string):
    """Validate date format (YYYY-MM-DD)"""
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_string):
        return False, 'Date format is invalid. Use (yyyy-mm-dd) format'
    return True, None

def validate_crypto_days(days):
    """Validate crypto historical data days parameter"""
    if days not in Config.VALID_CRYPTO_DAYS:
        return False, f'Invalid days: "{days}". Use: {", ".join(Config.VALID_CRYPTO_DAYS)}'
    return True, None
