# user_settings_routes.py
from flask import Blueprint, request, jsonify, current_app
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from db_connection import db_manager
from auth import token_required

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get the current user's profile information"""
    try:
        # Convert current_user tuple to dictionary
        user_data = {
            'user_id': current_user[0],
            'username': current_user[1],
            'email': current_user[2],
            'role': current_user[4],
            'account_status': current_user[6],
            'last_login': current_user[5].isoformat() if current_user[5] else None,
            'created_at': current_user[7].isoformat() if current_user[7] else None
        }
        
        return jsonify({
            'status': 'success',
            'data': user_data
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
    print(f"Received email update request: {data}")  # Debug log
    
    new_email = data.get('email')
    password = data.get('password')
    
    if not new_email or not password:
        print(f"Missing required fields: email={bool(new_email)}, password={bool(password)}")
        return jsonify({
            'status': 'error',
            'message': 'Email and password are required'
        }), 400
    
    conn = None
    cursor = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Get user_id from the tuple
        user_id = current_user[0]
        
        # Verify current password
        print(f"Verifying password for user_id: {user_id}")
        cursor.execute("SELECT pass FROM login WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            print(f"User not found with ID: {user_id}")
            return jsonify({
                'status': 'error', 
                'message': 'User not found'
            }), 404
            
        print(f"Stored password hash: {user[0][:20]}...") # Access first element of tuple
        
        if not check_password_hash(user[0], password): # Access first element of tuple
            print(f"Password verification failed for user: {user_id}")
            return jsonify({
                'status': 'error',
                'message': 'Current password is incorrect'
            }), 401
        
        # Password verified, check if email is already in use
        print(f"Checking if email {new_email} is already in use")
        cursor.execute("SELECT user_id FROM login WHERE email = %s AND user_id != %s", 
                      (new_email, user_id))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"Email {new_email} is already in use by user_id: {existing_user[0]}")
            return jsonify({
                'status': 'error',
                'message': 'Email is already in use'
            }), 400
        
        # Update email
        print(f"Updating email to {new_email} for user_id: {user_id}")
        cursor.execute("UPDATE login SET email = %s WHERE user_id = %s", 
                      (new_email, user_id))
        conn.commit()
        print(f"Email update successful")
        
        return jsonify({
            'status': 'success',
            'message': 'Email updated successfully'
        })
    except Exception as e:
        print(f"Error updating email: {e}")
        if conn:
            try:
                conn.rollback()
            except:
                pass
        return jsonify({
            'status': 'error',
            'message': 'Failed to update email'
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            db_manager.release_connection(conn)

@settings_bp.route('/update-password', methods=['PUT'])
@token_required
def update_password(current_user):
    """Update the user's password"""
    data = request.get_json()
    print(f"Received password update request: {data}")  # Debug log
    
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
    
    conn = None
    cursor = None
    try:
        user_id = current_user[0]  # Get user_id from tuple
        
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Verify current password
        cursor.execute("SELECT pass FROM login WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user[0], current_password):
            return jsonify({
                'status': 'error',
                'message': 'Current password is incorrect'
            }), 401
        
        # Hash and update new password
        hashed_password = generate_password_hash(new_password)
        cursor.execute("UPDATE login SET pass = %s WHERE user_id = %s", 
                      (hashed_password, user_id))
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Password updated successfully'
        })
    except Exception as e:
        print(f"Error updating password: {e}")
        if conn:
            try:
                conn.rollback()
            except:
                pass
        return jsonify({
            'status': 'error',
            'message': 'Failed to update password'
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            db_manager.release_connection(conn)

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
    
    conn = None
    cursor = None
    try:
        user_id = current_user[0]  # Get user_id from tuple
        
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Verify password
        cursor.execute("SELECT pass FROM login WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user[0], password):
            return jsonify({
                'status': 'error',
                'message': 'Password is incorrect'
            }), 401
        
        # Begin transaction to delete all user data
        conn.start_transaction()
        
        # Delete user's portfolio
        cursor.execute("DELETE FROM portfolio WHERE user_id = %s", (user_id,))
        
        # Delete user's balance requests
        cursor.execute("DELETE FROM balance_requests WHERE user_id = %s", (user_id,))
        
        # Delete user's trades
        cursor.execute("DELETE FROM trades WHERE user_id = %s", (user_id,))
        
        # Finally, delete the user account
        cursor.execute("DELETE FROM login WHERE user_id = %s", (user_id,))
        
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Account deleted successfully'
        })
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except:
                pass
        print(f"Error deleting account: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete account'
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            db_manager.release_connection(conn) 