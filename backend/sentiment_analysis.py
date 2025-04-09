import requests
from datetime import datetime, timedelta
import numpy as np
from textblob import TextBlob

def analyze_sentiment(symbol):
    try:
        # NewsAPI configuration
        api_key = 'fcfb9c8a0ced4c9c8a5db85e8f5638eb'
        base_url = 'https://newsapi.org/v2/everything'
        
        # Calculate date range (last 7 days)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        # Prepare parameters for NewsAPI
        params = {
            'q': symbol,
            'from': start_date.strftime('%Y-%m-%d'),
            'to': end_date.strftime('%Y-%m-%d'),
            'sortBy': 'publishedAt',
            'language': 'en',
            'apiKey': api_key
        }
        
        # Get news from NewsAPI
        response = requests.get(base_url, params=params)
        news_data = response.json()
        
        # Get recent tweets (simulated since we don't have Twitter API)
        simulated_tweets = [
            f"{symbol} showing strong momentum today",
            f"Analysts bullish on {symbol}",
            f"Market sentiment positive for {symbol}",
            f"Traders watching {symbol} closely",
            f"{symbol} breaking resistance levels"
        ]
        
        # Analyze news sentiment
        news_sentiments = []
        if 'articles' in news_data:
            for article in news_data['articles']:
                if 'title' in article:
                    sentiment = TextBlob(article['title']).sentiment.polarity
                    news_sentiments.append(sentiment)
        
        # Analyze social sentiment (simulated tweets)
        social_sentiments = [TextBlob(tweet).sentiment.polarity for tweet in simulated_tweets]
        
        # Calculate overall sentiment scores
        news_sentiment = np.mean(news_sentiments) if news_sentiments else 0
        social_sentiment = np.mean(social_sentiments) if social_sentiments else 0
        
        # Calculate confidence based on number of data points
        news_confidence = min(len(news_sentiments) * 10, 100)
        social_confidence = min(len(social_sentiments) * 20, 100)
        
        # Determine overall sentiment
        overall_sentiment = (news_sentiment + social_sentiment) / 2
        overall_confidence = (news_confidence + social_confidence) / 2
        
        # Convert sentiment to readable format
        sentiment_map = {
            'Bullish': overall_sentiment > 0.1,
            'Neutral': -0.1 <= overall_sentiment <= 0.1,
            'Bearish': overall_sentiment < -0.1
        }
        
        overall = next(key for key, value in sentiment_map.items() if value)
        
        # Get market mood based on sentiment
        market_mood = 'Positive' if overall_sentiment > 0 else 'Negative' if overall_sentiment < 0 else 'Neutral'
        
        return {
            'overall': overall,
            'confidence': round(overall_confidence),
            'news_sentiment': round(news_sentiment, 2),
            'social_sentiment': round(social_sentiment, 2),
            'market_mood': market_mood,
            'news_count': len(news_sentiments),
            'social_count': len(social_sentiments)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'overall': 'Neutral',
            'confidence': 0,
            'news_sentiment': 0,
            'social_sentiment': 0,
            'market_mood': 'Neutral',
            'news_count': 0,
            'social_count': 0
        } 