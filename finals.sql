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

-- Reset the sequence to the correct next value
SELECT setval('login_user_id_seq', (SELECT MAX(user_id) FROM login));

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

INSERT INTO price_history (price_id, symbol, open_price, high_price, low_price, close_price, timestamp, created_at) VALUES
(90, 'EURUSD=X', 1.07949388, 1.08510470, 1.07824850, 1.07949388, '2025-03-05 16:00:00', '2025-04-05 03:10:42'),
(91, 'EURUSD=X', 1.07879519, 1.08856571, 1.07821357, 1.07879519, '2025-03-06 16:00:00', '2025-04-05 03:10:42'),
(92, 'EURUSD=X', 1.08605933, 1.08734655, 1.08062541, 1.08605933, '2025-03-09 16:00:00', '2025-04-05 03:10:42'),
(93, 'EURUSD=X', 1.08394039, 1.09302759, 1.08368194, 1.08394039, '2025-03-10 16:00:00', '2025-04-05 03:10:42'),
(94, 'EURUSD=X', 1.09141707, 1.09345782, 1.08772504, 1.09141707, '2025-03-11 16:00:00', '2025-04-05 03:10:42'),
(95, 'EURUSD=X', 1.08862495, 1.08991826, 1.08229792, 1.08862495, '2025-03-12 16:00:00', '2025-04-05 03:10:42'),
(96, 'EURUSD=X', 1.08556414, 1.09101224, 1.08313024, 1.08556414, '2025-03-13 16:00:00', '2025-04-05 03:10:42'),
(97, 'EURUSD=X', 1.08812749, 1.09289610, 1.08692110, 1.08812749, '2025-03-16 16:00:00', '2025-04-05 03:10:42'),
(98, 'EURUSD=X', 1.09191763, 1.09544623, 1.08970439, 1.09191763, '2025-03-17 16:00:00', '2025-04-05 03:10:42'),
(99, 'EURUSD=X', 1.09394825, 1.09457088, 1.08759487, 1.09394825, '2025-03-18 16:00:00', '2025-04-05 03:10:42'),
(100, 'EURUSD=X', 1.09119081, 1.09175074, 1.08182967, 1.09119081, '2025-03-19 16:00:00', '2025-04-05 03:10:42'),
(101, 'EURUSD=X', 1.08567023, 1.08613014, 1.08056712, 1.08567023, '2025-03-20 16:00:00', '2025-04-05 03:10:42'),
(102, 'EURUSD=X', 1.08357620, 1.08569384, 1.07907450, 1.08357620, '2025-03-23 16:00:00', '2025-04-05 03:10:42'),
(103, 'EURUSD=X', 1.08035696, 1.08307159, 1.07786500, 1.08035696, '2025-03-24 16:00:00', '2025-04-05 03:10:42'),
(104, 'EURUSD=X', 1.07874870, 1.08022857, 1.07687831, 1.07874870, '2025-03-25 16:00:00', '2025-04-05 03:10:42'),
(105, 'EURUSD=X', 1.07420611, 1.08187640, 1.07420611, 1.07420611, '2025-03-26 16:00:00', '2025-04-05 03:10:42'),
(106, 'EURUSD=X', 1.08010018, 1.08452809, 1.07658851, 1.08010018, '2025-03-27 16:00:00', '2025-04-05 03:10:42'),
(107, 'EURUSD=X', 1.08239162, 1.08484578, 1.07857406, 1.08239162, '2025-03-30 16:00:00', '2025-04-05 03:10:42'),
(108, 'EURUSD=X', 1.08188808, 1.08307159, 1.07795787, 1.08188808, '2025-03-31 16:00:00', '2025-04-05 03:10:42'),
(109, 'EURUSD=X', 1.07959878, 1.08726382, 1.07820201, 1.07959878, '2025-04-01 16:00:00', '2025-04-05 03:10:42'),
(110, 'EURUSD=X', 1.09086943, 1.11333787, 1.08824587, 1.09086943, '2025-04-02 16:00:00', '2025-04-05 03:10:42'),
(111, 'EURUSD=X', 1.10533881, 1.11098766, 1.09289610, 1.09625089, '2025-04-03 16:00:00', '2025-04-05 03:10:42'),
(112, 'NZDUSD=X', 0.57287878, 0.57576162, 0.57213151, 0.57296085, '2025-03-05 16:00:00', '2025-04-05 03:11:11'),
(113, 'NZDUSD=X', 0.57362145, 0.57419127, 0.56969994, 0.57366091, '2025-03-06 16:00:00', '2025-04-05 03:11:11'),
(114, 'NZDUSD=X', 0.57094896, 0.57434958, 0.57057106, 0.57105982, '2025-03-09 16:00:00', '2025-04-05 03:11:11'),
(115, 'NZDUSD=X', 0.56960911, 0.57143837, 0.56789142, 0.56950849, '2025-03-10 16:00:00', '2025-04-05 03:11:11'),
(116, 'NZDUSD=X', 0.57130122, 0.57390124, 0.56991100, 0.57120991, '2025-03-11 16:00:00', '2025-04-05 03:11:11'),
(117, 'NZDUSD=X', 0.57381892, 0.57420117, 0.56841111, 0.57370043, '2025-03-12 16:00:00', '2025-04-05 03:11:11'),
(118, 'NZDUSD=X', 0.57028991, 0.57492083, 0.56970966, 0.57031077, '2025-03-13 16:00:00', '2025-04-05 03:11:11'),
(119, 'NZDUSD=X', 0.57518870, 0.58136153, 0.57470936, 0.57525152, '2025-03-16 16:00:00', '2025-04-05 03:11:11'),
(120, 'NZDUSD=X', 0.58243829, 0.58319920, 0.57993877, 0.58246887, '2025-03-17 16:00:00', '2025-04-05 03:11:11'),
(121, 'NZDUSD=X', 0.58190960, 0.58229995, 0.57772076, 0.58185881, '2025-03-18 16:00:00', '2025-04-05 03:11:11'),
(122, 'NZDUSD=X', 0.58203155, 0.58210945, 0.57244915, 0.58216023, '2025-03-19 16:00:00', '2025-04-05 03:11:11'),
(123, 'NZDUSD=X', 0.57626927, 0.57679111, 0.57283938, 0.57618952, '2025-03-20 16:00:00', '2025-04-05 03:11:11'),
(124, 'NZDUSD=X', 0.57449144, 0.57502991, 0.57189918, 0.57454091, '2025-03-23 16:00:00', '2025-04-05 03:11:11'),
(125, 'NZDUSD=X', 0.57274097, 0.57513905, 0.57123923, 0.57267863, '2025-03-24 16:00:00', '2025-04-05 03:11:11'),
(126, 'NZDUSD=X', 0.57337147, 0.57634896, 0.57183051, 0.57330906, '2025-03-25 16:00:00', '2025-04-05 03:11:11'),
(127, 'NZDUSD=X', 0.57185990, 0.57560915, 0.57185990, 0.57189918, '2025-03-26 16:00:00', '2025-04-05 03:11:11'),
(128, 'NZDUSD=X', 0.57357866, 0.57364118, 0.57115996, 0.57364118, '2025-03-27 16:00:00', '2025-04-05 03:11:11'),
(129, 'NZDUSD=X', 0.57072091, 0.57229847, 0.56501001, 0.57071108, '2025-03-30 16:00:00', '2025-04-05 03:11:11'),
(130, 'NZDUSD=X', 0.56698984, 0.57052875, 0.56638932, 0.56705093, '2025-03-31 16:00:00', '2025-04-05 03:11:11'),
(131, 'NZDUSD=X', 0.57126862, 0.57479990, 0.57034981, 0.57138938, '2025-04-01 16:00:00', '2025-04-05 03:11:11'),
(132, 'NZDUSD=X', 0.57271141, 0.58516145, 0.57218057, 0.57276064, '2025-04-02 16:00:00', '2025-04-05 03:11:11'),
(133, 'NZDUSD=X', 0.57907236, 0.57987827, 0.55537039, 0.55969107, '2025-04-03 16:00:00', '2025-04-05 03:11:11'),
(134, 'USDCHF=X', 0.89069003, 0.89253002, 0.88286000, 0.89069003, '2025-03-05 16:00:00', '2025-04-05 03:14:10'),
(135, 'USDCHF=X', 0.88331997, 0.88331002, 0.87682998, 0.88331997, '2025-03-06 16:00:00', '2025-04-05 03:14:10'),
(136, 'USDCHF=X', 0.87734002, 0.88159001, 0.87585002, 0.87734002, '2025-03-09 16:00:00', '2025-04-05 03:14:10'),
(137, 'USDCHF=X', 0.87998003, 0.88244998, 0.87730002, 0.87998003, '2025-03-10 16:00:00', '2025-04-05 03:14:10'),
(138, 'USDCHF=X', 0.88344002, 0.88519001, 0.88003999, 0.88344002, '2025-03-11 16:00:00', '2025-04-05 03:14:10'),
(139, 'USDCHF=X', 0.88177001, 0.88534999, 0.88034999, 0.88177001, '2025-03-12 16:00:00', '2025-04-05 03:14:10'),
(140, 'USDCHF=X', 0.88261998, 0.88626999, 0.88208997, 0.88261998, '2025-03-13 16:00:00', '2025-04-05 03:14:10'),
(141, 'USDCHF=X', 0.88409001, 0.88471001, 0.87983000, 0.88409001, '2025-03-16 16:00:00', '2025-04-05 03:14:10'),
(142, 'USDCHF=X', 0.88120198, 0.88182998, 0.87680000, 0.88120198, '2025-03-17 16:00:00', '2025-04-05 03:14:10'),
(143, 'USDCHF=X', 0.87674499, 0.88089001, 0.87650001, 0.87674499, '2025-03-18 16:00:00', '2025-04-05 03:14:10'),
(144, 'USDCHF=X', 0.87639999, 0.88414001, 0.87559998, 0.87639999, '2025-03-19 16:00:00', '2025-04-05 03:14:10'),
(145, 'USDCHF=X', 0.88137698, 0.88395000, 0.87971002, 0.88137698, '2025-03-20 16:00:00', '2025-04-05 03:14:10'),
(146, 'USDCHF=X', 0.88292003, 0.88454002, 0.87997001, 0.88292003, '2025-03-23 16:00:00', '2025-04-05 03:14:10'),
(147, 'USDCHF=X', 0.88269001, 0.88480997, 0.88006997, 0.88269001, '2025-03-24 16:00:00', '2025-04-05 03:14:10'),
(148, 'USDCHF=X', 0.88265002, 0.88459003, 0.88239998, 0.88265002, '2025-03-25 16:00:00', '2025-04-05 03:14:10'),
(149, 'USDCHF=X', 0.88415998, 0.88467002, 0.88051999, 0.88415998, '2025-03-26 16:00:00', '2025-04-05 03:14:10'),
(150, 'USDCHF=X', 0.88139999, 0.88339001, 0.88006002, 0.88139999, '2025-03-27 16:00:00', '2025-04-05 03:14:10'),
(151, 'USDCHF=X', 0.88085002, 0.88529998, 0.87814999, 0.88085002, '2025-03-30 16:00:00', '2025-04-05 03:14:10'),
(152, 'USDCHF=X', 0.88382000, 0.88429999, 0.88160002, 0.88382000, '2025-03-31 16:00:00', '2025-04-05 03:14:10'),
(153, 'USDCHF=X', 0.88340002, 0.88480002, 0.88139999, 0.88340002, '2025-04-01 16:00:00', '2025-04-05 03:14:10'),
(154, 'USDCHF=X', 0.87678999, 0.87884003, 0.85487002, 0.87678999, '2025-04-02 16:00:00', '2025-04-05 03:14:10'),
(155, 'USDCHF=X', 0.85820001, 0.86255002, 0.84763002, 0.85993999, '2025-04-03 16:00:00', '2025-04-05 03:14:10'),
(156, 'EURUSD=X', 1.07949388, 1.08510470, 1.07824850, 1.07949388, '2025-03-05 16:00:00', '2025-04-05 03:18:18'),
(157, 'EURUSD=X', 1.07879519, 1.08856571, 1.07821357, 1.07879519, '2025-03-06 16:00:00', '2025-04-05 03:18:18'),
(158, 'EURUSD=X', 1.08605933, 1.08734655, 1.08062541, 1.08605933, '2025-03-09 16:00:00', '2025-04-05 03:18:18'),
(159, 'EURUSD=X', 1.08394039, 1.09302759, 1.08368194, 1.08394039, '2025-03-10 16:00:00', '2025-04-05 03:18:18'),
(160, 'EURUSD=X', 1.09141707, 1.09345782, 1.08772504, 1.09141707, '2025-03-11 16:00:00', '2025-04-05 03:18:18'),
(161, 'EURUSD=X', 1.08862495, 1.08991826, 1.08229792, 1.08862495, '2025-03-12 16:00:00', '2025-04-05 03:18:18'),
(162, 'EURUSD=X', 1.08556414, 1.09101224, 1.08313024, 1.08556414, '2025-03-13 16:00:00', '2025-04-05 03:18:18'),
(163, 'EURUSD=X', 1.08812749, 1.09289610, 1.08692110, 1.08812749, '2025-03-16 16:00:00', '2025-04-05 03:18:18'),
(164, 'EURUSD=X', 1.09191763, 1.09544623, 1.08970439, 1.09191763, '2025-03-17 16:00:00', '2025-04-05 03:18:18'),
(165, 'EURUSD=X', 1.09394825, 1.09457088, 1.08759487, 1.09394825, '2025-03-18 16:00:00', '2025-04-05 03:18:18'),
(166, 'EURUSD=X', 1.09119081, 1.09175074, 1.08182967, 1.09119081, '2025-03-19 16:00:00', '2025-04-05 03:18:18'),
(167, 'EURUSD=X', 1.08567023, 1.08613014, 1.08056712, 1.08567023, '2025-03-20 16:00:00', '2025-04-05 03:18:18'),
(168, 'EURUSD=X', 1.08357620, 1.08569384, 1.07907450, 1.08357620, '2025-03-23 16:00:00', '2025-04-05 03:18:18'),
(169, 'EURUSD=X', 1.08035696, 1.08307159, 1.07786500, 1.08035696, '2025-03-24 16:00:00', '2025-04-05 03:18:18'),
(170, 'EURUSD=X', 1.07874870, 1.08022857, 1.07687831, 1.07874870, '2025-03-25 16:00:00', '2025-04-05 03:18:18'),
(171, 'EURUSD=X', 1.07420611, 1.08187640, 1.07420611, 1.07420611, '2025-03-26 16:00:00', '2025-04-05 03:18:18'),
(172, 'EURUSD=X', 1.08010018, 1.08452809, 1.07658851, 1.08010018, '2025-03-27 16:00:00', '2025-04-05 03:18:18'),
(173, 'EURUSD=X', 1.08239162, 1.08484578, 1.07857406, 1.08239162, '2025-03-30 16:00:00', '2025-04-05 03:18:18'),
(174, 'EURUSD=X', 1.08188808, 1.08307159, 1.07795787, 1.08188808, '2025-03-31 16:00:00', '2025-04-05 03:18:18'),
(175, 'EURUSD=X', 1.07959878, 1.08726382, 1.07820201, 1.07959878, '2025-04-01 16:00:00', '2025-04-05 03:18:18'),
(176, 'EURUSD=X', 1.09086943, 1.11333787, 1.08824587, 1.09086943, '2025-04-02 16:00:00', '2025-04-05 03:18:18'),
(177, 'EURUSD=X', 1.10533881, 1.11098766, 1.09289610, 1.09625089, '2025-04-03 16:00:00', '2025-04-05 03:18:18'),
(178, 'AUDUSD=X', 0.63374972, 0.63605988, 0.63235909, 0.63380998, '2025-03-05 16:00:00', '2025-04-05 03:30:08'),
(179, 'AUDUSD=X', 0.63319188, 0.63389999, 0.62843996, 0.63322800, '2025-03-06 16:00:00', '2025-04-05 03:30:08'),
(180, 'AUDUSD=X', 0.63029051, 0.63311177, 0.63011175, 0.63038981, '2025-03-09 16:00:00', '2025-04-05 03:30:08'),
(181, 'AUDUSD=X', 0.62810123, 0.62979984, 0.62607998, 0.62795138, '2025-03-10 16:00:00', '2025-04-05 03:30:08'),
(182, 'AUDUSD=X', 0.62965155, 0.63211006, 0.62774992, 0.62952864, '2025-03-11 16:00:00', '2025-04-05 03:30:08'),
(183, 'AUDUSD=X', 0.63291937, 0.63359994, 0.62696987, 0.63275921, '2025-03-12 16:00:00', '2025-04-05 03:30:08'),
(184, 'AUDUSD=X', 0.62866193, 0.63280004, 0.62788826, 0.62874103, '2025-03-13 16:00:00', '2025-04-05 03:30:08'),
(185, 'AUDUSD=X', 0.63257110, 0.63759243, 0.63219917, 0.63261914, '2025-03-16 16:00:00', '2025-04-05 03:30:08'),
(186, 'AUDUSD=X', 0.63823950, 0.63919818, 0.63451010, 0.63819873, '2025-03-17 16:00:00', '2025-04-05 03:30:08'),
(187, 'AUDUSD=X', 0.63616061, 0.63690215, 0.63218999, 0.63612020, '2025-03-18 16:00:00', '2025-04-05 03:30:08'),
(188, 'AUDUSD=X', 0.63635904, 0.63639140, 0.62729001, 0.63641167, '2025-03-19 16:00:00', '2025-04-05 03:30:08'),
(189, 'AUDUSD=X', 0.63031828, 0.63069993, 0.62604982, 0.63038981, '2025-03-20 16:00:00', '2025-04-05 03:30:08'),
(190, 'AUDUSD=X', 0.62885964, 0.63051707, 0.62729985, 0.62883192, '2025-03-23 16:00:00', '2025-04-05 03:30:08'),
(191, 'AUDUSD=X', 0.62868172, 0.63253105, 0.62790996, 0.62859082, '2025-03-24 16:00:00', '2025-04-05 03:30:08'),
(192, 'AUDUSD=X', 0.63079983, 0.63319993, 0.62833804, 0.63090008, '2025-03-25 16:00:00', '2025-04-05 03:30:08'),
(193, 'AUDUSD=X', 0.62866986, 0.63210005, 0.62866986, 0.62870151, '2025-03-26 16:00:00', '2025-04-05 03:30:08'),
(194, 'AUDUSD=X', 0.63009989, 0.63118005, 0.62812018, 0.63015944, '2025-03-27 16:00:00', '2025-04-05 03:30:08'),
(195, 'AUDUSD=X', 0.62825119, 0.63004029, 0.62191993, 0.62829071, '2025-03-30 16:00:00', '2025-04-05 03:30:08'),
(196, 'AUDUSD=X', 0.62404054, 0.62823933, 0.62325990, 0.62418854, '2025-03-31 16:00:00', '2025-04-05 03:30:08'),
(197, 'AUDUSD=X', 0.62887150, 0.63171196, 0.62734979, 0.62895846, '2025-04-01 16:00:00', '2025-04-05 03:30:08'),
(198, 'AUDUSD=X', 0.62640941, 0.63867974, 0.62577987, 0.62646985, '2025-04-02 16:00:00', '2025-04-05 03:30:08'),
(199, 'AUDUSD=X', 0.63287133, 0.63364530, 0.59898174, 0.60459489, '2025-04-03 16:00:00', '2025-04-05 03:30:08'),
(200, 'AUDUSD=X', 0.63374972, 0.63605988, 0.63235909, 0.63380998, '2025-03-05 16:00:00', '2025-04-05 03:30:25'),
(201, 'AUDUSD=X', 0.63319188, 0.63389999, 0.62843996, 0.63322800, '2025-03-06 16:00:00', '2025-04-05 03:30:25'),
(202, 'AUDUSD=X', 0.63029051, 0.63311177, 0.63011175, 0.63038981, '2025-03-09 16:00:00', '2025-04-05 03:30:25'),
(203, 'AUDUSD=X', 0.62810123, 0.62979984, 0.62607998, 0.62795138, '2025-03-10 16:00:00', '2025-04-05 03:30:25'),
(204, 'AUDUSD=X', 0.62965155, 0.63211006, 0.62774992, 0.62952864, '2025-03-11 16:00:00', '2025-04-05 03:30:25'),
(205, 'AUDUSD=X', 0.63291937, 0.63359994, 0.62696987, 0.63275921, '2025-03-12 16:00:00', '2025-04-05 03:30:25'),
(206, 'AUDUSD=X', 0.62866193, 0.63280004, 0.62788826, 0.62874103, '2025-03-13 16:00:00', '2025-04-05 03:30:25'),
(207, 'AUDUSD=X', 0.63257110, 0.63759243, 0.63219917, 0.63261914, '2025-03-16 16:00:00', '2025-04-05 03:30:25'),
(208, 'AUDUSD=X', 0.63823950, 0.63919818, 0.63451010, 0.63819873, '2025-03-17 16:00:00', '2025-04-05 03:30:25'),
(209, 'AUDUSD=X', 0.63616061, 0.63690215, 0.63218999, 0.63612020, '2025-03-18 16:00:00', '2025-04-05 03:30:25'),
(210, 'AUDUSD=X', 0.63635904, 0.63639140, 0.62729001, 0.63641167, '2025-03-19 16:00:00', '2025-04-05 03:30:25'),
(211, 'AUDUSD=X', 0.63031828, 0.63069993, 0.62604982, 0.63038981, '2025-03-20 16:00:00', '2025-04-05 03:30:25'),
(212, 'AUDUSD=X', 0.62885964, 0.63051707, 0.62729985, 0.62883192, '2025-03-23 16:00:00', '2025-04-05 03:30:25'),
(213, 'AUDUSD=X', 0.62868172, 0.63253105, 0.62790996, 0.62859082, '2025-03-24 16:00:00', '2025-04-05 03:30:25'),
(214, 'AUDUSD=X', 0.63079983, 0.63319993, 0.62833804, 0.63090008, '2025-03-25 16:00:00', '2025-04-05 03:30:25'),
(215, 'AUDUSD=X', 0.62866986, 0.63210005, 0.62866986, 0.62870151, '2025-03-26 16:00:00', '2025-04-05 03:30:25'),
(216, 'AUDUSD=X', 0.63009989, 0.63118005, 0.62812018, 0.63015944, '2025-03-27 16:00:00', '2025-04-05 03:30:25'),
(217, 'AUDUSD=X', 0.62825119, 0.63004029, 0.62191993, 0.62829071, '2025-03-30 16:00:00', '2025-04-05 03:30:25'),
(218, 'AUDUSD=X', 0.62404054, 0.62823933, 0.62325990, 0.62418854, '2025-03-31 16:00:00', '2025-04-05 03:30:25'),
(219, 'AUDUSD=X', 0.62887150, 0.63171196, 0.62734979, 0.62895846, '2025-04-01 16:00:00', '2025-04-05 03:30:25'),
(220, 'AUDUSD=X', 0.62640941, 0.63867974, 0.62577987, 0.62646985, '2025-04-02 16:00:00', '2025-04-05 03:30:25'),
(221, 'AUDUSD=X', 0.63287133, 0.63364530, 0.59898174, 0.60459489, '2025-04-03 16:00:00', '2025-04-05 03:30:25');

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

INSERT INTO price_predictions (id, symbol, prediction_date, predicted_price, created_at) VALUES
(1, 'NZDUSD=X', '2025-04-06', 0.5704, '2025-04-05 11:11:11'),
(2, 'NZDUSD=X', '2025-04-07', 0.5702, '2025-04-05 11:11:11'),
(3, 'NZDUSD=X', '2025-04-08', 0.5700, '2025-04-05 11:11:11'),
(4, 'NZDUSD=X', '2025-04-09', 0.5697, '2025-04-05 11:11:11'),
(5, 'NZDUSD=X', '2025-04-10', 0.5695, '2025-04-05 11:11:11'),
(6, 'EURUSD=X', '2025-04-06', 1.0849, '2025-04-05 11:18:18'),
(7, 'EURUSD=X', '2025-04-07', 1.0849, '2025-04-05 11:18:18'),
(8, 'EURUSD=X', '2025-04-08', 1.0849, '2025-04-05 11:18:18'),
(9, 'EURUSD=X', '2025-04-09', 1.0849, '2025-04-05 11:18:18'),
(10, 'EURUSD=X', '2025-04-10', 1.0848, '2025-04-05 11:18:18'),
(36, 'USDCHF=X', '2025-04-06', 0.8768, '2025-04-05 11:14:10'),
(37, 'USDCHF=X', '2025-04-07', 0.8765, '2025-04-05 11:14:10'),
(38, 'USDCHF=X', '2025-04-08', 0.8761, '2025-04-05 11:14:10'),
(39, 'USDCHF=X', '2025-04-09', 0.8758, '2025-04-05 11:14:10'),
(40, 'USDCHF=X', '2025-04-10', 0.8754, '2025-04-05 11:14:10'),
(46, 'AUDUSD=X', '2025-04-06', 0.6233, '2025-04-05 11:30:25'),
(47, 'AUDUSD=X', '2025-04-07', 0.6228, '2025-04-05 11:30:25'),
(48, 'AUDUSD=X', '2025-04-08', 0.6223, '2025-04-05 11:30:25'),
(49, 'AUDUSD=X', '2025-04-09', 0.6217, '2025-04-05 11:30:25'),
(50, 'AUDUSD=X', '2025-04-10', 0.6212, '2025-04-05 11:30:25');

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

INSERT INTO support_resistance (id, symbol, level_type, level_value, updated_at) VALUES
(1, 'NZDUSD=X', 'support', 0.5597, '2025-04-05 11:11:11'),
(2, 'NZDUSD=X', 'support', 0.5671, '2025-04-05 11:11:11'),
(3, 'NZDUSD=X', 'support', 0.5695, '2025-04-05 11:11:11'),
(4, 'NZDUSD=X', 'resistance', 0.5825, '2025-04-05 11:11:11'),
(5, 'NZDUSD=X', 'resistance', 0.5822, '2025-04-05 11:11:11'),
(6, 'NZDUSD=X', 'resistance', 0.5819, '2025-04-05 11:11:11'),
(7, 'EURUSD=X', 'support', 1.0742, '2025-04-05 11:18:18'),
(8, 'EURUSD=X', 'support', 1.0787, '2025-04-05 11:18:18'),
(9, 'EURUSD=X', 'support', 1.0796, '2025-04-05 11:18:18'),
(10, 'EURUSD=X', 'resistance', 1.0963, '2025-04-05 11:18:18'),
(11, 'EURUSD=X', 'resistance', 1.0939, '2025-04-05 11:18:18'),
(12, 'EURUSD=X', 'resistance', 1.0919, '2025-04-05 11:18:18'),
(43, 'USDCHF=X', 'support', 0.8599, '2025-04-05 11:14:10'),
(44, 'USDCHF=X', 'support', 0.8764, '2025-04-05 11:14:10'),
(45, 'USDCHF=X', 'support', 0.8767, '2025-04-05 11:14:10'),
(46, 'USDCHF=X', 'resistance', 0.8842, '2025-04-05 11:14:10'),
(47, 'USDCHF=X', 'resistance', 0.8841, '2025-04-05 11:14:10'),
(48, 'USDCHF=X', 'resistance', 0.8838, '2025-04-05 11:14:10'),
(55, 'AUDUSD=X', 'support', 0.6046, '2025-04-05 11:30:25'),
(56, 'AUDUSD=X', 'support', 0.6242, '2025-04-05 11:30:25'),
(57, 'AUDUSD=X', 'support', 0.6265, '2025-04-05 11:30:25'),
(58, 'AUDUSD=X', 'resistance', 0.6382, '2025-04-05 11:30:25'),
(59, 'AUDUSD=X', 'resistance', 0.6364, '2025-04-05 11:30:25'),
(60, 'AUDUSD=X', 'resistance', 0.6361, '2025-04-05 11:30:25');

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

-- Table for simulation sessions
CREATE TABLE IF NOT EXISTS simulation_sessions (
  session_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES login(user_id),
  simulation_amount DECIMAL(20,2) NOT NULL,
  trading_type VARCHAR(20) NOT NULL CHECK (trading_type IN ('short-term', 'long-term')),
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  final_balance DECIMAL(20,2),
  profit_loss DECIMAL(20,2),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table for open orders in simulation
CREATE TABLE IF NOT EXISTS simulation_orders (
  order_id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES simulation_sessions(session_id),
  symbol VARCHAR(20) NOT NULL,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('buy', 'sell')),
  amount DECIMAL(20,2) NOT NULL,
  price DECIMAL(20,8),
  target_price DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  leverage INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'filled', 'canceled', 'partially_filled')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table for positions in simulation
CREATE TABLE IF NOT EXISTS simulation_positions (
  position_id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES simulation_sessions(session_id),
  symbol VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('buy', 'sell')),
  open_price DECIMAL(20,8) NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  take_profit DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  margin_used DECIMAL(20,2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  closing_price DECIMAL(20,8),
  profit_loss DECIMAL(20,2),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table for trade history in simulation
CREATE TABLE IF NOT EXISTS simulation_trade_history (
  trade_id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES simulation_sessions(session_id),
  position_id INTEGER REFERENCES simulation_positions(position_id),
  order_id INTEGER REFERENCES simulation_orders(order_id),
  symbol VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('buy', 'sell')),
  order_type VARCHAR(20) NOT NULL,
  open_price DECIMAL(20,8) NOT NULL,
  close_price DECIMAL(20,8) NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  profit_loss DECIMAL(20,2) NOT NULL,
  trade_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_sim_sessions_user ON simulation_sessions(user_id);
CREATE INDEX idx_sim_orders_session ON simulation_orders(session_id);
CREATE INDEX idx_sim_positions_session ON simulation_positions(session_id);
CREATE INDEX idx_sim_trade_history_session ON simulation_trade_history(session_id);

-- Long-term trading system tables
-- Create trading strategies table
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

-- Create simulation_long_term table
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

-- Insert default simulation periods
INSERT INTO simulation_periods (name, days, is_default, display_order)
VALUES
('1 Year', 365, TRUE, 1),
('6 Months', 180, FALSE, 2),
('3 Months', 90, FALSE, 3),
('1 Month', 30, FALSE, 4),
('2 Years', 730, FALSE, 5);

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