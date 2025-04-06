# auth_routes.py
from flask import Blueprint, request, jsonify, current_app
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from db_connection import db_manager

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

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

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM login WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            return jsonify({'message': 'User not found'}), 404
        
        if not check_password_hash(user['pass'], password):
            cursor.close()
            return jsonify({'message': 'Invalid credentials'}), 401
        
        if user['account_status'] != 'active':
            cursor.close()
            return jsonify({'message': 'Account is not active'}), 403
        
        cursor.execute("UPDATE login SET last_login = NOW() WHERE user_id = %s", (user['user_id'],))
        conn.commit()
        cursor.close()
        
        token = jwt.encode({
            'user_id': user['user_id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, current_app.config['SECRET_KEY'])
        
        return jsonify({
            'token': token,
            'user': {
                'user_id': user['user_id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        })
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({'message': 'Database error occurred'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({'user': current_user})

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')
    
    if not username or not email or not password:
        return jsonify({'message': 'All fields are required'}), 400
    
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM login WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            return jsonify({'message': 'User already exists'}), 400
        
        hashed_password = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO login (username, email, pass, role, account_status, created_at) VALUES (%s, %s, %s, %s, 'active', NOW())",
            (username, email, hashed_password, role)
        )
        conn.commit()
        user_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({'message': 'Database error occurred'}), 500