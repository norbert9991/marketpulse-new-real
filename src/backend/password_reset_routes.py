from flask import Blueprint, request, jsonify
import secrets
import datetime
from werkzeug.security import generate_password_hash
from .database import db_manager
from .email_service import send_email, get_password_reset_template

password_reset_bp = Blueprint('password_reset', __name__)

# Database table for password reset tokens (add this to your database schema)
"""
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES login(user_id)
);
"""

@password_reset_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Request a password reset token"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({
            'status': 'error',
            'message': 'Email is required'
        }), 400
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Check if the email exists
        cursor.execute("SELECT user_id, username FROM login WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            # Don't reveal if the email exists or not for security reasons
            return jsonify({
                'status': 'success',
                'message': 'If your email is registered, you will receive password reset instructions'
            }), 200
        
        # Generate a unique token
        token = secrets.token_urlsafe(64)
        
        # Token expiration time (24 hours from now)
        expiration = datetime.datetime.now() + datetime.timedelta(hours=24)
        
        # Store token in database
        # First, invalidate any existing tokens for this user
        cursor.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = %s AND used = FALSE",
            (user[0],)
        )
        
        # Insert new token
        cursor.execute(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user[0], token, expiration)
        )
        
        conn.commit()
        
        # Create reset URL
        reset_url = f"{request.host_url.rstrip('/')}/#/reset-password?token={token}"
        
        # Prepare email content
        email_subject = "MarketPulse Password Reset"
        
        # Use HTML template for email
        email_body = get_password_reset_template(user[1], reset_url)
        
        # Send email
        send_email(email, email_subject, email_body, is_html=True)
        
        return jsonify({
            'status': 'success',
            'message': 'If your email is registered, you will receive password reset instructions'
        }), 200
        
    except Exception as e:
        print(f"Error in forgot password: {e}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred while processing your request'
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close()

@password_reset_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Reset password using a token"""
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('newPassword')
    
    if not token or not new_password:
        return jsonify({
            'status': 'error',
            'message': 'Token and new password are required'
        }), 400
    
    if len(new_password) < 8:
        return jsonify({
            'status': 'error',
            'message': 'New password must be at least 8 characters long'
        }), 400
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        
        # Find the token
        current_time = datetime.datetime.now()
        cursor.execute(
            """
            SELECT user_id 
            FROM password_reset_tokens 
            WHERE token = %s 
              AND expires_at > %s 
              AND used = FALSE
            """, 
            (token, current_time)
        )
        
        result = cursor.fetchone()
        
        if not result:
            return jsonify({
                'status': 'error',
                'message': 'Invalid or expired token'
            }), 400
        
        user_id = result[0]
        
        # Mark token as used
        cursor.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE token = %s",
            (token,)
        )
        
        # Update password
        hashed_password = generate_password_hash(new_password)
        cursor.execute(
            "UPDATE login SET pass = %s WHERE user_id = %s",
            (hashed_password, user_id)
        )
        
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Password has been reset successfully'
        }), 200
        
    except Exception as e:
        print(f"Error in reset password: {e}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred while resetting your password'
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close() 