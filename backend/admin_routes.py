# admin_routes.py
from flask import Blueprint, request, jsonify
from db_connection import db_manager
from auth import token_required
from datetime import datetime, timedelta
from db_utils import dict_fetchall, dict_fetchone

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    if current_user['role'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, username, email, role, last_login, account_status, created_at FROM login")
        users = dict_fetchall(cursor)
        cursor.close()
        return jsonify({'users': users})
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({'message': 'Database error occurred'}), 500

@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@token_required
def update_user_status(current_user, user_id):
    if current_user['role'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['active', 'suspended']:
        return jsonify({'message': 'Invalid status'}), 400
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE login SET account_status = %s WHERE user_id = %s",
            (new_status, user_id)
        )
        conn.commit()
        cursor.close()
        return jsonify({'message': 'User status updated successfully'})
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({'message': 'Database error occurred'}), 500

@admin_bp.route('/user-growth', methods=['GET'])
@token_required
def get_user_growth(current_user):
    if current_user['role'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        # Get optional query parameters
        months = request.args.get('months', default=6, type=int)
        
        # Connect to database
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30*months)  # Approximate months
        
        # Query to get user count by month - updated for PostgreSQL
        query = """
            SELECT 
                to_char(created_at, 'YYYY-MM') AS month,
                COUNT(*) AS user_count
            FROM login
            WHERE created_at BETWEEN %s AND %s
            GROUP BY to_char(created_at, 'YYYY-MM')
            ORDER BY month
        """
        
        cursor.execute(query, (start_date, end_date))
        results = dict_fetchall(cursor)
        
        # Format data for chart and fill in missing months
        chart_data = []
        current_month = start_date.replace(day=1)  # Start from first day of month
        
        while current_month <= end_date:
            month_str = current_month.strftime('%Y-%m')
            month_name = current_month.strftime('%b')  # Short month name
            year = current_month.strftime('%Y')
            
            found = next((item for item in results if item['month'] == month_str), None)
            
            # Format label differently for January to show year
            label = month_name if current_month.month != 1 else f"Jan '{year[2:]}"
            
            chart_data.append({
                'month': label,
                'users': int(found['user_count']) if found else 0  # Convert Decimal to int for JSON serialization
            })
            
            # Move to next month
            if current_month.month == 12:
                current_month = current_month.replace(year=current_month.year + 1, month=1)
            else:
                current_month = current_month.replace(month=current_month.month + 1)
        
        cursor.close()
        return jsonify({
            'success': True,
            'data': chart_data,
            'meta': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'months': months
            }
        })
        
    except Exception as e:
        print(f"Error in user growth endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/favorite-symbols', methods=['GET'])
@token_required
def get_favorite_symbols(current_user):
    if current_user['role'] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Get all favorite symbols with user information
        query = """
            SELECT 
                f.favorite_id,
                f.user_id,
                l.username,
                f.symbol,
                f.pair_name,
                f.created_at
            FROM favorites f
            JOIN login l ON f.user_id = l.user_id
            ORDER BY f.created_at DESC
        """
        
        cursor.execute(query)
        favorites = dict_fetchall(cursor)
        cursor.close()
        
        return jsonify({
            'success': True,
            'favorites': favorites
        })
        
    except Exception as e:
        print(f"Error fetching favorite symbols: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch favorite symbols',
            'error': str(e)
        }), 500