# admin_routes.py
from flask import Blueprint, request, jsonify
from db_connection import db_manager
from auth import token_required
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    if current_user[4] != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, username, email, role, last_login, account_status, created_at FROM login")
        users = cursor.fetchall()
        
        # Convert tuple results to dictionaries for JSON response
        formatted_users = []
        for user in users:
            formatted_users.append({
                'user_id': user[0],
                'username': user[1],
                'email': user[2],
                'role': user[3],
                'last_login': user[4].isoformat() if user[4] else None,
                'account_status': user[5],
                'created_at': user[6].isoformat() if user[6] else None
            })
            
        cursor.close()
        return jsonify({'users': formatted_users})
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({'message': 'Database error occurred'}), 500

@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@token_required
def update_user_status(current_user, user_id):
    if current_user[4] != 'admin':
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
    if current_user[4] != 'admin':
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
        
        # Generate chart data for each month without relying on complex SQL functions
        chart_data = []
        current_month = start_date.replace(day=1)  # Start from first day of month
        
        while current_month <= end_date:
            # Create month start and end dates
            month_start = current_month.replace(day=1)
            if current_month.month == 12:
                next_month = current_month.replace(year=current_month.year + 1, month=1)
            else:
                next_month = current_month.replace(month=current_month.month + 1)
            month_end = next_month - timedelta(days=1)
            
            # Simple query to count users created in this month period
            try:
                cursor.execute(
                    "SELECT COUNT(*) FROM login WHERE created_at >= %s AND created_at <= %s",
                    (month_start, month_end)
                )
                result = cursor.fetchone()
                user_count = result[0] if result else 0
            except Exception as query_error:
                print(f"Error executing user count query for {month_start} to {month_end}: {query_error}")
                user_count = 0
            
            # Format month name
            month_name = current_month.strftime('%b')  # Short month name
            year = current_month.strftime('%Y')
            label = month_name if current_month.month != 1 else f"Jan '{year[2:]}"
            
            # Add to chart data
            chart_data.append({
                'month': label,
                'users': user_count
            })
            
            # Move to next month
            if current_month.month == 12:
                current_month = current_month.replace(year=current_month.year + 1, month=1)
            else:
                current_month = current_month.replace(month=current_month.month + 1)
        
        cursor.close()
        db_manager.release_connection(conn)
        
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
        if 'conn' in locals() and conn:
            db_manager.release_connection(conn)
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []  # Return empty data to prevent frontend errors
        }), 500