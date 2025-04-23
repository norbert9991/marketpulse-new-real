-- Table for user's trading preferences
CREATE TABLE user_trading_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES login(user_id),
  default_leverage INTEGER NOT NULL DEFAULT 1,
  default_order_type VARCHAR(20) NOT NULL DEFAULT 'limit',
  show_indicators BOOLEAN NOT NULL DEFAULT true,
  chart_type VARCHAR(20) NOT NULL DEFAULT 'candles',
  chart_timeframe VARCHAR(10) NOT NULL DEFAULT '1h',
  favorite_pairs TEXT[] DEFAULT ARRAY['EUR/USD', 'GBP/USD', 'USD/JPY'],
  default_order_amount DECIMAL(10,2) DEFAULT 0.1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table for trading orders
CREATE TABLE trading_orders (
  order_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES login(user_id),
  symbol VARCHAR(20) NOT NULL,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop_limit')),
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  price DECIMAL(20,8),
  stop_price DECIMAL(20,8),
  limit_price DECIMAL(20,8),
  amount DECIMAL(10,4) NOT NULL,
  total DECIMAL(20,8) NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'filled', 'canceled', 'partially_filled')),
  filled_price DECIMAL(20,8),
  filled_amount DECIMAL(10,4),
  filled_time TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancel_time TIMESTAMP,
  UNIQUE(user_id, order_id)
);

-- Table for trading positions
CREATE TABLE trading_positions (
  position_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES login(user_id),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  entry_price DECIMAL(20,8) NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  amount DECIMAL(10,4) NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  take_profit DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  margin_used DECIMAL(20,8) NOT NULL,
  unrealized_pnl DECIMAL(20,8) NOT NULL,
  realized_pnl DECIMAL(20,8) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'closed')),
  open_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  close_time TIMESTAMP,
  order_id INTEGER REFERENCES trading_orders(order_id),
  UNIQUE(user_id, position_id)
);

-- Table for trade history
CREATE TABLE trade_history (
  trade_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES login(user_id),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  entry_price DECIMAL(20,8) NOT NULL,
  exit_price DECIMAL(20,8),
  amount DECIMAL(10,4) NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  pnl DECIMAL(20,8),
  fee DECIMAL(20,8) NOT NULL DEFAULT 0,
  open_time TIMESTAMP NOT NULL,
  close_time TIMESTAMP,
  duration_seconds INTEGER,
  position_id INTEGER REFERENCES trading_positions(position_id),
  order_id INTEGER REFERENCES trading_orders(order_id),
  UNIQUE(user_id, trade_id)
);

-- Table for price alerts
CREATE TABLE price_alerts (
  alert_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES login(user_id),
  symbol VARCHAR(20) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('above', 'below')),
  message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  triggered_at TIMESTAMP,
  UNIQUE(user_id, symbol, price, direction)
);

-- Add indexes for performance
CREATE INDEX idx_orders_user_id ON trading_orders(user_id);
CREATE INDEX idx_orders_symbol ON trading_orders(symbol);
CREATE INDEX idx_orders_status ON trading_orders(status);
CREATE INDEX idx_positions_user_id ON trading_positions(user_id);
CREATE INDEX idx_positions_symbol ON trading_positions(symbol);
CREATE INDEX idx_positions_status ON trading_positions(status);
CREATE INDEX idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX idx_trade_history_symbol ON trade_history(symbol);
CREATE INDEX idx_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_alerts_symbol ON price_alerts(symbol);
CREATE INDEX idx_alerts_active ON price_alerts(is_active);

-- Create function to update position PnL
CREATE OR REPLACE FUNCTION update_position_pnl()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate unrealized PnL
  IF NEW.side = 'buy' THEN
    NEW.unrealized_pnl := (NEW.current_price - NEW.entry_price) * NEW.amount * NEW.leverage;
  ELSE
    NEW.unrealized_pnl := (NEW.entry_price - NEW.current_price) * NEW.amount * NEW.leverage;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update PnL when position price changes
CREATE TRIGGER position_pnl_update
BEFORE UPDATE ON trading_positions
FOR EACH ROW
WHEN (NEW.current_price IS DISTINCT FROM OLD.current_price)
EXECUTE FUNCTION update_position_pnl();

-- Create function to close position and record trade history
CREATE OR REPLACE FUNCTION close_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status = 'open' THEN
    -- Calculate final PnL
    IF NEW.side = 'buy' THEN
      NEW.realized_pnl := (NEW.current_price - NEW.entry_price) * NEW.amount * NEW.leverage;
    ELSE
      NEW.realized_pnl := (NEW.entry_price - NEW.current_price) * NEW.amount * NEW.leverage;
    END IF;
    
    -- Calculate duration
    NEW.close_time := CURRENT_TIMESTAMP;
    
    -- Insert into trade history
    INSERT INTO trade_history (
      user_id, symbol, side, entry_price, exit_price, amount, leverage,
      pnl, open_time, close_time, duration_seconds, position_id
    ) VALUES (
      NEW.user_id, NEW.symbol, NEW.side, NEW.entry_price, NEW.current_price,
      NEW.amount, NEW.leverage, NEW.realized_pnl, NEW.open_time, NEW.close_time,
      EXTRACT(EPOCH FROM (NEW.close_time - NEW.open_time))::INTEGER, NEW.position_id
    );
    
    -- Update user balance
    UPDATE login
    SET balance = balance + NEW.realized_pnl
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to record trade history when position is closed
CREATE TRIGGER position_close
BEFORE UPDATE ON trading_positions
FOR EACH ROW
WHEN (NEW.status = 'closed' AND OLD.status = 'open')
EXECUTE FUNCTION close_position();

-- Create sample data for testing
INSERT INTO user_trading_preferences (user_id, default_leverage, default_order_type)
VALUES (1, 1, 'limit'), (2, 5, 'market'), (3, 2, 'limit');

-- Example queries

-- Get open orders for a user
-- SELECT * FROM trading_orders WHERE user_id = 1 AND status = 'open';

-- Get open positions for a user
-- SELECT * FROM trading_positions WHERE user_id = 1 AND status = 'open';

-- Get trade history for a user
-- SELECT * FROM trade_history WHERE user_id = 1 ORDER BY close_time DESC;

-- Get active price alerts for a user
-- SELECT * FROM price_alerts WHERE user_id = 1 AND is_active = true; 