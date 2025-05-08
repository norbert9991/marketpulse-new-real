from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
from db_connection import db_manager
from auth import token_required  # Import the token_required decorator from auth.py

admin_settings_bp = Blueprint('admin_settings', __name__)

# Now using the token_required decorator from auth.py which returns current_user as a tuple
# Removing the local token_required decorator

# Get current admin profile
@admin_settings_bp.route('/api/admin/profile', methods=['GET'])
@token_required
def get_admin_profile(current_user):
    try:
        # Convert tuple to dictionary for the response
        user_data = {
            'user_id': current_user[0],
            'username': current_user[1],
            'email': current_user[2],
            'role': current_user[4],
            'last_login': current_user[5].isoformat() if current_user[5] else None,
            'account_status': current_user[6],
            'created_at': current_user[7].isoformat() if current_user[7] else None
        }
            
        return jsonify({
            'status': 'success',
            'user': user_data
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
        cursor = conn.cursor()
        
        # Check if username or email already exists (excluding current user)
        cursor.execute('SELECT * FROM login WHERE (username = %s OR email = %s) AND user_id != %s', 
                      (username, email, current_user[0]))  # user_id is at index 0
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
            cursor.execute('SELECT pass FROM login WHERE user_id = %s', (current_user[0],))  # user_id is at index 0
            user = cursor.fetchone()
            
            if not check_password_hash(user[0], current_password):  # password hash is the first column in the result
                cursor.close()
                return jsonify({'message': 'Current password is incorrect'}), 400
                
            # Update with new password
            hashed_password = generate_password_hash(new_password)
            cursor.execute('UPDATE login SET username = %s, email = %s, pass = %s WHERE user_id = %s',
                          (username, email, hashed_password, current_user[0]))  # user_id is at index 0
        else:
            # Update without changing password
            cursor.execute('UPDATE login SET username = %s, email = %s WHERE user_id = %s',
                          (username, email, current_user[0]))  # user_id is at index 0
            
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
    if current_user[4] != 'admin':  # Check if user is admin using index 4 (role)
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Get all admin users
        cursor.execute('SELECT user_id, username, email, role, account_status FROM login WHERE role = "admin"')
        admin_tuples = cursor.fetchall()
        
        # Convert tuples to dictionaries for the response
        admins = []
        for admin in admin_tuples:
            admins.append({
                'user_id': admin[0],
                'username': admin[1],
                'email': admin[2],
                'role': admin[3],
                'account_status': admin[4]
            })
        
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
    if current_user[4] != 'admin':  # Check if user is admin using index 4 (role)
        return jsonify({'message': 'Admin access required'}), 403
    
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
        cursor = conn.cursor()
        
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
    if current_user[4] != 'admin':  # Check if user is admin using index 4 (role)
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        # Prevent self-deletion
        if admin_id == current_user[0]:  # user_id is at index 0
            return jsonify({'message': 'Cannot delete your own account'}), 400
            
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Check if admin exists
        cursor.execute('SELECT * FROM login WHERE user_id = %s', (admin_id,))
        admin = cursor.fetchone()
        
        if not admin:
            cursor.close()
            return jsonify({'message': 'Admin account not found'}), 404
        
        # Check if the user is actually an admin
        if admin[4] != 'admin':  # role is at index 4
            cursor.close()
            return jsonify({'message': 'The specified user is not an admin'}), 400
            
        # Delete admin account
        cursor.execute('DELETE FROM login WHERE user_id = %s', (admin_id,))
        
        if cursor.rowcount == 0:
            conn.rollback()
            cursor.close()
            return jsonify({'message': 'Failed to delete admin, no rows affected'}), 500
        
        conn.commit()
        cursor.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Admin account deleted successfully'
        }), 200
    except Exception as e:
        print(f"Error deleting admin: {e}")
        return jsonify({'message': str(e)}), 500

# Update a specific admin user
@admin_settings_bp.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@token_required
def update_admin_user(current_user, user_id):
    if current_user[4] != 'admin':  # Check if user is admin using index 4 (role)
        return jsonify({'message': 'Admin access required'}), 403
    
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
        cursor = conn.cursor()
        
        # Check if target user exists and is an admin
        cursor.execute('SELECT * FROM login WHERE user_id = %s', (user_id,))
        target_user = cursor.fetchone()
        
        if not target_user:
            cursor.close()
            return jsonify({'message': 'User not found'}), 404
            
        # Check if username or email already exists (excluding the user being updated)
        cursor.execute('SELECT * FROM login WHERE (username = %s OR email = %s) AND user_id != %s', 
                      (username, email, user_id))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            return jsonify({'message': 'Username or email already exists'}), 400
            
        # If changing password
        if new_password:
            # Only the user themselves should provide current password for verification
            # Admin can reset other admin passwords without verification
            if user_id == current_user[0] and not current_password:  # user_id is at index 0
                cursor.close()
                return jsonify({'message': 'Current password is required to change your own password'}), 400
                
            # If changing own password, verify current password
            if user_id == current_user[0] and current_password:
                cursor.execute('SELECT pass FROM login WHERE user_id = %s', (user_id,))
                user = cursor.fetchone()
                
                if not check_password_hash(user[0], current_password):  # password hash is the first column
                    cursor.close()
                    return jsonify({'message': 'Current password is incorrect'}), 400
            
            # Update with new password
            hashed_password = generate_password_hash(new_password)
            cursor.execute('UPDATE login SET username = %s, email = %s, pass = %s WHERE user_id = %s',
                          (username, email, hashed_password, user_id))
        else:
            # Update without changing password
            cursor.execute('UPDATE login SET username = %s, email = %s WHERE user_id = %s',
                          (username, email, user_id))
            
        conn.commit()
        cursor.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Admin user updated successfully'
        }), 200
    except Exception as e:
        print(f"Error updating admin user: {e}")
        return jsonify({'message': str(e)}), 500 