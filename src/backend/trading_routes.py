from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
import decimal
import json
from database import get_db
from auth import jwt_required

# Create blueprint for trading routes
trading_bp = Blueprint('trading', __name__)

# Helper function to convert decimal to float for JSON serialization
def decimal_to_float(obj):
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

# Helper function to format order data
def format_order(order):
    return {
        'id': order['order_id'],
        'symbol': order['symbol'],
        'type': order['order_type'],
        'side': order['side'],
        'price': decimal_to_float(order['price']) if order['price'] else None,
        'stopPrice': decimal_to_float(order['stop_price']) if order['stop_price'] else None,
        'limitPrice': decimal_to_float(order['limit_price']) if order['limit_price'] else None,
        'amount': decimal_to_float(order['amount']),
        'total': decimal_to_float(order['total']),
        'leverage': order['leverage'],
        'status': order['status'],
        'date': order['created_at'].isoformat(),
        'filledPrice': decimal_to_float(order['filled_price']) if order['filled_price'] else None,
        'filledAmount': decimal_to_float(order['filled_amount']) if order['filled_amount'] else None,
        'filledTime': order['filled_time'].isoformat() if order['filled_time'] else None,
        'cancelTime': order['cancel_time'].isoformat() if order['cancel_time'] else None
    }

# Helper function to format position data
def format_position(position):
    return {
        'id': position['position_id'],
        'symbol': position['symbol'],
        'side': position['side'],
        'entryPrice': decimal_to_float(position['entry_price']),
        'currentPrice': decimal_to_float(position['current_price']),
        'amount': decimal_to_float(position['amount']),
        'leverage': position['leverage'],
        'takeProfit': decimal_to_float(position['take_profit']) if position['take_profit'] else None,
        'stopLoss': decimal_to_float(position['stop_loss']) if position['stop_loss'] else None,
        'marginUsed': decimal_to_float(position['margin_used']),
        'unrealizedPnl': decimal_to_float(position['unrealized_pnl']),
        'realizedPnl': decimal_to_float(position['realized_pnl']),
        'status': position['status'],
        'openTime': position['open_time'].isoformat(),
        'closeTime': position['close_time'].isoformat() if position['close_time'] else None
    }

# Helper function to format trade history
def format_trade(trade):
    return {
        'id': trade['trade_id'],
        'symbol': trade['symbol'],
        'side': trade['side'],
        'entryPrice': decimal_to_float(trade['entry_price']),
        'exitPrice': decimal_to_float(trade['exit_price']) if trade['exit_price'] else None,
        'amount': decimal_to_float(trade['amount']),
        'leverage': trade['leverage'],
        'pnl': decimal_to_float(trade['pnl']) if trade['pnl'] else None,
        'fee': decimal_to_float(trade['fee']),
        'openTime': trade['open_time'].isoformat(),
        'closeTime': trade['close_time'].isoformat() if trade['close_time'] else None,
        'durationSeconds': trade['duration_seconds']
    }

# Routes for orders
@trading_bp.route('/api/trading/orders', methods=['POST'])
@jwt_required
def place_order():
    db = get_db()
    data = request.json
    user_id = g.user_id
    
    # Validate required fields
    required_fields = ['symbol', 'type', 'side', 'amount', 'total']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Extract data from request
    symbol = data['symbol']
    order_type = data['type']
    side = data['side']
    price = data.get('price')
    stop_price = data.get('stopPrice')
    limit_price = data.get('limitPrice')
    amount = data['amount']
    total = data['total']
    leverage = data.get('leverage', 1)
    
    # Default status to open unless it's a market order
    status = 'open' if order_type != 'market' else 'filled'
    filled_price = price if order_type == 'market' else None
    filled_amount = amount if order_type == 'market' else None
    filled_time = datetime.now() if order_type == 'market' else None
    
    try:
        # Begin transaction
        db.begin()
        
        # Insert order into database
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO trading_orders (
                user_id, symbol, order_type, side, price, stop_price, limit_price,
                amount, total, leverage, status, filled_price, filled_amount, filled_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING order_id
            """,
            (
                user_id, symbol, order_type, side, price, stop_price, limit_price,
                amount, total, leverage, status, filled_price, filled_amount, filled_time
            )
        )
        order_id = cursor.fetchone()[0]
        
        # If it's a market order, update user balance and create position
        if order_type == 'market':
            # Update user balance
            if side == 'buy':
                cursor.execute(
                    "UPDATE login SET balance = balance - %s WHERE user_id = %s",
                    (total, user_id)
                )
                
                # Create position
                cursor.execute(
                    """
                    INSERT INTO trading_positions (
                        user_id, symbol, side, entry_price, current_price, amount,
                        leverage, margin_used, unrealized_pnl, status, order_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        user_id, symbol, side, price, price, amount,
                        leverage, total, 0, 'open', order_id
                    )
                )
            else:
                # For sell orders, we would need to check if the user has the asset
                # and handle short positions. For simplicity, we'll just add to balance
                cursor.execute(
                    "UPDATE login SET balance = balance + %s WHERE user_id = %s",
                    (total, user_id)
                )
        
        # Commit transaction
        db.commit()
        
        return jsonify({
            'success': True,
            'order_id': order_id,
            'message': 'Order placed successfully'
        }), 201
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@trading_bp.route('/api/trading/orders/open', methods=['GET'])
@jwt_required
def get_open_orders():
    db = get_db()
    user_id = g.user_id
    
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT * FROM trading_orders
            WHERE user_id = %s AND status = 'open'
            ORDER BY created_at DESC
            """,
            (user_id,)
        )
        orders = cursor.fetchall()
        
        return jsonify({
            'success': True,
            'orders': [format_order(order) for order in orders]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trading_bp.route('/api/trading/orders/history', methods=['GET'])
@jwt_required
def get_order_history():
    db = get_db()
    user_id = g.user_id
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT * FROM trading_orders
            WHERE user_id = %s AND status != 'open'
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            (user_id, limit, offset)
        )
        orders = cursor.fetchall()
        
        return jsonify({
            'success': True,
            'orders': [format_order(order) for order in orders]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trading_bp.route('/api/trading/orders/<int:order_id>', methods=['DELETE'])
@jwt_required
def cancel_order(order_id):
    db = get_db()
    user_id = g.user_id
    
    try:
        # Begin transaction
        db.begin()
        
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT * FROM trading_orders
            WHERE user_id = %s AND order_id = %s AND status = 'open'
            """,
            (user_id, order_id)
        )
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'error': 'Order not found or already executed/canceled'}), 404
        
        # Update order status
        cursor.execute(
            """
            UPDATE trading_orders
            SET status = 'canceled', cancel_time = %s
            WHERE order_id = %s
            """,
            (datetime.now(), order_id)
        )
        
        # Commit transaction
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Order canceled successfully'
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

# Routes for positions
@trading_bp.route('/api/trading/positions/open', methods=['GET'])
@jwt_required
def get_open_positions():
    db = get_db()
    user_id = g.user_id
    
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT * FROM trading_positions
            WHERE user_id = %s AND status = 'open'
            ORDER BY open_time DESC
            """,
            (user_id,)
        )
        positions = cursor.fetchall()
        
        return jsonify({
            'success': True,
            'positions': [format_position(position) for position in positions]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trading_bp.route('/api/trading/positions/<int:position_id>/close', methods=['POST'])
@jwt_required
def close_position(position_id):
    db = get_db()
    user_id = g.user_id
    data = request.json
    price = data.get('price')
    
    if not price:
        return jsonify({'error': 'Missing required field: price'}), 400
    
    try:
        # Begin transaction
        db.begin()
        
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT * FROM trading_positions
            WHERE user_id = %s AND position_id = %s AND status = 'open'
            """,
            (user_id, position_id)
        )
        position = cursor.fetchone()
        
        if not position:
            return jsonify({'error': 'Position not found or already closed'}), 404
        
        # Calculate PnL
        realized_pnl = 0
        if position['side'] == 'buy':
            realized_pnl = (price - position['entry_price']) * position['amount'] * position['leverage']
        else:
            realized_pnl = (position['entry_price'] - price) * position['amount'] * position['leverage']
        
        # Update position
        cursor.execute(
            """
            UPDATE trading_positions
            SET status = 'closed', close_time = %s, current_price = %s, realized_pnl = %s
            WHERE position_id = %s
            """,
            (datetime.now(), price, realized_pnl, position_id)
        )
        
        # Update user balance
        cursor.execute(
            """
            UPDATE login
            SET balance = balance + %s
            WHERE user_id = %s
            """,
            (realized_pnl + position['margin_used'], user_id)
        )
        
        # Insert into trade history
        cursor.execute(
            """
            INSERT INTO trade_history (
                user_id, symbol, side, entry_price, exit_price, amount,
                leverage, pnl, open_time, close_time, duration_seconds, position_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id, position['symbol'], position['side'],
                position['entry_price'], price, position['amount'],
                position['leverage'], realized_pnl, position['open_time'],
                datetime.now(), int((datetime.now() - position['open_time']).total_seconds()),
                position_id
            )
        )
        
        # Commit transaction
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Position closed successfully',
            'pnl': decimal_to_float(realized_pnl)
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

# ... Add additional routes for:
# - position history
# - setting take profit / stop loss
# - getting trade history
# - getting performance stats
# - user preferences
# - price alerts
# - account information

# Register blueprint with main app
# app.register_blueprint(trading_bp) 