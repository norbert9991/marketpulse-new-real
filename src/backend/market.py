from fastapi import FastAPI
import random
import time
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated forex pairs
forex_pairs = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD"]
market_data: Dict[str, Dict] = {}

# Initialize market data
def generate_initial_data():
    for pair in forex_pairs:
        base_price = round(random.uniform(1.0, 1.5), 5)
        spread = round(random.uniform(0.0001, 0.0005), 5)
        market_data[pair] = {
            "buy": round(base_price + spread, 5),
            "sell": base_price,
            "spread": spread,
            "history": [(int(time.time()), base_price)]  # Timestamp, price
        }

generate_initial_data()

# Update prices dynamically
def update_prices():
    while True:
        time.sleep(1)
        for pair in forex_pairs:
            change = round(random.uniform(-0.0003, 0.0003), 5)
            new_price = round(market_data[pair]["sell"] + change, 5)
            spread = round(random.uniform(0.0001, 0.0005), 5)
            market_data[pair]["sell"] = new_price
            market_data[pair]["buy"] = round(new_price + spread, 5)
            market_data[pair]["spread"] = spread
            market_data[pair]["history"].append((int(time.time()), new_price))

import threading
threading.Thread(target=update_prices, daemon=True).start()

@app.get("/markets")
def get_market_data():
    return market_data

@app.get("/candlestick/{pair}")
def get_candlestick_data(pair: str):
    return market_data.get(pair, {}).get("history", [])
