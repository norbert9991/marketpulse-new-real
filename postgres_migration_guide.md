# MySQL to PostgreSQL Migration Guide

This guide explains the changes required to migrate the MarketPulse application from MySQL to PostgreSQL.

## 1. Database Schema Changes

The `finals.sql` file has been converted to PostgreSQL format with the following key changes:
- Changed `AUTO_INCREMENT` to `SERIAL` for primary key columns
- Removed MySQL-specific character set and collation settings
- Changed `int(11)` to `INTEGER`
- Created a proper PostgreSQL ENUM type for the `level_type` in `support_resistance` table
- Changed MySQL's `enum` to PostgreSQL's `CHECK` constraint
- Removed MySQL-specific backticks for identifiers and used double quotes when needed

## 2. Database Connection Code Changes

The database connection code (`db_connection.py`) has been updated to:
- Use `psycopg2` instead of `mysql-connector-python`
- Configure SSL for Render PostgreSQL
- Use the DATABASE_URL directly for Render PostgreSQL
- Update connection parameters structure

## 3. Cursor Handling Changes

MySQL's `cursor(dictionary=True)` is not available in PostgreSQL, so we:
- Created a new `db_utils.py` file with helper functions to convert rows to dictionaries
- Added `dict_fetchone()` and `dict_fetchall()` functions to simulate MySQL's dictionary cursor
- Added `get_lastrowid()` function to handle auto-increment ID retrieval differences
- Updated all cursor creation code to use the new pattern

## 4. SQL Query Changes

Several SQL-specific changes were made:
- Added `RETURNING` clause to insert queries to get the newly inserted ID
- Replaced `cursor.lastrowid` with direct retrieval using `RETURNING`
- Used standard SQL date/time functions that work in both MySQL and PostgreSQL

## 5. Dependencies Updates

The following dependencies were updated:
- Replaced `mysql-connector-python` with `psycopg2-binary`
- Updated `requirements.txt`, `requirements-render.txt`, and other dependency files

## 6. Environment Configuration

The environment configuration was updated:
- Added PostgreSQL connection string to `.env` and `.env.example`
- Updated any deployment-specific configurations

## 7. How to Complete the Migration

To complete the migration of your application:

1. **Update All Routes Files**:
   - Replace all instances of `cursor = conn.cursor(dictionary=True)` with `cursor = conn.cursor()`
   - Replace all `cursor.fetchone()` with `dict_fetchone(cursor)`
   - Replace all `cursor.fetchall()` with `dict_fetchall(cursor)`
   - Update any `lastrowid` usage to use `RETURNING` clause or `get_lastrowid()`

2. **Test Database Connections**:
   - Test your application locally with the PostgreSQL connection
   - Verify all routes are working correctly
   - Check all CRUD operations

3. **Update Deployment Configuration**:
   - Update any environment variables for deployment platforms
   - Update CI/CD pipeline if needed

4. **Deploy the Updated Application**:
   - Deploy to Render with the new PostgreSQL database connection

## 8. Common PostgreSQL-Specific Issues to Watch For

- Double quotes vs. backticks for identifiers
- Case sensitivity differences (PostgreSQL is case-sensitive for identifiers)
- String concatenation differences (`+` vs. `||`)
- Auto-increment sequence handling differences
- Date functions differences 