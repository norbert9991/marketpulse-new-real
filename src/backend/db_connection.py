# db_connection.py
import mysql.connector
from mysql.connector import Error
import logging

class DatabaseConnection:
    def __init__(self):
        """Initialize database connection parameters"""
        self.connection = None
        self.config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'finals',
            'port': 3306
        }
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def connect(self):
        """Establish a connection to the MySQL database"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            if self.connection.is_connected():
                self.logger.info("Successfully connected to MySQL database")
                return True
        except Error as e:
            self.logger.error(f"Error connecting to MySQL: {e}")
            return False

    def disconnect(self):
        """Close the database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            self.logger.info("MySQL connection closed")

    def get_connection(self):
        """Get the active database connection"""
        if not self.connection or not self.connection.is_connected():
            if not self.connect():
                raise Exception("Failed to establish database connection")
        return self.connection

# Create a global instance
db_manager = DatabaseConnection()