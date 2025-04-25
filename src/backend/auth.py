# auth_routes.py
from flask import Blueprint, request, jsonify, current_app
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from db_connection import db_manager
from password_reset_routes import password_reset_bp

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Register the password reset routes with the auth blueprint
auth_bp.register_blueprint(password_reset_bp)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            print("Auth header missing in request")
            return jsonify({'message': 'Token is missing!'}), 401
        
        conn = None    
        try:
            # Extract token from Bearer format more safely
            if ' ' in auth_header:
                bearer, token = auth_header.split(' ', 1)
                if bearer.lower() != 'bearer':
                    raise ValueError("Invalid authorization format. Expected 'Bearer <token>'")
            else:
                token = auth_header  # If no space, use the whole header
            
            print(f"Attempting to decode token: {token[:20]}...")
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            print(f"Token decoded successfully, user_id: {data.get('user_id')}")
            
            conn = db_manager.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM login WHERE user_id = %s", (data['user_id'],))
            current_user = cursor.fetchone()
            cursor.close()
            
            if not current_user:
                print(f"User not found for user_id: {data.get('user_id')}")
                db_manager.release_connection(conn)
                return jsonify({'message': 'User not found!'}), 401
            
            db_manager.release_connection(conn)
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            if conn:
                db_manager.release_connection(conn)
            return jsonify({'message': 'Token has expired!', 'expired': True}), 401
        except jwt.InvalidTokenError:
            print("Invalid token format")
            if conn:
                db_manager.release_connection(conn)
            return jsonify({'message': 'Invalid token format!'}), 401
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            if conn:
                db_manager.release_connection(conn)
            return jsonify({'message': 'Token validation failed!'}), 401
            
        return f(current_user, *args, **kwargs)
        
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
    
    conn = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM login WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({'message': 'User not found'}), 404
        
        # In PostgreSQL, results are returned as tuples, so we need to access by index
        # Assuming column order: user_id, username, email, pass, role, last_login, account_status, created_at
        if not check_password_hash(user[3], password):  # user[3] is the password hash
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({'message': 'Invalid credentials'}), 401
        
        if user[6] != 'active':  # user[6] is account_status
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({'message': 'Account is not active'}), 403
        
        cursor.execute("UPDATE login SET last_login = NOW() WHERE user_id = %s", (user[0],))
        conn.commit()
        cursor.close()
        db_manager.release_connection(conn)
        
        # Increase token expiration to 7 days for better usability
        token = jwt.encode({
            'user_id': user[0],
            'email': user[2],
            'username': user[1],
            'role': user[4],
            'iat': datetime.datetime.utcnow(),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")
        
        # For compatibility with different JWT libraries, ensure token is a string
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            
        print(f"Generated token for user {user[1]}, expires in 7 days")
        
        return jsonify({
            'token': token,
            'user': {
                'user_id': user[0],
                'username': user[1],
                'email': user[2],
                'role': user[4]
            }
        })
    except Exception as e:
        print(f"Login error: {str(e)}")
        if conn:
            db_manager.release_connection(conn)
        return jsonify({'message': f'Login error: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    # Convert the tuple current_user to a dictionary for consistent response format
    # Assuming column order: user_id, username, email, pass, role, last_login, account_status, created_at
    if current_user:
        user_data = {
            'user_id': current_user[0],
            'username': current_user[1],
            'email': current_user[2],
            'role': current_user[4],
            'account_status': current_user[6],
            'last_login': current_user[5].isoformat() if current_user[5] else None,
            'created_at': current_user[7].isoformat() if current_user[7] else None
        }
        return jsonify({'user': user_data})
    else:
        return jsonify({'message': 'User not found'}), 404

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')
    
    if not username or not email or not password:
        return jsonify({'message': 'All fields are required'}), 400
    
    conn = None
    try:
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM login WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            db_manager.release_connection(conn)  # Return connection to pool
            return jsonify({'message': 'User already exists'}), 400
        
        hashed_password = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO login (username, email, pass, role, account_status, created_at) VALUES (%s, %s, %s, %s, 'active', NOW()) RETURNING user_id",
            (username, email, hashed_password, role)
        )
        conn.commit()
        user_id = cursor.fetchone()[0]  # Get the returned user_id
        cursor.close()
        db_manager.release_connection(conn)  # Return connection to pool
        
        return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201
    except Exception as e:
        print(f"Database error: {e}")
        if conn:
            db_manager.release_connection(conn)  # Return connection to pool even on error
        return jsonify({'message': f'Database error occurred: {str(e)}'}), 500