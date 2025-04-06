# user_settings_routes.py
from flask import Blueprint, request, jsonify, current_app
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from db_connection import db_manager

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

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
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
        
    return decorated

@settings_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get the current user's profile information"""
    try:
        # Remove sensitive information
        if 'pass' in current_user:
            del current_user['pass']
        
        return jsonify({
            'status': 'success',
            'data': current_user
        })
    except Exception as e:
        print(f"Error fetching profile: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch profile data'
        }), 500

@settings_bp.route('/update-email', methods=['PUT'])
@token_required
def update_email(current_user):
    """Update the user's email address"""
    data = request.get_json()
    new_email = data.get('email')
    password = data.get('password')
    
    if not new_email or not password:
        return jsonify({
            'status': 'error',
            'message': 'Email and password are required'
        }), 400
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify current password
        cursor.execute("SELECT pass FROM login WHERE user_id = %s", (current_user['user_id'],))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['pass'], password):
            return jsonify({
                'status': 'error',
                'message': 'Current password is incorrect'
            }), 401
        
        # Check if email is already in use
        cursor.execute("SELECT user_id FROM login WHERE email = %s AND user_id != %s", 
                      (new_email, current_user['user_id']))
        existing_user = cursor.fetchone()
        
        if existing_user:
            return jsonify({
                'status': 'error',
                'message': 'Email is already in use'
            }), 400
        
        # Update email
        cursor.execute("UPDATE login SET email = %s WHERE user_id = %s", 
                      (new_email, current_user['user_id']))
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Email updated successfully'
        })
    except Exception as e:
        print(f"Error updating email: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update email'
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close()

@settings_bp.route('/update-password', methods=['PUT'])
@token_required
def update_password(current_user):
    """Update the user's password"""
    data = request.get_json()
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    
    if not current_password or not new_password:
        return jsonify({
            'status': 'error',
            'message': 'Current password and new password are required'
        }), 400
    
    if len(new_password) < 8:
        return jsonify({
            'status': 'error',
            'message': 'New password must be at least 8 characters long'
        }), 400
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify current password
        cursor.execute("SELECT pass FROM login WHERE user_id = %s", (current_user['user_id'],))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['pass'], current_password):
            return jsonify({
                'status': 'error',
                'message': 'Current password is incorrect'
            }), 401
        
        # Hash and update new password
        hashed_password = generate_password_hash(new_password)
        cursor.execute("UPDATE login SET pass = %s WHERE user_id = %s", 
                      (hashed_password, current_user['user_id']))
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Password updated successfully'
        })
    except Exception as e:
        print(f"Error updating password: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to update password'
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close()

@settings_bp.route('/delete-account', methods=['DELETE'])
@token_required
def delete_account(current_user):
    """Delete the user's account"""
    data = request.get_json()
    password = data.get('password')
    
    if not password:
        return jsonify({
            'status': 'error',
            'message': 'Password is required to confirm account deletion'
        }), 400
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify password
        cursor.execute("SELECT pass FROM login WHERE user_id = %s", (current_user['user_id'],))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['pass'], password):
            return jsonify({
                'status': 'error',
                'message': 'Password is incorrect'
            }), 401
        
        # Begin transaction to delete all user data
        conn.start_transaction()
        
        # Delete user's portfolio
        cursor.execute("DELETE FROM portfolio WHERE user_id = %s", (current_user['user_id'],))
        
        # Delete user's balance requests
        cursor.execute("DELETE FROM balance_requests WHERE user_id = %s", (current_user['user_id'],))
        
        # Delete user's trades
        cursor.execute("DELETE FROM trades WHERE user_id = %s", (current_user['user_id'],))
        
        # Finally, delete the user account
        cursor.execute("DELETE FROM login WHERE user_id = %s", (current_user['user_id'],))
        
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Account deleted successfully'
        })
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        print(f"Error deleting account: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete account'
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close() 