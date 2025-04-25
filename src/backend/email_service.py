import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import logging
import datetime

# Load environment variables
load_dotenv()

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
EMAIL_USERNAME = os.getenv('EMAIL_USERNAME')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'no-reply@marketpulse.com')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('email_service')

def get_password_reset_template(username, reset_url):
    """
    Returns HTML template for password reset emails
    
    Args:
        username (str): User's username
        reset_url (str): Password reset URL
        
    Returns:
        str: HTML email body
    """
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #1a67df;
                padding: 20px;
                text-align: center;
                color: white;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                padding: 20px;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                border-top: none;
                border-radius: 0 0 5px 5px;
            }}
            .button {{
                display: inline-block;
                padding: 10px 20px;
                margin: 20px 0;
                background-color: #1a67df;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }}
            .footer {{
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #777;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MarketPulse Password Reset</h1>
            </div>
            <div class="content">
                <p>Hello {username},</p>
                
                <p>We received a request to reset your password for your MarketPulse account.</p>
                
                <p>Please click the button below to reset your password. This link will expire in 24 hours.</p>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset My Password</a>
                </div>
                
                <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                
                <p>Best regards,<br>The MarketPulse Team</p>
            </div>
            <div class="footer">
                <p>&copy; {datetime.datetime.now().year} MarketPulse. All rights reserved.</p>
                <p>This is an automated email, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """

def send_email(to_email, subject, body, from_email=None, is_html=True):
    """
    Send an email using SMTP
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        body (str): Email body (HTML or plain text)
        from_email (str, optional): Sender email address. Defaults to DEFAULT_FROM_EMAIL.
        is_html (bool, optional): Whether the body is HTML. Defaults to True.
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        logger.error("Email credentials not configured. Set EMAIL_USERNAME and EMAIL_PASSWORD in .env file")
        return False
    
    from_email = from_email or DEFAULT_FROM_EMAIL
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    
    # Create plain text version (simple fallback)
    plain_text = body
    if is_html:
        # Very basic HTML to text conversion
        plain_text = body.replace('<p>', '').replace('</p>', '\n\n')
        plain_text = plain_text.replace('<br>', '\n').replace('<br/>', '\n')
        plain_text = plain_text.replace('</div>', '\n').replace('</h1>', '\n')
        # Strip all remaining HTML tags
        import re
        plain_text = re.sub(r'<[^>]*>', '', plain_text)
    
    # Attach plain text and HTML versions
    msg.attach(MIMEText(plain_text, 'plain'))
    if is_html:
        msg.attach(MIMEText(body, 'html'))
    
    try:
        # Connect to SMTP server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        
        # Send email
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False 