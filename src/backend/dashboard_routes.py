from flask import Blueprint, jsonify, request
from auth import token_required
from db_connection import db_manager
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api')
logger = logging.getLogger(__name__)

@dashboard_bp.route('/favorites', methods=['GET'])
@token_required
def get_favorites(current_user):
    """Get all favorites for the current user"""
    conn = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Extract user_id from current_user tuple
        # current_user[0] is the user_id based on the schema
        user_id = current_user[0]
        
        cursor.execute("""
            SELECT f.id, f.symbol, f.pair_name, f.created_at
            FROM favorites f
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
        """, (user_id,))
        
        # Fetch all results
        favorites_rows = cursor.fetchall()
        
        # Convert tuple rows to dictionaries
        favorites = []
        for row in favorites_rows:
            favorites.append({
                'id': row[0],
                'symbol': row[1],
                'pair_name': row[2],
                'created_at': row[3].isoformat() if row[3] else None
            })
        
        cursor.close()
        db_manager.release_connection(conn)
        
        return jsonify({'favorites': favorites})
    except Exception as e:
        logger.error(f"Error fetching favorites for user {current_user[0]}: {e}")
        if conn:
            db_manager.release_connection(conn)
        return jsonify({'message': 'Failed to retrieve favorites', 'error': str(e)}), 500

@dashboard_bp.route('/favorites/toggle', methods=['POST'])
@token_required
def toggle_favorite(current_user):
    conn = None
    try:
        data = request.get_json()
        symbol = data.get('symbol')
        pair_name = data.get('pair_name')
        
        if not symbol or not pair_name:
            return jsonify({
                'message': 'Symbol and pair name are required'
            }), 400
        
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Extract user_id from current_user tuple
        user_id = current_user[0]
        
        # Check if already favorited
        cursor.execute("""
            SELECT * FROM favorites 
            WHERE user_id = %s AND symbol = %s
        """, (user_id, symbol))
        
        existing = cursor.fetchone()
        
        if existing:
            # Remove from favorites
            cursor.execute("""
                DELETE FROM favorites 
                WHERE user_id = %s AND symbol = %s
            """, (user_id, symbol))
            is_favorite = False
            message = f"Removed {pair_name} from favorites"
        else:
            # Add to favorites
            cursor.execute("""
                INSERT INTO favorites (user_id, symbol, pair_name) 
                VALUES (%s, %s, %s)
            """, (user_id, symbol, pair_name))
            is_favorite = True
            message = f"Added {pair_name} to favorites"
        
        conn.commit()
        cursor.close()
        db_manager.release_connection(conn)
        
        return jsonify({
            'isFavorite': is_favorite,
            'message': message
        }), 200
    except Exception as e:
        logger.error(f"Error toggling favorite for user {current_user[0]}: {e}")
        if conn:
            db_manager.release_connection(conn)
        return jsonify({
            'message': f'Error toggling favorite: {str(e)}'
        }), 500

@dashboard_bp.route('/favorites/check/<symbol>', methods=['GET'])
@token_required
def check_favorite(current_user, symbol):
    conn = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Extract user_id from current_user tuple
        user_id = current_user[0]
        
        cursor.execute("""
            SELECT * FROM favorites 
            WHERE user_id = %s AND symbol = %s
        """, (user_id, symbol))
        
        is_favorite = cursor.fetchone() is not None
        cursor.close()
        db_manager.release_connection(conn)
        
        return jsonify({
            'isFavorite': is_favorite
        }), 200
    except Exception as e:
        logger.error(f"Error checking favorite for user {current_user[0]}: {e}")
        if conn:
            db_manager.release_connection(conn)
        return jsonify({
            'message': f'Error checking favorite: {str(e)}'
        }), 500

@dashboard_bp.route('/admin/favorite-symbols', methods=['GET'])
@token_required
def get_favorite_symbols(current_user):
    conn = None
    try:
        # Check if user is admin
        if current_user[4] != 'admin':  # current_user[4] is the role
            return jsonify({
                'message': 'Unauthorized access'
            }), 403

        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Get count of favorites for each symbol
        cursor.execute("""
            SELECT f.symbol, f.pair_name, COUNT(*) as count
            FROM favorites f
            GROUP BY f.symbol, f.pair_name
            ORDER BY count DESC
            LIMIT 10
        """)
        
        favorite_symbols_rows = cursor.fetchall()
        
        # Convert tuple rows to dictionaries
        favorite_symbols = []
        for row in favorite_symbols_rows:
            favorite_symbols.append({
                'symbol': row[0],
                'pair_name': row[1],
                'count': row[2]
            })
            
        cursor.close()
        db_manager.release_connection(conn)
        
        logger.info(f"Fetched favorite symbols data: {favorite_symbols}")
        
        return jsonify({
            'data': favorite_symbols
        }), 200
    except Exception as e:
        logger.error(f"Error fetching favorite symbols: {e}")
        if conn:
            db_manager.release_connection(conn)
        return jsonify({
            'message': f'Error fetching favorite symbols: {str(e)}'
        }), 500 