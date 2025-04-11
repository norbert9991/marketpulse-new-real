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