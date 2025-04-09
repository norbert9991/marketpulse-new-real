FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for numpy/pandas
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-build-isolation --only-binary=:all: numpy==1.24.3 pandas==2.0.3 scikit-learn==1.3.0 && \
    pip install -r requirements.txt

# Copy the backend code
COPY backend/ ./backend/

# Set environment variables for the backend
RUN mkdir -p ./backend
RUN touch ./backend/.env
RUN echo "FRONTEND_URL=https://marketpulse-new-static.onrender.com" > ./backend/.env
RUN echo "DATABASE_URL=postgresql://finals_gzev_user:pncrRDareyMyh720g7BGCHfDE7eSjdjV@dpg-cvpr2b8d13ps73866gc0-a.oregon-postgres.render.com:5432/finals_gzev" >> ./backend/.env
RUN echo "SECRET_KEY=fb4f4f255fb38f23a4d7379be97c837b" >> ./backend/.env

# Set environment variables for running the container
ENV FRONTEND_URL=https://marketpulse-new-static.onrender.com
ENV DATABASE_URL=postgresql://finals_gzev_user:pncrRDareyMyh720g7BGCHfDE7eSjdjV@dpg-cvpr2b8d13ps73866gc0-a.oregon-postgres.render.com:5432/finals_gzev
ENV SECRET_KEY=fb4f4f255fb38f23a4d7379be97c837b

# Database environment variables
ENV DB_HOST=dpg-cvpr2b8dl3ps73866gc0-a
ENV DB_USER=finals_gzev_user
ENV DB_PASSWORD=prnrRDareyMyh720g7BGCHfDE7eSjdjV
ENV DB_NAME=finals_gzev
ENV DB_PORT=5432

# Expose the port
EXPOSE 10000

# Command to run the application
# Use single-threaded worker to ensure better compatibility with MySQL connections
CMD ["gunicorn", "--chdir", "backend", "--bind", "0.0.0.0:10000", "--workers", "1", "--threads", "2", "main:app"] 