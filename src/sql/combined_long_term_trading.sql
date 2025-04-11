-- Create trading strategies table first
CREATE TABLE IF NOT EXISTS trading_strategies (
  strategy_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  total_net_pl DECIMAL(10,2) NOT NULL,
  one_year_net_pl DECIMAL(10,2) NOT NULL,
  six_month_net_pl DECIMAL(10,2),
  three_month_net_pl DECIMAL(10,2),
  risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  avg_duration VARCHAR(50),
  max_drawdown DECIMAL(10,2),
  sharpe_ratio DECIMAL(10,4),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create simulation_long_term table before the dependent tables
CREATE TABLE IF NOT EXISTS simulation_long_term (
  simulation_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  initial_balance DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  time_period VARCHAR(20) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  total_profit_loss DECIMAL(15,2),
  profit_loss_percentage DECIMAL(10,2),
  total_trades INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES login(user_id)
);

-- Create simulation_periods table
CREATE TABLE IF NOT EXISTS simulation_periods (
  period_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  days INT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INT NOT NULL
);

-- Create simulation_period_options table
CREATE TABLE IF NOT EXISTS simulation_period_options (
  period_id SERIAL PRIMARY KEY,
  period_name VARCHAR(50) NOT NULL,
  period_value VARCHAR(20) NOT NULL,
  days_duration INT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0
);

-- Create strategy_performance_history table
CREATE TABLE IF NOT EXISTS strategy_performance_history (
  id SERIAL PRIMARY KEY,
  strategy_id INT NOT NULL,
  date DATE NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  daily_profit_loss DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_id) REFERENCES trading_strategies(strategy_id)
);

-- Create strategy_trades table
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

-- Create simulation_allocations table
CREATE TABLE IF NOT EXISTS simulation_allocations (
  allocation_id SERIAL PRIMARY KEY,
  simulation_id INT NOT NULL,
  strategy_id INT NOT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  copy_ratio INT NOT NULL DEFAULT 1,
  profit_loss DECIMAL(15,2),
  profit_loss_percentage DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (simulation_id) REFERENCES simulation_long_term(simulation_id),
  FOREIGN KEY (strategy_id) REFERENCES trading_strategies(strategy_id)
);

-- Create simulation_results table
CREATE TABLE IF NOT EXISTS simulation_results (
  result_id SERIAL PRIMARY KEY,
  simulation_id INT NOT NULL,
  date DATE NOT NULL,
  total_balance DECIMAL(15,2) NOT NULL,
  daily_profit_loss DECIMAL(15,2),
  monthly_profit_loss DECIMAL(15,2),
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  losing_trades INT DEFAULT 0,
  win_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (simulation_id) REFERENCES simulation_long_term(simulation_id)
);

-- Create simulation_symbol_performance table
CREATE TABLE IF NOT EXISTS simulation_symbol_performance (
  id SERIAL PRIMARY KEY,
  simulation_id INT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  losing_trades INT DEFAULT 0,
  profit_loss DECIMAL(15,2),
  profit_loss_percentage DECIMAL(10,2),
  weight DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (simulation_id) REFERENCES simulation_long_term(simulation_id)
);

-- Insert sample strategies
INSERT INTO trading_strategies 
(name, description, total_net_pl, one_year_net_pl, six_month_net_pl, three_month_net_pl, risk_level, avg_duration, max_drawdown, sharpe_ratio)
VALUES
('Triumph', 'Conservative trend-following strategy using major currency pairs', 121.00, 121.00, 67.50, 32.50, 'low', '3-5 days', 15.20, 1.75),
('Legacy', 'Momentum-based strategy focusing on breakouts and pullbacks', 538.00, 102.00, 48.00, 22.50, 'medium', '1-3 days', 22.40, 1.95),
('Alpine', 'Range-trading strategy exploiting overbought and oversold conditions', 317.00, 77.00, 42.00, 20.00, 'medium', '2-4 days', 18.60, 1.82),
('Ivory', 'Contrarian strategy that trades against extreme market movements', 125.00, -13.00, 25.00, 35.00, 'high', '1-2 days', 27.50, 1.45),
('Quantum', 'High-frequency scalping algorithm targeting small price movements', 87.00, 24.00, 12.00, 8.00, 'high', '1-4 hours', 32.10, 1.25);

-- Insert sample simulation data
INSERT INTO simulation_long_term 
(user_id, initial_balance, current_balance, start_date, time_period, status, total_profit_loss, profit_loss_percentage, total_trades)
VALUES
(1, 100000.00, 112097.07, CURRENT_DATE - INTERVAL '12 months', '1 Year', 'active', 12097.07, 12.10, 3573);

-- Insert simulation period options
INSERT INTO simulation_period_options
(period_name, period_value, days_duration, is_default, active, display_order)
VALUES
('1 Month', '1M', 30, FALSE, TRUE, 1),
('3 Months', '3M', 90, FALSE, TRUE, 2),
('6 Months', '6M', 180, FALSE, TRUE, 3),
('1 Year', '1Y', 365, TRUE, TRUE, 4),
('2 Years', '2Y', 730, FALSE, TRUE, 5),
('3 Years', '3Y', 1095, FALSE, TRUE, 6);

-- Insert default simulation periods
INSERT INTO simulation_periods (name, days, is_default, display_order)
VALUES
('1 Year', 365, TRUE, 1),
('6 Months', 180, FALSE, 2),
('3 Months', 90, FALSE, 3),
('1 Month', 30, FALSE, 4),
('2 Years', 730, FALSE, 5);

-- Insert sample allocation data
INSERT INTO simulation_allocations 
(simulation_id, strategy_id, allocated_amount, current_value, copy_ratio, profit_loss, profit_loss_percentage)
VALUES
(1, 3, 6166.79, 6166.79, 2, 0.00, 0.00);

-- Sample strategy performance history for the past 30 days
-- Triumph strategy (ID: 1)
INSERT INTO strategy_performance_history (strategy_id, date, balance, daily_profit_loss)
VALUES
(1, CURRENT_DATE - INTERVAL '30 days', 10000.00, NULL),
(1, CURRENT_DATE - INTERVAL '29 days', 10120.00, 120.00),
(1, CURRENT_DATE - INTERVAL '28 days', 10180.00, 60.00),
(1, CURRENT_DATE - INTERVAL '27 days', 10220.00, 40.00),
(1, CURRENT_DATE - INTERVAL '26 days', 10320.00, 100.00),
(1, CURRENT_DATE - INTERVAL '25 days', 10280.00, -40.00),
(1, CURRENT_DATE - INTERVAL '24 days', 10350.00, 70.00),
(1, CURRENT_DATE - INTERVAL '23 days', 10420.00, 70.00),
(1, CURRENT_DATE - INTERVAL '22 days', 10390.00, -30.00),
(1, CURRENT_DATE - INTERVAL '21 days', 10450.00, 60.00),
(1, CURRENT_DATE - INTERVAL '20 days', 10520.00, 70.00),
(1, CURRENT_DATE - INTERVAL '19 days', 10490.00, -30.00),
(1, CURRENT_DATE - INTERVAL '18 days', 10560.00, 70.00),
(1, CURRENT_DATE - INTERVAL '17 days', 10630.00, 70.00),
(1, CURRENT_DATE - INTERVAL '16 days', 10700.00, 70.00),
(1, CURRENT_DATE - INTERVAL '15 days', 10780.00, 80.00),
(1, CURRENT_DATE - INTERVAL '14 days', 10850.00, 70.00),
(1, CURRENT_DATE - INTERVAL '13 days', 10910.00, 60.00),
(1, CURRENT_DATE - INTERVAL '12 days', 10880.00, -30.00),
(1, CURRENT_DATE - INTERVAL '11 days', 10950.00, 70.00),
(1, CURRENT_DATE - INTERVAL '10 days', 11030.00, 80.00),
(1, CURRENT_DATE - INTERVAL '9 days', 11090.00, 60.00),
(1, CURRENT_DATE - INTERVAL '8 days', 11150.00, 60.00),
(1, CURRENT_DATE - INTERVAL '7 days', 11210.00, 60.00),
(1, CURRENT_DATE - INTERVAL '6 days', 11180.00, -30.00),
(1, CURRENT_DATE - INTERVAL '5 days', 11230.00, 50.00),
(1, CURRENT_DATE - INTERVAL '4 days', 11280.00, 50.00),
(1, CURRENT_DATE - INTERVAL '3 days', 11320.00, 40.00),
(1, CURRENT_DATE - INTERVAL '2 days', 11380.00, 60.00),
(1, CURRENT_DATE - INTERVAL '1 day', 11450.00, 70.00),
(1, CURRENT_DATE, 11510.00, 60.00);

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

-- Insert sample simulation result data
INSERT INTO simulation_results 
(simulation_id, date, total_balance, daily_profit_loss, monthly_profit_loss, total_trades, winning_trades, losing_trades, win_rate)
VALUES
(1, CURRENT_DATE - INTERVAL '12 months', 100000.00, 0.00, NULL, 0, 0, 0, 0.00),
(1, CURRENT_DATE - INTERVAL '11 months', 101100.00, 120.00, 1100.00, 287, 172, 115, 59.93),
(1, CURRENT_DATE - INTERVAL '10 months', 102500.00, 140.00, 1400.00, 301, 184, 117, 61.13),
(1, CURRENT_DATE - INTERVAL '9 months', 103200.00, 80.00, 700.00, 276, 165, 111, 59.78),
(1, CURRENT_DATE - INTERVAL '8 months', 104500.00, 120.00, 1300.00, 295, 180, 115, 61.02),
(1, CURRENT_DATE - INTERVAL '7 months', 105700.00, 150.00, 1200.00, 310, 192, 118, 61.94),
(1, CURRENT_DATE - INTERVAL '6 months', 106900.00, 130.00, 1200.00, 298, 183, 115, 61.41),
(1, CURRENT_DATE - INTERVAL '5 months', 107600.00, 90.00, 700.00, 285, 171, 114, 60.00),
(1, CURRENT_DATE - INTERVAL '4 months', 108900.00, 140.00, 1300.00, 305, 189, 116, 61.97),
(1, CURRENT_DATE - INTERVAL '3 months', 110300.00, 160.00, 1400.00, 312, 195, 117, 62.50),
(1, CURRENT_DATE - INTERVAL '2 months', 111200.00, 120.00, 900.00, 291, 177, 114, 60.82),
(1, CURRENT_DATE - INTERVAL '1 month', 112097.07, 130.00, 897.07, 304, 187, 117, 61.51);

-- Insert sample symbols performance data
INSERT INTO simulation_symbol_performance 
(simulation_id, symbol, total_trades, winning_trades, losing_trades, profit_loss, profit_loss_percentage, weight)
VALUES
(1, 'EURUSD', 1246, 748, 498, 5380.00, 44.8, 44.8),
(1, 'EURJPY', 854, 529, 325, 3840.00, 32.0, 32.0),
(1, 'AUDUSD', 152, 80, 72, 290.00, 2.4, 2.4),
(1, 'EURNZD', 432, 250, 182, 390.00, 3.3, 3.3),
(1, 'GBPUSD', 564, 330, 234, 580.00, 4.8, 4.8),
(1, 'EURCHF', 95, 52, 43, 670.00, 5.5, 5.5),
(1, 'EURCAD', 230, 140, 90, 947.07, 7.9, 7.9); 