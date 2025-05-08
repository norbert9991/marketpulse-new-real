# upload_profile_image.py
from flask import Blueprint, request, jsonify, current_app, send_from_directory
import os
import uuid
from werkzeug.utils import secure_filename
from auth import token_required
from db_connection import db_manager

upload_bp = Blueprint('upload', __name__, url_prefix='/api/settings')

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'public', 'uploads', 'profile-images')
# Create directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/upload-profile-image', methods=['POST'])
@token_required
def upload_profile_image(current_user):
    """Upload a profile image for the current user"""
    if 'profileImage' not in request.files:
        return jsonify({
            'status': 'error',
            'message': 'No file part'
        }), 400
    
    file = request.files['profileImage']
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({
            'status': 'error',
            'message': 'No selected file'
        }), 400
    
    if file and allowed_file(file.filename):
        # Get user_id from the tuple
        user_id = current_user[0]
        
        # Create a unique filename to prevent conflicts
        original_filename = secure_filename(file.filename)
        filename = f"user_{user_id}_{uuid.uuid4()}_{original_filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # Save the file
        try:
            file.save(file_path)
        except Exception as e:
            current_app.logger.error(f"Error saving file: {e}")
            return jsonify({
                'status': 'error',
                'message': 'Failed to save file'
            }), 500
        
        # Generate URL for the image
        host = request.host_url.rstrip('/')
        relative_path = f"/uploads/profile-images/{filename}"
        image_url = f"{host}{relative_path}"
        
        # Update user profile in database
        conn = None
        cursor = None
        try:
            conn = db_manager.get_connection()
            cursor = conn.cursor()
            
            # Update the profile_image field
            cursor.execute("UPDATE login SET profile_image = %s WHERE user_id = %s", 
                         (image_url, user_id))
            conn.commit()
            
            return jsonify({
                'status': 'success',
                'message': 'Profile image uploaded successfully',
                'profile_image': image_url
            })
        except Exception as e:
            current_app.logger.error(f"Error updating profile image in database: {e}")
            if conn:
                conn.rollback()
            return jsonify({
                'status': 'error',
                'message': 'Failed to update profile image in database'
            }), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                db_manager.release_connection(conn)
    else:
        return jsonify({
            'status': 'error',
            'message': 'File type not allowed'
        }), 400

# Add a function to serve files from the upload folder if needed
@upload_bp.route('/uploads/profile-images/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# Function to register the blueprint with the Flask app
def register_upload_routes(app):
    app.register_blueprint(upload_bp)
    # Create an endpoint to serve the uploaded files
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER 