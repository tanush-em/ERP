import json
import time
from datetime import datetime
from functools import wraps
from flask import request, g
from services.audit_service import get_audit_service
from models.mcp_operation import MCPOperation
import logging
import traceback

class AuditLogger:
    def __init__(self):
        self.audit_service = get_audit_service()
        self.mcp_operation = MCPOperation()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Audit configuration
        self.config = {
            'log_requests': True,
            'log_responses': True,
            'log_errors': True,
            'log_database_changes': True,
            'exclude_paths': ['/health', '/ping', '/favicon.ico'],
            'exclude_methods': ['OPTIONS'],
            'sensitive_fields': ['password', 'token', 'secret', 'key'],
            'max_payload_size': 10000  # Max size of request/response to log
        }
    
    def _get_request_metadata(self):
        """Extract metadata from the current request"""
        return {
            'ipAddress': request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR')),
            'userAgent': request.headers.get('User-Agent'),
            'method': request.method,
            'path': request.path,
            'endpoint': request.endpoint,
            'userId': getattr(g, 'user_id', None),
            'sessionId': getattr(g, 'session_id', None),
            'timestamp': datetime.now()
        }
    
    def _sanitize_data(self, data):
        """Remove sensitive information from data"""
        if not isinstance(data, dict):
            return data
        
        sanitized = {}
        for key, value in data.items():
            if any(sensitive in key.lower() for sensitive in self.config['sensitive_fields']):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_data(value)
            elif isinstance(value, list):
                sanitized[key] = [self._sanitize_data(item) if isinstance(item, dict) else item for item in value]
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _should_audit_request(self):
        """Determine if the current request should be audited"""
        if not self.config['log_requests']:
            return False
        
        if request.path in self.config['exclude_paths']:
            return False
        
        if request.method in self.config['exclude_methods']:
            return False
        
        return True
    
    def _truncate_payload(self, payload):
        """Truncate large payloads"""
        if not payload:
            return payload
        
        payload_str = json.dumps(payload, default=str) if isinstance(payload, dict) else str(payload)
        
        if len(payload_str) > self.config['max_payload_size']:
            return {
                'truncated': True,
                'size': len(payload_str),
                'preview': payload_str[:self.config['max_payload_size']],
                'message': f'Payload truncated (original size: {len(payload_str)} characters)'
            }
        
        return payload
    
    def log_request(self):
        """Log incoming request details"""
        if not self._should_audit_request():
            return
        
        try:
            metadata = self._get_request_metadata()
            
            # Get request data
            request_data = {}
            
            # Query parameters
            if request.args:
                request_data['queryParams'] = dict(request.args)
            
            # JSON body
            if request.is_json:
                try:
                    json_data = request.get_json()
                    if json_data:
                        request_data['body'] = self._sanitize_data(json_data)
                except Exception as e:
                    request_data['body'] = f'Error parsing JSON: {str(e)}'
            
            # Form data
            elif request.form:
                request_data['formData'] = self._sanitize_data(dict(request.form))
            
            # Files
            if request.files:
                request_data['files'] = list(request.files.keys())
            
            # Headers (excluding sensitive ones)
            headers = {}
            for key, value in request.headers:
                if not any(sensitive in key.lower() for sensitive in self.config['sensitive_fields']):
                    headers[key] = value
                else:
                    headers[key] = '[REDACTED]'
            
            request_data['headers'] = headers
            
            # Truncate if too large
            request_data = self._truncate_payload(request_data)
            
            # Log the request
            audit_data = {
                'auditType': 'api_request',
                'action': f'{metadata["method"]} {metadata["path"]}',
                'metadata': metadata,
                'requestData': request_data
            }
            
            # Store in g for later use in response logging
            g.audit_start_time = time.time()
            g.audit_request_data = audit_data
            
            self.logger.info(f"API Request: {metadata['method']} {metadata['path']} from {metadata['ipAddress']}")
            
        except Exception as e:
            self.logger.error(f"Error logging request: {str(e)}")
    
    def log_response(self, response):
        """Log response details"""
        if not self.config['log_responses'] or not hasattr(g, 'audit_request_data'):
            return response
        
        try:
            # Calculate response time
            response_time = (time.time() - g.audit_start_time) * 1000 if hasattr(g, 'audit_start_time') else 0
            
            # Get response data
            response_data = {
                'statusCode': response.status_code,
                'headers': dict(response.headers),
                'responseTime': round(response_time, 2)
            }
            
            # Get response body if it's JSON and not too large
            if response.is_json and response.content_length and response.content_length < self.config['max_payload_size']:
                try:
                    response_data['body'] = response.get_json()
                except Exception:
                    response_data['body'] = 'Unable to parse response JSON'
            
            # Update audit data
            audit_data = g.audit_request_data
            audit_data['responseData'] = response_data
            audit_data['success'] = 200 <= response.status_code < 300
            
            # Log to audit service
            self.audit_service.log_database_change(
                collection_name='api_audit',
                operation_type='api_call',
                entity_id=f"{audit_data['metadata']['method']}:{audit_data['metadata']['path']}",
                after_state=audit_data,
                metadata=audit_data['metadata']
            )
            
            self.logger.info(f"API Response: {response.status_code} in {response_time:.2f}ms")
            
        except Exception as e:
            self.logger.error(f"Error logging response: {str(e)}")
        
        return response
    
    def log_error(self, error):
        """Log error details"""
        if not self.config['log_errors']:
            return
        
        try:
            metadata = self._get_request_metadata()
            
            error_data = {
                'auditType': 'api_error',
                'action': f'{metadata["method"]} {metadata["path"]}',
                'metadata': metadata,
                'error': {
                    'type': type(error).__name__,
                    'message': str(error),
                    'traceback': traceback.format_exc()
                }
            }
            
            # Log to audit service
            self.audit_service.log_database_change(
                collection_name='api_audit',
                operation_type='api_error',
                entity_id=f"error:{metadata['method']}:{metadata['path']}",
                after_state=error_data,
                metadata=metadata
            )
            
            self.logger.error(f"API Error: {type(error).__name__} in {metadata['method']} {metadata['path']}: {str(error)}")
            
        except Exception as e:
            self.logger.error(f"Error logging error: {str(e)}")
    
    def log_database_operation(self, operation_type, collection_name, entity_id, 
                             before_state=None, after_state=None, mcp_command=None):
        """Log database operations"""
        if not self.config['log_database_changes']:
            return
        
        try:
            metadata = self._get_request_metadata()
            
            # Sanitize states
            if before_state:
                before_state = self._sanitize_data(before_state)
            
            if after_state:
                after_state = self._sanitize_data(after_state)
            
            # Log to audit service
            audit_id = self.audit_service.log_database_change(
                collection_name=collection_name,
                operation_type=operation_type,
                entity_id=entity_id,
                before_state=before_state,
                after_state=after_state,
                mcp_command=mcp_command,
                user_id=metadata.get('userId'),
                metadata=metadata
            )
            
            self.logger.info(f"Database operation: {operation_type} on {collection_name}.{entity_id}")
            
            return audit_id
            
        except Exception as e:
            self.logger.error(f"Error logging database operation: {str(e)}")
            return None
    
    def log_mcp_operation(self, operation_data):
        """Log MCP operation"""
        try:
            metadata = self._get_request_metadata()
            
            # Add metadata to operation
            operation_data.update({
                'requestMetadata': metadata,
                'timestamp': datetime.now()
            })
            
            # Log to MCP operations
            operation_id = self.mcp_operation.log_operation(operation_data)
            
            self.logger.info(f"MCP Operation: {operation_data.get('operationType', 'unknown')} - ID: {operation_id}")
            
            return operation_id
            
        except Exception as e:
            self.logger.error(f"Error logging MCP operation: {str(e)}")
            return None
    
    def audit_decorator(self, operation_type=None, collection_name=None, 
                       log_request=True, log_response=True, log_db_changes=True):
        """Decorator for comprehensive audit logging"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Log request
                if log_request:
                    self.log_request()
                
                try:
                    # Store original database change logging setting
                    original_db_logging = self.config['log_database_changes']
                    self.config['log_database_changes'] = log_db_changes
                    
                    # Execute function
                    result = f(*args, **kwargs)
                    
                    # Restore original setting
                    self.config['log_database_changes'] = original_db_logging
                    
                    # Log response
                    if log_response and hasattr(result, 'status_code'):
                        result = self.log_response(result)
                    
                    return result
                    
                except Exception as error:
                    # Log error
                    self.log_error(error)
                    raise
            
            return decorated_function
        return decorator
    
    def get_audit_config(self):
        """Get current audit configuration"""
        return self.config.copy()
    
    def update_audit_config(self, **kwargs):
        """Update audit configuration"""
        for key, value in kwargs.items():
            if key in self.config:
                self.config[key] = value
                self.logger.info(f"Updated audit config: {key} = {value}")
        
        return self.config
    
    def get_audit_stats(self, hours=24):
        """Get audit statistics"""
        try:
            start_time = datetime.now() - timedelta(hours=hours)
            
            # API call stats
            api_calls = self.audit_service.db.audit_trail.count_documents({
                'collectionName': 'api_audit',
                'operationType': 'api_call',
                'timestamp': {'$gte': start_time}
            })
            
            # Error stats
            api_errors = self.audit_service.db.audit_trail.count_documents({
                'collectionName': 'api_audit',
                'operationType': 'api_error',
                'timestamp': {'$gte': start_time}
            })
            
            # Database operation stats
            db_operations = self.audit_service.db.audit_trail.count_documents({
                'timestamp': {'$gte': start_time},
                'collectionName': {'$ne': 'api_audit'}
            })
            
            # MCP operation stats
            mcp_operations = self.audit_service.db.mcp_operations.count_documents({
                'timestamp': {'$gte': start_time}
            })
            
            return {
                'timeRange': f'Last {hours} hours',
                'apiCalls': api_calls,
                'apiErrors': api_errors,
                'databaseOperations': db_operations,
                'mcpOperations': mcp_operations,
                'errorRate': round((api_errors / max(api_calls, 1)) * 100, 2)
            }
            
        except Exception as e:
            self.logger.error(f"Error getting audit stats: {str(e)}")
            return {'error': str(e)}

# Global audit logger instance
audit_logger = AuditLogger()

def get_audit_logger():
    """Get the global audit logger instance"""
    return audit_logger

# Decorator shortcuts
def audit_api_call(f):
    return audit_logger.audit_decorator()(f)

def audit_mcp_operation(f):
    return audit_logger.audit_decorator(log_db_changes=True)(f)

def audit_admin_action(f):
    return audit_logger.audit_decorator(log_request=True, log_response=True, log_db_changes=True)(f)
