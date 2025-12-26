from utils.validators import (
    validate_top_stocks_count,
    validate_period,
    validate_interval,
    validate_date_format,
    validate_crypto_days
)
from config import Config


class TestValidateTopStocksCount:
    def test_valid_integer_returns_clamped_value(self):
        result, error = validate_top_stocks_count(50)
        assert result == 50
        assert error is None

    def test_value_below_minimum_returns_one(self):
        result, error = validate_top_stocks_count(0)
        assert result == 1
        assert error is None

    def test_negative_value_returns_one(self):
        result, error = validate_top_stocks_count(-10)
        assert result == 1
        assert error is None

    def test_value_above_maximum_returns_max(self):
        result, error = validate_top_stocks_count(200)
        assert result == Config.MAX_TOP_STOCKS
        assert error is None

    def test_string_number_returns_parsed_value(self):
        result, error = validate_top_stocks_count("25")
        assert result == 25
        assert error is None

    def test_invalid_string_returns_default_with_error(self):
        result, error = validate_top_stocks_count("invalid")
        assert result == Config.DEFAULT_TOP_STOCKS
        assert error == 'Invalid top count, using default'

    def test_none_value_returns_default_with_error(self):
        result, error = validate_top_stocks_count(None)
        assert result == Config.DEFAULT_TOP_STOCKS
        assert error == 'Invalid top count, using default'

    def test_float_value_is_truncated_to_integer(self):
        result, error = validate_top_stocks_count(25.9)
        assert result == 25
        assert error is None

    def test_boundary_value_at_max_returns_max(self):
        result, error = validate_top_stocks_count(Config.MAX_TOP_STOCKS)
        assert result == Config.MAX_TOP_STOCKS
        assert error is None

    def test_boundary_value_at_one_returns_one(self):
        result, error = validate_top_stocks_count(1)
        assert result == 1
        assert error is None


class TestValidatePeriod:
    def test_valid_period_returns_success(self):
        valid, error = validate_period('1d')
        assert valid is True
        assert error is None

    def test_all_valid_periods_are_accepted(self):
        for period in Config.VALID_PERIODS:
            valid, error = validate_period(period)
            assert valid is True
            assert error is None

    def test_invalid_period_returns_error_with_valid_options(self):
        valid, error = validate_period('2d')
        assert valid is False
        assert 'Invalid period: "2d"' in error
        assert '1d' in error

    def test_empty_string_returns_error(self):
        valid, error = validate_period('')
        assert valid is False
        assert 'Invalid period' in error

    def test_case_sensitive_period_validation(self):
        valid, error = validate_period('1D')
        assert valid is False
        assert 'Invalid period' in error


class TestValidateInterval:
    def test_valid_interval_returns_success(self):
        valid, error = validate_interval('1h')
        assert valid is True
        assert error is None

    def test_all_valid_intervals_are_accepted(self):
        for interval in Config.VALID_INTERVALS:
            valid, error = validate_interval(interval)
            assert valid is True
            assert error is None

    def test_invalid_interval_returns_error_with_valid_options(self):
        valid, error = validate_interval('2h')
        assert valid is False
        assert 'Invalid interval: "2h"' in error
        assert '1h' in error

    def test_empty_string_returns_error(self):
        valid, error = validate_interval('')
        assert valid is False
        assert 'Invalid interval' in error

    def test_case_sensitive_interval_validation(self):
        valid, error = validate_interval('1H')
        assert valid is False
        assert 'Invalid interval' in error


class TestValidateDateFormat:
    def test_valid_date_format_returns_success(self):
        valid, error = validate_date_format('2025-12-26')
        assert valid is True
        assert error is None

    def test_invalid_format_with_slashes_returns_error(self):
        valid, error = validate_date_format('2025/12/26')
        assert valid is False
        assert 'Date format is invalid' in error

    def test_invalid_format_day_month_year_returns_error(self):
        valid, error = validate_date_format('26-12-2025')
        assert valid is False
        assert 'Date format is invalid' in error

    def test_missing_leading_zeros_returns_error(self):
        valid, error = validate_date_format('2025-1-5')
        assert valid is False
        assert 'Date format is invalid' in error

    def test_empty_string_returns_error(self):
        valid, error = validate_date_format('')
        assert valid is False
        assert 'Date format is invalid' in error

    def test_date_with_extra_characters_returns_error(self):
        valid, error = validate_date_format('2025-12-26T00:00:00')
        assert valid is False
        assert 'Date format is invalid' in error

    def test_non_numeric_date_returns_error(self):
        valid, error = validate_date_format('abcd-ef-gh')
        assert valid is False
        assert 'Date format is invalid' in error

    def test_partial_date_returns_error(self):
        valid, error = validate_date_format('2025-12')
        assert valid is False
        assert 'Date format is invalid' in error


class TestValidateCryptoDays:
    def test_valid_days_returns_success(self):
        valid, error = validate_crypto_days('30')
        assert valid is True
        assert error is None

    def test_all_valid_days_are_accepted(self):
        for days in Config.VALID_CRYPTO_DAYS:
            valid, error = validate_crypto_days(days)
            assert valid is True
            assert error is None

    def test_invalid_days_returns_error_with_valid_options(self):
        valid, error = validate_crypto_days('60')
        assert valid is False
        assert 'Invalid days: "60"' in error
        assert '30' in error

    def test_max_days_value_is_accepted(self):
        valid, error = validate_crypto_days('max')
        assert valid is True
        assert error is None

    def test_empty_string_returns_error(self):
        valid, error = validate_crypto_days('')
        assert valid is False
        assert 'Invalid days' in error

    def test_integer_instead_of_string_returns_error(self):
        valid, error = validate_crypto_days(30)
        assert valid is False
        assert 'Invalid days' in error
