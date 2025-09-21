import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from models.mcp_operation import MCPOperation
from models.audit_trail import AuditTrail
from models.system_health import SystemHealth
from utils.database import get_db
from bson import ObjectId
import logging
from collections import defaultdict

class AnalyticsEngine:
    def __init__(self):
        self.mcp_operation = MCPOperation()
        self.audit_trail = AuditTrail()
        self.system_health = SystemHealth()
        self.db = get_db()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def get_operation_trends(self, days=30):
        """Analyze MCP operation trends over time"""
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            # Daily operation counts
            daily_pipeline = [
                {'$match': {'timestamp': {'$gte': start_date}}},
                {'$group': {
                    '_id': {
                        'date': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$timestamp'}},
                        'status': '$status'
                    },
                    'count': {'$sum': 1}
                }},
                {'$sort': {'_id.date': 1}}
            ]
            
            daily_data = list(self.db.mcp_operations.aggregate(daily_pipeline))
            
            # Operation type trends
            type_pipeline = [
                {'$match': {'timestamp': {'$gte': start_date}}},
                {'$group': {
                    '_id': {
                        'date': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$timestamp'}},
                        'operationType': '$operationType'
                    },
                    'count': {'$sum': 1}
                }},
                {'$sort': {'_id.date': 1}}
            ]
            
            type_data = list(self.db.mcp_operations.aggregate(type_pipeline))
            
            # Performance trends
            perf_pipeline = [
                {'$match': {
                    'timestamp': {'$gte': start_date},
                    'executionTime': {'$exists': True, '$ne': None}
                }},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$timestamp'}},
                    'avgExecutionTime': {'$avg': '$executionTime'},
                    'maxExecutionTime': {'$max': '$executionTime'},
                    'minExecutionTime': {'$min': '$executionTime'},
                    'operationCount': {'$sum': 1}
                }},
                {'$sort': {'_id': 1}}
            ]
            
            perf_data = list(self.db.mcp_operations.aggregate(perf_pipeline))
            
            return {
                'success': True,
                'timeRange': {'days': days, 'startDate': start_date},
                'dailyOperations': daily_data,
                'operationTypes': type_data,
                'performance': perf_data
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing operation trends: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def detect_anomalies(self, hours=24):
        """Detect anomalies in system behavior"""
        try:
            start_time = datetime.now() - timedelta(hours=hours)
            
            anomalies = []
            
            # 1. Unusual operation volume
            hourly_ops = list(self.db.mcp_operations.aggregate([
                {'$match': {'timestamp': {'$gte': start_time}}},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d %H:00', 'date': '$timestamp'}},
                    'count': {'$sum': 1}
                }}
            ]))
            
            if hourly_ops:
                counts = [item['count'] for item in hourly_ops]
                mean_count = np.mean(counts)
                std_count = np.std(counts)
                threshold = mean_count + (2 * std_count)  # 2 standard deviations
                
                for item in hourly_ops:
                    if item['count'] > threshold:
                        anomalies.append({
                            'type': 'high_operation_volume',
                            'severity': 'medium',
                            'timestamp': item['_id'],
                            'value': item['count'],
                            'threshold': threshold,
                            'description': f"Unusually high operation volume: {item['count']} operations in hour {item['_id']}"
                        })
            
            # 2. High failure rate
            failure_rate_pipeline = [
                {'$match': {'timestamp': {'$gte': start_time}}},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d %H:00', 'date': '$timestamp'}},
                    'total': {'$sum': 1},
                    'failed': {'$sum': {'$cond': [{'$eq': ['$status', 'failed']}, 1, 0]}}
                }},
                {'$addFields': {
                    'failureRate': {'$multiply': [{'$divide': ['$failed', '$total']}, 100]}
                }}
            ]
            
            failure_data = list(self.db.mcp_operations.aggregate(failure_rate_pipeline))
            
            for item in failure_data:
                if item['failureRate'] > 20:  # More than 20% failure rate
                    anomalies.append({
                        'type': 'high_failure_rate',
                        'severity': 'high',
                        'timestamp': item['_id'],
                        'value': item['failureRate'],
                        'threshold': 20,
                        'description': f"High failure rate: {item['failureRate']:.1f}% in hour {item['_id']}"
                    })
            
            # 3. Slow performance
            slow_ops = list(self.db.mcp_operations.find({
                'timestamp': {'$gte': start_time},
                'executionTime': {'$gt': 10000}  # More than 10 seconds
            }))
            
            if slow_ops:
                anomalies.append({
                    'type': 'slow_operations',
                    'severity': 'medium',
                    'timestamp': datetime.now(),
                    'value': len(slow_ops),
                    'threshold': 0,
                    'description': f"Found {len(slow_ops)} slow operations (>10s execution time)"
                })
            
            # 4. System resource anomalies
            resource_anomalies = self._detect_resource_anomalies(start_time)
            anomalies.extend(resource_anomalies)
            
            return {
                'success': True,
                'timeRange': {'hours': hours, 'startTime': start_time},
                'anomalies': anomalies,
                'totalAnomalies': len(anomalies)
            }
            
        except Exception as e:
            self.logger.error(f"Error detecting anomalies: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _detect_resource_anomalies(self, start_time):
        """Detect system resource anomalies"""
        try:
            anomalies = []
            
            # Get recent system metrics
            metrics = list(self.db.system_health.find({
                'timestamp': {'$gte': start_time},
                'component': 'system'
            }))
            
            if not metrics:
                return anomalies
            
            # Check CPU usage spikes
            cpu_values = []
            memory_values = []
            disk_values = []
            
            for metric in metrics:
                system_data = metric.get('metrics', {})
                
                cpu_usage = system_data.get('cpu', {}).get('usage_percent')
                if cpu_usage is not None:
                    cpu_values.append(cpu_usage)
                
                memory_usage = system_data.get('memory', {}).get('usage_percent')
                if memory_usage is not None:
                    memory_values.append(memory_usage)
                
                disk_usage = system_data.get('disk', {}).get('usage_percent')
                if disk_usage is not None:
                    disk_values.append(disk_usage)
            
            # CPU anomalies
            if cpu_values:
                max_cpu = max(cpu_values)
                avg_cpu = np.mean(cpu_values)
                
                if max_cpu > 90:
                    anomalies.append({
                        'type': 'high_cpu_usage',
                        'severity': 'high',
                        'timestamp': datetime.now(),
                        'value': max_cpu,
                        'threshold': 90,
                        'description': f"High CPU usage detected: {max_cpu}%"
                    })
                elif avg_cpu > 70:
                    anomalies.append({
                        'type': 'sustained_high_cpu',
                        'severity': 'medium',
                        'timestamp': datetime.now(),
                        'value': avg_cpu,
                        'threshold': 70,
                        'description': f"Sustained high CPU usage: {avg_cpu:.1f}% average"
                    })
            
            # Memory anomalies
            if memory_values:
                max_memory = max(memory_values)
                
                if max_memory > 95:
                    anomalies.append({
                        'type': 'high_memory_usage',
                        'severity': 'critical',
                        'timestamp': datetime.now(),
                        'value': max_memory,
                        'threshold': 95,
                        'description': f"Critical memory usage: {max_memory}%"
                    })
                elif max_memory > 85:
                    anomalies.append({
                        'type': 'high_memory_usage',
                        'severity': 'medium',
                        'timestamp': datetime.now(),
                        'value': max_memory,
                        'threshold': 85,
                        'description': f"High memory usage: {max_memory}%"
                    })
            
            return anomalies
            
        except Exception as e:
            self.logger.error(f"Error detecting resource anomalies: {str(e)}")
            return []
    
    def get_predictive_insights(self, days=30):
        """Generate predictive insights based on historical data"""
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            insights = []
            
            # 1. Predict peak usage times
            hourly_pattern = list(self.db.mcp_operations.aggregate([
                {'$match': {'timestamp': {'$gte': start_date}}},
                {'$group': {
                    '_id': {'$hour': '$timestamp'},
                    'avgOperations': {'$avg': 1},
                    'totalOperations': {'$sum': 1}
                }},
                {'$sort': {'totalOperations': -1}}
            ]))
            
            if hourly_pattern:
                peak_hours = [item['_id'] for item in hourly_pattern[:3]]
                insights.append({
                    'type': 'peak_usage_prediction',
                    'confidence': 'high',
                    'data': peak_hours,
                    'description': f"Peak usage hours are typically: {', '.join(map(str, peak_hours))}:00"
                })
            
            # 2. Failure rate trends
            weekly_failures = list(self.db.mcp_operations.aggregate([
                {'$match': {'timestamp': {'$gte': start_date}}},
                {'$group': {
                    '_id': {
                        'week': {'$week': '$timestamp'},
                        'year': {'$year': '$timestamp'}
                    },
                    'total': {'$sum': 1},
                    'failed': {'$sum': {'$cond': [{'$eq': ['$status', 'failed']}, 1, 0]}}
                }},
                {'$addFields': {
                    'failureRate': {'$multiply': [{'$divide': ['$failed', '$total']}, 100]}
                }},
                {'$sort': {'_id.year': 1, '_id.week': 1}}
            ]))
            
            if len(weekly_failures) >= 2:
                recent_rate = weekly_failures[-1]['failureRate']
                prev_rate = weekly_failures[-2]['failureRate']
                trend = 'increasing' if recent_rate > prev_rate else 'decreasing'
                
                insights.append({
                    'type': 'failure_rate_trend',
                    'confidence': 'medium',
                    'data': {'current': recent_rate, 'previous': prev_rate, 'trend': trend},
                    'description': f"Failure rate is {trend}: {recent_rate:.1f}% this week vs {prev_rate:.1f}% last week"
                })
            
            # 3. Resource usage predictions
            resource_trend = self._analyze_resource_trends(start_date)
            if resource_trend:
                insights.extend(resource_trend)
            
            # 4. Operation type popularity
            type_trends = list(self.db.mcp_operations.aggregate([
                {'$match': {'timestamp': {'$gte': start_date}}},
                {'$group': {
                    '_id': '$operationType',
                    'count': {'$sum': 1},
                    'avgExecutionTime': {'$avg': '$executionTime'}
                }},
                {'$sort': {'count': -1}}
            ]))
            
            if type_trends:
                popular_ops = [item['_id'] for item in type_trends[:3]]
                insights.append({
                    'type': 'popular_operations',
                    'confidence': 'high',
                    'data': popular_ops,
                    'description': f"Most common operations: {', '.join(popular_ops)}"
                })
            
            return {
                'success': True,
                'timeRange': {'days': days, 'startDate': start_date},
                'insights': insights,
                'totalInsights': len(insights),
                'generatedAt': datetime.now()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating predictive insights: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _analyze_resource_trends(self, start_date):
        """Analyze resource usage trends for predictions"""
        try:
            insights = []
            
            # Get system metrics over time
            metrics = list(self.db.system_health.find({
                'timestamp': {'$gte': start_date},
                'component': 'system'
            }).sort('timestamp', 1))
            
            if len(metrics) < 10:  # Need enough data points
                return insights
            
            # Analyze memory usage trend
            memory_values = []
            timestamps = []
            
            for metric in metrics:
                system_data = metric.get('metrics', {})
                memory_usage = system_data.get('memory', {}).get('usage_percent')
                
                if memory_usage is not None:
                    memory_values.append(memory_usage)
                    timestamps.append(metric['timestamp'])
            
            if len(memory_values) >= 5:
                # Simple linear trend analysis
                x = np.arange(len(memory_values))
                coeffs = np.polyfit(x, memory_values, 1)
                slope = coeffs[0]
                
                if abs(slope) > 0.1:  # Significant trend
                    trend = 'increasing' if slope > 0 else 'decreasing'
                    current_avg = np.mean(memory_values[-5:])  # Last 5 readings
                    
                    insights.append({
                        'type': 'memory_usage_trend',
                        'confidence': 'medium',
                        'data': {
                            'trend': trend,
                            'slope': slope,
                            'currentAverage': current_avg
                        },
                        'description': f"Memory usage is {trend} (current avg: {current_avg:.1f}%)"
                    })
            
            return insights
            
        except Exception as e:
            self.logger.error(f"Error analyzing resource trends: {str(e)}")
            return []
    
    def get_custom_metrics(self, metric_config):
        """Calculate custom metrics based on configuration"""
        try:
            results = {}
            
            for metric_name, config in metric_config.items():
                collection_name = config.get('collection', 'mcp_operations')
                aggregation = config.get('aggregation', 'count')
                filters = config.get('filters', {})
                time_range = config.get('timeRange', 24)  # hours
                
                start_time = datetime.now() - timedelta(hours=time_range)
                
                # Build query
                query = {'timestamp': {'$gte': start_time}}
                query.update(filters)
                
                collection = self.db[collection_name]
                
                if aggregation == 'count':
                    result = collection.count_documents(query)
                elif aggregation == 'sum':
                    field = config.get('field')
                    if field:
                        pipeline = [
                            {'$match': query},
                            {'$group': {'_id': None, 'total': {'$sum': f'${field}'}}}
                        ]
                        agg_result = list(collection.aggregate(pipeline))
                        result = agg_result[0]['total'] if agg_result else 0
                    else:
                        result = 0
                elif aggregation == 'avg':
                    field = config.get('field')
                    if field:
                        pipeline = [
                            {'$match': query},
                            {'$group': {'_id': None, 'average': {'$avg': f'${field}'}}}
                        ]
                        agg_result = list(collection.aggregate(pipeline))
                        result = agg_result[0]['average'] if agg_result else 0
                    else:
                        result = 0
                else:
                    result = 0
                
                results[metric_name] = {
                    'value': result,
                    'config': config,
                    'calculatedAt': datetime.now()
                }
            
            return {
                'success': True,
                'metrics': results
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating custom metrics: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def generate_performance_report(self, days=7):
        """Generate comprehensive performance report"""
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            # Overall statistics
            total_ops = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': start_date}
            })
            
            successful_ops = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': start_date},
                'status': 'completed'
            })
            
            failed_ops = self.db.mcp_operations.count_documents({
                'timestamp': {'$gte': start_date},
                'status': 'failed'
            })
            
            success_rate = (successful_ops / max(total_ops, 1)) * 100
            
            # Performance metrics
            perf_pipeline = [
                {'$match': {
                    'timestamp': {'$gte': start_date},
                    'executionTime': {'$exists': True, '$ne': None}
                }},
                {'$group': {
                    '_id': None,
                    'avgExecutionTime': {'$avg': '$executionTime'},
                    'maxExecutionTime': {'$max': '$executionTime'},
                    'minExecutionTime': {'$min': '$executionTime'},
                    'p95ExecutionTime': {'$percentile': {'input': '$executionTime', 'p': [0.95]}},
                    'totalOperations': {'$sum': 1}
                }}
            ]
            
            perf_data = list(self.db.mcp_operations.aggregate(perf_pipeline))
            performance = perf_data[0] if perf_data else {}
            
            # Top slow operations
            slow_ops = list(self.db.mcp_operations.find({
                'timestamp': {'$gte': start_date},
                'executionTime': {'$exists': True}
            }).sort('executionTime', -1).limit(10))
            
            # Error analysis
            error_pipeline = [
                {'$match': {
                    'timestamp': {'$gte': start_date},
                    'status': 'failed'
                }},
                {'$group': {
                    '_id': '$errorMessage',
                    'count': {'$sum': 1}
                }},
                {'$sort': {'count': -1}},
                {'$limit': 10}
            ]
            
            common_errors = list(self.db.mcp_operations.aggregate(error_pipeline))
            
            return {
                'success': True,
                'reportPeriod': {'days': days, 'startDate': start_date},
                'summary': {
                    'totalOperations': total_ops,
                    'successfulOperations': successful_ops,
                    'failedOperations': failed_ops,
                    'successRate': round(success_rate, 2)
                },
                'performance': performance,
                'slowOperations': slow_ops,
                'commonErrors': common_errors,
                'generatedAt': datetime.now()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating performance report: {str(e)}")
            return {'success': False, 'error': str(e)}

# Global analytics engine instance
analytics_engine = AnalyticsEngine()

def get_analytics_engine():
    """Get the global analytics engine instance"""
    return analytics_engine
