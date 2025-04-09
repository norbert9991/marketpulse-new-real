#!/usr/bin/env bash
# exit on error
set -o errexit

# Upgrade pip
pip install --upgrade pip

# Install binary packages directly
pip install --only-binary=numpy numpy==1.24.3
pip install --only-binary=pandas pandas==2.0.3
pip install --only-binary=scikit-learn scikit-learn==1.3.0

# Install remaining packages
pip install Flask==3.0.2 Flask-CORS==4.0.0 mysql-connector-python==8.3.0 yfinance==0.2.37 requests==2.31.0 textblob==0.17.1 python-dotenv==1.0.1 gunicorn==21.2.0 