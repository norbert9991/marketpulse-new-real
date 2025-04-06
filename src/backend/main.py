# main.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from auth import auth_bp
from admin_routes import admin_bp
from dashboard_routes import dashboard_bp
from user_settings_routes import settings_bp  # Import the settings blueprint
from market_analysis_routes import market_analysis_bp  # Import the market analysis blueprint
from admin_settings_routes import admin_settings_bp  # Import the admin settings blueprint
from db_connection import db_manager
from market_analysis import analyze_stock

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Configure CORS
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(settings_bp)  # Register the settings blueprint
app.register_blueprint(market_analysis_bp)  # Register the market analysis blueprint
app.register_blueprint(admin_settings_bp)  # Register the admin settings blueprint

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
    app.run(debug=True, port=5000)