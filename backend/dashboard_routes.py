from flask import Blueprint, jsonify, request
from auth import token_required
from db_connection import db_manager
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

dashboard_bp = Blueprint('dashboard', __name__)
logger = logging.getLogger(__name__)

@dashboard_bp.route('/api/favorites', methods=['GET'])
@token_required
def get_favorites(current_user):
    try:
        db = db_manager.get_connection()
        cursor = db.cursor(dictionary=True)
        
        # Get user's favorite markets
        cursor.execute('''
            SELECT f.*, m.current_price, m.change_percentage, m.trend
            FROM favorites f
            LEFT JOIN market_data m ON f.symbol = m.symbol
            WHERE f.user_id = %s
        ''', (current_user['user_id'],))
        
        favorites = cursor.fetchall()
        cursor.close()
        
        logger.info(f"Fetched favorites for user {current_user['user_id']}: {favorites}")
        
        return jsonify({
            'status': 'success',
            'favorites': favorites
        }), 200
    except Exception as e:
        logger.error(f"Error fetching favorites for user {current_user['user_id']}: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@dashboard_bp.route('/api/favorites/toggle', methods=['POST'])
@token_required
def toggle_favorite(current_user):
    try:
        data = request.get_json()
        symbol = data.get('symbol')
        pair_name = data.get('pair_name')
        
        if not symbol or not pair_name:
            return jsonify({
                'status': 'error',
                'message': 'Symbol and pair name are required'
            }), 400
        
        db = db_manager.get_connection()
        cursor = db.cursor(dictionary=True)
        
        # Check if already favorited
        cursor.execute('''
            SELECT * FROM favorites 
            WHERE user_id = %s AND symbol = %s
        ''', (current_user['user_id'], symbol))
        
        existing = cursor.fetchone()
        
        if existing:
            # Remove from favorites
            cursor.execute('''
                DELETE FROM favorites 
                WHERE user_id = %s AND symbol = %s
            ''', (current_user['user_id'], symbol))
            is_favorite = False
        else:
            # Add to favorites
            cursor.execute('''
                INSERT INTO favorites (user_id, symbol, pair_name) 
                VALUES (%s, %s, %s)
            ''', (current_user['user_id'], symbol, pair_name))
            is_favorite = True
        
        db.commit()
        cursor.close()
        
        return jsonify({
            'status': 'success',
            'is_favorite': is_favorite
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@dashboard_bp.route('/api/favorites/check/<symbol>', methods=['GET'])
@token_required
def check_favorite(current_user, symbol):
    try:
        db = db_manager.get_connection()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute('''
            SELECT * FROM favorites 
            WHERE user_id = %s AND symbol = %s
        ''', (current_user['user_id'], symbol))
        
        is_favorite = cursor.fetchone() is not None
        cursor.close()
        
        return jsonify({
            'status': 'success',
            'is_favorite': is_favorite
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@dashboard_bp.route('/api/admin/favorite-symbols', methods=['GET'])
@token_required
def get_favorite_symbols(current_user):
    try:
        if current_user['role'] != 'admin':
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        db = db_manager.get_connection()
        cursor = db.cursor(dictionary=True)
        
        # Get count of favorites for each symbol
        cursor.execute('''
            SELECT f.symbol, f.pair_name, COUNT(*) as count
            FROM favorites f
            GROUP BY f.symbol, f.pair_name
            ORDER BY count DESC
            LIMIT 10
        ''')
        
        favorite_symbols = cursor.fetchall()
        cursor.close()
        
        logger.info(f"Fetched favorite symbols data: {favorite_symbols}")
        
        return jsonify({
            'status': 'success',
            'data': favorite_symbols
        }), 200
    except Exception as e:
        logger.error(f"Error fetching favorite symbols: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 