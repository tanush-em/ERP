import time
import json
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
from utils.database import get_db
import logging
from collections import defaultdict

class RateLimiter:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.rate_limit_logs
        
        # In-memory rate limiting for faster checks
        self.request_counts = defaultdict(lambda: defaultdict(int))
        self.request_times = defaultdict(lambda: defaultdict(list))
        
        # Rate limit rules
        self.rules = {
            'default': {'requests': 100, 'window': 3600, 'enabled': True},  # 100 requests per hour
            'mcp_operations': {'requests': 1000, 'window': 3600, 'enabled': True},  # 1000 MCP ops per hour
            'audit_queries': {'requests': 200, 'window': 3600, 'enabled': True},  # 200 audit queries per hour
            'system_health': {'requests': 300, 'window': 3600, 'enabled': True},  # 300 health checks per hour
            'analytics': {'requests': 50, 'window': 3600, 'enabled': True},  # 50 analytics requests per hour
        }
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Cleanup old data periodically
        self._last_cleanup = time.time()
        self._cleanup_interval = 3600  # 1 hour
    
    def _get_client_id(self):
        """Get unique client identifier"""
        # Use IP address and user agent for identification
        ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.headers.get('User-Agent', 'unknown')
        
        # If authenticated, use user ID
        user_id = getattr(g, 'user_id', None)
        if user_id:
            return f"user:{user_id}"
        
        # Otherwise use IP + partial user agent
        ua_hash = hash(user_agent) % 10000  # Simple hash to reduce storage
        return f"ip:{ip}:ua:{ua_hash}"
    
    def _cleanup_old_data(self):
        """Clean up old rate limiting data"""
        current_time = time.time()
        
        if current_time - self._last_cleanup < self._cleanup_interval:
            return
        
        cutoff_time = current_time - max(rule['window'] for rule in self.rules.values())
        
        # Clean up in-memory data
        for client_id in list(self.request_times.keys()):
            for rule_name in list(self.request_times[client_id].keys()):
                # Remove old timestamps
                self.request_times[client_id][rule_name] = [
                    timestamp for timestamp in self.request_times[client_id][rule_name]
                    if timestamp > cutoff_time
                ]
                
                # Update counts
                self.request_counts[client_id][rule_name] = len(self.request_times[client_id][rule_name])
                
                # Remove empty entries
                if not self.request_times[client_id][rule_name]:
                    del self.request_times[client_id][rule_name]
                    del self.request_counts[client_id][rule_name]
            
            if not self.request_times[client_id]:
                del self.request_times[client_id]
                del self.request_counts[client_id]
        
        # Clean up database logs
        cutoff_date = datetime.now() - timedelta(days=7)  # Keep 7 days of logs
        try:
            result = self.collection.delete_many({
                'timestamp': {'$lt': cutoff_date}
            })
            self.logger.info(f"Cleaned up {result.deleted_count} old rate limit logs")
        except Exception as e:
            self.logger.error(f"Error cleaning up rate limit logs: {str(e)}")
        
        self._last_cleanup = current_time
    
    def _is_rate_limited(self, client_id: str, rule_name: str) -> tuple[bool, dict]:
        """Check if client is rate limited"""
        rule = self.rules.get(rule_name, self.rules['default'])
        
        if not rule['enabled']:
            return False, {}
        
        current_time = time.time()
        window_start = current_time - rule['window']
        
        # Clean up old requests
        self.request_times[client_id][rule_name] = [
            timestamp for timestamp in self.request_times[client_id][rule_name]
            if timestamp > window_start
        ]
        
        current_count = len(self.request_times[client_id][rule_name])
        self.request_counts[client_id][rule_name] = current_count
        
        if current_count >= rule['requests']:
            # Calculate reset time
            oldest_request = min(self.request_times[client_id][rule_name])
            reset_time = oldest_request + rule['window']
            
            return True, {
                'limit': rule['requests'],
                'window': rule['window'],
                'current': current_count,
                'resetTime': reset_time,
                'retryAfter': int(reset_time - current_time)
            }
        
        return False, {
            'limit': rule['requests'],
            'window': rule['window'],
            'current': current_count,
            'remaining': rule['requests'] - current_count
        }
    
    def _record_request(self, client_id: str, rule_name: str):
        """Record a request"""
        current_time = time.time()
        self.request_times[client_id][rule_name].append(current_time)
        self.request_counts[client_id][rule_name] += 1
        
        # Log to database for analytics
        try:
            log_data = {
                'clientId': client_id,
                'ruleName': rule_name,
                'timestamp': datetime.now(),
                'endpoint': request.endpoint,
                'method': request.method,
                'path': request.path,
                'userAgent': request.headers.get('User-Agent'),
                'ipAddress': request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
            }
            
            self.collection.insert_one(log_data)
        except Exception as e:
            self.logger.error(f"Error logging rate limit request: {str(e)}")
    
    def rate_limit(self, rule_name: str = 'default'):
        """Decorator for rate limiting endpoints"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Clean up old data periodically
                self._cleanup_old_data()
                
                client_id = self._get_client_id()
                
                # Check rate limit
                is_limited, limit_info = self._is_rate_limited(client_id, rule_name)
                
                if is_limited:
                    self.logger.warning(f"Rate limit exceeded for client {client_id} on rule {rule_name}")
                    
                    response = jsonify({
                        'error': 'Rate limit exceeded',
                        'message': f'Too many requests. Limit: {limit_info["limit"]} per {limit_info["window"]} seconds',
                        'rateLimitInfo': limit_info
                    })
                    
                    response.status_code = 429
                    response.headers['X-RateLimit-Limit'] = str(limit_info['limit'])
                    response.headers['X-RateLimit-Window'] = str(limit_info['window'])
                    response.headers['X-RateLimit-Current'] = str(limit_info['current'])
                    response.headers['Retry-After'] = str(limit_info['retryAfter'])
                    
                    return response
                
                # Record the request
                self._record_request(client_id, rule_name)
                
                # Add rate limit headers to response
                response = f(*args, **kwargs)
                
                if hasattr(response, 'headers'):
                    response.headers['X-RateLimit-Limit'] = str(limit_info['limit'])
                    response.headers['X-RateLimit-Window'] = str(limit_info['window'])
                    response.headers['X-RateLimit-Remaining'] = str(limit_info['remaining'])
                
                return response
            
            return decorated_function
        return decorator
    
    def get_client_stats(self, client_id: str = None):
        """Get rate limiting statistics for a client"""
        if not client_id:
            client_id = self._get_client_id()
        
        stats = {}
        
        for rule_name, rule in self.rules.items():
            current_count = self.request_counts[client_id].get(rule_name, 0)
            
            stats[rule_name] = {
                'limit': rule['requests'],
                'window': rule['window'],
                'current': current_count,
                'remaining': max(0, rule['requests'] - current_count),
                'enabled': rule['enabled']
            }
        
        return stats
    
    def get_system_stats(self):
        """Get system-wide rate limiting statistics"""
        try:
            # Active clients
            active_clients = len(self.request_counts)
            
            # Total requests in last hour
            recent_requests = self.collection.count_documents({
                'timestamp': {'$gte': datetime.now() - timedelta(hours=1)}
            })
            
            # Requests by rule
            rule_pipeline = [
                {'$match': {
                    'timestamp': {'$gte': datetime.now() - timedelta(hours=1)}
                }},
                {'$group': {
                    '_id': '$ruleName',
                    'count': {'$sum': 1}
                }},
                {'$sort': {'count': -1}}
            ]
            
            rule_stats = list(self.collection.aggregate(rule_pipeline))
            
            # Top clients
            client_pipeline = [
                {'$match': {
                    'timestamp': {'$gte': datetime.now() - timedelta(hours=1)}
                }},
                {'$group': {
                    '_id': '$clientId',
                    'count': {'$sum': 1}
                }},
                {'$sort': {'count': -1}},
                {'$limit': 10}
            ]
            
            top_clients = list(self.collection.aggregate(client_pipeline))
            
            return {
                'activeClients': active_clients,
                'recentRequests': recent_requests,
                'requestsByRule': rule_stats,
                'topClients': top_clients,
                'rules': self.rules
            }
            
        except Exception as e:
            self.logger.error(f"Error getting system rate limit stats: {str(e)}")
            return {'error': str(e)}
    
    def update_rule(self, rule_name: str, requests: int = None, window: int = None, enabled: bool = None):
        """Update a rate limiting rule"""
        if rule_name not in self.rules:
            return {'success': False, 'error': f'Rule {rule_name} not found'}
        
        if requests is not None:
            self.rules[rule_name]['requests'] = requests
        
        if window is not None:
            self.rules[rule_name]['window'] = window
        
        if enabled is not None:
            self.rules[rule_name]['enabled'] = enabled
        
        self.logger.info(f"Updated rate limit rule {rule_name}: {self.rules[rule_name]}")
        
        return {'success': True, 'rule': self.rules[rule_name]}
    
    def reset_client_limits(self, client_id: str = None):
        """Reset rate limits for a specific client"""
        if not client_id:
            client_id = self._get_client_id()
        
        if client_id in self.request_counts:
            del self.request_counts[client_id]
        
        if client_id in self.request_times:
            del self.request_times[client_id]
        
        self.logger.info(f"Reset rate limits for client {client_id}")
        
        return {'success': True, 'message': f'Rate limits reset for client {client_id}'}
    
    def get_rate_limit_logs(self, hours: int = 24, limit: int = 100):
        """Get recent rate limit logs"""
        try:
            start_time = datetime.now() - timedelta(hours=hours)
            
            logs = list(self.collection.find({
                'timestamp': {'$gte': start_time}
            }).sort('timestamp', -1).limit(limit))
            
            return {
                'success': True,
                'logs': logs,
                'count': len(logs)
            }
            
        except Exception as e:
            self.logger.error(f"Error getting rate limit logs: {str(e)}")
            return {'success': False, 'error': str(e)}

# Global rate limiter instance
rate_limiter = RateLimiter()

def get_rate_limiter():
    """Get the global rate limiter instance"""
    return rate_limiter

# Decorator shortcuts
def rate_limit_default(f):
    return rate_limiter.rate_limit('default')(f)

def rate_limit_mcp(f):
    return rate_limiter.rate_limit('mcp_operations')(f)

def rate_limit_audit(f):
    return rate_limiter.rate_limit('audit_queries')(f)

def rate_limit_health(f):
    return rate_limiter.rate_limit('system_health')(f)

def rate_limit_analytics(f):
    return rate_limiter.rate_limit('analytics')(f)
