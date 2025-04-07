# db_connection.py
import psycopg2
from psycopg2 import Error
import logging
import os

class DatabaseConnection:
    def __init__(self):
        """Initialize database connection parameters"""
        self.connection = None
        
        # Get database credentials from environment variables
        # with names matching Render's configuration
        self.config = {
            'host': os.environ.get('DB_HOST', 'dpg-cvpr2b8dl3ps73866gc0-a'),
            'user': os.environ.get('DB_USER', 'finals_gzev_user'),
            'password': os.environ.get('DB_PASSWORD', 'prnrRDareyMyh720g7BGCHfDE7eSjdjV'),
            'database': os.environ.get('DB_NAME', 'finals_gzev'),
            'port': os.environ.get('DB_PORT', 5432),
            'databaseurl': os.environ.get('DATABASE_URL', 'postgresql://finals_gzev_user:prnrRDareyMyh720g7BGCHfDE7eSjdjV@dpg-cvpr2b8dl3ps73866gc0-a.oregon-postgres.render.com/finals_gzev')
        }
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def connect(self):
        """Establish a connection to the PostgreSQL database"""
        try:
            # For render.com deployment, use DATABASE_URL if available
            database_url = os.environ.get('DATABASE_URL')
            if database_url:
                self.connection = psycopg2.connect(database_url)
            else:
                self.connection = psycopg2.connect(
                    host=self.config['host'],
                    user=self.config['user'],
                    password=self.config['password'],
                    database=self.config['database'],
                    port=self.config['port']
                )
            
            self.logger.info("Successfully connected to PostgreSQL database")
            return True
        except Error as e:
            self.logger.error(f"Error connecting to PostgreSQL: {e}")
            return False

    def disconnect(self):
        """Close the database connection"""
        if self.connection:
            self.connection.close()
            self.logger.info("PostgreSQL connection closed")

    def get_connection(self):
        """Get the active database connection"""
        if not self.connection:
            if not self.connect():
                raise Exception("Failed to establish database connection")
        return self.connection

# Create a global instance
db_manager = DatabaseConnection()