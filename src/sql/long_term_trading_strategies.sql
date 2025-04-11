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

-- Insert sample strategies
INSERT INTO trading_strategies 
(name, description, total_net_pl, one_year_net_pl, six_month_net_pl, three_month_net_pl, risk_level, avg_duration, max_drawdown, sharpe_ratio)
VALUES
('Triumph', 'Conservative trend-following strategy using major currency pairs', 121.00, 121.00, 67.50, 32.50, 'low', '3-5 days', 15.20, 1.75),
('Legacy', 'Momentum-based strategy focusing on breakouts and pullbacks', 538.00, 102.00, 48.00, 22.50, 'medium', '1-3 days', 22.40, 1.95),
('Alpine', 'Range-trading strategy exploiting overbought and oversold conditions', 317.00, 77.00, 42.00, 20.00, 'medium', '2-4 days', 18.60, 1.82),
('Ivory', 'Contrarian strategy that trades against extreme market movements', 125.00, -13.00, 25.00, 35.00, 'high', '1-2 days', 27.50, 1.45),
('Quantum', 'High-frequency scalping algorithm targeting small price movements', 87.00, 24.00, 12.00, 8.00, 'high', '1-4 hours', 32.10, 1.25); 