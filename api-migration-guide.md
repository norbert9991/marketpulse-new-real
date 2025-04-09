# API Migration Guide: Moving from Localhost to Deployed API

## The Problem

Your React frontend is trying to connect to a backend at `http://localhost:5000/api/` but your actual backend is now deployed at `https://marketpulse-new-q049.onrender.com/api/`.

## The Solution

You already have a good solution in your codebase! The file `src/utils/api.js` has a centralized API configuration:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://marketpulse-new-q049.onrender.com/api';
```

But your components aren't using this utility - they're directly hardcoding the localhost URL.

## How to Fix

### Option 1: Manual Updates (Quickest for a Few Files)

1. In each component file, add the import:
   ```javascript
   import api from '../utils/api'; // adjust path as needed
   ```

2. Replace all calls like:
   ```javascript
   axios.get('http://localhost:5000/api/auth/login', ...)
   ```
   
   With:
   ```javascript
   api.get('/auth/login', ...)
   ```

3. Notice you don't need to include headers with Authorization token - the api utility handles this automatically in its interceptors.

### Option 2: Automated Script (Best for Many Files)

1. Run the `update-api-urls.js` script I created for you:
   ```
   node update-api-urls.js
   ```

2. Review each modified file to ensure changes were made correctly.

### Option 3: Environment Variable (Best Long-term Solution)

1. Set the `REACT_APP_API_URL` environment variable in your Render Static Site settings to:
   ```
   https://marketpulse-new-q049.onrender.com/api
   ```

2. This way, you can deploy to different environments without changing code.

## Files Needing Updates

Based on the code search, these files have hardcoded localhost URLs:

- src/User/user-dashboard.jsx
- src/User/settings.jsx
- src/User/MarketAnalysis.jsx
- src/User/market.jsx
- src/frontend/Log/Login.jsx
- src/Admin/adminsettings.jsx
- src/Admin/TransactionPage.jsx
- src/Admin/UserManagement.jsx
- src/Admin/admin-dashboard.jsx

## Testing Your Changes

1. After making these changes, rebuild and redeploy your frontend
2. Try logging in again
3. Check browser console (F12) for any remaining API connection errors

## CORS Considerations

If you encounter CORS errors, make sure your backend allows requests from your frontend domain:

```python
# In your backend's main.py
frontend_url = os.getenv('FRONTEND_URL', 'https://marketpulse-new-static.onrender.com')
CORS(app, resources={r"/api/*": {"origins": [frontend_url, "http://localhost:3000"]}}, supports_credentials=True)
``` 