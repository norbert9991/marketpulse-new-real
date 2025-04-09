# db_connection.py
import psycopg2
from psycopg2 import Error
from psycopg2 import pool
import logging
import os
import time

class DatabaseConnection:
    def __init__(self):
        """Initialize database connection parameters"""
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
        
        # Initialize connection pool
        self.connection_pool = None
        self._initialize_pool()
        
    def _initialize_pool(self):
        """Initialize the connection pool with multiple database connections"""
        try:
            # For render.com deployment, use DATABASE_URL if available
            database_url = os.environ.get('DATABASE_URL')
            
            if database_url:
                self.connection_pool = pool.ThreadedConnectionPool(
                    minconn=1,  # Minimum number of connections
                    maxconn=10, # Maximum number of connections
                    dsn=database_url
                )
            else:
                self.connection_pool = pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=10,
                    host=self.config['host'],
                    user=self.config['user'],
                    password=self.config['password'],
                    database=self.config['database'],
                    port=self.config['port']
                )
                
            self.logger.info("Successfully initialized PostgreSQL connection pool")
        except Error as e:
            self.logger.error(f"Error initializing PostgreSQL connection pool: {e}")
            # If pool initialization fails, retry after a delay
            time.sleep(2)
            self._initialize_pool()
    
    def get_connection(self):
        """Get a connection from the pool"""
        try:
            if not self.connection_pool:
                self._initialize_pool()
                
            connection = self.connection_pool.getconn()
            if connection:
                self.logger.info("Successfully obtained connection from pool")
                return connection
            else:
                self.logger.error("Failed to get connection from pool")
                raise Exception("Failed to get database connection from pool")
        except Error as e:
            self.logger.error(f"Error getting connection from pool: {e}")
            # Re-initialize pool if there's an error
            self._initialize_pool()
            # Try one more time
            try:
                connection = self.connection_pool.getconn()
                if connection:
                    return connection
            except:
                pass
            raise Exception(f"Failed to establish database connection: {e}")
    
    def release_connection(self, connection):
        """Return a connection to the pool"""
        if self.connection_pool and connection:
            try:
                self.connection_pool.putconn(connection)
                self.logger.info("Released connection back to pool")
            except Error as e:
                self.logger.error(f"Error releasing connection: {e}")
                
    def close_all_connections(self):
        """Close all connections in the pool"""
        if self.connection_pool:
            try:
                self.connection_pool.closeall()
                self.logger.info("All database connections closed")
                self.connection_pool = None
            except Error as e:
                self.logger.error(f"Error closing connection pool: {e}")

# Create a global instance
db_manager = DatabaseConnection()