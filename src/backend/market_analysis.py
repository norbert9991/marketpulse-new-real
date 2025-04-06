import numpy as np
from sklearn.linear_model import LinearRegression
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
from sentiment_analysis import analyze_sentiment
from db_connection import db_manager
import json
import os

def store_price_data(symbol, historical_data):
    """Store price data in MySQL database"""
    try:
        db = db_manager.get_connection()
        cursor = db.cursor(dictionary=True)
        
        # Store support and resistance levels
        support_levels = historical_data.get('support_resistance', {}).get('support', [])
        resistance_levels = historical_data.get('support_resistance', {}).get('resistance', [])
        
        # Begin transaction
        db.start_transaction()
        
        # Store price history
        historical_prices = historical_data.get('historical_data', {})
        dates = historical_prices.get('dates', [])
        opens = historical_prices.get('open', [])
        highs = historical_prices.get('high', [])
        lows = historical_prices.get('low', [])
        closes = historical_prices.get('close', [])
        
        for i, date in enumerate(dates):
            cursor.execute('''
                INSERT INTO price_history 
                (symbol, open_price, high_price, low_price, close_price, timestamp, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                open_price = VALUES(open_price),
                high_price = VALUES(high_price),
                low_price = VALUES(low_price),
                close_price = VALUES(close_price),
                created_at = NOW()
            ''', (symbol, opens[i], highs[i], lows[i], closes[i], date))
        
        # Update support levels
        for level in support_levels:
            cursor.execute('''
                INSERT INTO support_resistance 
                (symbol, level_type, level_value, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                level_value = VALUES(level_value),
                updated_at = NOW()
            ''', (symbol, 'support', level))
        
        # Update resistance levels
        for level in resistance_levels:
            cursor.execute('''
                INSERT INTO support_resistance 
                (symbol, level_type, level_value, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                level_value = VALUES(level_value),
                updated_at = NOW()
            ''', (symbol, 'resistance', level))
        
        # Store price predictions
        predictions = historical_data.get('predictions', [])
        
        # Update predictions
        end_date = datetime.now()
        for i, pred in enumerate(predictions):
            prediction_date = end_date + timedelta(days=i+1)
            cursor.execute('''
                INSERT INTO price_predictions 
                (symbol, prediction_date, predicted_price, created_at)
                VALUES (%s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                predicted_price = VALUES(predicted_price),
                created_at = NOW()
            ''', (symbol, prediction_date.strftime('%Y-%m-%d'), pred))
        
        # Store technical indicators
        technical_indicators = historical_data.get('technical_indicators', {})
        cursor.execute('''
            INSERT INTO technical_indicators 
            (symbol, rsi, macd, macd_signal, macd_hist, sma20, sma50, sma200)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            rsi = VALUES(rsi),
            macd = VALUES(macd),
            macd_signal = VALUES(macd_signal),
            macd_hist = VALUES(macd_hist),
            sma20 = VALUES(sma20),
            sma50 = VALUES(sma50),
            sma200 = VALUES(sma200)
        ''', (
            symbol,
            technical_indicators.get('rsi', 0),
            technical_indicators.get('macd', 0),
            technical_indicators.get('macd_signal', 0),
            technical_indicators.get('macd_hist', 0),
            technical_indicators.get('sma20', 0),
            technical_indicators.get('sma50', 0),
            technical_indicators.get('sma200', 0)
        ))
        
        db.commit()
        cursor.close()
        return True
    except Exception as e:
        if 'db' in locals() and 'cursor' in locals():
            db.rollback()
            cursor.close()
        print(f"Error storing price data: {e}")
        return False

def analyze_stock(symbol):
    try:
        # Get historical data for the last 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Fetch data from Yahoo Finance
        stock = yf.Ticker(symbol)
        hist = stock.history(start=start_date, end=end_date)
        
        if hist.empty:
            return {"error": "No data available for this symbol"}
            
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
        
        # Prepare response with safe value handling
        response = {
            "symbol": symbol,
            "current_price": safe_float(hist['Close'].iloc[-1]),
            "trend": trend,
            "slope": safe_float(slope),
            "predictions": safe_list(predictions),
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
        store_price_data(symbol, response)
        
        # Store or update analysis results in the market_data table
        db = db_manager.get_connection()
        cursor = db.cursor(dictionary=True)
        
        # Check if the symbol already exists
        cursor.execute('''
            SELECT * FROM market_data WHERE symbol = %s
        ''', (symbol,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing record
            cursor.execute('''
                UPDATE market_data SET 
                    current_price = %s,
                    change_percentage = %s,
                    trend = %s,
                    updated_at = NOW()
                WHERE symbol = %s
            ''', (response['current_price'], response['slope'], response['trend'], symbol))
        else:
            # Insert new record
            cursor.execute('''
                INSERT INTO market_data (symbol, current_price, change_percentage, trend, updated_at) 
                VALUES (%s, %s, %s, %s, NOW())
            ''', (symbol, response['current_price'], response['slope'], response['trend']))
        
        db.commit()
        cursor.close()
        
        return response
        
    except Exception as e:
        return {"error": str(e)} 