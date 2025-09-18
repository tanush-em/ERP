from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models.user import User

def role_required(*allowed_roles):
    """Decorator to check if user has required role"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                current_user_id = get_jwt_identity()
                user_model = User()
                user = user_model.find_by_id(current_user_id)
                
                if not user:
                    return jsonify({
                        'error': 'User not found',
                        'message': 'Invalid user session'
                    }), 401
                
                if not user.get('isActive'):
                    return jsonify({
                        'error': 'Account deactivated',
                        'message': 'Your account has been deactivated'
                    }), 401
                
                user_role = user.get('role')
                if user_role not in allowed_roles:
                    return jsonify({
                        'error': 'Insufficient permissions',
                        'message': f'This action requires one of the following roles: {", ".join(allowed_roles)}'
                    }), 403
                
                # Add user info to request context
                request.current_user = user
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({
                    'error': 'Authentication error',
                    'message': str(e)
                }), 401
        
        return decorated_function
    return decorator

def admin_required(f):
    """Decorator for admin-only routes"""
    return role_required('admin')(f)

def student_required(f):
    """Decorator for student-only routes"""
    return role_required('student')(f)

def admin_or_student_required(f):
    """Decorator for routes accessible by both admin and student"""
    return role_required('admin', 'student')(f)

def get_current_user():
    """Get current authenticated user"""
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user_model = User()
        user = user_model.find_by_id(current_user_id)
        return user
    except Exception:
        return None

def is_admin():
    """Check if current user is admin"""
    user = get_current_user()
    return user and user.get('role') == 'admin'

def is_student():
    """Check if current user is student"""
    user = get_current_user()
    return user and user.get('role') == 'student'

def can_access_student_data(student_id):
    """Check if current user can access specific student's data"""
    current_user = get_current_user()
    
    if not current_user:
        return False
    
    # Admin can access any student's data
    if current_user.get('role') == 'admin':
        return True
    
    # Student can only access their own data
    if current_user.get('role') == 'student':
        return str(current_user.get('id')) == str(student_id)
    
    return False

def validate_request_data(required_fields):
    """Decorator to validate required fields in request data"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'error': 'Invalid request',
                    'message': 'Request must be JSON'
                }), 400
            
            data = request.get_json()
            missing_fields = []
            
            for field in required_fields:
                if field not in data or data[field] is None or data[field] == '':
                    missing_fields.append(field)
            
            if missing_fields:
                return jsonify({
                    'error': 'Missing required fields',
                    'message': f'The following fields are required: {", ".join(missing_fields)}'
                }), 400
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def handle_errors(f):
    """Decorator to handle common errors"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({
                'error': 'Invalid data',
                'message': str(e)
            }), 400
        except Exception as e:
            current_app.logger.error(f"Unexpected error in {f.__name__}: {str(e)}")
            return jsonify({
                'error': 'Internal server error',
                'message': 'An unexpected error occurred'
            }), 500
    
    return decorated_function
