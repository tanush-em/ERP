import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from models.notification import Notification
from models.mcp_operation import MCPOperation
from models.system_health import SystemHealth
from utils.database import get_db
import threading
import time

class NotificationHub:
    def __init__(self):
        self.notification = Notification()
        self.mcp_operation = MCPOperation()
        self.system_health = SystemHealth()
        self.db = get_db()
        
        # WebSocket connections for real-time notifications
        self.websocket_connections = set()
        
        # Notification rules
        self.notification_rules = {
            'mcp_operation_failed': {
                'enabled': True,
                'threshold': 1,
                'cooldown': 300  # 5 minutes
            },
            'high_failure_rate': {
                'enabled': True,
                'threshold': 20,  # 20% failure rate
                'cooldown': 900  # 15 minutes
            },
            'system_resource_high': {
                'enabled': True,
                'threshold': 85,  # 85% usage
                'cooldown': 600  # 10 minutes
            },
            'mcp_server_down': {
                'enabled': True,
                'threshold': 1,
                'cooldown': 300  # 5 minutes
            }
        }
        
        # Cooldown tracking
        self.last_notifications = {}
        
        # Background monitoring
        self.monitoring = False
        self.monitor_thread = None
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def start_monitoring(self):
        """Start the notification monitoring service"""
        if not self.monitoring:
            self.monitoring = True
            self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
            self.monitor_thread.start()
            self.logger.info("Notification Hub monitoring started")
    
    def stop_monitoring(self):
        """Stop the notification monitoring service"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        self.logger.info("Notification Hub monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.monitoring:
            try:
                # Check various conditions and send notifications
                self._check_failed_operations()
                self._check_failure_rate()
                self._check_system_resources()
                self._check_mcp_server_health()
                
                # Sleep for 60 seconds
                time.sleep(60)
                
            except Exception as e:
                self.logger.error(f"Error in notification monitoring loop: {str(e)}")
                time.sleep(120)  # Wait longer on error
    
    def _check_failed_operations(self):
        """Check for recent failed operations"""
        try:
            if not self._should_notify('mcp_operation_failed'):
                return
            
            # Check for failed operations in the last 5 minutes
            recent_failures = list(self.db.mcp_operations.find({
                'status': 'failed',
                'timestamp': {'$gte': datetime.now() - timedelta(minutes=5)}
            }))
            
            if recent_failures:
                notification_data = {
                    'type': 'mcp_operation_failed',
                    'title': 'MCP Operation Failures Detected',
                    'message': f'{len(recent_failures)} MCP operations failed in the last 5 minutes',
                    'severity': 'high',
                    'data': {
                        'failedOperations': len(recent_failures),
                        'timeWindow': '5 minutes'
                    }
                }
                
                self._send_system_notification(notification_data)
                self._update_notification_cooldown('mcp_operation_failed')
                
        except Exception as e:
            self.logger.error(f"Error checking failed operations: {str(e)}")
    
    def _check_failure_rate(self):
        """Check for high failure rate"""
        try:
            if not self._should_notify('high_failure_rate'):
                return
            
            # Check failure rate in the last hour
            start_time = datetime.now() - timedelta(hours=1)
            
            total_ops = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': start_time}
            })
            
            failed_ops = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': start_time},
                'status': 'failed'
            })
            
            if total_ops > 0:
                failure_rate = (failed_ops / total_ops) * 100
                threshold = self.notification_rules['high_failure_rate']['threshold']
                
                if failure_rate >= threshold:
                    notification_data = {
                        'type': 'high_failure_rate',
                        'title': 'High MCP Operation Failure Rate',
                        'message': f'Failure rate is {failure_rate:.1f}% in the last hour (threshold: {threshold}%)',
                        'severity': 'critical',
                        'data': {
                            'failureRate': failure_rate,
                            'threshold': threshold,
                            'totalOperations': total_ops,
                            'failedOperations': failed_ops
                        }
                    }
                    
                    self._send_system_notification(notification_data)
                    self._update_notification_cooldown('high_failure_rate')
                    
        except Exception as e:
            self.logger.error(f"Error checking failure rate: {str(e)}")
    
    def _check_system_resources(self):
        """Check for high system resource usage"""
        try:
            if not self._should_notify('system_resource_high'):
                return
            
            # Get latest system metrics
            latest_metric = self.db.system_health.find_one(
                {'component': 'system'},
                sort=[('timestamp', -1)]
            )
            
            if not latest_metric:
                return
            
            metrics = latest_metric.get('metrics', {})
            threshold = self.notification_rules['system_resource_high']['threshold']
            
            alerts = []
            
            # Check CPU
            cpu_usage = metrics.get('cpu', {}).get('usage_percent', 0)
            if cpu_usage >= threshold:
                alerts.append(f'CPU: {cpu_usage}%')
            
            # Check Memory
            memory_usage = metrics.get('memory', {}).get('usage_percent', 0)
            if memory_usage >= threshold:
                alerts.append(f'Memory: {memory_usage}%')
            
            # Check Disk
            disk_usage = metrics.get('disk', {}).get('usage_percent', 0)
            if disk_usage >= threshold:
                alerts.append(f'Disk: {disk_usage}%')
            
            if alerts:
                notification_data = {
                    'type': 'system_resource_high',
                    'title': 'High System Resource Usage',
                    'message': f'High resource usage detected: {", ".join(alerts)}',
                    'severity': 'high',
                    'data': {
                        'threshold': threshold,
                        'cpu': cpu_usage,
                        'memory': memory_usage,
                        'disk': disk_usage
                    }
                }
                
                self._send_system_notification(notification_data)
                self._update_notification_cooldown('system_resource_high')
                
        except Exception as e:
            self.logger.error(f"Error checking system resources: {str(e)}")
    
    def _check_mcp_server_health(self):
        """Check MCP server health"""
        try:
            if not self._should_notify('mcp_server_down'):
                return
            
            # Check if there have been no operations in the last 10 minutes
            # This could indicate the MCP server is down
            recent_ops = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': datetime.now() - timedelta(minutes=10)}
            })
            
            # Also check for recent failed connection attempts
            recent_failures = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': datetime.now() - timedelta(minutes=5)},
                'status': 'failed',
                'errorMessage': {'$regex': 'connection|timeout|unreachable', '$options': 'i'}
            })
            
            if recent_ops == 0 and recent_failures > 0:
                notification_data = {
                    'type': 'mcp_server_down',
                    'title': 'MCP Server Connectivity Issues',
                    'message': 'No successful operations in 10 minutes with connection failures detected',
                    'severity': 'critical',
                    'data': {
                        'recentOperations': recent_ops,
                        'connectionFailures': recent_failures
                    }
                }
                
                self._send_system_notification(notification_data)
                self._update_notification_cooldown('mcp_server_down')
                
        except Exception as e:
            self.logger.error(f"Error checking MCP server health: {str(e)}")
    
    def _should_notify(self, rule_name: str) -> bool:
        """Check if we should send a notification based on cooldown"""
        rule = self.notification_rules.get(rule_name, {})
        
        if not rule.get('enabled', False):
            return False
        
        cooldown = rule.get('cooldown', 300)
        last_notification = self.last_notifications.get(rule_name)
        
        if last_notification:
            time_since_last = (datetime.now() - last_notification).total_seconds()
            if time_since_last < cooldown:
                return False
        
        return True
    
    def _update_notification_cooldown(self, rule_name: str):
        """Update the last notification time for a rule"""
        self.last_notifications[rule_name] = datetime.now()
    
    def _send_system_notification(self, notification_data: Dict[str, Any]):
        """Send a system notification"""
        try:
            # Store in database
            self.notification.create_notification(
                recipient_id='system',
                title=notification_data['title'],
                message=notification_data['message'],
                notification_type=notification_data['type']
            )
            
            # Send to WebSocket connections
            self._broadcast_to_websockets(notification_data)
            
            # Log the notification
            self.logger.warning(f"System notification: {notification_data['title']} - {notification_data['message']}")
            
        except Exception as e:
            self.logger.error(f"Error sending system notification: {str(e)}")
    
    def send_custom_notification(self, title: str, message: str, severity: str = 'info', 
                               notification_type: str = 'custom', data: Optional[Dict] = None):
        """Send a custom notification"""
        try:
            notification_data = {
                'type': notification_type,
                'title': title,
                'message': message,
                'severity': severity,
                'data': data or {},
                'timestamp': datetime.now()
            }
            
            self._send_system_notification(notification_data)
            
            return {'success': True, 'message': 'Notification sent successfully'}
            
        except Exception as e:
            self.logger.error(f"Error sending custom notification: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def add_websocket_connection(self, websocket):
        """Add a WebSocket connection for real-time notifications"""
        self.websocket_connections.add(websocket)
        self.logger.info(f"Added WebSocket connection. Total connections: {len(self.websocket_connections)}")
    
    def remove_websocket_connection(self, websocket):
        """Remove a WebSocket connection"""
        self.websocket_connections.discard(websocket)
        self.logger.info(f"Removed WebSocket connection. Total connections: {len(self.websocket_connections)}")
    
    def _broadcast_to_websockets(self, notification_data: Dict[str, Any]):
        """Broadcast notification to all WebSocket connections"""
        if not self.websocket_connections:
            return
        
        message = json.dumps({
            'type': 'notification',
            'data': notification_data
        }, default=str)
        
        # Remove closed connections
        closed_connections = set()
        
        for websocket in self.websocket_connections:
            try:
                # This would be the actual WebSocket send in a real implementation
                # For now, we'll just log it
                self.logger.info(f"Broadcasting notification to WebSocket: {notification_data['title']}")
            except Exception as e:
                self.logger.error(f"Error broadcasting to WebSocket: {str(e)}")
                closed_connections.add(websocket)
        
        # Remove closed connections
        for websocket in closed_connections:
            self.websocket_connections.discard(websocket)
    
    def get_notification_settings(self):
        """Get current notification settings"""
        return {
            'rules': self.notification_rules,
            'activeConnections': len(self.websocket_connections),
            'monitoring': self.monitoring
        }
    
    def update_notification_rule(self, rule_name: str, settings: Dict[str, Any]):
        """Update a notification rule"""
        if rule_name in self.notification_rules:
            self.notification_rules[rule_name].update(settings)
            return {'success': True, 'message': f'Updated rule: {rule_name}'}
        else:
            return {'success': False, 'error': f'Rule not found: {rule_name}'}
    
    def get_recent_notifications(self, hours: int = 24, limit: int = 50):
        """Get recent system notifications"""
        try:
            start_time = datetime.now() - timedelta(hours=hours)
            
            notifications = list(self.db.notifications.find({
                'userId': 'system',
                'createdAt': {'$gte': start_time}
            }).sort('createdAt', -1).limit(limit))
            
            return {
                'success': True,
                'notifications': notifications,
                'count': len(notifications)
            }
            
        except Exception as e:
            self.logger.error(f"Error getting recent notifications: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_notification_stats(self):
        """Get notification statistics"""
        try:
            # Count by type
            type_pipeline = [
                {'$group': {
                    '_id': '$type',
                    'count': {'$sum': 1}
                }},
                {'$sort': {'count': -1}}
            ]
            
            type_stats = list(self.db.notifications.aggregate(type_pipeline))
            
            # Count by severity
            severity_pipeline = [
                {'$group': {
                    '_id': '$severity',
                    'count': {'$sum': 1}
                }},
                {'$sort': {'count': -1}}
            ]
            
            severity_stats = list(self.db.notifications.aggregate(severity_pipeline))
            
            # Recent activity
            recent_count = self.db.notifications.count_documents({
                'createdAt': {'$gte': datetime.now() - timedelta(hours=24)}
            })
            
            return {
                'success': True,
                'stats': {
                    'byType': type_stats,
                    'bySeverity': severity_stats,
                    'recentCount': recent_count,
                    'totalNotifications': self.db.notifications.count_documents({})
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error getting notification stats: {str(e)}")
            return {'success': False, 'error': str(e)}

# Global notification hub instance
notification_hub = NotificationHub()

def start_notification_monitoring():
    """Start notification monitoring service"""
    notification_hub.start_monitoring()

def stop_notification_monitoring():
    """Stop notification monitoring service"""
    notification_hub.stop_monitoring()

def get_notification_hub():
    """Get the global notification hub instance"""
    return notification_hub
