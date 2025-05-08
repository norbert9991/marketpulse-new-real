# main.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from auth import auth_bp
from admin_routes import admin_bp
from dashboard_routes import dashboard_bp
from user_settings_routes import settings_bp  # Import the settings blueprint
from market_analysis_routes import market_analysis_bp  # Import the market analysis blueprint
from admin_settings_routes import admin_settings_bp  # Import the admin settings blueprint
from news_routes import news_bp  # Import the news blueprint
from db_connection import db_manager
from market_analysis import analyze_stock
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fb4f4f255fb38f23a4d7379be97c837b')

# Configure CORS to allow requests from any origin to ensure maximum compatibility
CORS(app, 
     origins=["*", "http://localhost:3000", "http://localhost:5000", "https://marketpulse-new-real-3.onrender.com", "https://marketpulse-new-real-3-web.onrender.com"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True,
     expose_headers=["Content-Type", "Authorization"])

# Additional CORS headers added to all responses
@app.after_request
def after_request(response):
    # Allow credentials
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    # Allow specific headers
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept')
    # Allow all methods
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    # Add additional debug headers to help troubleshoot
    response.headers.add('X-API-Version', '1.0')
    return response

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(settings_bp)  # Register the settings blueprint
app.register_blueprint(market_analysis_bp)  # Register the market analysis blueprint
app.register_blueprint(admin_settings_bp)  # Register the admin settings blueprint
app.register_blueprint(news_bp)  # Register the news blueprint

# Root route for testing
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "MarketPulse API is running",
        "endpoints": {
            "auth": "/api/auth",
            "admin": "/api/admin",
            "dashboard": "/api/dashboard",
            "settings": "/api/settings",
            "market_analysis": "/api/market-analysis",
            "news": "/api/news",
            "health": "/health"
        }
    })

@app.route('/api/market/analyze', methods=['POST'])
def analyze_market():
    data = request.get_json()
    symbol = data.get('symbol')
    if not symbol:
        return jsonify({"error": "Symbol is required"}), 400
    
    result = analyze_stock(symbol)
    return jsonify(result)

@app.teardown_appcontext
def close_db_connection(exception=None):
    """Ensure database connection is closed when app context tears down"""
    db_manager.close_all_connections()

# Health check endpoint for Render
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    # Use PORT from environment variables for Render compatibility
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=(os.environ.get('FLASK_ENV') == 'development'))