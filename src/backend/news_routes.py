from flask import Blueprint, jsonify, request
import requests
import os
import json
from datetime import datetime, timedelta
import logging
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

news_bp = Blueprint('news', __name__)

# Get NewsAPI key from environment, or use the provided key
NEWS_API_KEY = os.environ.get('NEWS_API_KEY', 'bfa5fbf17e864cf2a47694de22a333f8')

# Base URL for NewsAPI
NEWS_API_URL = "https://newsapi.org/v2/everything"

# Cache mechanism for news data to reduce API calls
news_cache = {}
CACHE_EXPIRY = 30 * 60  # 30 minutes in seconds

def get_cache_key(category, page=1):
    """Generate a cache key based on category and page"""
    return f"forex_news_{category}_{page}"

def get_from_cache(cache_key):
    """Get data from cache if available and not expired"""
    if cache_key in news_cache:
        cache_entry = news_cache[cache_key]
        # Check if cache is still valid
        if (datetime.now() - cache_entry['timestamp']).total_seconds() < CACHE_EXPIRY:
            logger.info(f"Using cached data for {cache_key}")
            return cache_entry['data']
        else:
            logger.info(f"Cache expired for {cache_key}")
    return None

def save_to_cache(cache_key, data):
    """Save data to cache with timestamp"""
    news_cache[cache_key] = {
        'data': data,
        'timestamp': datetime.now()
    }
    logger.info(f"Saved data to cache with key {cache_key}")
    
    # Save to file for persistence across restarts
    try:
        cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)
            
        cache_file = os.path.join(cache_dir, f"{cache_key}.json")
        with open(cache_file, 'w') as f:
            json.dump({
                'data': data,
                'timestamp': datetime.now().isoformat()
            }, f)
    except Exception as e:
        logger.error(f"Failed to write cache to file: {str(e)}")

def load_cache_from_files():
    """Load cache from files on startup"""
    try:
        cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
        if not os.path.exists(cache_dir):
            return
            
        for filename in os.listdir(cache_dir):
            if filename.endswith('.json') and filename.startswith('forex_news_'):
                cache_key = filename[:-5]  # Remove .json
                try:
                    with open(os.path.join(cache_dir, filename), 'r') as f:
                        cache_data = json.load(f)
                        # Convert timestamp string back to datetime
                        timestamp = datetime.fromisoformat(cache_data['timestamp'])
                        # Check if still valid
                        if (datetime.now() - timestamp).total_seconds() < CACHE_EXPIRY:
                            news_cache[cache_key] = {
                                'data': cache_data['data'],
                                'timestamp': timestamp
                            }
                            logger.info(f"Loaded valid cache for {cache_key}")
                except Exception as e:
                    logger.error(f"Failed to load cache file {filename}: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to load cache from files: {str(e)}")

# Load cache on module import
load_cache_from_files()

# Currency codes to full names mapping
CURRENCY_NAMES = {
    "USD": "US Dollar",
    "EUR": "Euro",
    "GBP": "British Pound",
    "JPY": "Japanese Yen",
    "AUD": "Australian Dollar",
    "NZD": "New Zealand Dollar",
    "CAD": "Canadian Dollar",
    "CHF": "Swiss Franc",
    "MXN": "Mexican Peso",
    "ZAR": "South African Rand",
    "TRY": "Turkish Lira",
    "BRL": "Brazilian Real",
    "CNY": "Chinese Yuan",
    "RUB": "Russian Ruble",
    "INR": "Indian Rupee"
}

def get_fallback_news():
    """Generate fallback news data when API is unavailable"""
    now = datetime.now()
    
    fallback_news = [
        {
            "id": f"fallback-1-{now.timestamp()}",
            "title": "Fed Signals Further Rate Cuts, USD Weakens Against Major Currencies",
            "summary": "The Federal Reserve indicated additional interest rate cuts are likely as inflation continues to moderate, leading to a weakening of the US dollar against major currencies, particularly the Euro and British Pound.",
            "source": "Financial Times",
            "date": (now - timedelta(days=1)).strftime('%Y-%m-%d'),
            "image": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            "url": "https://ft.com/markets/forex/usd-weakens",
            "impact": "High",
            "sentiment": "Bearish",
            "relatedCurrencies": ["USD", "EUR", "GBP"]
        },
        {
            "id": f"fallback-2-{now.timestamp()}",
            "title": "Bank of Japan Raises Rates, Yen Strengthens to Three-Year High",
            "summary": "The Bank of Japan raised interest rates for the second time this year, causing the yen to surge to a three-year high against the dollar as Japan moves away from its ultra-loose monetary policy.",
            "source": "Bloomberg",
            "date": (now - timedelta(days=3)).strftime('%Y-%m-%d'),
            "image": "https://images.unsplash.com/photo-1524673450801-b5aa9b621b76?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            "url": "https://bloomberg.com/markets/currencies/jpy-policy",
            "impact": "High",
            "sentiment": "Bullish",
            "relatedCurrencies": ["JPY", "USD"]
        },
        {
            "id": f"fallback-3-{now.timestamp()}",
            "title": "ECB Holds Rates Steady Amid Economic Growth Concerns, Euro Dips",
            "summary": "The European Central Bank maintained its current interest rate levels despite earlier expectations of a cut, citing concerns about persistent inflation. However, the euro still weakened against major currencies as growth forecasts were revised downward.",
            "source": "Reuters",
            "date": (now - timedelta(days=5)).strftime('%Y-%m-%d'),
            "image": "https://images.unsplash.com/photo-1561414927-6d86591d0c4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            "url": "https://reuters.com/markets/ecb-policy",
            "impact": "Medium",
            "sentiment": "Bearish",
            "relatedCurrencies": ["EUR", "USD", "GBP"]
        }
    ]
    
    return fallback_news

def determine_sentiment(title, description):
    """Basic sentiment analysis on news title and description"""
    positive_words = ["rise", "gain", "grows", "higher", "increase", "strengthen", "bullish", "rally", "surge", "positive", "growth", "recovery", "optimistic", "eased", "boost", "success", "upbeat"]
    negative_words = ["fall", "drop", "slip", "decline", "lower", "decrease", "weaken", "bearish", "crash", "negative", "contraction", "concern", "risk", "worry", "warn", "recession", "downward", "dire", "pessimistic"]
    
    text = (title + " " + description).lower()
    positive_count = sum(1 for word in positive_words if word in text)
    negative_count = sum(1 for word in negative_words if word in text)
    
    if positive_count > negative_count:
        return "Bullish"
    elif negative_count > positive_count:
        return "Bearish"
    else:
        return "Neutral"

def determine_impact(source, title):
    """Determine impact level based on source and title"""
    high_impact_sources = ["Financial Times", "Wall Street Journal", "Bloomberg", "Reuters", "CNBC"]
    high_impact_keywords = ["fed ", "ecb ", "boe ", "bank of japan", "rate", "inflation", "gdp", "recession", "crisis", "central bank"]
    
    if source in high_impact_sources:
        for keyword in high_impact_keywords:
            if keyword in title.lower():
                return "High"
        return "Medium"
    else:
        return "Low"

def determine_related_currencies(title, description, category):
    """Determine which currencies are related to the news article"""
    related = []
    text = (title + " " + description).lower()
    
    # Map of terms to currencies
    currency_terms = {
        "USD": ["dollar", "usd", "us economy", "fed ", "federal reserve", "united states"],
        "EUR": ["euro", "eur", "ecb", "european central bank", "eurozone", "europe"],
        "GBP": ["pound", "gbp", "sterling", "boe", "bank of england", "uk economy", "britain"],
        "JPY": ["yen", "jpy", "boj", "bank of japan", "japan"],
        "AUD": ["australian dollar", "aud", "australia", "rba", "reserve bank of australia"],
        "NZD": ["new zealand dollar", "nzd", "new zealand", "rbnz"],
        "CAD": ["canadian dollar", "cad", "canada", "boc", "bank of canada"],
        "CHF": ["swiss franc", "chf", "switzerland", "snb", "swiss national bank"],
        "CNY": ["yuan", "cny", "rmb", "china", "pboc"],
        "MXN": ["mexican peso", "mxn", "mexico"],
        "INR": ["indian rupee", "inr", "india", "rbi"],
    }
    
    # Check specific category first
    if category in currency_terms:
        related.append(category)
    
    # Add other currencies mentioned in the text
    for currency, terms in currency_terms.items():
        if currency != category:  # Skip if already added from category
            for term in terms:
                if term in text:
                    related.append(currency)
                    break
    
    # Always include at least one currency
    if not related:
        if "forex" in text or "currency" in text or "exchange rate" in text:
            related = ["USD", "EUR"]  # Default to major forex pairs
        else:
            related = ["USD"]  # Default to USD
    
    return related[:3]  # Limit to 3 currencies

@news_bp.route('/api/news/forex', methods=['GET'])
def get_forex_news():
    """Get forex related news from NewsAPI"""
    try:
        category = request.args.get('category', 'all')
        page = int(request.args.get('page', '1'))
        page_size = int(request.args.get('pageSize', '5'))
        force_refresh = request.args.get('forceRefresh', 'false').lower() == 'true'
        
        logger.info(f"Getting forex news with category: {category}, page: {page}")
        
        # Generate cache key
        cache_key = get_cache_key(category, page)
        
        # Check cache if not forcing refresh
        if not force_refresh:
            cached_data = get_from_cache(cache_key)
            if cached_data:
                return jsonify(cached_data), 200
        
        # Default search query
        search_query = "forex OR currency OR exchange rate OR dollar OR euro"
        
        # Adjust query based on category
        if category != 'all':
            if category == 'majors':
                search_query = "(USD OR EUR OR GBP OR JPY) AND forex"
            elif category == 'economic':
                search_query = "economy OR economic data OR GDP OR inflation OR employment"
            elif category == 'central_banks':
                search_query = "central bank OR fed OR ecb OR boe OR boj OR monetary policy OR interest rate"
            else:
                # For specific currency
                currency_code = category.upper()
                currency_name = CURRENCY_NAMES.get(currency_code, currency_code)
                search_query = f"{currency_code} OR {currency_name} OR {currency_name} exchange rate"
        
        # Set up API parameters - increase pageSize to get more articles we can paginate through
        params = {
            "apiKey": NEWS_API_KEY,
            "q": search_query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": page_size * 5,  # Get enough articles for multiple pages
            "domains": "reuters.com,ft.com,bloomberg.com,cnbc.com,wsj.com,economist.com,investing.com,marketwatch.com"
        }
        
        response = requests.get(NEWS_API_URL, params=params, timeout=5)
        
        if response.status_code == 200:
            news_data = response.json()
            
            # Transform the data to match our format
            all_articles = []
            for article in news_data.get("articles", []):
                # Extract source name
                source = article.get("source", {}).get("name", "Unknown Source")
                
                # Extract and format date
                published_at = article.get("publishedAt", "")
                date = published_at.split("T")[0] if "T" in published_at else published_at
                
                # Get article data
                title = article.get("title", "")
                description = article.get("description", "")
                url = article.get("url", "")
                image = article.get("urlToImage", "")
                
                # Skip articles without titles or descriptions
                if not title or not description:
                    continue
                
                # Generate a unique ID
                article_id = f"{source}-{date}-{hash(title) & 0xffffffff}"
                
                # Analyze sentiment and impact
                sentiment = determine_sentiment(title, description)
                impact = determine_impact(source, title)
                
                # Determine related currencies
                related_currencies = determine_related_currencies(title, description, category)
                
                # Create article object
                article_obj = {
                    "id": article_id,
                    "title": title,
                    "summary": description,
                    "source": source,
                    "date": date,
                    "image": image or "https://via.placeholder.com/500x200?text=Forex+News",
                    "url": url,
                    "impact": impact,
                    "sentiment": sentiment,
                    "relatedCurrencies": related_currencies
                }
                
                all_articles.append(article_obj)
            
            # Get total count of articles
            total_count = len(all_articles)
            
            # Calculate total pages
            total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
            
            # Paginate the articles
            start_idx = (page - 1) * page_size
            end_idx = min(start_idx + page_size, total_count)
            
            # Get articles for requested page
            paginated_articles = all_articles[start_idx:end_idx] if start_idx < total_count else []
            
            # Prepare response data
            response_data = {
                "articles": paginated_articles,
                "totalCount": total_count,
                "page": page,
                "pageSize": page_size,
                "totalPages": total_pages,
                "lastUpdated": datetime.now().isoformat(),
                "source": "NewsAPI"
            }
            
            # Save to cache
            save_to_cache(cache_key, response_data)
            
            # Return the transformed data
            return jsonify(response_data), 200
        else:
            logger.error(f"News API returned error: {response.status_code}, {response.text}")
            # Fall back to synthetic data
            fallback_articles = get_fallback_news()
            
            response_data = {
                "articles": fallback_articles,
                "totalCount": len(fallback_articles),
                "page": page,
                "pageSize": page_size,
                "totalPages": 1,
                "lastUpdated": datetime.now().isoformat(),
                "source": "Fallback Data"
            }
            
            # Save to cache
            save_to_cache(cache_key, response_data)
            
            return jsonify(response_data), 200
    
    except Exception as e:
        logger.error(f"Error getting forex news: {str(e)}")
        # Return fallback data in case of error
        fallback_articles = get_fallback_news()
        
        response_data = {
            "articles": fallback_articles,
            "totalCount": len(fallback_articles),
            "page": int(request.args.get('page', '1')),
            "pageSize": int(request.args.get('pageSize', '5')),
            "totalPages": 1,
            "lastUpdated": datetime.now().isoformat(),
            "source": "Fallback Data (Error)"
        }
        
        return jsonify(response_data), 200

@news_bp.route('/api/news/forex/clear-cache', methods=['POST'])
def clear_news_cache():
    """Clear the news cache"""
    try:
        category = request.args.get('category')
        
        if category:
            # Clear cache for specific category
            keys_to_remove = [k for k in news_cache.keys() if k.startswith(f"forex_news_{category}_")]
            for key in keys_to_remove:
                news_cache.pop(key, None)
                
            # Delete cache files
            cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
            if os.path.exists(cache_dir):
                for filename in os.listdir(cache_dir):
                    if filename.startswith(f"forex_news_{category}_") and filename.endswith('.json'):
                        os.remove(os.path.join(cache_dir, filename))
                        
            logger.info(f"Cleared cache for category: {category}")
        else:
            # Clear all news cache
            keys_to_remove = [k for k in news_cache.keys() if k.startswith("forex_news_")]
            for key in keys_to_remove:
                news_cache.pop(key, None)
                
            # Delete all cache files
            cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
            if os.path.exists(cache_dir):
                for filename in os.listdir(cache_dir):
                    if filename.startswith("forex_news_") and filename.endswith('.json'):
                        os.remove(os.path.join(cache_dir, filename))
                        
            logger.info("Cleared all news cache")
        
        return jsonify({"success": True, "message": "Cache cleared successfully"}), 200
    
    except Exception as e:
        logger.error(f"Error clearing news cache: {str(e)}")
        return jsonify({"success": False, "message": f"Error clearing cache: {str(e)}"}), 500 