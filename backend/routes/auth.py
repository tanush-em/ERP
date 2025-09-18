from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime
from models.user import User
from middleware.auth_middleware import validate_request_data, handle_errors, admin_or_student_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
@validate_request_data(['username', 'password'])
@handle_errors
def login():
    """User login endpoint"""
    data = request.get_json()
    username = data['username']
    password = data['password']
    
    user_model = User()
    user = user_model.find_by_username(username)
    
    if not user:
        return jsonify({
            'error': 'Invalid credentials',
            'message': 'Username or password is incorrect'
        }), 401
    
    if not user.get('isActive'):
        return jsonify({
            'error': 'Account deactivated',
            'message': 'Your account has been deactivated. Please contact admin.'
        }), 401
    
    if not user_model.verify_password(user, password):
        return jsonify({
            'error': 'Invalid credentials',
            'message': 'Username or password is incorrect'
        }), 401
    
    # Create tokens
    access_token = create_access_token(identity=user['id'])
    refresh_token = create_refresh_token(identity=user['id'])
    
    # Remove sensitive data
    user_data = user.copy()
    del user_data['password']
    
    return jsonify({
        'message': 'Login successful',
        'user': user_data,
        'accessToken': access_token,
        'refreshToken': refresh_token
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
@handle_errors
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    user_model = User()
    user = user_model.find_by_id(current_user_id)
    
    if not user or not user.get('isActive'):
        return jsonify({
            'error': 'Invalid user',
            'message': 'User not found or deactivated'
        }), 401
    
    new_access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'accessToken': new_access_token
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@admin_or_student_required
@handle_errors
def get_profile():
    """Get current user profile"""
    current_user = request.current_user.copy()
    del current_user['password']
    
    return jsonify({
        'user': current_user
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@admin_or_student_required
@handle_errors
def update_profile():
    """Update current user profile"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    # Fields that can be updated
    allowed_fields = [
        'email', 'profile.phone', 'profile.address'
    ]
    
    update_data = {}
    for field in allowed_fields:
        if '.' in field:
            # Handle nested fields
            parts = field.split('.')
            if parts[0] in data and parts[1] in data[parts[0]]:
                if parts[0] not in update_data:
                    update_data[parts[0]] = {}
                update_data[parts[0]][parts[1]] = data[parts[0]][parts[1]]
        else:
            if field in data:
                update_data[field] = data[field]
    
    if not update_data:
        return jsonify({
            'error': 'No valid fields to update',
            'message': 'Please provide valid fields to update'
        }), 400
    
    user_model = User()
    success = user_model.update_user(current_user_id, update_data)
    
    if success:
        # Get updated user data
        updated_user = user_model.find_by_id(current_user_id)
        del updated_user['password']
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': updated_user
        }), 200
    else:
        return jsonify({
            'error': 'Update failed',
            'message': 'Failed to update profile'
        }), 500

@auth_bp.route('/change-password', methods=['PUT'])
@admin_or_student_required
@validate_request_data(['currentPassword', 'newPassword'])
@handle_errors
def change_password():
    """Change user password"""
    data = request.get_json()
    current_password = data['currentPassword']
    new_password = data['newPassword']
    current_user_id = get_jwt_identity()
    
    # Validate new password
    if len(new_password) < 6:
        return jsonify({
            'error': 'Invalid password',
            'message': 'Password must be at least 6 characters long'
        }), 400
    
    user_model = User()
    user = user_model.find_by_id(current_user_id)
    
    # Verify current password
    if not user_model.verify_password(user, current_password):
        return jsonify({
            'error': 'Invalid current password',
            'message': 'Current password is incorrect'
        }), 400
    
    # Update password
    from utils.helpers import hash_password
    hashed_password = hash_password(new_password)
    
    success = user_model.update_user(current_user_id, {'password': hashed_password})
    
    if success:
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
    else:
        return jsonify({
            'error': 'Password change failed',
            'message': 'Failed to update password'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@admin_or_student_required
@handle_errors
def logout():
    """User logout endpoint"""
    # In a more complete implementation, you would blacklist the JWT token
    # For now, we'll just return a success message
    return jsonify({
        'message': 'Logged out successfully'
    }), 200
