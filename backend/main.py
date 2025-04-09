# main.py
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from auth import auth_bp
from admin_routes import admin_bp
from dashboard_routes import dashboard_bp
from user_settings_routes import settings_bp  # Import the settings blueprint
from market_analysis_routes import market_analysis_bp  # Import the market analysis blueprint
from admin_settings_routes import admin_settings_bp  # Import the admin settings blueprint
from db_connection import db_manager
from market_analysis import analyze_stock
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fb4f4f255fb38f23a4d7379be97c837b')

# Configure CORS - get frontend URL from environment or use default in development
frontend_url = os.getenv('FRONTEND_URL', 'https://marketpulse-new-static.onrender.com')
CORS(app, resources={r"/api/*": {"origins": [frontend_url, "http://localhost:3000"]}}, supports_credentials=True)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(settings_bp)  # Register the settings blueprint
app.register_blueprint(market_analysis_bp)  # Register the market analysis blueprint
app.register_blueprint(admin_settings_bp)  # Register the admin settings blueprint

@app.route('/')
def index():
    """Root route handler - either serve API info or redirect to frontend"""
    # Option 1: Serve API information
    return jsonify({
        "api": "MarketPulse API",
        "version": "1.0.0",
        "endpoints": [
            "/api/auth/login",
            "/api/auth/register",
            "/api/market/analyze",
            # Add other endpoints here
        ]
    })
    
    # Option 2: Redirect to frontend
    # return redirect(f"https://{frontend_url}")

@app.route('/health')
def health_check():
    """Health check endpoint for monitoring services"""
    return jsonify({"status": "healthy"}), 200

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
    db_manager.disconnect()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', debug=False, port=port)
