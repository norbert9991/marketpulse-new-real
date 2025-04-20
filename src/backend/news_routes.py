from flask import Blueprint, jsonify, request
import requests
import os
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
        logger.info(f"Getting forex news with category: {category}")
        
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
        
        # Always use the API since we have a real key
        # Set up API parameters
        params = {
            "apiKey": NEWS_API_KEY,
            "q": search_query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 10,
            "domains": "reuters.com,ft.com,bloomberg.com,cnbc.com,wsj.com,economist.com,investing.com,marketwatch.com"
        }
        
        response = requests.get(NEWS_API_URL, params=params, timeout=5)
        
        if response.status_code == 200:
            news_data = response.json()
            
            # Transform the data to match our format
            articles = []
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
                
                articles.append(article_obj)
            
            # Return the transformed data
            return jsonify({
                "articles": articles,
                "totalCount": len(articles),
                "lastUpdated": datetime.now().isoformat(),
                "source": "NewsAPI"
            }), 200
        else:
            logger.error(f"News API returned error: {response.status_code}, {response.text}")
            # Fall back to synthetic data
            fallback_articles = get_fallback_news()
            return jsonify({
                "articles": fallback_articles,
                "totalCount": len(fallback_articles),
                "lastUpdated": datetime.now().isoformat(),
                "source": "Fallback Data"
            }), 200
    
    except Exception as e:
        logger.error(f"Error getting forex news: {str(e)}")
        # Return fallback data in case of error
        fallback_articles = get_fallback_news()
        return jsonify({
            "articles": fallback_articles,
            "totalCount": len(fallback_articles),
            "lastUpdated": datetime.now().isoformat(),
            "source": "Fallback Data (Error)"
        }), 200 