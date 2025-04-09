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
    """Get market analysis data for a specific symbol"""
    conn = None
    cursor = None
    try:
        # Clean the symbol by removing -X suffix if present
        clean_symbol = symbol.split('-X')[0] if '-X' in symbol else symbol
        
        logger.info(f"Fetching market analysis for symbol: {symbol}, clean_symbol: {clean_symbol}")
        
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # First try with the original symbol
        cursor.execute("""
            SELECT 
                md.current_price, 
                md.trend,
                ti.rsi, 
                ti.macd, 
                ti.macd_signal, 
                ti.macd_hist, 
                ti.sma20, 
                ti.sma50, 
                ti.sma200
            FROM market_data md
            LEFT JOIN technical_indicators ti ON md.symbol = ti.symbol
            WHERE md.symbol = %s
        """, (symbol,))
        
        market_row = cursor.fetchone()
        
        # If no results with original symbol and it differs from clean_symbol, try with clean_symbol
        if not market_row and symbol != clean_symbol:
            logger.info(f"No market data found for {symbol}, trying with clean symbol: {clean_symbol}")
            cursor.execute("""
                SELECT 
                    md.current_price, 
                    md.trend,
                    ti.rsi, 
                    ti.macd, 
                    ti.macd_signal, 
                    ti.macd_hist, 
                    ti.sma20, 
                    ti.sma50, 
                    ti.sma200
                FROM market_data md
                LEFT JOIN technical_indicators ti ON md.symbol = ti.symbol
                WHERE md.symbol = %s
            """, (clean_symbol,))
            
            market_row = cursor.fetchone()
            
            # If we found data with the clean symbol, use that as the symbol in the response
            if market_row:
                symbol = clean_symbol
        
        # Fetch support and resistance levels
        # Use the symbol that was found to have data in the previous query
        symbol_to_use = clean_symbol if market_row and symbol != clean_symbol else symbol
        cursor.execute("""
            SELECT level_type, level_value
            FROM support_resistance
            WHERE symbol = %s
        """, (symbol_to_use,))
        
        sr_rows = cursor.fetchall()
        
        # Fetch price predictions
        cursor.execute("""
            SELECT prediction_date, predicted_price
            FROM price_predictions
            WHERE symbol = %s
            ORDER BY prediction_date ASC
        """, (symbol_to_use,))
        
        prediction_rows = cursor.fetchall()
        
        # If no market data exists yet, perform analysis
        if not market_row:
            cursor.close()
            db_manager.release_connection(conn)
            logger.info(f"No existing market data for {symbol}, performing new analysis")
            analysis_result = analyze_stock(symbol)
            return jsonify(analysis_result), 200
        
        # Prepare response
        response = {
            "symbol": symbol,
            "current_price": float(market_row[0]) if market_row[0] else 0.0,
            "trend": market_row[1] if market_row[1] else "Neutral",
            "technical_indicators": {
                "rsi": float(market_row[2]) if market_row[2] else 0.0,
                "macd": float(market_row[3]) if market_row[3] else 0.0,
                "macd_signal": float(market_row[4]) if market_row[4] else 0.0,
                "macd_hist": float(market_row[5]) if market_row[5] else 0.0,
                "sma20": float(market_row[6]) if market_row[6] else 0.0,
                "sma50": float(market_row[7]) if market_row[7] else 0.0,
                "sma200": float(market_row[8]) if market_row[8] else 0.0
            },
            "support_resistance": {
                "support": [],
                "resistance": []
            },
            "predictions": [],
            "prediction_dates": []
        }
        
        # Process support and resistance levels
        for row in sr_rows:
            level_type, level_value = row
            if level_type == 'support':
                response["support_resistance"]["support"].append(float(level_value))
            elif level_type == 'resistance':
                response["support_resistance"]["resistance"].append(float(level_value))
        
        # Process predictions
        for row in prediction_rows:
            date, price = row
            response["prediction_dates"].append(date.strftime('%Y-%m-%d'))
            response["predictions"].append(float(price) if price else 0.0)
        
        cursor.close()
        db_manager.release_connection(conn)
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error retrieving market analysis for {symbol}: {str(e)}")
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conn:
            db_manager.release_connection(conn)
        return jsonify({"error": str(e)}), 500

@market_analysis_bp.route('/api/market-analysis/refresh/<symbol>', methods=['POST'])
def refresh_market_analysis(symbol):
    """Force a refresh of market analysis data for a specific symbol"""
    try:
        # Clean the symbol by removing -X suffix if present
        clean_symbol = symbol.split('-X')[0] if '-X' in symbol else symbol
        
        logger.info(f"Refreshing market analysis for symbol: {symbol}, clean_symbol: {clean_symbol}")
        
        # Use the clean symbol for analysis
        analysis_result = analyze_stock(clean_symbol)
        
        if "error" in analysis_result:
            return jsonify({"error": analysis_result["error"]}), 400
            
        return jsonify(analysis_result), 200
        
    except Exception as e:
        logger.error(f"Error refreshing market analysis for {symbol}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@market_analysis_bp.route('/api/market-analysis/<symbol>/history', methods=['GET'])
def get_symbol_history(symbol):
    conn = None
    cursor = None
    try:
        # Clean the symbol by removing -X suffix if present
        clean_symbol = symbol.split('-X')[0] if '-X' in symbol else symbol
        
        logger.info(f"Fetching price history for symbol: {symbol}, clean_symbol: {clean_symbol}")
        
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # First try with the original symbol
        cursor.execute("""
            SELECT 
                open_price,
                high_price,
                low_price,
                close_price,
                timestamp
            FROM price_history
            WHERE symbol = %s
            ORDER BY timestamp DESC
            LIMIT 30
        """, (symbol,))
        
        rows = cursor.fetchall()
        
        # If no results with original symbol and it differs from clean_symbol, try with clean_symbol
        if len(rows) == 0 and symbol != clean_symbol:
            logger.info(f"No data found for {symbol}, trying with clean symbol: {clean_symbol}")
            cursor.execute("""
                SELECT 
                    open_price,
                    high_price,
                    low_price,
                    close_price,
                    timestamp
                FROM price_history
                WHERE symbol = %s
                ORDER BY timestamp DESC
                LIMIT 30
            """, (clean_symbol,))
            
            rows = cursor.fetchall()
            
            # If we found data with the clean symbol, use that as the symbol in the response
            if len(rows) > 0:
                symbol = clean_symbol
        
        # If still no data, return appropriate message
        if len(rows) == 0:
            logger.warning(f"No price history data found for symbol: {symbol} or {clean_symbol}")
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({
                "message": "No historical data available",
                "symbol": symbol,
                "history": []
            }), 404
        
        # Convert rows to dictionaries
        history = []
        for row in rows:
            history.append({
                'open': float(row[0]),
                'high': float(row[1]),
                'low': float(row[2]),
                'close': float(row[3]),
                'date': row[4].strftime('%Y-%m-%d')
            })
        
        # Sort by date ascending for better charting
        history.sort(key=lambda x: x['date'])
        
        cursor.close()
        db_manager.release_connection(conn)
        
        return jsonify({
            "symbol": symbol,
            "history": history
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching price history for {symbol}: {str(e)}")
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conn:
            db_manager.release_connection(conn)
        return jsonify({
            "message": f"Error fetching price history: {str(e)}",
            "symbol": symbol,
            "history": []
        }), 500

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