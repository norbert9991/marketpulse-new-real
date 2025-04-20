from flask import Blueprint, jsonify, request
import requests
import os
import json
from datetime import datetime, timedelta
import logging
import random
import hashlib
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

# Cache directory
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Cache settings
CACHE_DURATION = 60 * 60  # 1 hour in seconds

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

def get_cache_path(category):
    """Generate a cache file path for a specific category"""
    # Create a safe filename from the category
    filename = f"forex_news_{category}.json"
    return os.path.join(CACHE_DIR, filename)

def get_cached_news(category):
    """Get news from cache if available and not expired"""
    cache_path = get_cache_path(category)
    
    if not os.path.exists(cache_path):
        return None
    
    try:
        with open(cache_path, 'r') as f:
            cache_data = json.load(f)
        
        # Check if cache is expired
        cached_time = cache_data.get('timestamp', 0)
        current_time = int(datetime.now().timestamp())
        
        if current_time - cached_time <= CACHE_DURATION:
            logger.info(f"Using cached news data for category: {category}")
            return cache_data.get('data')
        else:
            logger.info(f"Cache expired for category: {category}")
            return None
    except Exception as e:
        logger.error(f"Error reading cache: {str(e)}")
        return None

def save_to_cache(category, data):
    """Save news data to cache"""
    cache_path = get_cache_path(category)
    
    try:
        cache_data = {
            'timestamp': int(datetime.now().timestamp()),
            'data': data
        }
        
        with open(cache_path, 'w') as f:
            json.dump(cache_data, f)
        
        logger.info(f"Saved news data to cache for category: {category}")
        return True
    except Exception as e:
        logger.error(f"Error saving to cache: {str(e)}")
        return False

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
    
    # If category is a specific currency code, make sure it's the first in the list
    if category.upper() in CURRENCY_NAMES:
        related.append(category.upper())
    
    # Add other currencies mentioned in the text
    for currency, terms in currency_terms.items():
        if currency not in related:  # Skip if already added from category
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

def filter_articles_by_category(articles, category):
    """Filter articles based on the selected category"""
    if category.lower() == 'all':
        return articles
    
    filtered = []
    
    # Ensure case-insensitive comparison for currency codes
    category_upper = category.upper()
    
    # If category is a specific currency
    if category_upper in CURRENCY_NAMES:
        currency = category_upper
        logger.info(f"Filtering for specific currency: {currency}")
        for article in articles:
            # Look for explicit mentions in the title or summary
            article_text = (article['title'] + " " + article['summary']).upper()
            if (
                currency in article_text or 
                CURRENCY_NAMES[currency].upper() in article_text
            ):
                # Make sure this currency is in relatedCurrencies
                if currency not in article['relatedCurrencies']:
                    article['relatedCurrencies'].insert(0, currency)
                    if len(article['relatedCurrencies']) > 3:
                        article['relatedCurrencies'] = article['relatedCurrencies'][:3]
                filtered.append(article)
            # Also include if it's already identified as related
            elif currency in article['relatedCurrencies']:
                # Ensure this currency is first in the list
                article['relatedCurrencies'].remove(currency)
                article['relatedCurrencies'].insert(0, currency)
                filtered.append(article)
    
    # For special categories
    elif category.lower() == 'majors':
        logger.info("Filtering for major currency pairs")
        major_currencies = ['USD', 'EUR', 'GBP', 'JPY']
        for article in articles:
            if any(currency in article['relatedCurrencies'] for currency in major_currencies):
                filtered.append(article)
    
    elif category.lower() == 'economic':
        logger.info("Filtering for economic news")
        economic_terms = ['gdp', 'inflation', 'employment', 'economy', 'economic', 'growth', 'recession']
        for article in articles:
            text = (article['title'] + " " + article['summary']).lower()
            if any(term in text for term in economic_terms):
                filtered.append(article)
    
    elif category.lower() == 'central_banks':
        logger.info("Filtering for central bank news")
        bank_terms = ['central bank', 'fed', 'federal reserve', 'ecb', 'european central bank', 
                     'boe', 'bank of england', 'boj', 'bank of japan', 'rba', 'reserve bank',
                     'interest rate', 'rate decision', 'monetary policy']
        for article in articles:
            text = (article['title'] + " " + article['summary']).lower()
            if any(term in text for term in bank_terms):
                filtered.append(article)
    
    logger.info(f"Filtered to {len(filtered)} articles for category: {category}")
    return filtered

@news_bp.route('/api/news/forex', methods=['GET'])
def get_forex_news():
    """Get forex related news from NewsAPI"""
    try:
        category = request.args.get('category', 'all')
        # Normalize category
        if category.lower() in ['central_banks', 'central-banks']:
            category = 'central_banks'
        
        force_refresh = request.args.get('force', 'false').lower() == 'true'
        logger.info(f"Getting forex news with category: {category}, force refresh: {force_refresh}")
        
        # Check for cached data first if not forcing refresh
        if not force_refresh:
            cached_data = get_cached_news(category)
            if cached_data:
                logger.info(f"Returning {len(cached_data.get('articles', []))} cached articles for category: {category}")
                return jsonify(cached_data), 200
        
        # Default search query - broad forex terms to get a variety of articles
        search_query = "forex OR currency OR exchange rate OR dollar OR euro OR yen OR pound"
        
        # Set up API parameters - always fetch a broader set and filter later
        params = {
            "apiKey": NEWS_API_KEY,
            "q": search_query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 30,  # Request more articles to ensure we have enough after filtering
            "domains": "reuters.com,ft.com,bloomberg.com,cnbc.com,wsj.com,economist.com,investing.com,marketwatch.com,fxstreet.com"
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
                
                # Log for debugging
                logger.debug(f"Article: '{title[:50]}...' - Related currencies: {related_currencies}")
                
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
            
            # Now filter articles based on category
            filtered_articles = filter_articles_by_category(all_articles, category)
            
            # Log summary of filtering
            logger.info(f"Retrieved {len(all_articles)} articles from API, filtered to {len(filtered_articles)} for category '{category}'")
            
            # Create the response data
            response_data = {
                "articles": filtered_articles,
                "totalCount": len(filtered_articles),
                "lastUpdated": datetime.now().isoformat(),
                "source": "NewsAPI",
                "category": category
            }
            
            # Save to cache
            save_to_cache(category, response_data)
            
            # Return the filtered data
            return jsonify(response_data), 200
        else:
            logger.error(f"News API returned error: {response.status_code}, {response.text}")
            # Try to get from cache first even if it's expired
            expired_cache = get_cached_news(category)
            if expired_cache:
                expired_cache["source"] = "Expired Cache"
                return jsonify(expired_cache), 200
                
            # Fall back to synthetic data if no cache available
            fallback_articles = get_fallback_news()
            response_data = {
                "articles": fallback_articles,
                "totalCount": len(fallback_articles),
                "lastUpdated": datetime.now().isoformat(),
                "source": "Fallback Data",
                "category": category
            }
            return jsonify(response_data), 200
    
    except Exception as e:
        logger.error(f"Error getting forex news: {str(e)}")
        # Try to get from cache first even if it's expired
        expired_cache = get_cached_news(category)
        if expired_cache:
            expired_cache["source"] = "Expired Cache (Error Recovery)"
            return jsonify(expired_cache), 200
            
        # Return fallback data in case of error
        fallback_articles = get_fallback_news()
        response_data = {
            "articles": fallback_articles,
            "totalCount": len(fallback_articles),
            "lastUpdated": datetime.now().isoformat(),
            "source": "Fallback Data (Error)",
            "category": category
        }
        return jsonify(response_data), 200

@news_bp.route('/api/news/forex/clear-cache', methods=['POST'])
def clear_news_cache():
    """Clear the news cache"""
    try:
        category = request.args.get('category')
        
        if category:
            # Clear specific category
            cache_path = get_cache_path(category)
            if os.path.exists(cache_path):
                os.remove(cache_path)
                logger.info(f"Cleared cache for category: {category}")
        else:
            # Clear all categories
            for file in os.listdir(CACHE_DIR):
                if file.startswith('forex_news_') and file.endswith('.json'):
                    os.remove(os.path.join(CACHE_DIR, file))
            logger.info("Cleared all news cache")
        
        return jsonify({"success": True, "message": "Cache cleared successfully"}), 200
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        return jsonify({"success": False, "message": f"Error clearing cache: {str(e)}"}), 500 