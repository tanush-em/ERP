import asyncio
import json
import logging
import weakref
from datetime import datetime
from typing import Dict, Set, Any, Optional, Callable
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from services.mcp_monitor import get_monitor_instance
from services.audit_service import get_audit_service
from services.analytics_engine import get_analytics_engine
from services.notification_hub import get_notification_hub
import threading
import time

class WebSocketManager:
    def __init__(self, app=None):
        self.socketio = None
        self.app = app
        
        # Connection management
        self.connections: Dict[str, Dict] = {}  # session_id -> connection_info
        self.rooms: Dict[str, Set[str]] = {}     # room_name -> set of session_ids
        
        # Real-time data streams
        self.data_streams = {
            'mcp_operations': {'enabled': True, 'interval': 2},
            'system_health': {'enabled': True, 'interval': 5},
            'audit_trail': {'enabled': True, 'interval': 3},
            'analytics': {'enabled': True, 'interval': 10},
            'notifications': {'enabled': True, 'interval': 1}
        }
        
        # Background tasks
        self.background_tasks = {}
        self.running = False
        
        # Services
        self.mcp_monitor = get_monitor_instance()
        self.audit_service = get_audit_service()
        self.analytics_engine = get_analytics_engine()
        self.notification_hub = get_notification_hub()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize WebSocket manager with Flask app"""
        self.app = app
        self.socketio = SocketIO(
            app,
            cors_allowed_origins="*",
            async_mode='threading',
            logger=True,
            engineio_logger=True
        )
        
        # Register event handlers
        self._register_handlers()
        
        # Start background tasks
        self.start_background_tasks()
    
    def _register_handlers(self):
        """Register WebSocket event handlers"""
        
        @self.socketio.on('connect')
        def handle_connect(auth=None):
            session_id = self._get_session_id()
            
            # Store connection info
            self.connections[session_id] = {
                'connected_at': datetime.now(),
                'user_id': auth.get('user_id') if auth else None,
                'subscriptions': set(),
                'last_ping': datetime.now()
            }
            
            self.logger.info(f"WebSocket connected: {session_id}")
            
            # Send welcome message
            emit('connection_established', {
                'session_id': session_id,
                'server_time': datetime.now().isoformat(),
                'available_streams': list(self.data_streams.keys())
            })
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            session_id = self._get_session_id()
            
            # Clean up connection
            if session_id in self.connections:
                # Leave all rooms
                for room in list(self.rooms.keys()):
                    if session_id in self.rooms[room]:
                        self.rooms[room].discard(session_id)
                        if not self.rooms[room]:
                            del self.rooms[room]
                
                del self.connections[session_id]
            
            self.logger.info(f"WebSocket disconnected: {session_id}")
        
        @self.socketio.on('subscribe')
        def handle_subscribe(data):
            session_id = self._get_session_id()
            stream_name = data.get('stream')
            room_name = data.get('room', 'default')
            
            if stream_name not in self.data_streams:
                emit('error', {'message': f'Unknown stream: {stream_name}'})
                return
            
            # Add to room
            full_room_name = f"{stream_name}:{room_name}"
            join_room(full_room_name)
            
            # Track subscription
            if session_id in self.connections:
                self.connections[session_id]['subscriptions'].add(full_room_name)
            
            if full_room_name not in self.rooms:
                self.rooms[full_room_name] = set()
            self.rooms[full_room_name].add(session_id)
            
            self.logger.info(f"Client {session_id} subscribed to {full_room_name}")
            
            emit('subscribed', {
                'stream': stream_name,
                'room': room_name,
                'status': 'success'
            })
        
        @self.socketio.on('unsubscribe')
        def handle_unsubscribe(data):
            session_id = self._get_session_id()
            stream_name = data.get('stream')
            room_name = data.get('room', 'default')
            
            full_room_name = f"{stream_name}:{room_name}"
            leave_room(full_room_name)
            
            # Remove from tracking
            if session_id in self.connections:
                self.connections[session_id]['subscriptions'].discard(full_room_name)
            
            if full_room_name in self.rooms:
                self.rooms[full_room_name].discard(session_id)
                if not self.rooms[full_room_name]:
                    del self.rooms[full_room_name]
            
            self.logger.info(f"Client {session_id} unsubscribed from {full_room_name}")
            
            emit('unsubscribed', {
                'stream': stream_name,
                'room': room_name,
                'status': 'success'
            })
        
        @self.socketio.on('ping')
        def handle_ping():
            session_id = self._get_session_id()
            
            if session_id in self.connections:
                self.connections[session_id]['last_ping'] = datetime.now()
            
            emit('pong', {'server_time': datetime.now().isoformat()})
        
        @self.socketio.on('get_initial_data')
        def handle_get_initial_data(data):
            stream_name = data.get('stream')
            
            if stream_name not in self.data_streams:
                emit('error', {'message': f'Unknown stream: {stream_name}'})
                return
            
            # Send initial data for the requested stream
            initial_data = self._get_initial_data(stream_name)
            emit('initial_data', {
                'stream': stream_name,
                'data': initial_data,
                'timestamp': datetime.now().isoformat()
            })
    
    def _get_session_id(self):
        """Get current session ID"""
        from flask import request
        return request.sid
    
    def _get_initial_data(self, stream_name: str) -> Dict[str, Any]:
        """Get initial data for a stream"""
        try:
            if stream_name == 'mcp_operations':
                return {
                    'recent_operations': self.mcp_monitor.mcp_operation.get_live_operations(20),
                    'stats': self.mcp_monitor.mcp_operation.get_operation_stats()
                }
            
            elif stream_name == 'system_health':
                return {
                    'current_metrics': self.mcp_monitor.system_health.get_current_system_metrics(),
                    'summary': self.mcp_monitor.system_health.get_system_summary()
                }
            
            elif stream_name == 'audit_trail':
                return {
                    'recent_changes': self.audit_service.audit_trail.get_recent_changes(60, 20),
                    'stats': self.audit_service.audit_trail.get_audit_stats()
                }
            
            elif stream_name == 'analytics':
                return {
                    'trends': self.analytics_engine.get_operation_trends(7),
                    'anomalies': self.analytics_engine.detect_anomalies(24)
                }
            
            elif stream_name == 'notifications':
                return {
                    'recent_notifications': self.notification_hub.get_recent_notifications(1, 10),
                    'stats': self.notification_hub.get_notification_stats()
                }
            
            return {}
            
        except Exception as e:
            self.logger.error(f"Error getting initial data for {stream_name}: {str(e)}")
            return {'error': str(e)}
    
    def start_background_tasks(self):
        """Start background tasks for real-time data streaming"""
        if self.running:
            return
        
        self.running = True
        
        for stream_name, config in self.data_streams.items():
            if config['enabled']:
                task_thread = threading.Thread(
                    target=self._stream_data,
                    args=(stream_name, config['interval']),
                    daemon=True
                )
                task_thread.start()
                self.background_tasks[stream_name] = task_thread
        
        # Start connection cleanup task
        cleanup_thread = threading.Thread(target=self._cleanup_connections, daemon=True)
        cleanup_thread.start()
        self.background_tasks['cleanup'] = cleanup_thread
        
        self.logger.info("Background tasks started")
    
    def stop_background_tasks(self):
        """Stop all background tasks"""
        self.running = False
        self.logger.info("Background tasks stopped")
    
    def _stream_data(self, stream_name: str, interval: int):
        """Background task to stream data"""
        while self.running:
            try:
                # Check if anyone is subscribed to this stream
                subscribed_rooms = [room for room in self.rooms.keys() if room.startswith(f"{stream_name}:")]
                
                if not subscribed_rooms:
                    time.sleep(interval)
                    continue
                
                # Get data for this stream
                data = self._get_stream_data(stream_name)
                
                if data:
                    # Broadcast to all subscribed rooms
                    for room in subscribed_rooms:
                        self.socketio.emit('stream_data', {
                            'stream': stream_name,
                            'data': data,
                            'timestamp': datetime.now().isoformat()
                        }, room=room)
                
                time.sleep(interval)
                
            except Exception as e:
                self.logger.error(f"Error in {stream_name} stream: {str(e)}")
                time.sleep(interval * 2)  # Wait longer on error
    
    def _get_stream_data(self, stream_name: str) -> Optional[Dict[str, Any]]:
        """Get current data for a stream"""
        try:
            if stream_name == 'mcp_operations':
                return {
                    'recent_operations': self.mcp_monitor.mcp_operation.get_live_operations(5),
                    'realtime_metrics': self.mcp_monitor.get_realtime_metrics()
                }
            
            elif stream_name == 'system_health':
                return {
                    'current_metrics': self.mcp_monitor.system_health.get_current_system_metrics(),
                    'alerts': self.mcp_monitor.system_health.get_performance_alerts()
                }
            
            elif stream_name == 'audit_trail':
                return {
                    'recent_changes': self.audit_service.audit_trail.get_recent_changes(5, 10)
                }
            
            elif stream_name == 'analytics':
                # Less frequent updates for analytics
                return None  # Will be handled by specific analytics requests
            
            elif stream_name == 'notifications':
                return {
                    'recent_notifications': self.notification_hub.get_recent_notifications(0.1, 5)  # Last 6 minutes
                }
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting stream data for {stream_name}: {str(e)}")
            return None
    
    def _cleanup_connections(self):
        """Clean up stale connections"""
        while self.running:
            try:
                current_time = datetime.now()
                stale_connections = []
                
                for session_id, conn_info in self.connections.items():
                    # Check for connections that haven't pinged in 5 minutes
                    if (current_time - conn_info['last_ping']).total_seconds() > 300:
                        stale_connections.append(session_id)
                
                # Remove stale connections
                for session_id in stale_connections:
                    self.logger.info(f"Cleaning up stale connection: {session_id}")
                    
                    # Remove from rooms
                    for room in list(self.rooms.keys()):
                        if session_id in self.rooms[room]:
                            self.rooms[room].discard(session_id)
                            if not self.rooms[room]:
                                del self.rooms[room]
                    
                    # Remove from connections
                    del self.connections[session_id]
                
                time.sleep(60)  # Check every minute
                
            except Exception as e:
                self.logger.error(f"Error in connection cleanup: {str(e)}")
                time.sleep(60)
    
    def broadcast_notification(self, notification_data: Dict[str, Any]):
        """Broadcast a notification to all connected clients"""
        self.socketio.emit('notification', {
            'type': 'system_notification',
            'data': notification_data,
            'timestamp': datetime.now().isoformat()
        })
    
    def broadcast_to_room(self, room_name: str, event: str, data: Any):
        """Broadcast data to a specific room"""
        self.socketio.emit(event, data, room=room_name)
    
    def send_to_user(self, user_id: str, event: str, data: Any):
        """Send data to a specific user"""
        # Find sessions for this user
        user_sessions = [
            sid for sid, conn_info in self.connections.items()
            if conn_info.get('user_id') == user_id
        ]
        
        for session_id in user_sessions:
            self.socketio.emit(event, data, room=session_id)
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get WebSocket connection statistics"""
        return {
            'total_connections': len(self.connections),
            'active_rooms': len(self.rooms),
            'streams': self.data_streams,
            'background_tasks': list(self.background_tasks.keys()),
            'running': self.running
        }
    
    def configure_stream(self, stream_name: str, enabled: bool = None, interval: int = None):
        """Configure a data stream"""
        if stream_name not in self.data_streams:
            return {'success': False, 'error': f'Unknown stream: {stream_name}'}
        
        if enabled is not None:
            self.data_streams[stream_name]['enabled'] = enabled
        
        if interval is not None:
            self.data_streams[stream_name]['interval'] = interval
        
        return {
            'success': True,
            'stream': stream_name,
            'config': self.data_streams[stream_name]
        }

# Global WebSocket manager instance
websocket_manager = None

def init_websocket_manager(app):
    """Initialize the global WebSocket manager"""
    global websocket_manager
    websocket_manager = WebSocketManager(app)
    return websocket_manager

def get_websocket_manager():
    """Get the global WebSocket manager instance"""
    return websocket_manager
