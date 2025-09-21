import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from models.mcp_operation import MCPOperation
from models.system_health import SystemHealth
from utils.database import get_db
import threading
import time

class MCPMonitor:
    def __init__(self, mcp_server_url="http://localhost:8000"):
        self.mcp_server_url = mcp_server_url
        self.mcp_operation = MCPOperation()
        self.system_health = SystemHealth()
        self.db = get_db()
        self.monitoring = False
        self.monitor_thread = None
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def start_monitoring(self):
        """Start the monitoring service"""
        if not self.monitoring:
            self.monitoring = True
            self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
            self.monitor_thread.start()
            self.logger.info("MCP Monitor started")
    
    def stop_monitoring(self):
        """Stop the monitoring service"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        self.logger.info("MCP Monitor stopped")
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.monitoring:
            try:
                # Check MCP server health
                self._check_mcp_server_health()
                
                # Record system metrics
                self._record_system_metrics()
                
                # Check for stuck operations
                self._check_stuck_operations()
                
                # Sleep for 30 seconds
                time.sleep(30)
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {str(e)}")
                time.sleep(60)  # Wait longer on error
    
    def _check_mcp_server_health(self):
        """Check MCP server health status"""
        try:
            # This would make an actual HTTP request to MCP server health endpoint
            # For now, we'll simulate based on recent operations
            
            recent_ops = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': datetime.now() - timedelta(minutes=5)}
            })
            
            failed_ops = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': datetime.now() - timedelta(minutes=30)},
                'status': 'failed'
            })
            
            total_recent = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': datetime.now() - timedelta(minutes=30)}
            })
            
            error_rate = (failed_ops / max(total_recent, 1)) * 100
            
            health_data = {
                'serverUrl': self.mcp_server_url,
                'status': 'healthy' if error_rate < 10 else 'unhealthy',
                'responseTime': 0,  # Would be actual response time
                'recentOperations': recent_ops,
                'errorRate': error_rate,
                'lastCheck': datetime.now(),
                'uptime': 'unknown'
            }
            
            # Store health data
            self.system_health.record_health_metrics({
                'component': 'mcp_server',
                'metrics': health_data
            })
            
        except Exception as e:
            self.logger.error(f"Error checking MCP server health: {str(e)}")
    
    def _record_system_metrics(self):
        """Record current system metrics"""
        try:
            metrics = self.system_health.get_current_system_metrics()
            self.system_health.record_health_metrics({
                'component': 'system',
                'metrics': metrics
            })
        except Exception as e:
            self.logger.error(f"Error recording system metrics: {str(e)}")
    
    def _check_stuck_operations(self):
        """Check for operations that might be stuck"""
        try:
            # Find operations that have been "running" for more than 10 minutes
            stuck_threshold = datetime.now() - timedelta(minutes=10)
            
            stuck_operations = list(self.db.mcp_operations.find({
                'status': 'running',
                'timestamp': {'$lt': stuck_threshold}
            }))
            
            for operation in stuck_operations:
                self.logger.warning(f"Found stuck operation: {operation['_id']}")
                
                # Mark as failed
                self.mcp_operation.update_operation_status(
                    str(operation['_id']),
                    'failed',
                    error_message='Operation timed out - marked as stuck'
                )
                
        except Exception as e:
            self.logger.error(f"Error checking stuck operations: {str(e)}")
    
    async def ping_mcp_server(self):
        """Ping MCP server to check if it's responsive"""
        try:
            async with aiohttp.ClientSession() as session:
                start_time = time.time()
                async with session.get(f"{self.mcp_server_url}/health", timeout=5) as response:
                    response_time = (time.time() - start_time) * 1000  # Convert to ms
                    
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'status': 'healthy',
                            'responseTime': round(response_time, 2),
                            'serverData': data
                        }
                    else:
                        return {
                            'status': 'unhealthy',
                            'responseTime': round(response_time, 2),
                            'error': f'HTTP {response.status}'
                        }
        except asyncio.TimeoutError:
            return {
                'status': 'timeout',
                'responseTime': 5000,
                'error': 'Request timed out'
            }
        except Exception as e:
            return {
                'status': 'error',
                'responseTime': 0,
                'error': str(e)
            }
    
    def get_server_metrics(self):
        """Get comprehensive MCP server metrics"""
        try:
            # Operation statistics
            op_stats = self.mcp_operation.get_operation_stats()
            
            # Recent performance
            recent_ops = list(self.db.mcp_operations.find({
                'timestamp': {'$gte': datetime.now() - timedelta(hours=1)}
            }).sort('timestamp', -1))
            
            avg_execution_time = 0
            if recent_ops:
                execution_times = [op.get('executionTime', 0) for op in recent_ops if op.get('executionTime')]
                avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0
            
            # Error patterns
            error_pipeline = [
                {'$match': {
                    'status': 'failed',
                    'timestamp': {'$gte': datetime.now() - timedelta(hours=24)}
                }},
                {'$group': {
                    '_id': '$errorMessage',
                    'count': {'$sum': 1}
                }},
                {'$sort': {'count': -1}},
                {'$limit': 5}
            ]
            
            common_errors = list(self.db.mcp_operations.aggregate(error_pipeline))
            
            return {
                'operationStats': op_stats,
                'recentPerformance': {
                    'avgExecutionTime': round(avg_execution_time, 2),
                    'operationsLastHour': len(recent_ops)
                },
                'commonErrors': common_errors,
                'serverUrl': self.mcp_server_url
            }
            
        except Exception as e:
            self.logger.error(f"Error getting server metrics: {str(e)}")
            return {'error': str(e)}
    
    def get_connection_pool_status(self):
        """Get database connection pool status"""
        try:
            db_stats = self.db.command("serverStatus")
            connections = db_stats.get('connections', {})
            
            return {
                'current': connections.get('current', 0),
                'available': connections.get('available', 0),
                'totalCreated': connections.get('totalCreated', 0),
                'active': connections.get('active', 0),
                'threaded': connections.get('threaded', 0),
                'exhaustIsMaster': connections.get('exhaustIsMaster', 0),
                'exhaustHello': connections.get('exhaustHello', 0)
            }
        except Exception as e:
            self.logger.error(f"Error getting connection pool status: {str(e)}")
            return {'error': str(e)}
    
    def get_realtime_metrics(self):
        """Get real-time metrics for dashboard"""
        try:
            # Current operations
            running_ops = self.db.mcp_operations.count_documents({'status': 'running'})
            pending_ops = self.db.mcp_operations.count_documents({'status': 'pending'})
            
            # Recent activity (last 5 minutes)
            recent_activity = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': datetime.now() - timedelta(minutes=5)}
            })
            
            # System health
            system_metrics = self.system_health.get_current_system_metrics()
            
            # Connection pool
            connection_pool = self.get_connection_pool_status()
            
            return {
                'timestamp': datetime.now(),
                'operations': {
                    'running': running_ops,
                    'pending': pending_ops,
                    'recentActivity': recent_activity
                },
                'system': {
                    'cpu': system_metrics.get('cpu', {}),
                    'memory': system_metrics.get('memory', {}),
                    'disk': system_metrics.get('disk', {})
                },
                'database': {
                    'connections': connection_pool
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error getting realtime metrics: {str(e)}")
            return {'error': str(e)}

# Global monitor instance
mcp_monitor = MCPMonitor()

def start_mcp_monitoring():
    """Start MCP monitoring service"""
    mcp_monitor.start_monitoring()

def stop_mcp_monitoring():
    """Stop MCP monitoring service"""
    mcp_monitor.stop_monitoring()

def get_monitor_instance():
    """Get the global monitor instance"""
    return mcp_monitor
