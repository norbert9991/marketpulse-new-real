#!/usr/bin/env python
"""
Test script for email functionality.
Run this script to test the email sending capability:
   python test_email.py [recipient_email]
"""

import sys
import logging
from email_service import test_email_service

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def main():
    """Main function to run the email test"""
    # Get recipient email from command line if provided
    recipient = None
    if len(sys.argv) > 1:
        recipient = sys.argv[1]
    
    # Otherwise prompt for it
    if not recipient:
        recipient = input("Enter recipient email address: ").strip()
    
    if not recipient:
        logger.error("No recipient email provided")
        return False
    
    logger.info(f"Testing email service by sending to: {recipient}")
    result = test_email_service(recipient)
    
    if result:
        logger.info("✅ Email test successful!")
    else:
        logger.error("❌ Email test failed!")
    
    return result

if __name__ == "__main__":
    main() 