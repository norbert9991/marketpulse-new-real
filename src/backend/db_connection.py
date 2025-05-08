# db_connection.py
import psycopg2
from psycopg2 import Error
from psycopg2 import pool
import logging
import os
import time
import sys

class DatabaseConnection:
    def __init__(self):
        """Initialize database connection parameters"""
        # Get database credentials from environment variables
        # with names matching Render's configuration
        self.config = {
            'host': os.environ.get('DB_HOST', 'dpg-d0e4k6h5pdvs73ao5d2g-a.oregon-postgres.render.com'),
            'user': os.environ.get('DB_USER', 'finals2'),
            'password': os.environ.get('DB_PASSWORD', 'kHp9MSWHJpK7XhrzAbvKCosZDxKzPkC3'),
            'database': os.environ.get('DB_NAME', 'finals2'),
            'port': os.environ.get('DB_PORT', 5432),
            'databaseurl': os.environ.get('DATABASE_URL', 'postgresql://finals2:kHp9MSWHJpK7XhrzAbvKCosZDxKzPkC3@dpg-d0e4k6h5pdvs73ao5d2g-a.oregon-postgres.render.com/finals2')
        }
        
        # Set up logging with increased verbosity
        logging.basicConfig(
            level=logging.DEBUG,  # Changed from INFO to DEBUG for more details
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # Print connection parameters for debugging (hide password)
        debug_config = dict(self.config)
        debug_config['password'] = '********'  # Hide actual password in logs
        self.logger.info(f"Database configuration: {debug_config}")
        
        # Initialize connection pool
        self.connection_pool = None
        self._initialize_pool()
        
    def _initialize_pool(self):
        """Initialize the connection pool with multiple database connections"""
        try:
            # For render.com deployment, use DATABASE_URL if available
            database_url = os.environ.get('DATABASE_URL')
            
            self.logger.debug(f"Initializing pool with DATABASE_URL available: {'Yes' if database_url else 'No'}")
            
            if database_url:
                self.logger.info(f"Using DATABASE_URL to connect: {database_url[:30]}...")
                self.connection_pool = pool.ThreadedConnectionPool(
                    minconn=1,  # Minimum number of connections
                    maxconn=10, # Maximum number of connections
                    dsn=database_url
                )
            else:
                self.logger.info(f"Using individual parameters to connect to {self.config['host']}")
                self.connection_pool = pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=10,
                    host=self.config['host'],
                    user=self.config['user'],
                    password=self.config['password'],
                    database=self.config['database'],
                    port=self.config['port']
                )
            
            # Test that the pool is working
            conn = self.connection_pool.getconn()
            if conn:
                self.logger.info("Successfully established database connection and pool")
                cursor = conn.cursor()
                cursor.execute("SELECT current_database(), current_user")
                db_info = cursor.fetchone()
                self.logger.info(f"Connected to database: {db_info[0]} as user: {db_info[1]}")
                
                # Check tables in the database
                cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
                tables = cursor.fetchall()
                table_list = [table[0] for table in tables]
                self.logger.info(f"Tables in database: {', '.join(table_list)}")
                
                cursor.close()
                self.connection_pool.putconn(conn)
        except Error as e:
            self.logger.error(f"Error initializing PostgreSQL connection pool: {e}")
            self.logger.error(f"Connection details: host={self.config['host']}, db={self.config['database']}, user={self.config['user']}")
            # If pool initialization fails, retry after a delay
            time.sleep(2)
            self._initialize_pool()
    
    def get_connection(self):
        """Get a connection from the pool"""
        try:
            if not self.connection_pool:
                self.logger.warning("Connection pool was None, reinitializing")
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
            except Exception as inner_e:
                self.logger.error(f"Second attempt to get connection failed: {inner_e}")
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

# Test the connection directly when this module is run
if __name__ == "__main__":
    print("Testing database connection...")
    db = DatabaseConnection()
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT current_database(), current_user, version()")
    result = cursor.fetchone()
    print(f"Connection successful! Database: {result[0]}, User: {result[1]}")
    print(f"PostgreSQL version: {result[2]}")
    cursor.close()
    db.release_connection(conn)
    db.close_all_connections()

# Create a global instance
db_manager = DatabaseConnection()