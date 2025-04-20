import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import pandas as pd
from sentiment_analysis import analyze_sentiment
from db_connection import db_manager
from alpha_vantage_api import alpha_vantage
import json
import os
import re

def store_price_data(symbol, historical_data):
    """Store price data in MySQL database"""
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Store support and resistance levels
        support_levels = historical_data.get('support_resistance', {}).get('support', [])
        resistance_levels = historical_data.get('support_resistance', {}).get('resistance', [])
        
        # Begin transaction
        conn.begin()
        
        # Store price history
        historical_prices = historical_data.get('historical_data', {})
        dates = historical_prices.get('dates', [])
        opens = historical_prices.get('open', [])
        highs = historical_prices.get('high', [])
        lows = historical_prices.get('low', [])
        closes = historical_prices.get('close', [])
        
        for i, date in enumerate(dates):
            cursor.execute("""
                INSERT INTO price_history 
                (symbol, open_price, high_price, low_price, close_price, timestamp, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (symbol, timestamp) DO UPDATE SET
                open_price = EXCLUDED.open_price,
                high_price = EXCLUDED.high_price,
                low_price = EXCLUDED.low_price,
                close_price = EXCLUDED.close_price,
                created_at = NOW()
            """, (symbol, opens[i], highs[i], lows[i], closes[i], date))
        
        # Update support levels
        for level in support_levels:
            cursor.execute("""
                INSERT INTO support_resistance 
                (symbol, level_type, level_value, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (symbol, level_type, level_value) DO UPDATE SET
                updated_at = NOW()
            """, (symbol, 'support', level))
        
        # Update resistance levels
        for level in resistance_levels:
            cursor.execute("""
                INSERT INTO support_resistance 
                (symbol, level_type, level_value, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (symbol, level_type, level_value) DO UPDATE SET
                updated_at = NOW()
            """, (symbol, 'resistance', level))
        
        # Store price predictions
        predictions = historical_data.get('predictions', [])
        
        # Update predictions
        end_date = datetime.now()
        for i, pred in enumerate(predictions):
            prediction_date = end_date + timedelta(days=i+1)
            cursor.execute("""
                INSERT INTO price_predictions 
                (symbol, prediction_date, predicted_price, created_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (symbol, prediction_date) DO UPDATE SET
                predicted_price = EXCLUDED.predicted_price,
                created_at = NOW()
            """, (symbol, prediction_date.strftime('%Y-%m-%d'), pred))
        
        # Store technical indicators
        technical_indicators = historical_data.get('technical_indicators', {})
        cursor.execute("""
            INSERT INTO technical_indicators 
            (symbol, rsi, macd, macd_signal, macd_hist, sma20, sma50, sma200)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (symbol) DO UPDATE SET
            rsi = EXCLUDED.rsi,
            macd = EXCLUDED.macd,
            macd_signal = EXCLUDED.macd_signal,
            macd_hist = EXCLUDED.macd_hist,
            sma20 = EXCLUDED.sma20,
            sma50 = EXCLUDED.sma50,
            sma200 = EXCLUDED.sma200
        """, (
            symbol,
            technical_indicators.get('rsi', 0),
            technical_indicators.get('macd', 0),
            technical_indicators.get('macd_signal', 0),
            technical_indicators.get('macd_hist', 0),
            technical_indicators.get('sma20', 0),
            technical_indicators.get('sma50', 0),
            technical_indicators.get('sma200', 0)
        ))
        
        conn.commit()
        cursor.close()
        db_manager.release_connection(conn)
        return True
    except Exception as e:
        print(f"Error storing price data: {e}")
        if cursor:
            cursor.close()
        if conn:
            try:
                conn.rollback()
            except:
                pass
            db_manager.release_connection(conn)
        return False

def analyze_stock(symbol, force_refresh=False):
    """
    Analyze stock or forex data using Alpha Vantage API with caching
    
    Args:
        symbol: Stock or forex symbol
        force_refresh: Whether to force a refresh of data from the API
        
    Returns:
        Dictionary with analysis results
    """
    try:
        # Add debug logging
        print(f"Starting analysis for symbol: {symbol}")
        
        # Check if it's a forex pair (format like "EURUSD-X" or "EURUSD=X")
        is_forex = '-X' in symbol or '=X' in symbol
        
        # Clean symbol for API calls
        clean_symbol = symbol.replace('-X', '').replace('=X', '')
        
        # For forex pairs, extract the currency codes
        if is_forex and len(clean_symbol) == 6:
            from_currency = clean_symbol[:3]
            to_currency = clean_symbol[3:6]
            print(f"Forex pair detected: {from_currency}/{to_currency}")
            
            # Get historical data from Alpha Vantage with caching
            hist = alpha_vantage.get_forex_data(from_currency, to_currency, days=30, force_refresh=force_refresh)
        else:
            # Get historical data from Alpha Vantage with caching
            hist = alpha_vantage.get_daily_data(clean_symbol, days=30, force_refresh=force_refresh)
        
        if hist.empty:
            print(f"No data available for symbol: {symbol}")
            return {"error": f"No data available for this symbol: {symbol}"}
            
        print(f"Successfully fetched data for {symbol}, {len(hist)} data points")
        
        # Rename columns if necessary to match our expected format
        column_mapping = {
            'open': 'Open',
            'high': 'High',
            'low': 'Low', 
            'close': 'Close',
            'volume': 'Volume'
        }
        
        # Apply mapping where needed
        for old_col, new_col in column_mapping.items():
            if old_col in hist.columns and new_col not in hist.columns:
                hist[new_col] = hist[old_col]
        
        # Prepare data for linear regression
        X = np.array(range(len(hist))).reshape(-1, 1)
        y = hist['Close'].values
        
        # Create and fit the model
        model = LinearRegression()
        model.fit(X, y)
        
        # Make predictions for next 5 days
        future_days = np.array(range(len(hist), len(hist) + 5)).reshape(-1, 1)
        predictions = model.predict(future_days)
        
        # Calculate trend
        slope = model.coef_[0]
        trend = "Bullish" if slope > 0 else "Bearish"
        
        # Calculate technical indicators
        # RSI
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        # Moving Averages
        sma20 = hist['Close'].rolling(window=20).mean()
        sma50 = hist['Close'].rolling(window=50).mean()
        sma200 = hist['Close'].rolling(window=200).mean()
        
        # MACD
        exp1 = hist['Close'].ewm(span=12, adjust=False).mean()
        exp2 = hist['Close'].ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()
        macd_hist = macd - signal
        
        # Support and Resistance levels
        recent_data = hist['Close'].tail(20)
        support_levels = recent_data.nsmallest(3).tolist()
        resistance_levels = recent_data.nlargest(3).tolist()
        
        # Get sentiment analysis
        sentiment_data = analyze_sentiment(symbol)
        
        # Handle NaN values and ensure all values are JSON-serializable
        def safe_float(value):
            if pd.isna(value) or np.isnan(value):
                return 0.0
            return float(value)
            
        def safe_list(values):
            return [safe_float(v) for v in values]
        
        # Generate prediction dates
        prediction_dates = [(datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(len(predictions))]
        print(f"Generated prediction dates: {prediction_dates}")
        
        # Prepare response with safe value handling
        response = {
            "symbol": symbol,
            "current_price": safe_float(hist['Close'].iloc[-1]),
            "trend": trend,
            "slope": safe_float(slope),
            "predictions": safe_list(predictions),
            "prediction_dates": prediction_dates,
            "historical_data": {
                "dates": hist.index.strftime('%Y-%m-%d').tolist(),
                "prices": safe_list(hist['Close'].tolist()),
                "open": safe_list(hist['Open'].tolist()),
                "high": safe_list(hist['High'].tolist()),
                "low": safe_list(hist['Low'].tolist()),
                "close": safe_list(hist['Close'].tolist())
            },
            "technical_indicators": {
                "rsi": safe_float(rsi.iloc[-1]),
                "macd": safe_float(macd.iloc[-1]),
                "macd_signal": safe_float(signal.iloc[-1]),
                "macd_hist": safe_float(macd_hist.iloc[-1]),
                "sma20": safe_float(sma20.iloc[-1]),
                "sma50": safe_float(sma50.iloc[-1]),
                "sma200": safe_float(sma200.iloc[-1])
            },
            "support_resistance": {
                "support": safe_list(support_levels),
                "resistance": safe_list(resistance_levels)
            },
            "sentiment": sentiment_data
        }
        
        # Store data in MySQL database
        print(f"Storing data for {symbol} in database")
        store_success = store_price_data(symbol, response)
        if not store_success:
            print(f"Warning: Failed to store price data for {symbol}")
        
        # Store or update analysis results in the market_data table
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if the symbol already exists
            cursor.execute("""
                SELECT * FROM market_data WHERE symbol = %s
            """, (symbol,))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing record
                cursor.execute("""
                    UPDATE market_data 
                    SET current_price = %s, trend = %s, rsi = %s, macd = %s, macd_signal = %s, 
                        macd_hist = %s, sma20 = %s, sma50 = %s, sma200 = %s, updated_at = NOW()
                    WHERE symbol = %s
                """, (
                    response["current_price"],
                    response["trend"],
                    response["technical_indicators"]["rsi"],
                    response["technical_indicators"]["macd"],
                    response["technical_indicators"]["macd_signal"],
                    response["technical_indicators"]["macd_hist"],
                    response["technical_indicators"]["sma20"],
                    response["technical_indicators"]["sma50"],
                    response["technical_indicators"]["sma200"],
                    symbol
                ))
            else:
                # Insert new record
                cursor.execute("""
                    INSERT INTO market_data 
                    (symbol, current_price, trend, rsi, macd, macd_signal, macd_hist, sma20, sma50, sma200, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, (
                    symbol,
                    response["current_price"],
                    response["trend"],
                    response["technical_indicators"]["rsi"],
                    response["technical_indicators"]["macd"],
                    response["technical_indicators"]["macd_signal"],
                    response["technical_indicators"]["macd_hist"],
                    response["technical_indicators"]["sma20"],
                    response["technical_indicators"]["sma50"],
                    response["technical_indicators"]["sma200"]
                ))
                
            conn.commit()
            print(f"Successfully updated market_data for {symbol}")
        except Exception as e:
            print(f"Error updating market_data: {e}")
            try:
                conn.rollback()
            except:
                pass
        finally:
            cursor.close()
            db_manager.release_connection(conn)
        
        return response
    except Exception as e:
        print(f"Error analyzing stock: {e}")
        return {"error": str(e)}

def get_historical_prices(symbol, days=30, force_refresh=False):
    """
    Get historical price data for a symbol
    
    Args:
        symbol: Stock or forex symbol
        days: Number of days of history to return
        force_refresh: Whether to force a refresh of data from the API
        
    Returns:
        Dictionary with historical price data
    """
    try:
        # Check if it's a forex pair (format like "EURUSD-X" or "EURUSD=X")
        is_forex = '-X' in symbol or '=X' in symbol
        
        # Clean symbol for API calls
        clean_symbol = symbol.replace('-X', '').replace('=X', '')
        
        # For forex pairs, extract the currency codes
        if is_forex and len(clean_symbol) == 6:
            from_currency = clean_symbol[:3]
            to_currency = clean_symbol[3:6]
            print(f"Forex pair detected for history: {from_currency}/{to_currency}")
            
            # Get historical data from Alpha Vantage with caching
            hist = alpha_vantage.get_forex_data(from_currency, to_currency, days=days, force_refresh=force_refresh)
        else:
            # Get historical data from Alpha Vantage with caching
            hist = alpha_vantage.get_daily_data(clean_symbol, days=days, force_refresh=force_refresh)
        
        if hist.empty:
            return {"error": f"No historical data available for {symbol}"}
        
        # Format the data for response
        history_data = []
        for date, row in hist.iterrows():
            history_data.append({
                "date": date.strftime('%Y-%m-%d'),
                "open": float(row.get('Open', row.get('open', 0))),
                "high": float(row.get('High', row.get('high', 0))),
                "low": float(row.get('Low', row.get('low', 0))),
                "close": float(row.get('Close', row.get('close', 0))),
                "volume": float(row.get('Volume', row.get('volume', 0))) if 'Volume' in row or 'volume' in row else 0
            })
        
        return {
            "symbol": symbol,
            "history": history_data
        }
    
    except Exception as e:
        print(f"Error getting historical prices: {e}")
        return {"error": str(e)} 