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

-- Insert sample allocation data
INSERT INTO simulation_allocations 
(simulation_id, strategy_id, allocated_amount, current_value, copy_ratio, profit_loss, profit_loss_percentage)
VALUES
(1, 3, 6166.79, 6166.79, 2, 0.00, 0.00);

CREATE TABLE IF NOT EXISTS strategy_performance_history (
  id SERIAL PRIMARY KEY,
  strategy_id INT NOT NULL,
  date DATE NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  daily_profit_loss DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_id) REFERENCES trading_strategies(strategy_id)
);

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