"""Utilities for database operations"""

def dict_fetchall(cursor):
    """
    Return all rows from a cursor as a list of dictionaries.
    This mimics the behavior of MySQL's cursor(dictionary=True)
    """
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

def dict_fetchone(cursor):
    """
    Return one row from a cursor as a dictionary.
    This mimics the behavior of MySQL's cursor(dictionary=True)
    """
    if cursor.rowcount == 0:
        return None
        
    columns = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    
    return dict(zip(columns, row)) if row else None
    
def get_lastrowid(cursor):
    """
    Get the last inserted ID for PostgreSQL.
    This mimics the behavior of MySQL's cursor.lastrowid
    """
    cursor.execute("SELECT lastval()")
    return cursor.fetchone()[0] 