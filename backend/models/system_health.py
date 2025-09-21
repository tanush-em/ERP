from datetime import datetime, timedelta
from bson import ObjectId
from utils.database import get_db
from utils.helpers import serialize_mongo_doc
import psutil
import time

class SystemHealth:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.system_health
    
    def record_health_metrics(self, metrics_data):
        """Record system health metrics"""
        metrics_data.update({
            'timestamp': datetime.now(),
            'createdAt': datetime.now()
        })
        
        result = self.collection.insert_one(metrics_data)
        return str(result.inserted_id)
    
    def get_current_system_metrics(self):
        """Get current system performance metrics"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Get database connection info
            db_stats = self.db.command("serverStatus")
            
            metrics = {
                'timestamp': datetime.now(),
                'cpu': {
                    'usage_percent': cpu_percent,
                    'core_count': psutil.cpu_count()
                },
                'memory': {
                    'total_gb': round(memory.total / (1024**3), 2),
                    'used_gb': round(memory.used / (1024**3), 2),
                    'usage_percent': memory.percent,
                    'available_gb': round(memory.available / (1024**3), 2)
                },
                'disk': {
                    'total_gb': round(disk.total / (1024**3), 2),
                    'used_gb': round(disk.used / (1024**3), 2),
                    'usage_percent': round((disk.used / disk.total) * 100, 2),
                    'free_gb': round(disk.free / (1024**3), 2)
                },
                'database': {
                    'connections': db_stats.get('connections', {}),
                    'uptime_seconds': db_stats.get('uptime', 0),
                    'version': db_stats.get('version', 'unknown')
                },
                'system': {
                    'uptime_seconds': time.time() - psutil.boot_time(),
                    'load_average': psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
                }
            }
            
            return metrics
        except Exception as e:
            return {
                'timestamp': datetime.now(),
                'error': str(e),
                'status': 'error'
            }
    
    def get_health_history(self, hours=24, interval_minutes=5):
        """Get system health history"""
        start_time = datetime.now() - timedelta(hours=hours)
        
        # Aggregate data by intervals
        pipeline = [
            {'$match': {
                'timestamp': {'$gte': start_time}
            }},
            {'$sort': {'timestamp': 1}},
            {'$group': {
                '_id': {
                    '$dateToString': {
                        'format': '%Y-%m-%d %H:%M',
                        'date': {
                            '$dateTrunc': {
                                'date': '$timestamp',
                                'unit': 'minute',
                                'binSize': interval_minutes
                            }
                        }
                    }
                },
                'avgCpuUsage': {'$avg': '$cpu.usage_percent'},
                'avgMemoryUsage': {'$avg': '$memory.usage_percent'},
                'avgDiskUsage': {'$avg': '$disk.usage_percent'},
                'timestamp': {'$first': '$timestamp'}
            }},
            {'$sort': {'timestamp': 1}}
        ]
        
        history = list(self.collection.aggregate(pipeline))
        return serialize_mongo_doc(history)
    
    def get_mcp_server_status(self):
        """Get MCP server health status"""
        # This would typically ping the MCP server
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
        
        status = 'healthy'
        if error_rate > 20:
            status = 'critical'
        elif error_rate > 10:
            status = 'warning'
        elif recent_ops == 0:
            status = 'idle'
        
        return {
            'status': status,
            'recentOperations': recent_ops,
            'errorRate': round(error_rate, 2),
            'lastCheck': datetime.now(),
            'uptime': 'unknown'  # Would be calculated from actual server ping
        }
    
    def get_database_health(self):
        """Get database health metrics"""
        try:
            db_stats = self.db.command("serverStatus")
            
            # Collection sizes
            collections_info = []
            for collection_name in self.db.list_collection_names():
                stats = self.db.command("collStats", collection_name)
                collections_info.append({
                    'name': collection_name,
                    'size_mb': round(stats.get('size', 0) / (1024*1024), 2),
                    'count': stats.get('count', 0),
                    'avgObjSize': round(stats.get('avgObjSize', 0), 2)
                })
            
            return {
                'status': 'healthy',
                'connections': db_stats.get('connections', {}),
                'uptime_hours': round(db_stats.get('uptime', 0) / 3600, 2),
                'version': db_stats.get('version', 'unknown'),
                'collections': collections_info,
                'totalSize_mb': sum(col['size_mb'] for col in collections_info),
                'totalDocuments': sum(col['count'] for col in collections_info)
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now()
            }
    
    def get_performance_alerts(self):
        """Get system performance alerts"""
        alerts = []
        
        # Get latest metrics
        latest_metric = self.collection.find_one(sort=[('timestamp', -1)])
        
        if latest_metric:
            # CPU alert
            if latest_metric.get('cpu', {}).get('usage_percent', 0) > 80:
                alerts.append({
                    'type': 'cpu',
                    'level': 'warning',
                    'message': f"High CPU usage: {latest_metric['cpu']['usage_percent']}%",
                    'timestamp': latest_metric['timestamp']
                })
            
            # Memory alert
            memory_usage = latest_metric.get('memory', {}).get('usage_percent', 0)
            if memory_usage > 85:
                alerts.append({
                    'type': 'memory',
                    'level': 'critical' if memory_usage > 95 else 'warning',
                    'message': f"High memory usage: {memory_usage}%",
                    'timestamp': latest_metric['timestamp']
                })
            
            # Disk alert
            disk_usage = latest_metric.get('disk', {}).get('usage_percent', 0)
            if disk_usage > 80:
                alerts.append({
                    'type': 'disk',
                    'level': 'critical' if disk_usage > 90 else 'warning',
                    'message': f"High disk usage: {disk_usage}%",
                    'timestamp': latest_metric['timestamp']
                })
        
        # Check for failed MCP operations
        recent_failures = self.db.mcp_operations.count_documents({
            'timestamp': {'$gte': datetime.now() - timedelta(minutes=10)},
            'status': 'failed'
        })
        
        if recent_failures > 5:
            alerts.append({
                'type': 'mcp_operations',
                'level': 'warning',
                'message': f"High MCP operation failure rate: {recent_failures} failures in last 10 minutes",
                'timestamp': datetime.now()
            })
        
        return alerts
    
    def get_system_summary(self):
        """Get comprehensive system health summary"""
        current_metrics = self.get_current_system_metrics()
        mcp_status = self.get_mcp_server_status()
        db_health = self.get_database_health()
        alerts = self.get_performance_alerts()
        
        return {
            'overview': {
                'status': 'healthy' if len(alerts) == 0 else 'warning',
                'timestamp': datetime.now(),
                'alertCount': len(alerts)
            },
            'system': current_metrics,
            'mcpServer': mcp_status,
            'database': db_health,
            'alerts': alerts
        }
    
    def cleanup_old_metrics(self, days=7):
        """Clean up old health metrics"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        result = self.collection.delete_many({
            'timestamp': {'$lt': cutoff_date}
        })
        
        return result.deleted_count
