from flask import Blueprint, jsonify, request
from db_connection import db_manager
from market_analysis import analyze_stock
import json
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

market_analysis_bp = Blueprint('market_analysis', __name__)

@market_analysis_bp.route('/api/market-analysis/<symbol>', methods=['GET'])
def get_market_analysis(symbol):
    """Get market analysis data for a specific symbol from the database"""
    conn = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Get basic market data
        cursor.execute("""
            SELECT * FROM market_data 
            WHERE symbol = %s
        """, (symbol,))
        market_data_row = cursor.fetchone()
        
        if not market_data_row:
            # If no data exists, perform a new analysis
            cursor.close()
            db_manager.release_connection(conn)
            analysis_result = analyze_stock(symbol)
            if "error" in analysis_result:
                return jsonify({"error": analysis_result["error"]}), 404
            return jsonify(analysis_result), 200
        
        # Create market_data dictionary from tuple
        # Assuming columns: id, symbol, current_price, change_percentage, trend, updated_at
        market_data = {
            'id': market_data_row[0],
            'symbol': market_data_row[1],
            'current_price': market_data_row[2],
            'change_percentage': market_data_row[3],
            'trend': market_data_row[4],
            'updated_at': market_data_row[5]
        }
        
        # Get support and resistance levels
        cursor.execute("""
            SELECT level_type, level_value 
            FROM support_resistance 
            WHERE symbol = %s
        """, (symbol,))
        levels_rows = cursor.fetchall()
        
        # Process levels data from tuples
        levels = []
        for row in levels_rows:
            levels.append({
                'level_type': row[0],
                'level_value': row[1]
            })
        
        support_levels = [level['level_value'] for level in levels if level['level_type'] == 'support']
        resistance_levels = [level['level_value'] for level in levels if level['level_type'] == 'resistance']
        
        # Get price predictions
        cursor.execute("""
            SELECT prediction_date, predicted_price 
            FROM price_predictions 
            WHERE symbol = %s
            ORDER BY prediction_date
        """, (symbol,))
        predictions_rows = cursor.fetchall()
        
        # Process predictions data from tuples
        predictions_data = []
        for row in predictions_rows:
            predictions_data.append({
                'prediction_date': row[0],
                'predicted_price': row[1]
            })
        
        prediction_dates = [pred['prediction_date'].strftime('%Y-%m-%d') if pred['prediction_date'] else None for pred in predictions_data]
        predicted_prices = [float(pred['predicted_price']) if pred['predicted_price'] else 0.0 for pred in predictions_data]
        
        # Get technical indicators
        cursor.execute("""
            SELECT rsi, macd, macd_signal, macd_hist, sma20, sma50, sma200
            FROM technical_indicators
            WHERE symbol = %s
        """, (symbol,))
        technical_row = cursor.fetchone()
        
        # Process technical data from tuple
        technical_data = None
        if technical_row:
            technical_data = {
                'rsi': technical_row[0],
                'macd': technical_row[1],
                'macd_signal': technical_row[2],
                'macd_hist': technical_row[3],
                'sma20': technical_row[4],
                'sma50': technical_row[5],
                'sma200': technical_row[6]
            }
        
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
            "current_price": float(market_data['current_price']) if market_data['current_price'] else 0.0,
            "trend": market_data['trend'],
            "slope": float(market_data['change_percentage']) if market_data['change_percentage'] else 0.0,
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
            "last_updated": market_data['updated_at'].strftime('%Y-%m-%d %H:%M:%S') if market_data['updated_at'] else None
        }
        
        cursor.close()
        db_manager.release_connection(conn)
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error fetching market analysis for {symbol}: {str(e)}")
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conn:
            db_manager.release_connection(conn)
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
        logger.error(f"Error refreshing market analysis for {symbol}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@market_analysis_bp.route('/api/market-analysis/<symbol>/history', methods=['GET'])
def get_price_history(symbol):
    """Get historical price data for a specific symbol"""
    conn = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Get historical price data
        cursor.execute("""
            SELECT open_price, high_price, low_price, close_price, timestamp, created_at
            FROM price_history 
            WHERE symbol = %s
            ORDER BY timestamp DESC
            LIMIT 30
        """, (symbol,))
        
        history_rows = cursor.fetchall()
        
        if not history_rows:
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({"error": "No historical data available"}), 404
        
        # Convert tuples to dictionaries
        history_data = []
        for row in history_rows:
            history_data.append({
                'open_price': row[0],
                'high_price': row[1],
                'low_price': row[2],
                'close_price': row[3],
                'timestamp': row[4],
                'created_at': row[5]
            })
            
        # Format the response
        response = {
            "symbol": symbol,
            "history": [{
                "open": float(row['open_price']) if row['open_price'] else 0.0,
                "high": float(row['high_price']) if row['high_price'] else 0.0,
                "low": float(row['low_price']) if row['low_price'] else 0.0,
                "close": float(row['close_price']) if row['close_price'] else 0.0,
                "date": row['timestamp'].strftime('%Y-%m-%d') if row['timestamp'] else None,
                "created_at": row['created_at'].strftime('%Y-%m-%d %H:%M:%S') if row['created_at'] else None
            } for row in history_data]
        }
        
        cursor.close()
        db_manager.release_connection(conn)
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error fetching price history for {symbol}: {str(e)}")
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conn:
            db_manager.release_connection(conn)
        return jsonify({"error": str(e)}), 500

@market_analysis_bp.route('/api/market-trends', methods=['GET'])
def get_market_trends():
    """Get overall market trend (bullish/bearish) based on market_data table"""
    conn = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Get all symbols from market_data
        cursor.execute("""
            SELECT symbol, trend
            FROM market_data
        """)
        market_rows = cursor.fetchall()
        
        if not market_rows:
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({
                "message": "No market data available"
            }), 404
        
        # Convert tuples to dictionaries
        market_data = []
        for row in market_rows:
            market_data.append({
                'symbol': row[0],
                'trend': row[1]
            })
        
        # Count bullish and bearish symbols
        bullish_count = sum(1 for item in market_data if item['trend'] == 'Bullish')
        bearish_count = sum(1 for item in market_data if item['trend'] == 'Bearish')
        neutral_count = sum(1 for item in market_data if item['trend'] == 'Neutral')
        
        # Calculate overall trend
        total_symbols = len(market_data)
        bullish_percentage = (bullish_count / total_symbols) * 100 if total_symbols > 0 else 0
        bearish_percentage = (bearish_count / total_symbols) * 100 if total_symbols > 0 else 0
        neutral_percentage = (neutral_count / total_symbols) * 100 if total_symbols > 0 else 0
        
        # Determine overall market sentiment
        if bullish_percentage > bearish_percentage and bullish_percentage > 50:
            overall_trend = "bullish"
        elif bearish_percentage > bullish_percentage and bearish_percentage > 50:
            overall_trend = "bearish"
        else:
            overall_trend = "neutral"
        
        cursor.close()
        db_manager.release_connection(conn)
        
        return jsonify({
            "data": {
                "overall_trend": overall_trend,
                "bullish_percentage": round(bullish_percentage, 2),
                "bearish_percentage": round(bearish_percentage, 2),
                "neutral_percentage": round(neutral_percentage, 2),
                "total_symbols": total_symbols
            }
        }), 200
    except Exception as e:
        logger.error(f"Error fetching market trends: {str(e)}")
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conn:
            db_manager.release_connection(conn)
        return jsonify({
            "message": f"Error fetching market trends: {str(e)}"
        }), 500 