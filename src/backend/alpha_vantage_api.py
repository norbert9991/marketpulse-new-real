import requests
import pandas as pd
from datetime import datetime, timedelta
import os
import json
import time
from pathlib import Path

class AlphaVantageAPI:
    """
    Alpha Vantage API client with robust caching to minimize API calls
    """
    def __init__(self):
        # Get API key from environment variable
        self.api_key = os.environ.get('ALPHA_VANTAGE_API_KEY', 'demo')
        self.base_url = "https://www.alphavantage.co/query"
        
        # Cache configuration
        self.cache_dir = Path("cache/alpha_vantage")
        self.default_cache_expiry = 24 * 60 * 60  # 24 hours in seconds
        self.request_delay = 0.5  # Delay between API calls to prevent rate limiting
        self.last_request_time = 0
        
        # Ensure cache directory exists
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Memory cache for frequent requests
        self.memory_cache = {}
        
    def _get_cache_path(self, function, symbol, interval="daily"):
        """Generate a cache file path for the given parameters"""
        # Create a safe filename
        filename = f"{symbol.replace('=', '_')}_{function}_{interval}.json"
        return self.cache_dir / filename
    
    def _is_cache_valid(self, cache_path, expiry_seconds=None):
        """Check if cache file exists and is not expired"""
        if not cache_path.exists():
            return False
            
        # Use default expiry if none provided
        if expiry_seconds is None:
            expiry_seconds = self.default_cache_expiry
            
        # Check file modification time
        mtime = cache_path.stat().st_mtime
        age = time.time() - mtime
        
        return age < expiry_seconds
    
    def _read_cache(self, cache_path):
        """Read and return data from cache file"""
        with open(cache_path, 'r') as f:
            return json.load(f)
    
    def _write_cache(self, cache_path, data):
        """Write data to cache file"""
        with open(cache_path, 'w') as f:
            json.dump(data, f)
    
    def _rate_limit_request(self):
        """Apply rate limiting to prevent exceeding API limits"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.request_delay:
            time.sleep(self.request_delay - time_since_last_request)
            
        self.last_request_time = time.time()
    
    def get_daily_data(self, symbol, days=30, outputsize="compact", force_refresh=False):
        """
        Get daily time series data for a symbol with caching
        
        Parameters:
        - symbol: Stock or forex symbol (e.g., 'EURUSD')
        - days: Number of days of historical data needed
        - outputsize: 'compact' (last 100 data points) or 'full' (all available data)
        - force_refresh: If True, ignore cache and fetch new data
        
        Returns:
        - Pandas DataFrame with date, open, high, low, close, volume columns
        """
        function = "TIME_SERIES_DAILY"
        
        # Check memory cache first (fastest)
        memory_cache_key = f"{symbol}_{function}_{outputsize}"
        if not force_refresh and memory_cache_key in self.memory_cache:
            cache_item = self.memory_cache[memory_cache_key]
            if (time.time() - cache_item['timestamp']) < 3600:  # 1 hour memory cache
                return cache_item['data']
        
        # Check file cache next
        cache_path = self._get_cache_path(function, symbol)
        
        # Determine appropriate cache expiry based on days needed
        # For recent data (< 7 days), use shorter cache
        cache_expiry = 3600 if days <= 7 else self.default_cache_expiry
        
        # Use cache if valid and not forcing refresh
        if not force_refresh and self._is_cache_valid(cache_path, cache_expiry):
            print(f"Using cached data for {symbol}")
            cached_data = self._read_cache(cache_path)
            
            # Convert to DataFrame
            if 'Time Series (Daily)' in cached_data:
                df = pd.DataFrame.from_dict(cached_data['Time Series (Daily)'], orient='index')
                df.index = pd.to_datetime(df.index)
                df = df.sort_index()
                
                # Rename columns
                df.columns = [c.split('. ')[1] for c in df.columns]
                
                # Convert to numeric
                for col in df.columns:
                    df[col] = pd.to_numeric(df[col])
                
                # Filter to requested days
                if days > 0:
                    start_date = datetime.now().date() - timedelta(days=days)
                    df = df[df.index >= pd.Timestamp(start_date)]
                
                # Store in memory cache
                self.memory_cache[memory_cache_key] = {
                    'data': df,
                    'timestamp': time.time()
                }
                
                return df
        
        # Apply rate limiting
        self._rate_limit_request()
        
        # Make API request
        print(f"Fetching fresh data from Alpha Vantage for {symbol}")
        params = {
            'function': function,
            'symbol': symbol,
            'outputsize': outputsize,
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()  # Raise exception for HTTP errors
            data = response.json()
            
            # Check for error messages
            if 'Error Message' in data:
                print(f"Alpha Vantage API error: {data['Error Message']}")
                return pd.DataFrame()  # Return empty DataFrame on error
                
            # Cache the raw response
            self._write_cache(cache_path, data)
            
            # Convert to DataFrame
            if 'Time Series (Daily)' in data:
                df = pd.DataFrame.from_dict(data['Time Series (Daily)'], orient='index')
                df.index = pd.to_datetime(df.index)
                df = df.sort_index()
                
                # Rename columns
                df.columns = [c.split('. ')[1] for c in df.columns]
                
                # Convert to numeric
                for col in df.columns:
                    df[col] = pd.to_numeric(df[col])
                
                # Filter to requested days
                if days > 0:
                    start_date = datetime.now().date() - timedelta(days=days)
                    df = df[df.index >= pd.Timestamp(start_date)]
                
                # Store in memory cache
                self.memory_cache[memory_cache_key] = {
                    'data': df,
                    'timestamp': time.time()
                }
                
                return df
            
            return pd.DataFrame()  # Return empty DataFrame if no data
            
        except Exception as e:
            print(f"Error fetching data from Alpha Vantage: {e}")
            
            # If we have cached data, use it as fallback even if expired
            if cache_path.exists():
                print(f"Using expired cache as fallback for {symbol}")
                try:
                    cached_data = self._read_cache(cache_path)
                    if 'Time Series (Daily)' in cached_data:
                        df = pd.DataFrame.from_dict(cached_data['Time Series (Daily)'], orient='index')
                        df.index = pd.to_datetime(df.index)
                        df = df.sort_index()
                        
                        # Rename columns
                        df.columns = [c.split('. ')[1] for c in df.columns]
                        
                        # Convert to numeric
                        for col in df.columns:
                            df[col] = pd.to_numeric(df[col])
                        
                        # Filter to requested days
                        if days > 0:
                            start_date = datetime.now().date() - timedelta(days=days)
                            df = df[df.index >= pd.Timestamp(start_date)]
                        
                        return df
                except:
                    pass
            
            return pd.DataFrame()  # Return empty DataFrame on error
    
    def get_forex_data(self, from_currency, to_currency, days=30, force_refresh=False):
        """
        Get forex time series data with caching
        
        Parameters:
        - from_currency: Base currency code (e.g., 'EUR')
        - to_currency: Quote currency code (e.g., 'USD')
        - days: Number of days of historical data needed
        - force_refresh: If True, ignore cache and fetch new data
        
        Returns:
        - Pandas DataFrame with date, open, high, low, close columns
        """
        function = "FX_DAILY"
        symbol = f"{from_currency}{to_currency}"
        
        # Check memory cache first (fastest)
        memory_cache_key = f"{symbol}_{function}"
        if not force_refresh and memory_cache_key in self.memory_cache:
            cache_item = self.memory_cache[memory_cache_key]
            if (time.time() - cache_item['timestamp']) < 3600:  # 1 hour memory cache
                return cache_item['data']
        
        # Check file cache next
        cache_path = self._get_cache_path(function, symbol)
        
        # Determine appropriate cache expiry based on days needed
        # For recent data (< 7 days), use shorter cache
        cache_expiry = 3600 if days <= 7 else self.default_cache_expiry
        
        # Use cache if valid and not forcing refresh
        if not force_refresh and self._is_cache_valid(cache_path, cache_expiry):
            print(f"Using cached forex data for {symbol}")
            cached_data = self._read_cache(cache_path)
            
            # Convert to DataFrame
            if 'Time Series FX (Daily)' in cached_data:
                df = pd.DataFrame.from_dict(cached_data['Time Series FX (Daily)'], orient='index')
                df.index = pd.to_datetime(df.index)
                df = df.sort_index()
                
                # Rename columns
                df.columns = [c.split('. ')[1] for c in df.columns]
                
                # Convert to numeric
                for col in df.columns:
                    df[col] = pd.to_numeric(df[col])
                
                # Filter to requested days
                if days > 0:
                    start_date = datetime.now().date() - timedelta(days=days)
                    df = df[df.index >= pd.Timestamp(start_date)]
                
                # Store in memory cache
                self.memory_cache[memory_cache_key] = {
                    'data': df,
                    'timestamp': time.time()
                }
                
                return df
        
        # Apply rate limiting
        self._rate_limit_request()
        
        # Make API request
        print(f"Fetching fresh forex data from Alpha Vantage for {symbol}")
        params = {
            'function': function,
            'from_symbol': from_currency,
            'to_symbol': to_currency,
            'outputsize': 'full',
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()  # Raise exception for HTTP errors
            data = response.json()
            
            # Check for error messages
            if 'Error Message' in data:
                print(f"Alpha Vantage API error: {data['Error Message']}")
                return pd.DataFrame()  # Return empty DataFrame on error
                
            # Cache the raw response
            self._write_cache(cache_path, data)
            
            # Convert to DataFrame
            if 'Time Series FX (Daily)' in data:
                df = pd.DataFrame.from_dict(data['Time Series FX (Daily)'], orient='index')
                df.index = pd.to_datetime(df.index)
                df = df.sort_index()
                
                # Rename columns
                df.columns = [c.split('. ')[1] for c in df.columns]
                
                # Convert to numeric
                for col in df.columns:
                    df[col] = pd.to_numeric(df[col])
                
                # Filter to requested days
                if days > 0:
                    start_date = datetime.now().date() - timedelta(days=days)
                    df = df[df.index >= pd.Timestamp(start_date)]
                
                # Store in memory cache
                self.memory_cache[memory_cache_key] = {
                    'data': df,
                    'timestamp': time.time()
                }
                
                return df
            
            return pd.DataFrame()  # Return empty DataFrame if no data
            
        except Exception as e:
            print(f"Error fetching forex data from Alpha Vantage: {e}")
            
            # If we have cached data, use it as fallback even if expired
            if cache_path.exists():
                print(f"Using expired cache as fallback for {symbol}")
                try:
                    cached_data = self._read_cache(cache_path)
                    if 'Time Series FX (Daily)' in cached_data:
                        df = pd.DataFrame.from_dict(cached_data['Time Series FX (Daily)'], orient='index')
                        df.index = pd.to_datetime(df.index)
                        df = df.sort_index()
                        
                        # Rename columns
                        df.columns = [c.split('. ')[1] for c in df.columns]
                        
                        # Convert to numeric
                        for col in df.columns:
                            df[col] = pd.to_numeric(df[col])
                        
                        # Filter to requested days
                        if days > 0:
                            start_date = datetime.now().date() - timedelta(days=days)
                            df = df[df.index >= pd.Timestamp(start_date)]
                        
                        return df
                except:
                    pass
            
            return pd.DataFrame()  # Return empty DataFrame on error


# Create a singleton instance for use across the application
alpha_vantage = AlphaVantageAPI() 