from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
from db_connection import db_manager

admin_settings_bp = Blueprint('admin_settings', __name__)

# Token verification decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'message': 'Token is missing!'}), 401
            
        try:
            # Extract token from Bearer format
            token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            conn = db_manager.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM login WHERE user_id = %s", (data['user_id'],))
            current_user = cursor.fetchone()
            cursor.close()
            
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
                
            # Check if user is an admin
            if current_user['role'] != 'admin':
                return jsonify({'message': 'Unauthorized access'}), 403
                
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
        
    return decorated

# Get current admin profile
@admin_settings_bp.route('/api/admin/profile', methods=['GET'])
@token_required
def get_admin_profile(current_user):
    try:
        # Remove password from response
        if 'pass' in current_user:
            del current_user['pass']
            
        return jsonify({
            'status': 'success',
            'user': current_user
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Update admin profile
@admin_settings_bp.route('/api/admin/update-profile', methods=['PUT'])
@token_required
def update_admin_profile(current_user):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
            
        username = data.get('username')
        email = data.get('email')
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not username or not email:
            return jsonify({'message': 'Username and email are required'}), 400
            
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if username or email already exists (excluding current user)
        cursor.execute('SELECT * FROM login WHERE (username = %s OR email = %s) AND user_id != %s', 
                      (username, email, current_user['user_id']))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            return jsonify({'message': 'Username or email already exists'}), 400
            
        # If changing password, verify current password
        if new_password:
            if not current_password:
                cursor.close()
                return jsonify({'message': 'Current password is required to change password'}), 400
                
            # Verify current password
            cursor.execute('SELECT pass FROM login WHERE user_id = %s', (current_user['user_id'],))
            user = cursor.fetchone()
            
            if not check_password_hash(user['pass'], current_password):
                cursor.close()
                return jsonify({'message': 'Current password is incorrect'}), 400
                
            # Update with new password
            hashed_password = generate_password_hash(new_password)
            cursor.execute('UPDATE login SET username = %s, email = %s, pass = %s WHERE user_id = %s',
                          (username, email, hashed_password, current_user['user_id']))
        else:
            # Update without changing password
            cursor.execute('UPDATE login SET username = %s, email = %s WHERE user_id = %s',
                          (username, email, current_user['user_id']))
            
        conn.commit()
        cursor.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Profile updated successfully'
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Get all admin accounts
@admin_settings_bp.route('/api/admin/admins', methods=['GET'])
@token_required
def get_all_admins(current_user):
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all admin users
        cursor.execute('SELECT user_id, username, email, role, account_status FROM login WHERE role = "admin"')
        admins = cursor.fetchall()
        
        cursor.close()
        
        return jsonify({
            'status': 'success',
            'admins': admins
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Add new admin account
@admin_settings_bp.route('/api/admin/add-admin', methods=['POST'])
@token_required
def add_admin(current_user):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
            
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'message': 'Username, email and password are required'}), 400
            
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if username or email already exists
        cursor.execute('SELECT * FROM login WHERE username = %s OR email = %s', (username, email))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            return jsonify({'message': 'Username or email already exists'}), 400
            
        # Create new admin account
        hashed_password = generate_password_hash(password)
        cursor.execute(
            'INSERT INTO login (username, email, pass, role, account_status, created_at) VALUES (%s, %s, %s, %s, %s, NOW())',
            (username, email, hashed_password, 'admin', 'active')
        )
        
        conn.commit()
        cursor.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Admin account created successfully'
        }), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Delete admin account
@admin_settings_bp.route('/api/admin/delete-admin/<int:admin_id>', methods=['DELETE'])
@token_required
def delete_admin(current_user, admin_id):
    try:
        # Prevent self-deletion
        if admin_id == current_user['user_id']:
            return jsonify({'message': 'Cannot delete your own account'}), 400
            
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if admin exists
        cursor.execute('SELECT * FROM login WHERE user_id = %s AND role = "admin"', (admin_id,))
        admin = cursor.fetchone()
        
        if not admin:
            cursor.close()
            return jsonify({'message': 'Admin account not found'}), 404
            
        # Delete admin account
        cursor.execute('DELETE FROM login WHERE user_id = %s', (admin_id,))
        
        conn.commit()
        cursor.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Admin account deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500 