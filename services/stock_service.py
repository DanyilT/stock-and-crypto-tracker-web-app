import pandas as pd
import yfinance as yf
from services.cache_service import CacheService
from config import Config
from datetime import datetime, timedelta

class StockService:
    def __init__(self):
        self.cache = CacheService()

    def get_top_popular_stocks_list(self, top=10):
        """Get top market cap companies with caching"""
        return self.cache.get_or_fetch_popular_stocks(top)

    def get_stock_data(self, symbol, full_data=False):
        """
        Fetch stock data using yfinance

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
            if exchange in Config.US_EXCHANGES:
                market = 'US'
                currency = 'USD'
            elif exchange in Config.EU_EXCHANGES:
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
                'exchange': exchange,
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'website': info.get('website', ''),
                'businessSummary': info.get('longBusinessSummary', '')
            })

            return full_data_dict

        except Exception as e:
            print(f"Error fetching stock data for {symbol}: {e}")
            return None

    def get_historical_data(self, symbol, period='1mo', start=None, end=None, interval='1d', ohlc=False):
        """
        Get stock historical data

        Args:
            symbol: Stock symbol to fetch
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            start: Start date (YYYY-MM-DD)
            end: End date (YYYY-MM-DD)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 1wk, 1mo, 3mo)
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
                    'ohlc': ohlc,
                    'lastUpdated': datetime.now().isoformat()
                }
            }

        except Exception as e:
            print(f"Error fetching historical data for {symbol}: {e}")
            return None

    def get_stock_quote(self, symbol):
        """
        Get real-time stock quote with essential trading information

        Args:
            symbol: Stock symbol

        Returns:
            Dictionary with real-time quote data
        """
        try:
            ticker = yf.Ticker(symbol.upper())
            info = ticker.info

            # Get fast info for real-time data
            try:
                fast_info = ticker.fast_info
                current_price = fast_info.get('lastPrice') or info.get('regularMarketPrice') or info.get('currentPrice')
                previous_close = fast_info.get('previousClose') or info.get('previousClose')
                day_high = fast_info.get('dayHigh') or info.get('dayHigh')
                day_low = fast_info.get('dayLow') or info.get('dayLow')
                market_cap = fast_info.get('marketCap') or info.get('marketCap')
                shares_outstanding = fast_info.get('sharesOutstanding') or info.get('sharesOutstanding')
            except:
                # Fallback to regular info if fast_info fails
                current_price = info.get('regularMarketPrice') or info.get('currentPrice')
                previous_close = info.get('previousClose')
                day_high = info.get('dayHigh')
                day_low = info.get('dayLow')
                market_cap = info.get('marketCap')
                shares_outstanding = info.get('sharesOutstanding')

            if not current_price:
                return None

            change = current_price - previous_close if previous_close else 0
            change_percent = (change / previous_close * 100) if previous_close else 0

            quote = {
                'symbol': symbol.upper(),
                'name': info.get('longName') or info.get('shortName') or symbol.upper(),
                'price': round(float(current_price), 2),
                'change': round(float(change), 2),
                'changePercent': round(float(change_percent), 2),
                'previousClose': round(float(previous_close), 2) if previous_close else None,
                'dayHigh': round(float(day_high), 2) if day_high else None,
                'dayLow': round(float(day_low), 2) if day_low else None,
                'volume': info.get('volume', 0),
                'avgVolume': info.get('averageVolume', 0),
                'marketCap': market_cap,
                'sharesOutstanding': shares_outstanding,
                'currency': info.get('currency', 'USD'),
                'exchange': info.get('exchange', 'N/A'),
                'timezone': info.get('timeZoneFullName', 'America/New_York'),
                'marketState': info.get('marketState', 'UNKNOWN'),
                'lastUpdated': datetime.now().isoformat()
            }

            return quote

        except Exception as e:
            print(f"Error fetching quote for {symbol}: {e}")
            return None

    def get_stock_splits(self, symbol):
        """
        Get stock split history

        Args:
            symbol: Stock symbol

        Returns:
            List of stock splits with dates and ratios
        """
        try:
            ticker = yf.Ticker(symbol.upper())
            splits = ticker.splits

            if splits.empty:
                return []

            split_history = []
            for date, ratio in splits.items():
                split_history.append({
                    'date': date.isoformat(),
                    'ratio': f"{int(ratio)}:1" if ratio > 1 else f"1:{int(1/ratio)}",
                    'splitFactor': float(ratio)
                })

            return sorted(split_history, key=lambda x: x['date'], reverse=True)

        except Exception as e:
            print(f"Error fetching stock splits for {symbol}: {e}")
            return []

    def get_dividend_history(self, symbol, period='5y'):
        """
        Get dividend payment history

        Args:
            symbol: Stock symbol
            period: Time period for dividend history

        Returns:
            List of dividend payments with dates and amounts
        """
        try:
            ticker = yf.Ticker(symbol.upper())
            dividends = ticker.dividends

            if dividends.empty:
                return []

            # Filter by period if specified
            if period != 'max':
                end_date = pd.Timestamp.now(tz='UTC')
                if period == '1y':
                    start_date = end_date - pd.DateOffset(years=1)
                elif period == '3y':
                    start_date = end_date - pd.DateOffset(years=3)
                elif period == '5y':
                    start_date = end_date - pd.DateOffset(years=5)
                else:
                    start_date = end_date - pd.DateOffset(years=1)

                # Convert dividend index to UTC for comparison
                dividend_index = dividends.index.tz_convert('UTC') if dividends.index.tz else dividends.index.tz_localize('UTC')
                dividends = dividends[dividend_index >= start_date]

            dividend_history = []
            for date, amount in dividends.items():
                # Handle timezone-aware dates
                if hasattr(date, 'tz_localize'):
                    date_str = date.strftime('%Y-%m-%d')
                else:
                    date_str = date.isoformat()

                dividend_history.append({
                    'date': date_str,
                    'amount': round(float(amount), 4),
                    'year': date.year,
                    'quarter': f"Q{(date.month-1)//3 + 1}"
                })

            return {
                'dividends': sorted(dividend_history, key=lambda x: x['date'], reverse=True),
                'metadata': {
                    'currency': ticker.info.get('currency', 'USD'),
                    'symbol': symbol.upper()
                }
            }

        except Exception as e:
            print(f"Error fetching dividend history for {symbol}: {e}")
            return []

    def get_financial_statements(self, symbol, statement_type='income', quarterly=False):
        """
        Get financial statements (income, balance sheet, cash flow)

        Args:
            symbol: Stock symbol
            statement_type: 'income', 'balance', or 'cashflow'
            quarterly: If True, get quarterly data; if False, get annual data

        Returns:
            Financial statement data as dictionary
        """
        try:
            ticker = yf.Ticker(symbol.upper())

            if statement_type == 'income':
                df = ticker.quarterly_income_stmt if quarterly else ticker.income_stmt
            elif statement_type == 'balance':
                df = ticker.quarterly_balance_sheet if quarterly else ticker.balance_sheet
            elif statement_type == 'cashflow':
                df = ticker.quarterly_cash_flow if quarterly else ticker.cash_flow
            else:
                return {}

            if df.empty:
                return {}

            # Convert to dictionary format
            result = {
                'symbol': symbol.upper(),
                'type': statement_type,
                'quarterly': quarterly,
                'periods': [],
                'data': {}
            }

            # Get period headers (dates)
            periods = [col.strftime('%Y-%m-%d') for col in df.columns]
            result['periods'] = periods

            # Convert financial data
            for index, row in df.iterrows():
                key = str(index).replace(' ', '_').lower()
                values = []
                for period in df.columns:
                    value = row[period]
                    if pd.isna(value):
                        values.append(None)
                    else:
                        values.append(int(value) if isinstance(value, (int, float)) else str(value))
                result['data'][key] = values

            return result

        except Exception as e:
            print(f"Error fetching {statement_type} statement for {symbol}: {e}")
            return {}

    def get_institutional_holders(self, symbol):
        """
        Get institutional ownership information

        Args:
            symbol: Stock symbol

        Returns:
            Dictionary with institutional holders and major holders breakdown
        """
        try:
            ticker = yf.Ticker(symbol.upper())
            institutional = ticker.institutional_holders
            major = ticker.major_holders

            result = {
                'institutional': [],
                'major': {}
            }

            # Format institutional holders
            if institutional is not None and not institutional.empty:
                for index, row in institutional.iterrows():
                    result['institutional'].append({
                        'holder': row.get('Holder', 'Unknown'),
                        'shares': int(row.get('Shares', 0)),
                        'dateReportedTimestamp': int(pd.to_datetime(row.get('Date Reported')).timestamp()) if pd.notna(row.get('Date Reported')) else 0,
                        'percentOut': round(float(row.get('% Out', 0)), 2) if row.get('% Out') else 'N/A',
                        'value': int(row.get('Value', 0))
                    })

            # Format major holders summary
            if major is not None and not major.empty and major.shape[1] >= 2:
                for index, row in major.iterrows():
                    key = str(row.iloc[1]).lower().replace(' ', '_').replace('%', 'percent')
                    result['major'][key] = row.iloc[0]

            return result

        except Exception as e:
            print(f"Error fetching institutional holders for {symbol}: {e}")
            return {}

    def get_options_data(self, symbol, expiration=None):
        """
        Get options data for a stock symbol

        Args:
            symbol: Stock symbol
            expiration: Specific expiration date in YYYY-MM-DD format (optional)

        Returns:
            dict: Options data including calls, puts, available expirations, and metadata
        """
        try:
            ticker = yf.Ticker(symbol.upper())

            # Get available expiration dates
            exp_dates = ticker.options
            if not exp_dates:
                return {}

            # Determine which expiration to use
            if expiration:
                # Validate that the requested expiration is available
                if expiration not in exp_dates:
                    # Find the closest available expiration
                    from datetime import datetime
                    try:
                        target_date = datetime.strptime(expiration, '%Y-%m-%d')
                        available_dates = [datetime.strptime(date, '%Y-%m-%d') for date in exp_dates]
                        closest_date = min(available_dates, key=lambda x: abs((x - target_date).days))
                        selected_expiration = closest_date.strftime('%Y-%m-%d')
                    except (ValueError, TypeError):
                        selected_expiration = exp_dates[0]
                else:
                    selected_expiration = expiration
            else:
                # Default to the first (nearest) expiration
                selected_expiration = exp_dates[0]

            # Get options chain for the selected expiration
            options_chain = ticker.option_chain(selected_expiration)

            # Format calls data
            calls = []
            if not options_chain.calls.empty:
                for _, call in options_chain.calls.iterrows():
                    strike = float(call['strike'])
                    last_price = float(call['lastPrice']) if pd.notna(call['lastPrice']) else 0

                    calls.append({
                        'contractName': f"{symbol.upper()}{selected_expiration.replace('-', '')}{str(int(strike)).zfill(8)}C",
                        'lastTradeDateTimestamp': int(call['lastTradeDate'].timestamp()),
                        'strike': strike,
                        'lastPrice': round(last_price, 2),
                        'bid': round(float(call['bid']), 2) if pd.notna(call['bid']) else 0,
                        'ask': round(float(call['ask']), 2) if pd.notna(call['ask']) else 0,
                        'change': round(float(call['change']), 2),
                        'changePercent': round((float(call['change']) / (last_price - float(call['change']))) * 100, 2) if (last_price - float(call['change'])) != 0 else 0,
                        'volume': int(call['volume']) if pd.notna(call['volume']) else 0,
                        'openInterest': int(call['openInterest']) if pd.notna(call['openInterest']) else 0,
                        'impliedVolatility': round(float(call['impliedVolatility']) * 100, 2) if pd.notna(call['impliedVolatility']) else 0
                    })

            # Format puts data
            puts = []
            if not options_chain.puts.empty:
                for _, put in options_chain.puts.iterrows():
                    strike = float(put['strike'])
                    last_price = float(put['lastPrice']) if pd.notna(put['lastPrice']) else 0

                    puts.append({
                        'contractName': f"{symbol.upper()}{selected_expiration.replace('-', '')}{str(int(strike)).zfill(8)}P",
                        'lastTradeDateTimestamp': int(put['lastTradeDate'].timestamp()),
                        'strike': strike,
                        'lastPrice': round(last_price, 2),
                        'bid': round(float(put['bid']), 2) if pd.notna(put['bid']) else 0,
                        'ask': round(float(put['ask']), 2) if pd.notna(put['ask']) else 0,
                        'change': round(float(put['change']), 2),
                        'changePercent': round((float(put['change']) / (last_price - float(put['change']))) * 100, 2) if (last_price - float(put['change'])) != 0 else 0,
                        'volume': int(put['volume']) if pd.notna(put['volume']) else 0,
                        'openInterest': int(put['openInterest']) if pd.notna(put['openInterest']) else 0,
                        'impliedVolatility': round(float(put['impliedVolatility']) * 100, 2) if pd.notna(put['impliedVolatility']) else 0
                    })

            return {
                'availableExpirations': list(exp_dates),
                'calls': calls,
                'puts': puts,
                'metadata': {
                    'expiration': selected_expiration,
                    'symbol': symbol.upper(),
                    'currency': ticker.info.get('currency', 'USD') # Get currency from stock info
                }
            }

        except Exception as e:
            print(f"Error fetching options data for {symbol}: {e}")
            return {}

    def get_stock_news(self, symbol, limit=10):
        """
        Get recent news for a stock

        Args:
            symbol: Stock symbol
            limit: Number of news articles to return (default 10)

        Returns:
            List of news articles with title, link, published date, etc.
        """
        try:
            ticker = yf.Ticker(symbol.upper())
            news = ticker.news

            if not news:
                return []

            formatted_news = []
            for article in news[:limit]:
                # Handle new yfinance news structure
                content = article.get('content', article)  # Fallback to article if no content key

                # Extract thumbnail URL from resolutions
                thumbnail_url = ''
                thumbnail = content.get('thumbnail', {})
                if thumbnail and thumbnail.get('resolutions'):
                    resolutions = thumbnail['resolutions']
                    # Get the smallest resolution for faster loading
                    thumbnail_url = resolutions[-1].get('url', '') if resolutions else ''

                # Handle different URL structures
                article_url = ''
                if content.get('canonicalUrl'):
                    article_url = content['canonicalUrl'].get('url', '')
                elif content.get('clickThroughUrl'):
                    article_url = content['clickThroughUrl'].get('url', '')
                else:
                    article_url = content.get('link', '')

                # Parse publication date
                pub_time = 0
                pub_date = content.get('pubDate') or content.get('providerPublishTime')
                if pub_date:
                    try:
                        if isinstance(pub_date, str):
                            # Convert ISO format to timestamp
                            dt = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                            pub_time = int(dt.timestamp())
                        else:
                            pub_time = int(pub_date)
                    except:
                        pub_time = 0

                formatted_article = {
                    'title': content.get('title', 'N/A'),
                    'link': article_url,
                    'published': pub_time,
                    'publisher': content.get('provider', {}).get('displayName', 'Unknown'),
                    'summary': content.get('summary', content.get('description', '')),
                    'thumbnail': thumbnail_url
                }
                formatted_news.append(formatted_article)

            return formatted_news

        except Exception as e:
            print(f"Error fetching news for {symbol}: {e}")
            return []

    def get_market_indices(self):
        """
        Get major market indices data

        Returns:
            Dictionary with major market indices information
        """
        try:
            # Major indices symbols
            indices = {
                'sp500': '^GSPC',      # S&P 500
                'dow': '^DJI',         # Dow Jones Industrial Average
                'nasdaq': '^IXIC',     # NASDAQ Composite
                'russell2000': '^RUT', # Russell 2000
                'vix': '^VIX',         # Volatility Index
                'ftse': '^FTSE',       # FTSE 100 (UK)
                'dax': '^GDAXI',       # DAX (Germany)
                'nikkei': '^N225',     # Nikkei 225 (Japan)
                'shanghai': '000001.SS', # Shanghai Composite (China)
                'cac40': '^FCHI',      # CAC 40 (France)
            }

            indices_data = {}

            for name, symbol in indices.items():
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info

                    current_price = info.get('regularMarketPrice') or info.get('currentPrice')
                    if not current_price:
                        continue

                    previous_close = info.get('previousClose', current_price)
                    change = current_price - previous_close
                    change_percent = (change / previous_close * 100) if previous_close else 0

                    indices_data[name] = {
                        'symbol': symbol,
                        'name': info.get('longName') or name.upper(),
                        'price': round(float(current_price), 2),
                        'change': round(float(change), 2),
                        'changePercent': round(float(change_percent), 2),
                        'dayHigh': round(float(info.get('dayHigh', 0)), 2),
                        'dayLow': round(float(info.get('dayLow', 0)), 2),
                        'volume': info.get('volume', 0),
                        'currency': info.get('currency', 'USD'),
                        'exchange': info.get('exchange', 'N/A'),
                        'marketState': info.get('marketState', 'UNKNOWN')
                    }

                except Exception as e:
                    print(f"Error fetching {name} index data: {e}")
                    continue

            return {
                'indices': indices_data,
                'lastUpdated': datetime.now().isoformat(),
                'marketSummary': self._get_market_summary(indices_data)
            }

        except Exception as e:
            print(f"Error fetching market indices: {e}")
            return {}

    def _get_market_summary(self, indices_data):
        """Generate market summary from indices data"""
        if not indices_data:
            return {}

        up_count = sum(1 for data in indices_data.values() if data.get('change', 0) > 0)
        down_count = sum(1 for data in indices_data.values() if data.get('change', 0) < 0)
        unchanged_count = len(indices_data) - up_count - down_count

        return {
            'totalIndices': len(indices_data),
            'marketsUp': up_count,
            'marketsDown': down_count,
            'marketsUnchanged': unchanged_count,
            'marketSentiment': 'bullish' if up_count > down_count else 'bearish' if down_count > up_count else 'neutral'
        }

    def get_market_news(self, limit=20, category='general'):
        """
        Get general market news

        Args:
            limit: Number of news articles to return
            category: News category ('general', 'earnings', 'mergers', etc.)

        Returns:
            List of market news articles
        """
        try:
            # Use major market tickers to get general market news
            market_tickers = ['^GSPC', '^DJI', '^IXIC']  # S&P 500, Dow, NASDAQ
            all_news = []

            for ticker_symbol in market_tickers:
                try:
                    ticker = yf.Ticker(ticker_symbol)
                    news = ticker.news

                    if news:
                        for article in news:
                            # Handle new yfinance news structure
                            content = article.get('content', article)

                            # Extract thumbnail URL from resolutions
                            thumbnail_url = ''
                            thumbnail = content.get('thumbnail', {})
                            if thumbnail and thumbnail.get('resolutions'):
                                resolutions = thumbnail['resolutions']
                                thumbnail_url = resolutions[-1].get('url', '') if resolutions else ''

                            # Handle different URL structures
                            article_url = ''
                            if content.get('canonicalUrl'):
                                article_url = content['canonicalUrl'].get('url', '')
                            elif content.get('clickThroughUrl'):
                                article_url = content['clickThroughUrl'].get('url', '')
                            else:
                                article_url = content.get('link', '')

                            # Parse publication date
                            pub_time = 0
                            pub_date = content.get('pubDate') or content.get('providerPublishTime')
                            if pub_date:
                                try:
                                    if isinstance(pub_date, str):
                                        dt = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
                                        pub_time = int(dt.timestamp())
                                    else:
                                        pub_time = int(pub_date)
                                except:
                                    pub_time = 0

                            # Avoid duplicates by checking if we already have this article
                            if not any(existing['link'] == article_url for existing in all_news):
                                formatted_article = {
                                    'title': content.get('title', 'N/A'),
                                    'link': article_url,
                                    'published': pub_time,
                                    'publisher': content.get('provider', {}).get('displayName', 'Unknown'),
                                    'summary': content.get('summary', content.get('description', '')),
                                    'thumbnail': thumbnail_url,
                                    'category': 'market',
                                    'relatedSymbol': ticker_symbol
                                }
                                all_news.append(formatted_article)

                except Exception as e:
                    print(f"Error fetching news for {ticker_symbol}: {e}")
                    continue

            # Sort by publication time (most recent first)
            all_news.sort(key=lambda x: x.get('published', 0), reverse=True)

            # Remove duplicates and limit results
            unique_news = []
            seen_titles = set()

            for article in all_news:
                title = article.get('title', '').lower().strip()
                if title not in seen_titles and len(unique_news) < limit:
                    seen_titles.add(title)
                    unique_news.append(article)

            return unique_news[:limit]

        except Exception as e:
            print(f"Error fetching market news: {e}")
            return []
