from flask import Blueprint, jsonify, request
from db_connection import db_manager
from market_analysis import analyze_stock
import json

market_analysis_bp = Blueprint('market_analysis', __name__)

@market_analysis_bp.route('/api/market-analysis/<symbol>', methods=['GET'])
def get_market_analysis(symbol):
    """Get market analysis data for a specific symbol from the database"""
    try:
        db = db_manager.get_connection()
        cursor = db.cursor(dictionary=True)
        
        # Get basic market data
        cursor.execute('''
            SELECT * FROM market_data 
            WHERE symbol = %s
        ''', (symbol,))
        market_data = cursor.fetchone()
        
        if not market_data:
            # If no data exists, perform a new analysis
            analysis_result = analyze_stock(symbol)
            if "error" in analysis_result:
                return jsonify({"error": analysis_result["error"]}), 404
            return jsonify(analysis_result), 200
        
        # Get support and resistance levels
        cursor.execute('''
            SELECT level_type, level_value 
            FROM support_resistance 
            WHERE symbol = %s
        ''', (symbol,))
        levels = cursor.fetchall()
        
        support_levels = [level['level_value'] for level in levels if level['level_type'] == 'support']
        resistance_levels = [level['level_value'] for level in levels if level['level_type'] == 'resistance']
        
        # Get price predictions
        cursor.execute('''
            SELECT prediction_date, predicted_price 
            FROM price_predictions 
            WHERE symbol = %s
            ORDER BY prediction_date
        ''', (symbol,))
        predictions_data = cursor.fetchall()
        
        prediction_dates = [pred['prediction_date'] for pred in predictions_data]
        predicted_prices = [pred['predicted_price'] for pred in predictions_data]
        
        # Get technical indicators
        cursor.execute('''
            SELECT rsi, macd, macd_signal, macd_hist, sma20, sma50, sma200
            FROM technical_indicators
            WHERE symbol = %s
        ''', (symbol,))
        technical_data = cursor.fetchone()
        
        # Get sentiment data from the sentiment_analysis.json file
        try:
            with open('market_data/sentiment_analysis.json', 'r') as f:
                sentiment_data = json.load(f)
                symbol_sentiment = sentiment_data.get(symbol, {})
        except (FileNotFoundError, json.JSONDecodeError):
            symbol_sentiment = {}
        
        # Prepare response
        response = {
            "symbol": symbol,
            "current_price": market_data['current_price'],
            "trend": market_data['trend'],
            "slope": market_data['change_percentage'],
            "predictions": predicted_prices,
            "prediction_dates": prediction_dates,
            "support_resistance": {
                "support": support_levels,
                "resistance": resistance_levels
            },
            "technical_indicators": technical_data if technical_data else {
                "rsi": 0,
                "macd": 0,
                "macd_signal": 0,
                "macd_hist": 0,
                "sma20": 0,
                "sma50": 0,
                "sma200": 0
            },
            "sentiment": symbol_sentiment,
            "last_updated": market_data['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
        }
        
        cursor.close()
        return jsonify(response), 200
        
    except Exception as e:
        if 'cursor' in locals():
            cursor.close()
        return jsonify({"error": str(e)}), 500

@market_analysis_bp.route('/api/market-analysis/refresh/<symbol>', methods=['POST'])
def refresh_market_analysis(symbol):
    """Force a refresh of market analysis data for a specific symbol"""
    try:
        analysis_result = analyze_stock(symbol)
        if "error" in analysis_result:
            return jsonify({"error": analysis_result["error"]}), 404
        return jsonify(analysis_result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@market_analysis_bp.route('/api/market-analysis/<symbol>/history', methods=['GET'])
def get_price_history(symbol):
    """Get historical price data for a specific symbol"""
    try:
        db = db_manager.get_connection()
        cursor = db.cursor(dictionary=True)
        
        # Get historical price data
        cursor.execute('''
            SELECT open_price, high_price, low_price, close_price, timestamp, created_at
            FROM price_history 
            WHERE symbol = %s
            ORDER BY timestamp DESC
            LIMIT 30
        ''', (symbol,))
        
        history_data = cursor.fetchall()
        
        if not history_data:
            return jsonify({"error": "No historical data available"}), 404
            
        # Format the response
        response = {
            "symbol": symbol,
            "history": [{
                "open": float(row['open_price']),
                "high": float(row['high_price']),
                "low": float(row['low_price']),
                "close": float(row['close_price']),
                "date": row['timestamp'].strftime('%Y-%m-%d'),
                "created_at": row['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            } for row in history_data]
        }
        
        cursor.close()
        return jsonify(response), 200
        
    except Exception as e:
        if 'cursor' in locals():
            cursor.close()
        return jsonify({"error": str(e)}), 500

@market_analysis_bp.route('/api/market-trends', methods=['GET'])
def get_market_trends():
    """Get overall market trend (bullish/bearish) based on market_data table"""
    try:
        db = db_manager.get_connection()
        cursor = db.cursor(dictionary=True)
        
        # Get all symbols from market_data
        cursor.execute('''
            SELECT symbol, trend
            FROM market_data
        ''')
        market_data = cursor.fetchall()
        
        if not market_data:
            return jsonify({
                "status": "error",
                "message": "No market data available"
            }), 404
        
        # Count bullish and bearish symbols
        bullish_count = sum(1 for item in market_data if item['trend'] == 'Bullish')
        bearish_count = sum(1 for item in market_data if item['trend'] == 'Bearish')
        neutral_count = sum(1 for item in market_data if item['trend'] == 'Neutral')
        
        # Calculate overall trend
        total_symbols = len(market_data)
        bullish_percentage = (bullish_count / total_symbols) * 100
        bearish_percentage = (bearish_count / total_symbols) * 100
        neutral_percentage = (neutral_count / total_symbols) * 100
        
        # Determine overall market sentiment
        if bullish_percentage > bearish_percentage and bullish_percentage > 50:
            overall_trend = "bullish"
        elif bearish_percentage > bullish_percentage and bearish_percentage > 50:
            overall_trend = "bearish"
        else:
            overall_trend = "neutral"
        
        return jsonify({
            "status": "success",
            "data": {
                "overall_trend": overall_trend,
                "bullish_percentage": round(bullish_percentage, 2),
                "bearish_percentage": round(bearish_percentage, 2),
                "neutral_percentage": round(neutral_percentage, 2),
                "total_symbols": total_symbols
            }
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500 