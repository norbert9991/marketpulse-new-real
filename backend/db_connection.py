# db_connection.py
import psycopg2
from psycopg2 import Error
import logging
import os
from dotenv import load_dotenv
import urllib.parse

# Load environment variables
load_dotenv()

class DatabaseConnection:
    def __init__(self):
        """Initialize database connection parameters"""
        self.connection = None
        
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        # Check if DATABASE_URL is provided (Render PostgreSQL integration)
        database_url = os.getenv('DATABASE_URL')
        
        if database_url:
            # Check if it's a MySQL or PostgreSQL connection string
            if database_url.startswith('mysql://'):
                # Extract MySQL connection parameters from the URL
                self.logger.info("Detected MySQL connection string, converting to PostgreSQL format")
                parsed = urllib.parse.urlparse(database_url)
                
                # Extract components
                username = parsed.username
                password = parsed.password
                hostname = parsed.hostname
                port = parsed.port or 3306
                database = parsed.path.lstrip('/')
                
                # Convert to PostgreSQL format
                self.config = self._get_default_config(
                    host=hostname, 
                    user=username, 
                    password=password, 
                    dbname=database, 
                    port=str(port)
                )
                # Remove sslmode which may not be compatible with converted MySQL connection
                if 'sslmode' in self.config:
                    del self.config['sslmode']
            else:
                # For Render PostgreSQL, we can use the DATABASE_URL directly
                self.config = {
                    'dsn': database_url,
                    'sslmode': 'require'  # Required for Render PostgreSQL
                }
        else:
            # Use default configuration
            self.config = self._get_default_config()
        
    def _get_default_config(self, host=None, user=None, password=None, dbname=None, port=None):
        """Get the default database configuration"""
        # Build connection string for local development
        host = host or os.getenv('DB_HOST', 'dpg-cvpr2b8d13ps73866gc0-a.oregon-postgres.render.com')
        user = user or os.getenv('DB_USER', 'finals_gzev_user')
        password = password or os.getenv('DB_PASSWORD', 'pncrRDareyMyh720g7BGCHfDE7eSjdjV')
        dbname = dbname or os.getenv('DB_NAME', 'finals_gzev')
        port = port or os.getenv('DB_PORT', '5432')
        
        return {
            'dsn': f'postgresql://{user}:{password}@{host}:{port}/{dbname}',
            'sslmode': 'require'
        }

    def connect(self):
        """Establish a connection to the PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(**self.config)
            self.connection.autocommit = False  # Use transactions by default
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
        if not self.connection or self.connection.closed:
            if not self.connect():
                raise Exception("Failed to establish database connection")
        return self.connection
    
    def execute_query(self, query, params=None, fetch=False):
        """Execute a query with optional parameters and fetch results"""
        conn = self.get_connection()
        cursor = conn.cursor()
        result = None
        
        try:
            cursor.execute(query, params or ())
            
            if fetch:
                result = cursor.fetchall()
            else:
                conn.commit()
        except Error as e:
            conn.rollback()
            self.logger.error(f"Query execution error: {e}")
            raise
        finally:
            cursor.close()
            
        return result

# Create a global instance
db_manager = DatabaseConnection()
