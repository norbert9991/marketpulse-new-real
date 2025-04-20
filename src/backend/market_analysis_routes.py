from flask import Blueprint, jsonify, request
from db_connection import db_manager
from market_analysis import analyze_stock, generate_synthetic_data, format_symbol_for_yahoo
import json
import logging
import concurrent.futures
import time
import random

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
        # Clean and format the symbol properly
        original_symbol = symbol
        clean_symbol = symbol.split('-X')[0] if '-X' in symbol else symbol
        yahoo_formatted_symbol = format_symbol_for_yahoo(symbol)
        
        logger.info(f"Fetching market analysis for symbol: {original_symbol}, clean_symbol: {clean_symbol}, yahoo_formatted: {yahoo_formatted_symbol}")
        
        # Try various symbol formats when querying the database
        symbols_to_try = list(set([original_symbol, clean_symbol, yahoo_formatted_symbol]))
        logger.info(f"Will try the following symbol formats: {symbols_to_try}")
        
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        market_row = None
        symbol_found = None
        
        # Try each symbol format in order
        for sym in symbols_to_try:
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
            """, (sym,))
            
            row = cursor.fetchone()
            if row:
                market_row = row
                symbol_found = sym
                logger.info(f"Found market data using symbol format: {sym}")
                break
        
        # Fetch support and resistance levels
        sr_rows = []
        prediction_rows = []
        
        if symbol_found:
            cursor.execute("""
                SELECT level_type, level_value
                FROM support_resistance
                WHERE symbol = %s
            """, (symbol_found,))
            
            sr_rows = cursor.fetchall()
            
            # Fetch price predictions
            cursor.execute("""
                SELECT prediction_date, predicted_price
                FROM price_predictions
                WHERE symbol = %s
                ORDER BY prediction_date ASC
            """, (symbol_found,))
            
            prediction_rows = cursor.fetchall()
        
        # If no market data exists yet, perform analysis with the Yahoo-formatted symbol
        if not market_row:
            cursor.close()
            db_manager.release_connection(conn)
            logger.info(f"No existing market data for {symbol}, performing new analysis with {yahoo_formatted_symbol}")
            analysis_result = analyze_stock(yahoo_formatted_symbol)
            return jsonify(analysis_result), 200
        
        # Prepare response using the original requested symbol for consistency in the UI
        response = {
            "symbol": original_symbol,
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
        # Format the symbol for Yahoo Finance
        original_symbol = symbol
        yahoo_formatted_symbol = format_symbol_for_yahoo(symbol)
        
        logger.info(f"Refreshing market analysis for symbol: {original_symbol}, yahoo_formatted: {yahoo_formatted_symbol}")
        
        # Use the Yahoo-formatted symbol for analysis
        analysis_result = analyze_stock(yahoo_formatted_symbol)
        
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
        # Format the symbol properly
        original_symbol = symbol
        clean_symbol = symbol.split('-X')[0] if '-X' in symbol else symbol
        yahoo_formatted_symbol = format_symbol_for_yahoo(symbol)
        
        # Remove =X suffix for database queries since the DB typically stores the clean version
        db_symbol = yahoo_formatted_symbol.replace('=X', '') if yahoo_formatted_symbol.endswith('=X') else yahoo_formatted_symbol
        
        logger.info(f"Fetching price history for symbol: {original_symbol}, clean_symbol: {clean_symbol}, yahoo_formatted: {yahoo_formatted_symbol}, db_symbol: {db_symbol}")
        
        # Try various symbol formats when querying the database
        symbols_to_try = list(set([original_symbol, clean_symbol, yahoo_formatted_symbol, db_symbol]))
        logger.info(f"Will try the following symbol formats: {symbols_to_try}")
        
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        rows = []
        symbol_found = None
        
        # Try each symbol format in order
        for sym in symbols_to_try:
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
            """, (sym,))
            
            result_rows = cursor.fetchall()
            if result_rows and len(result_rows) > 0:
                rows = result_rows
                symbol_found = sym
                logger.info(f"Found price history using symbol format: {sym}")
                break
        
        # If still no data, return appropriate message
        if len(rows) == 0:
            logger.warning(f"No price history data found for any format of symbol: {original_symbol}")
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({
                "message": "No historical data available",
                "symbol": original_symbol,
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
        
        # Always return the original symbol in the response for UI consistency
        return jsonify({
            "symbol": original_symbol,
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

@market_analysis_bp.route('/api/market-analysis/<symbol>/synthetic', methods=['GET'])
def get_synthetic_market_analysis(symbol):
    """Get synthetic market analysis data for any symbol"""
    try:
        logger.info(f"Generating synthetic data for symbol: {symbol}")
        
        # Generate synthetic data regardless of whether real data exists
        synthetic_data = generate_synthetic_data(symbol)
        
        return jsonify(synthetic_data), 200
    except Exception as e:
        logger.error(f"Error generating synthetic data: {str(e)}")
        return jsonify({"error": str(e)}), 500 

@market_analysis_bp.route('/api/market-analysis/batch', methods=['POST'])
def batch_market_analysis():
    """Process multiple symbols in a single request to optimize caching and reduce API calls"""
    try:
        # Get symbols from request
        data = request.get_json()
        if not data or 'symbols' not in data:
            return jsonify({"error": "No symbols provided"}), 400
            
        symbols = data.get('symbols', [])
        if not symbols or not isinstance(symbols, list):
            return jsonify({"error": "Invalid symbols format"}), 400
            
        # Limit number of symbols per batch
        max_symbols = 10
        if len(symbols) > max_symbols:
            logger.warning(f"Too many symbols requested: {len(symbols)}. Limiting to {max_symbols}")
            symbols = symbols[:max_symbols]
        
        logger.info(f"Processing batch request for {len(symbols)} symbols")
        
        # Process symbols
        results = {}
        db_loaded = set()  # Keep track of symbols loaded from DB
        
        # First try to get data from database for all symbols
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        try:
            # Create placeholders for SQL query
            placeholders = ','.join(['%s'] * len(symbols))
            cursor.execute(f"""
                SELECT 
                    md.symbol,
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
                WHERE md.symbol IN ({placeholders})
            """, symbols)
            
            market_rows = cursor.fetchall()
            
            # Process database results
            for row in market_rows:
                if len(row) < 10:
                    continue
                    
                symbol = row[0]
                db_loaded.add(symbol)
                
                # Extract support and resistance levels for this symbol
                cursor.execute("""
                    SELECT level_type, level_value
                    FROM support_resistance
                    WHERE symbol = %s
                """, (symbol,))
                
                sr_rows = cursor.fetchall()
                
                # Extract price predictions
                cursor.execute("""
                    SELECT prediction_date, predicted_price
                    FROM price_predictions
                    WHERE symbol = %s
                    ORDER BY prediction_date ASC
                """, (symbol,))
                
                prediction_rows = cursor.fetchall()
                
                # Build response
                response = {
                    "symbol": symbol,
                    "current_price": float(row[1]) if row[1] else 0.0,
                    "trend": row[2] if row[2] else "Neutral",
                    "technical_indicators": {
                        "rsi": float(row[3]) if row[3] else 0.0,
                        "macd": float(row[4]) if row[4] else 0.0,
                        "macd_signal": float(row[5]) if row[5] else 0.0,
                        "macd_hist": float(row[6]) if row[6] else 0.0,
                        "sma20": float(row[7]) if row[7] else 0.0,
                        "sma50": float(row[8]) if row[8] else 0.0,
                        "sma200": float(row[9]) if row[9] else 0.0
                    },
                    "support_resistance": {
                        "support": [],
                        "resistance": []
                    },
                    "predictions": [],
                    "prediction_dates": []
                }
                
                # Process support and resistance levels
                for sr_row in sr_rows:
                    level_type, level_value = sr_row
                    if level_type == 'support':
                        response["support_resistance"]["support"].append(float(level_value))
                    elif level_type == 'resistance':
                        response["support_resistance"]["resistance"].append(float(level_value))
                
                # Process predictions
                for pred_row in prediction_rows:
                    date, price = pred_row
                    response["prediction_dates"].append(date.strftime('%Y-%m-%d'))
                    response["predictions"].append(float(price) if price else 0.0)
                
                # Store in results
                results[symbol] = response
            
            # Close cursor and release connection
            cursor.close()
            db_manager.release_connection(conn)
            
        except Exception as db_error:
            logger.error(f"Database error in batch processing: {db_error}")
            if cursor:
                cursor.close()
            if 'conn' in locals() and conn:
                db_manager.release_connection(conn)
        
        # Process symbols not found in database using a thread pool
        symbols_to_analyze = [s for s in symbols if s not in db_loaded]
        
        if symbols_to_analyze:
            logger.info(f"Analyzing {len(symbols_to_analyze)} symbols not found in database")
            
            # Process in parallel with a maximum of 3 workers to avoid rate limits
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                # Submit all tasks
                future_to_symbol = {
                    executor.submit(analyze_with_backoff, symbol, i): symbol 
                    for i, symbol in enumerate(symbols_to_analyze)
                }
                
                # Collect results as they complete
                for future in concurrent.futures.as_completed(future_to_symbol):
                    symbol = future_to_symbol[future]
                    try:
                        data = future.result()
                        if data:
                            results[symbol] = data
                    except Exception as e:
                        logger.error(f"Error analyzing symbol {symbol}: {e}")
                        # Use synthetic data as fallback
                        results[symbol] = generate_synthetic_data(symbol)
        
        return jsonify({"results": results}), 200
        
    except Exception as e:
        logger.error(f"Error in batch market analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500

def analyze_with_backoff(symbol, index):
    """Analyze stock with exponential backoff to avoid rate limits"""
    # Add a small delay based on index to stagger requests
    delay = index * random.uniform(0.5, 1.5)
    if delay > 0:
        time.sleep(delay)
    
    try:
        return analyze_stock(symbol)
    except Exception as e:
        logger.error(f"Error analyzing {symbol}: {e}")
        return generate_synthetic_data(symbol) 