from flask import Blueprint, jsonify, request
from db_connection import db_manager
from market_analysis import analyze_stock, get_historical_prices
import json
import logging
from datetime import datetime, timedelta

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
        # Check if we should force refresh (bypass cache)
        force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
        
        # Clean the symbol by removing -X suffix if present
        clean_symbol = symbol.split('-X')[0] if '-X' in symbol else symbol
        clean_symbol = clean_symbol.split('=X')[0] if '=X' in clean_symbol else clean_symbol
        
        logger.info(f"Fetching market analysis for symbol: {symbol}, clean_symbol: {clean_symbol}, force_refresh: {force_refresh}")
        
        # If force refresh, skip database lookup and go straight to analysis
        if force_refresh:
            logger.info(f"Force refresh requested for {symbol}, performing new analysis")
            analysis_result = analyze_stock(symbol, force_refresh=True)
            
            # Debug log for predictions in analysis result
            if 'predictions' in analysis_result:
                logger.info(f"Predictions from analysis for {symbol}: {analysis_result['predictions']}")
                logger.info(f"Prediction dates from analysis for {symbol}: {analysis_result.get('prediction_dates', [])}")
            else:
                logger.warning(f"No predictions in analysis result for {symbol}")
                
            return jsonify(analysis_result), 200
            
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Query market_data table
        cursor.execute("""
            SELECT current_price, trend, rsi, macd, macd_signal, macd_hist, 
                   sma20, sma50, sma200, updated_at
            FROM market_data
            WHERE symbol = %s
        """, (symbol,))
        
        market_row = cursor.fetchone()
        
        # If row found for symbol, try with clean_symbol
        if not market_row and symbol != clean_symbol:
            logger.info(f"No data found for {symbol}, trying with {clean_symbol}")
            cursor.execute("""
                SELECT current_price, trend, rsi, macd, macd_signal, macd_hist, 
                    sma20, sma50, sma200, updated_at
                FROM market_data
                WHERE symbol = %s
            """, (clean_symbol,))
            
            market_row = cursor.fetchone()
            
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
        logger.info(f"Found {len(prediction_rows)} prediction records for {symbol_to_use}")
        
        # If no market data exists yet, perform analysis
        if not market_row:
            cursor.close()
            db_manager.release_connection(conn)
            logger.info(f"No existing market data for {symbol}, performing new analysis")
            analysis_result = analyze_stock(symbol)
            
            # Debug log for predictions in analysis result
            if 'predictions' in analysis_result:
                logger.info(f"Predictions from analysis for {symbol}: {analysis_result['predictions']}")
                logger.info(f"Prediction dates from analysis for {symbol}: {analysis_result.get('prediction_dates', [])}")
            else:
                logger.warning(f"No predictions in analysis result for {symbol}")
                
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
            "prediction_dates": [],
            "updated_at": market_row[9].isoformat() if market_row[9] else datetime.now().isoformat()
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
        
        # Log the processed prediction data
        logger.info(f"Processed {len(response['predictions'])} predictions for {symbol}")
        if len(response['predictions']) > 0:
            logger.info(f"Sample prediction data: {response['predictions'][0]}, date: {response['prediction_dates'][0]}")
        else:
            logger.warning(f"No predictions found for {symbol}")
            
            # Generate default prediction data if none exists
            today = datetime.now()
            current_price = response["current_price"]
            if current_price > 0:
                logger.info(f"Generating default predictions for {symbol} based on current price {current_price}")
                # Create 5 predictions with slight trend based on current price
                response["predictions"] = [
                    current_price * (1 + 0.001 * i) for i in range(1, 6)
                ]
                response["prediction_dates"] = [
                    (today + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(1, 6)
                ]
                logger.info(f"Generated predictions: {response['predictions']}")
                logger.info(f"Generated dates: {response['prediction_dates']}")
        
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
        clean_symbol = clean_symbol.split('=X')[0] if '=X' in clean_symbol else clean_symbol
        
        logger.info(f"Refreshing market analysis for symbol: {symbol}, clean_symbol: {clean_symbol}")
        
        # Force refresh of data from API (bypass cache)
        analysis_result = analyze_stock(symbol, force_refresh=True)
        
        if "error" in analysis_result:
            return jsonify({"error": analysis_result["error"]}), 400
            
        return jsonify(analysis_result), 200
        
    except Exception as e:
        logger.error(f"Error refreshing market analysis for {symbol}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@market_analysis_bp.route('/api/market-analysis/<symbol>/history', methods=['GET'])
def get_symbol_history(symbol):
    """Get historical price data for a specific symbol"""
    try:
        # Check if we should force refresh (bypass cache)
        force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
        
        # Get number of days requested (default to 30)
        days = int(request.args.get('days', 30))
        
        # Clean the symbol by removing -X suffix if present
        clean_symbol = symbol.split('-X')[0] if '-X' in symbol else symbol
        clean_symbol = clean_symbol.split('=X')[0] if '=X' in clean_symbol else clean_symbol
        
        logger.info(f"Fetching price history for symbol: {symbol}, days: {days}, force_refresh: {force_refresh}")
        
        # Get historical prices from Alpha Vantage (with caching)
        history_data = get_historical_prices(symbol, days=days, force_refresh=force_refresh)
        
        return jsonify(history_data), 200
        
    except Exception as e:
        logger.error(f"Error retrieving price history for {symbol}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@market_analysis_bp.route('/api/market-trends', methods=['GET'])
def get_market_trends():
    """Get overall market trend (bullish/bearish) based on market_data table"""
    conn = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        try:
            # Get all symbols from market_data
            cursor.execute("""
                SELECT symbol, trend
                FROM market_data
            """)
            market_rows = cursor.fetchall()
            
            if not market_rows:
                # Return default data if no market data available
                cursor.close()
                db_manager.release_connection(conn)
                return jsonify({
                    "success": True,
                    "data": {
                        "overall_trend": "neutral",
                        "bullish_percentage": 0,
                        "bearish_percentage": 0,
                        "neutral_percentage": 100,
                        "total_symbols": 0
                    }
                }), 200
            
            # Convert tuples to dictionaries
            market_data = []
            for row in market_rows:
                if len(row) >= 2:  # Ensure row has enough elements
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
        except Exception as query_error:
            logger.error(f"Error executing market trends query: {str(query_error)}")
            # Return default data on query error
            overall_trend = "neutral"
            bullish_percentage = 0
            bearish_percentage = 0
            neutral_percentage = 100
            total_symbols = 0
        
        cursor.close()
        db_manager.release_connection(conn)
        
        return jsonify({
            "success": True,
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
            "success": False,
            "error": f"Error fetching market trends: {str(e)}",
            "data": {
                "overall_trend": "neutral",
                "bullish_percentage": 0,
                "bearish_percentage": 0,
                "neutral_percentage": 100,
                "total_symbols": 0
            }
        }), 500 