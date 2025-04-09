-- PostgreSQL SQL Dump
-- version 15
-- https://www.postgresql.org/

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Database: `finals`
--

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  pair_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, symbol)
);

--
-- Dumping data for table `favorites`
--

INSERT INTO favorites (id, user_id, symbol, pair_name, created_at) VALUES
(1, 3, 'EURUSD=X', 'EUR/USD', '2025-04-04 22:30:44'),
(2, 3, 'AUDUSD=X', 'AUD/USD', '2025-04-04 22:38:04'),
(4, 1, 'USDCHF=X', 'USD/CHF', '2025-04-05 01:28:01'),
(5, 1, 'EURUSD=X', 'EUR/USD', '2025-04-05 01:32:25'),
(6, 1, 'NZDUSD=X', 'NZD/USD', '2025-04-05 02:21:14');

-- --------------------------------------------------------

--
-- Table structure for table `login`
--

CREATE TABLE login (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  pass VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  last_login TIMESTAMP,
  account_status VARCHAR(10) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  balance INTEGER
);

--
-- Dumping data for table `login`
--

INSERT INTO login (user_id, username, email, pass, role, last_login, account_status, created_at, balance) VALUES
(1, 'nigga', 'negger@gmail.com', 'scrypt:32768:8:1$n4PSQ1RMU0QwnMb1$6199a08009c0374f294d2bc5b09190ce25f7e021be2e904e6c81468e151f1f1d06e3c5b9e00f85c2ce80ca58c36c93398f769aa299bdb4b596299b8ab99ba144', 'user', '2025-04-05 10:47:22', 'active', '2025-03-28 11:39:18', 10000),
(2, 'admin', 'admin@example.com', 'scrypt:32768:8:1$zU4WVnJuKLCyBMA4$c3dd498edab1575f98db2d62a83aeec9192aeaeacdba6c23e2656bf1960298cbf9b4df7d7a00b43b86e9e2fa4e2dadcc2220d81025b11fe238a02b38df11fbe9', 'admin', '2025-04-05 11:38:53', 'active', '2025-03-29 08:58:02', 10000),
(3, 'test', 'tes@gmail.com', 'scrypt:32768:8:1$T0sSeJKCRzuKPR7Z$3d15de7ac8003e2af709beb77e62a0f66f0b3952f0df0e6c56f8ba9f54c1aaee101b8433f57658cec7c4f83398606991383e7f9ce75c6e42ebb3f2cae66b84a0', 'user', '2025-04-05 11:29:29', 'active', '2025-04-03 10:57:07', 123);

-- --------------------------------------------------------

--
-- Table structure for table `market_data`
--

CREATE TABLE market_data (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  current_price DECIMAL(20,8),
  change_percentage DECIMAL(5,2) NOT NULL,
  trend VARCHAR(10) NOT NULL CHECK (trend IN ('Bullish', 'Bearish')),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

--
-- Dumping data for table `market_data`
--

INSERT INTO market_data (id, symbol, current_price, change_percentage, trend, updated_at) VALUES
(1, 'EURUSD=X', 1.09625089, 0.00, 'Bearish', '2025-04-05 03:18:18'),
(2, 'AUDUSD=X', 0.60459489, 0.00, 'Bearish', '2025-04-05 03:30:25'),
(4, 'USDCHF=X', 0.85993999, 0.00, 'Bearish', '2025-04-05 03:14:10'),
(5, 'NZDUSD=X', 0.55969107, 0.00, 'Bearish', '2025-04-05 03:11:11');

-- --------------------------------------------------------

--
-- Table structure for table `price_history`
--

CREATE TABLE price_history (
  price_id SERIAL PRIMARY KEY,
  symbol VARCHAR(20),
  open_price DECIMAL(20,8),
  high_price DECIMAL(20,8),
  low_price DECIMAL(20,8),
  close_price DECIMAL(20,8),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_symbol ON price_history(symbol);

--
-- Dumping data for table `price_history`
--

-- [Previous price_history data remains the same]

-- --------------------------------------------------------

--
-- Table structure for table `price_predictions`
--

CREATE TABLE price_predictions (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  prediction_date DATE NOT NULL,
  predicted_price DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  UNIQUE(symbol, prediction_date)
);

--
-- Dumping data for table `price_predictions`
--

-- [Previous price_predictions data remains the same]

-- --------------------------------------------------------

--
-- Table structure for table `support_resistance`
--

CREATE TYPE level_type AS ENUM ('support', 'resistance');

CREATE TABLE support_resistance (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  level_type level_type NOT NULL,
  level_value DECIMAL(10,4) NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(symbol, level_type, level_value)
);

--
-- Dumping data for table `support_resistance`
--

-- [Previous support_resistance data remains the same]

-- --------------------------------------------------------

--
-- Table structure for table `technical_indicators`
--

CREATE TABLE technical_indicators (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  rsi DECIMAL(10,4),
  macd DECIMAL(10,4),
  macd_signal DECIMAL(10,4),
  macd_hist DECIMAL(10,4),
  sma20 DECIMAL(10,4),
  sma50 DECIMAL(10,4),
  sma200 DECIMAL(10,4),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

--
-- Dumping data for table `technical_indicators`
--

INSERT INTO technical_indicators (id, symbol, rsi, macd, macd_signal, macd_hist, sma20, sma50, sma200, created_at, updated_at) VALUES
(1, 'EURUSD=X', 57.6357, 0.0013, 0.0006, 0.0007, 1.0857, 0.0000, 0.0000, '2025-04-05 03:18:18', '2025-04-05 03:18:18'),
(2, 'AUDUSD=X', 25.3484, -0.0034, -0.0015, -0.0019, 0.6291, 0.0000, 0.0000, '2025-04-05 03:30:08', '2025-04-05 03:30:08');

--
-- Constraints for dumped tables
--

ALTER TABLE favorites
  ADD CONSTRAINT favorites_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES login(user_id); 