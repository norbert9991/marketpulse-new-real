CREATE TABLE IF NOT EXISTS simulation_periods (
  period_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  days INT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INT NOT NULL
);

-- Insert default simulation periods
INSERT INTO simulation_periods (name, days, is_default, display_order)
VALUES
('1 Year', 365, TRUE, 1),
('6 Months', 180, FALSE, 2),
('3 Months', 90, FALSE, 3),
('1 Month', 30, FALSE, 4),
('2 Years', 730, FALSE, 5);

-- Create table for strategy trades
CREATE TABLE IF NOT EXISTS strategy_trades (
  trade_id SERIAL PRIMARY KEY,
  strategy_id INT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  trade_type VARCHAR(4) NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  open_price DECIMAL(15,5) NOT NULL,
  close_price DECIMAL(15,5),
  open_time TIMESTAMP NOT NULL,
  close_time TIMESTAMP,
  lot_size DECIMAL(10,2) NOT NULL,
  profit_loss DECIMAL(15,2),
  pips DECIMAL(10,1),
  status VARCHAR(6) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_id) REFERENCES trading_strategies(strategy_id)
);

-- Insert sample strategy trades for Alpine strategy (ID: 3)
INSERT INTO strategy_trades 
(strategy_id, symbol, trade_type, open_price, close_price, open_time, close_time, lot_size, profit_loss, pips, status)
VALUES
(3, 'EURUSD', 'buy', 1.10243, 1.10546, NOW() - INTERVAL '29 days', NOW() - INTERVAL '28 days', 1.00, 303.00, 30.3, 'closed'),
(3, 'GBPUSD', 'sell', 1.25435, 1.25162, NOW() - INTERVAL '27 days', NOW() - INTERVAL '26 days', 0.75, 204.75, 27.3, 'closed'),
(3, 'EURJPY', 'buy', 157.325, 158.463, NOW() - INTERVAL '25 days', NOW() - INTERVAL '23 days', 1.25, 1422.50, 113.8, 'closed'),
(3, 'EURUSD', 'sell', 1.10867, 1.10612, NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days', 1.00, 255.00, 25.5, 'closed'),
(3, 'EURUSD', 'buy', 1.10456, 1.10789, NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', 1.50, 499.50, 33.3, 'closed'),
(3, 'GBPUSD', 'buy', 1.24876, 1.25234, NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', 1.00, 358.00, 35.8, 'closed'),
(3, 'EURJPY', 'sell', 159.874, 158.953, NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', 0.50, 460.50, 92.1, 'closed'),
(3, 'EURUSD', 'buy', 1.10324, 1.10587, NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days', 2.00, 526.00, 26.3, 'closed'),
(3, 'EURJPY', 'buy', 158.456, 159.342, NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', 0.75, 663.00, 88.6, 'closed'),
(3, 'GBPUSD', 'sell', 1.25745, 1.25324, NOW() - INTERVAL '9 days', NOW() - INTERVAL '7 days', 1.25, 526.25, 42.1, 'closed'),
(3, 'EURUSD', 'buy', 1.10678, 1.10923, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', 1.00, 245.00, 24.5, 'closed'),
(3, 'EURJPY', 'sell', 160.245, 159.876, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 0.50, 184.50, 36.9, 'closed'),
(3, 'EURUSD', 'buy', 1.10745, 1.10986, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 1.50, 361.50, 24.1, 'closed'),
(3, 'GBPUSD', 'buy', 1.25123, 1.25345, NOW() - INTERVAL '1 day', NULL, 1.00, NULL, NULL, 'open'); 