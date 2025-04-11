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

-- Insert sample simulation data
INSERT INTO simulation_long_term 
(user_id, initial_balance, current_balance, start_date, time_period, status, total_profit_loss, profit_loss_percentage, total_trades)
VALUES
(1, 100000.00, 112097.07, CURRENT_DATE - INTERVAL '12 months', '1 Year', 'active', 12097.07, 12.10, 3573);

CREATE TABLE IF NOT EXISTS simulation_period_options (
  period_id SERIAL PRIMARY KEY,
  period_name VARCHAR(50) NOT NULL,
  period_value VARCHAR(20) NOT NULL,
  days_duration INT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0
);

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