from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from services.mcp_monitor import get_monitor_instance
from services.audit_service import get_audit_service
from services.analytics_engine import get_analytics_engine
from services.notification_hub import get_notification_hub
from utils.change_streams import get_change_stream_manager
from utils.websocket_manager import get_websocket_manager
from middleware.rate_limiter import rate_limit_mcp, rate_limit_analytics, rate_limit_audit
from middleware.audit_logger import audit_mcp_operation, get_audit_logger
from bson import ObjectId
import json

mcp_bp = Blueprint('mcp', __name__)

# Initialize services
mcp_monitor = get_monitor_instance()
audit_service = get_audit_service()
analytics_engine = get_analytics_engine()
notification_hub = get_notification_hub()
change_stream_manager = get_change_stream_manager()
audit_logger = get_audit_logger()

# MCP Operations Endpoints
@mcp_bp.route('/operations', methods=['GET'])
@rate_limit_mcp
@audit_mcp_operation
def get_mcp_operations():
    """Get MCP operations with filtering and pagination"""
    try:
        # Get query parameters
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        status = request.args.get('status')
        operation_type = request.args.get('operationType')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Parse dates
        if start_date:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Get operations
        operations = mcp_monitor.mcp_operation.get_operations(
            limit=limit,
            offset=offset,
            status=status,
            operation_type=operation_type,
            start_date=start_date,
            end_date=end_date
        )
        
        return jsonify({
            'success': True,
            'data': operations
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/operations/<operation_id>', methods=['GET'])
@rate_limit_mcp
def get_mcp_operation(operation_id):
    """Get specific MCP operation details"""
    try:
        operation = mcp_monitor.mcp_operation.get_operation_by_id(operation_id)
        
        if not operation:
            return jsonify({
                'success': False,
                'error': 'Operation not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': operation
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/operations', methods=['POST'])
@rate_limit_mcp
@audit_mcp_operation
def create_mcp_operation():
    """Create/log a new MCP operation"""
    try:
        data = request.get_json()
        
        required_fields = ['operationType', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Log the operation
        operation_id = audit_logger.log_mcp_operation(data)
        
        return jsonify({
            'success': True,
            'operationId': operation_id
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/operations/<operation_id>/status', methods=['PUT'])
@rate_limit_mcp
@audit_mcp_operation
def update_operation_status(operation_id):
    """Update MCP operation status"""
    try:
        data = request.get_json()
        
        status = data.get('status')
        result_data = data.get('result')
        error_message = data.get('errorMessage')
        
        if not status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        success = mcp_monitor.mcp_operation.update_operation_status(
            operation_id, status, result_data, error_message
        )
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to update operation status'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Operation status updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/operations/stats', methods=['GET'])
@rate_limit_mcp
def get_operation_stats():
    """Get MCP operation statistics"""
    try:
        stats = mcp_monitor.mcp_operation.get_operation_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/operations/live', methods=['GET'])
@rate_limit_mcp
def get_live_operations():
    """Get live feed of recent operations"""
    try:
        limit = int(request.args.get('limit', 20))
        operations = mcp_monitor.mcp_operation.get_live_operations(limit)
        
        return jsonify({
            'success': True,
            'data': operations
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# System Health Endpoints
@mcp_bp.route('/health/current', methods=['GET'])
@rate_limit_mcp
def get_current_health():
    """Get current system health metrics"""
    try:
        metrics = mcp_monitor.system_health.get_current_system_metrics()
        
        return jsonify({
            'success': True,
            'data': metrics
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/health/summary', methods=['GET'])
@rate_limit_mcp
def get_health_summary():
    """Get comprehensive system health summary"""
    try:
        summary = mcp_monitor.system_health.get_system_summary()
        
        return jsonify({
            'success': True,
            'data': summary
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/health/history', methods=['GET'])
@rate_limit_mcp
def get_health_history():
    """Get system health history"""
    try:
        hours = int(request.args.get('hours', 24))
        interval = int(request.args.get('interval', 5))
        
        history = mcp_monitor.system_health.get_health_history(hours, interval)
        
        return jsonify({
            'success': True,
            'data': history
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/health/alerts', methods=['GET'])
@rate_limit_mcp
def get_health_alerts():
    """Get current health alerts"""
    try:
        alerts = mcp_monitor.system_health.get_performance_alerts()
        
        return jsonify({
            'success': True,
            'data': alerts
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/health/mcp-server', methods=['GET'])
@rate_limit_mcp
def get_mcp_server_status():
    """Get MCP server health status"""
    try:
        status = mcp_monitor.system_health.get_mcp_server_status()
        
        return jsonify({
            'success': True,
            'data': status
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Audit Trail Endpoints
@mcp_bp.route('/audit/changes', methods=['GET'])
@rate_limit_audit
def get_audit_changes():
    """Get audit trail changes"""
    try:
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        collection_name = request.args.get('collection')
        operation_type = request.args.get('operationType')
        entity_id = request.args.get('entityId')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Parse dates
        if start_date:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        changes = audit_service.audit_trail.get_changes(
            limit=limit,
            offset=offset,
            collection_name=collection_name,
            operation_type=operation_type,
            start_date=start_date,
            end_date=end_date,
            entity_id=entity_id
        )
        
        return jsonify({
            'success': True,
            'data': changes
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/audit/entity/<collection>/<entity_id>', methods=['GET'])
@rate_limit_audit
def get_entity_audit_trail(collection, entity_id):
    """Get complete audit trail for a specific entity"""
    try:
        trail = audit_service.get_entity_audit_trail(collection, entity_id)
        
        return jsonify({
            'success': True,
            'data': trail
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/audit/rollback/<audit_id>', methods=['POST'])
@rate_limit_audit
@audit_mcp_operation
def rollback_change(audit_id):
    """Rollback a specific change"""
    try:
        data = request.get_json()
        rollback_reason = data.get('reason', 'Manual rollback via API')
        
        result = audit_service.perform_rollback(audit_id, rollback_reason)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/audit/rollback-candidates', methods=['GET'])
@rate_limit_audit
def get_rollback_candidates():
    """Get operations that can be rolled back"""
    try:
        hours = int(request.args.get('hours', 24))
        candidates = audit_service.get_rollback_candidates(hours)
        
        return jsonify({
            'success': True,
            'data': candidates
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/audit/suspicious-activity', methods=['GET'])
@rate_limit_audit
def get_suspicious_activity():
    """Get suspicious database activity"""
    try:
        hours = int(request.args.get('hours', 24))
        activity = audit_service.detect_suspicious_activity(hours)
        
        return jsonify({
            'success': True,
            'data': activity
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/audit/compliance-report', methods=['POST'])
@rate_limit_audit
def generate_compliance_report():
    """Generate compliance audit report"""
    try:
        data = request.get_json()
        
        start_date = datetime.fromisoformat(data['startDate'].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(data['endDate'].replace('Z', '+00:00'))
        collection_name = data.get('collection')
        
        report = audit_service.generate_compliance_report(start_date, end_date, collection_name)
        
        return jsonify({
            'success': True,
            'data': report
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Analytics Endpoints
@mcp_bp.route('/analytics/trends', methods=['GET'])
@rate_limit_analytics
def get_operation_trends():
    """Get operation trends analysis"""
    try:
        days = int(request.args.get('days', 30))
        trends = analytics_engine.get_operation_trends(days)
        
        return jsonify({
            'success': True,
            'data': trends
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/analytics/anomalies', methods=['GET'])
@rate_limit_analytics
def get_anomalies():
    """Get detected anomalies"""
    try:
        hours = int(request.args.get('hours', 24))
        anomalies = analytics_engine.detect_anomalies(hours)
        
        return jsonify({
            'success': True,
            'data': anomalies
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/analytics/predictions', methods=['GET'])
@rate_limit_analytics
def get_predictive_insights():
    """Get predictive insights"""
    try:
        days = int(request.args.get('days', 30))
        insights = analytics_engine.get_predictive_insights(days)
        
        return jsonify({
            'success': True,
            'data': insights
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/analytics/performance-report', methods=['GET'])
@rate_limit_analytics
def get_performance_report():
    """Get comprehensive performance report"""
    try:
        days = int(request.args.get('days', 7))
        report = analytics_engine.generate_performance_report(days)
        
        return jsonify({
            'success': True,
            'data': report
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/analytics/custom-metrics', methods=['POST'])
@rate_limit_analytics
def calculate_custom_metrics():
    """Calculate custom metrics"""
    try:
        metric_config = request.get_json()
        
        if not metric_config:
            return jsonify({
                'success': False,
                'error': 'Metric configuration is required'
            }), 400
        
        metrics = analytics_engine.get_custom_metrics(metric_config)
        
        return jsonify({
            'success': True,
            'data': metrics
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Notification Endpoints
@mcp_bp.route('/notifications', methods=['GET'])
@rate_limit_mcp
def get_recent_notifications():
    """Get recent notifications"""
    try:
        hours = int(request.args.get('hours', 24))
        limit = int(request.args.get('limit', 50))
        
        notifications = notification_hub.get_recent_notifications(hours, limit)
        
        return jsonify({
            'success': True,
            'data': notifications
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/notifications', methods=['POST'])
@rate_limit_mcp
@audit_mcp_operation
def send_custom_notification():
    """Send a custom notification"""
    try:
        data = request.get_json()
        
        title = data.get('title')
        message = data.get('message')
        severity = data.get('severity', 'info')
        notification_type = data.get('type', 'custom')
        notification_data = data.get('data', {})
        
        if not title or not message:
            return jsonify({
                'success': False,
                'error': 'Title and message are required'
            }), 400
        
        result = notification_hub.send_custom_notification(
            title, message, severity, notification_type, notification_data
        )
        
        return jsonify(result), 200 if result['success'] else 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/notifications/settings', methods=['GET'])
@rate_limit_mcp
def get_notification_settings():
    """Get notification settings"""
    try:
        settings = notification_hub.get_notification_settings()
        
        return jsonify({
            'success': True,
            'data': settings
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/notifications/settings/<rule_name>', methods=['PUT'])
@rate_limit_mcp
@audit_mcp_operation
def update_notification_rule(rule_name):
    """Update a notification rule"""
    try:
        settings = request.get_json()
        
        result = notification_hub.update_notification_rule(rule_name, settings)
        
        return jsonify(result), 200 if result['success'] else 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Real-time Monitoring Endpoints
@mcp_bp.route('/realtime/metrics', methods=['GET'])
@rate_limit_mcp
def get_realtime_metrics():
    """Get real-time metrics for dashboard"""
    try:
        metrics = mcp_monitor.get_realtime_metrics()
        
        return jsonify({
            'success': True,
            'data': metrics
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/realtime/connection-pool', methods=['GET'])
@rate_limit_mcp
def get_connection_pool_status():
    """Get database connection pool status"""
    try:
        status = mcp_monitor.get_connection_pool_status()
        
        return jsonify({
            'success': True,
            'data': status
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Change Stream Management Endpoints
@mcp_bp.route('/change-streams/status', methods=['GET'])
@rate_limit_mcp
def get_change_stream_status():
    """Get change stream status"""
    try:
        status = change_stream_manager.get_stream_status()
        
        return jsonify({
            'success': True,
            'data': status
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/change-streams/statistics', methods=['GET'])
@rate_limit_mcp
def get_change_statistics():
    """Get change stream statistics"""
    try:
        hours = int(request.args.get('hours', 24))
        stats = change_stream_manager.get_change_statistics(hours)
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/change-streams/configure/<collection>', methods=['PUT'])
@rate_limit_mcp
@audit_mcp_operation
def configure_change_stream(collection):
    """Configure change stream for a collection"""
    try:
        config = request.get_json()
        
        result = change_stream_manager.configure_collection(collection, **config)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# WebSocket Management Endpoints
@mcp_bp.route('/websocket/stats', methods=['GET'])
@rate_limit_mcp
def get_websocket_stats():
    """Get WebSocket connection statistics"""
    try:
        websocket_manager = get_websocket_manager()
        if not websocket_manager:
            return jsonify({
                'success': False,
                'error': 'WebSocket manager not initialized'
            }), 500
        
        stats = websocket_manager.get_connection_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mcp_bp.route('/websocket/configure/<stream_name>', methods=['PUT'])
@rate_limit_mcp
@audit_mcp_operation
def configure_websocket_stream(stream_name):
    """Configure WebSocket data stream"""
    try:
        websocket_manager = get_websocket_manager()
        if not websocket_manager:
            return jsonify({
                'success': False,
                'error': 'WebSocket manager not initialized'
            }), 500
        
        config = request.get_json()
        result = websocket_manager.configure_stream(stream_name, **config)
        
        return jsonify(result), 200 if result['success'] else 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
