# auth_routes.py
from flask import Blueprint, request, jsonify, current_app
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from db_connection import db_manager
import logging
import traceback

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            logger.warning("Auth header missing in request")
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
            
            logger.debug(f"Attempting to decode token: {token[:20]}...")
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            logger.debug(f"Token decoded successfully, user_id: {data.get('user_id')}")
            
            conn = db_manager.get_connection()
            cursor = conn.cursor()
            logger.debug(f"Executing query to find user with ID: {data['user_id']}")
            cursor.execute("SELECT * FROM login WHERE user_id = %s", (data['user_id'],))
            current_user = cursor.fetchone()
            cursor.close()
            
            if not current_user:
                logger.warning(f"User not found for user_id: {data.get('user_id')}")
                db_manager.release_connection(conn)
                return jsonify({'message': 'User not found!'}), 401
            
            logger.debug(f"User found: ID={current_user[0]}, Username={current_user[1]}")
            db_manager.release_connection(conn)
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            if conn:
                db_manager.release_connection(conn)
            return jsonify({'message': 'Token has expired!', 'expired': True}), 401
        except jwt.InvalidTokenError:
            logger.warning("Invalid token format")
            if conn:
                db_manager.release_connection(conn)
            return jsonify({'message': 'Invalid token format!'}), 401
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            logger.error(traceback.format_exc())
            if conn:
                db_manager.release_connection(conn)
            return jsonify({'message': 'Token validation failed!'}), 401
            
        return f(current_user, *args, **kwargs)
        
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    logger.debug(f"Login attempt with data: {data}")
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        logger.warning("Login attempt missing email or password")
        return jsonify({'message': 'Email and password are required'}), 400
    
    conn = None
    try:
        logger.debug(f"Attempting to authenticate user with email: {email}")
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM login WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            logger.warning(f"User with email {email} not found")
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({'message': 'User not found'}), 404
        
        logger.debug(f"User found: ID={user[0]}, Username={user[1]}")
        
        # In PostgreSQL, results are returned as tuples, so we need to access by index
        # Assuming column order: user_id, username, email, pass, role, last_login, account_status, created_at
        if not check_password_hash(user[3], password):  # user[3] is the password hash
            logger.warning(f"Invalid password for user: {user[1]}")
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({'message': 'Invalid credentials'}), 401
        
        logger.debug(f"Password matched for user: {user[1]}")
        
        if user[6] != 'active':  # user[6] is account_status
            logger.warning(f"Account not active for user: {user[1]}, status: {user[6]}")
            cursor.close()
            db_manager.release_connection(conn)
            return jsonify({'message': 'Account is not active'}), 403
        
        logger.debug(f"Updating last_login for user: {user[1]}")
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
            
        logger.info(f"Generated token for user {user[1]}, expires in 7 days")
        
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
        logger.error(f"Login error: {str(e)}")
        logger.error(traceback.format_exc())
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
        logger.debug(f"Retrieved current user data: {user_data}")
        return jsonify({'user': user_data})
    else:
        logger.warning("Current user not found in /me endpoint")
        return jsonify({'message': 'User not found'}), 404

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    logger.debug(f"Register attempt with data: {data}")
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')
    
    if not username or not email or not password:
        logger.warning("Registration missing required fields")
        return jsonify({'message': 'All fields are required'}), 400
    
    conn = None
    try:
        logger.debug(f"Checking if user with email {email} already exists")
        conn = db_manager.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM login WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            logger.warning(f"User with email {email} already exists")
            cursor.close()
            db_manager.release_connection(conn)  # Return connection to pool
            return jsonify({'message': 'User already exists'}), 400
        
        logger.debug(f"Creating new user with username: {username}, email: {email}")
        hashed_password = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO login (username, email, pass, role, account_status, created_at) VALUES (%s, %s, %s, %s, 'active', NOW()) RETURNING user_id",
            (username, email, hashed_password, role)
        )
        conn.commit()
        user_id = cursor.fetchone()[0]  # Get the returned user_id
        logger.info(f"User registered successfully: ID={user_id}, Username={username}")
        cursor.close()
        db_manager.release_connection(conn)  # Return connection to pool
        
        return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        logger.error(traceback.format_exc())
        if conn:
            db_manager.release_connection(conn)  # Return connection to pool even on error
        return jsonify({'message': f'Database error occurred: {str(e)}'}), 500