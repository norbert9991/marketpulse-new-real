# MarketPulse

A comprehensive market analysis and trading platform.

## Project Overview

MarketPulse is a web application that provides market analysis, trading capabilities, and portfolio management features.

## Features

- Real-time market data
- Technical analysis tools
- User authentication and authorization
- Portfolio management
- Admin dashboard

## Tech Stack

- Frontend: React, Material-UI
- Backend: Flask (Python)
- Database: PostgreSQL
- Deployment: Render

## Deployment Instructions for Render

### Prerequisites

- A Render account
- Git repository with your code

### Deployment Steps

1. **Push your code to a Git repository**
   - Ensure all code is committed and pushed to your repository

2. **Create a PostgreSQL database on Render**
   - Go to the Render Dashboard
   - Click "New" > "PostgreSQL"
   - Configure your database (name, region, plan)
   - Note the connection details for later use

3. **Deploy the Backend Service**
   - In the Render Dashboard, click "New" > "Web Service"
   - Connect your Git repository
   - Configure the service:
     - Name: `marketpulse-api`
     - Environment: Python
     - Region: Choose your preferred region
     - Branch: main (or your deployment branch)
     - Build Command: `cd src/backend && pip install -r requirements.txt`
     - Start Command: `cd src/backend && gunicorn main:app`
   - Add the following environment variables:
     - `SECRET_KEY`: A random secret key
     - `DATABASE_URL`: Will be automatically provided if using Render's PostgreSQL

4. **Deploy the Frontend Service**
   - In the Render Dashboard, click "New" > "Static Site"
   - Connect your Git repository
   - Configure the service:
     - Name: `marketpulse-frontend`
     - Environment: Node
     - Region: Choose your preferred region
     - Branch: main (or your deployment branch)
     - Build Command: `npm install && npm run build`
     - Publish Directory: `build`
   - Add the following environment variable:
     - `REACT_APP_API_URL`: URL of your backend API (e.g., `https://marketpulse-api.onrender.com`)

5. **Initialize the Database**
   - Use the PostgreSQL console in Render to run the SQL commands from `finals.sql`
   - Or connect to the database using a PostgreSQL client and run the script

### Alternative: One-Click Deployment

You can also deploy the entire application (frontend, backend, and database) with a single click using the `render.yaml` file in this repository.

1. Fork this repository
2. Click the "Deploy to Render" button in your fork
3. Follow the prompts to configure your services

## Local Development

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd src/backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   - Copy `.env.sample` to `.env`
   - Update the values in `.env` file

4. Run the Flask server:
   ```
   python main.py
   ```

### Frontend Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
