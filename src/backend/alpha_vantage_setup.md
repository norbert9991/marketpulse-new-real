# Alpha Vantage API Setup

This document explains how to set up and use the Alpha Vantage API integration with caching for MarketPulse.

## Getting an API Key

1. Visit the Alpha Vantage website: https://www.alphavantage.co/
2. Sign up for a free API key
3. Set the API key in your environment:
   - For local development: Add `ALPHA_VANTAGE_API_KEY=your_key_here` to your .env file
   - For Render deployment: Update the `ALPHA_VANTAGE_API_KEY` value in render.yaml

## Understanding the Caching System

The caching system is designed to minimize API calls to Alpha Vantage, which has limits on the number of requests (especially for free accounts):

1. **Memory Cache**: The fastest cache, stores data in memory for 1 hour
   - Used for repeated requests for the same symbol in a short time
   - Cleared when the application restarts

2. **File Cache**: Persistent cache stored in the `cache/alpha_vantage` directory
   - Default expiry: 24 hours for most data
   - Short-term expiry (1 hour) for recent data (≤ 7 days)
   - Falls back to expired cache if API requests fail

3. **Force Refresh**: Bypass cache when needed
   - Use the `force_refresh=true` query parameter in API calls
   - Example: `/api/market-analysis/AAPL?force_refresh=true`
   - Or use the refresh endpoint: `/api/market-analysis/refresh/AAPL`

## API Endpoints

The updated endpoints that support caching:

1. **Get Market Analysis**:
   - `GET /api/market-analysis/<symbol>`
   - Optional: `?force_refresh=true` to bypass cache

2. **Force Refresh Analysis**:
   - `POST /api/market-analysis/refresh/<symbol>`
   - Always bypasses cache

3. **Get Historical Prices**:
   - `GET /api/market-analysis/<symbol>/history`
   - Optional: `?days=30` to specify number of days
   - Optional: `?force_refresh=true` to bypass cache

## Cache Location

- **Local Development**: Cache is stored in `cache/alpha_vantage` in the project directory
- **Render Deployment**: Cache is stored on a persistent disk at `/opt/render/project/src/cache/alpha_vantage`

## Handling API Limits

Alpha Vantage has the following limits:
- Free tier: 5 API requests per minute, 500 requests per day
- Premium tiers have higher limits

Our caching strategy:
1. Most users will get cached data (unless using force_refresh)
2. The 1-second delay between API calls prevents hitting rate limits
3. Memory cache prevents duplicate API calls for popular symbols
4. File cache persists across application restarts

## Troubleshooting

If you encounter issues:

1. **Check API Key**: Ensure your Alpha Vantage API key is correctly set
2. **Verify Cache Directory**: Make sure the cache directory is writable
3. **Check API Limits**: If you're getting errors, you might have exceeded daily limits
4. **Clear Cache**: Delete files in the cache directory if needed

For further assistance, check the application logs for detailed error messages. 