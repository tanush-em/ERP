import threading
import time
import logging
from datetime import datetime
from typing import Dict, Callable, Any, Optional
from pymongo import MongoClient
from pymongo.change_stream import ChangeStream
from utils.database import get_db
from services.audit_service import get_audit_service
from services.notification_hub import get_notification_hub
import json

class ChangeStreamManager:
    def __init__(self):
        self.db = get_db()
        self.audit_service = get_audit_service()
        self.notification_hub = get_notification_hub()
        
        # Change stream configurations
        self.stream_configs = {
            'students': {
                'enabled': True,
                'operations': ['insert', 'update', 'delete'],
                'audit_logging': True,
                'notifications': True
            },
            'courses': {
                'enabled': True,
                'operations': ['insert', 'update', 'delete'],
                'audit_logging': True,
                'notifications': True
            },
            'attendance': {
                'enabled': True,
                'operations': ['insert', 'update', 'delete'],
                'audit_logging': True,
                'notifications': False  # Too frequent for notifications
            },
            'scores': {
                'enabled': True,
                'operations': ['insert', 'update', 'delete'],
                'audit_logging': True,
                'notifications': True
            },
            'fees': {
                'enabled': True,
                'operations': ['insert', 'update', 'delete'],
                'audit_logging': True,
                'notifications': True
            },
            'mcp_operations': {
                'enabled': True,
                'operations': ['insert', 'update'],
                'audit_logging': False,  # Already logged by MCP system
                'notifications': True
            },
            'notifications': {
                'enabled': True,
                'operations': ['insert'],
                'audit_logging': False,
                'notifications': False  # Avoid recursion
            }
        }
        
        # Active change streams
        self.change_streams: Dict[str, ChangeStream] = {}
        self.stream_threads: Dict[str, threading.Thread] = {}
        
        # Event handlers
        self.event_handlers: Dict[str, list] = {
            'insert': [],
            'update': [],
            'delete': [],
            'replace': []
        }
        
        # Running state
        self.running = False
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def start_change_streams(self):
        """Start monitoring change streams for all configured collections"""
        if self.running:
            self.logger.warning("Change streams already running")
            return
        
        self.running = True
        
        for collection_name, config in self.stream_configs.items():
            if config['enabled']:
                self._start_collection_stream(collection_name, config)
        
        self.logger.info("Change stream monitoring started")
    
    def stop_change_streams(self):
        """Stop all change stream monitoring"""
        self.running = False
        
        # Close all change streams
        for collection_name, stream in self.change_streams.items():
            try:
                stream.close()
                self.logger.info(f"Closed change stream for {collection_name}")
            except Exception as e:
                self.logger.error(f"Error closing change stream for {collection_name}: {str(e)}")
        
        # Wait for threads to finish
        for collection_name, thread in self.stream_threads.items():
            try:
                thread.join(timeout=5)
                self.logger.info(f"Stopped change stream thread for {collection_name}")
            except Exception as e:
                self.logger.error(f"Error stopping thread for {collection_name}: {str(e)}")
        
        self.change_streams.clear()
        self.stream_threads.clear()
        
        self.logger.info("Change stream monitoring stopped")
    
    def _start_collection_stream(self, collection_name: str, config: Dict[str, Any]):
        """Start change stream for a specific collection"""
        try:
            collection = self.db[collection_name]
            
            # Create pipeline to filter operations
            pipeline = []
            
            if config['operations']:
                pipeline.append({
                    '$match': {
                        'operationType': {'$in': config['operations']}
                    }
                })
            
            # Create change stream
            change_stream = collection.watch(pipeline, full_document='updateLookup')
            self.change_streams[collection_name] = change_stream
            
            # Start monitoring thread
            thread = threading.Thread(
                target=self._monitor_collection_changes,
                args=(collection_name, change_stream, config),
                daemon=True
            )
            thread.start()
            self.stream_threads[collection_name] = thread
            
            self.logger.info(f"Started change stream for {collection_name}")
            
        except Exception as e:
            self.logger.error(f"Error starting change stream for {collection_name}: {str(e)}")
    
    def _monitor_collection_changes(self, collection_name: str, change_stream: ChangeStream, config: Dict[str, Any]):
        """Monitor changes for a specific collection"""
        while self.running:
            try:
                # Wait for next change (with timeout)
                change = change_stream.try_next()
                
                if change is None:
                    time.sleep(0.1)  # Brief pause if no changes
                    continue
                
                # Process the change
                self._process_change(collection_name, change, config)
                
            except Exception as e:
                self.logger.error(f"Error monitoring changes for {collection_name}: {str(e)}")
                time.sleep(1)  # Wait before retrying
    
    def _process_change(self, collection_name: str, change: Dict[str, Any], config: Dict[str, Any]):
        """Process a detected change"""
        try:
            operation_type = change.get('operationType')
            document_id = change.get('documentKey', {}).get('_id')
            full_document = change.get('fullDocument')
            
            # Extract before and after states
            before_state = None
            after_state = None
            
            if operation_type == 'insert':
                after_state = full_document
            elif operation_type == 'update':
                after_state = full_document
                # Try to get before state from update description
                update_desc = change.get('updateDescription', {})
                if update_desc:
                    before_state = self._reconstruct_before_state(full_document, update_desc)
            elif operation_type == 'delete':
                # For delete, we only have the document key
                before_state = {'_id': document_id}
            elif operation_type == 'replace':
                after_state = full_document
            
            # Log to audit trail if enabled
            if config.get('audit_logging', False):
                self._log_change_to_audit(
                    collection_name=collection_name,
                    operation_type=operation_type,
                    entity_id=str(document_id),
                    before_state=before_state,
                    after_state=after_state,
                    change_metadata=change
                )
            
            # Send notifications if enabled
            if config.get('notifications', False):
                self._send_change_notification(
                    collection_name=collection_name,
                    operation_type=operation_type,
                    entity_id=str(document_id),
                    change_data=change
                )
            
            # Call registered event handlers
            self._call_event_handlers(operation_type, {
                'collection': collection_name,
                'operation': operation_type,
                'entityId': str(document_id),
                'beforeState': before_state,
                'afterState': after_state,
                'change': change
            })
            
            self.logger.debug(f"Processed {operation_type} change for {collection_name}.{document_id}")
            
        except Exception as e:
            self.logger.error(f"Error processing change for {collection_name}: {str(e)}")
    
    def _reconstruct_before_state(self, current_document: Dict[str, Any], update_desc: Dict[str, Any]) -> Dict[str, Any]:
        """Attempt to reconstruct the before state from update description"""
        try:
            if not current_document:
                return None
            
            before_state = current_document.copy()
            
            # Handle removed fields
            removed_fields = update_desc.get('removedFields', [])
            for field in removed_fields:
                # We can't know what the removed value was
                before_state[field] = '[REMOVED_FIELD]'
            
            # Handle updated fields (this is approximate)
            updated_fields = update_desc.get('updatedFields', {})
            for field, new_value in updated_fields.items():
                # We don't have the old value, so we'll mark it as changed
                before_state[field] = '[PREVIOUS_VALUE]'
            
            return before_state
            
        except Exception as e:
            self.logger.error(f"Error reconstructing before state: {str(e)}")
            return None
    
    def _log_change_to_audit(self, collection_name: str, operation_type: str, entity_id: str,
                           before_state: Optional[Dict], after_state: Optional[Dict], 
                           change_metadata: Dict[str, Any]):
        """Log change to audit trail"""
        try:
            # Sanitize states (remove sensitive info)
            if before_state:
                before_state = self._sanitize_document(before_state)
            
            if after_state:
                after_state = self._sanitize_document(after_state)
            
            # Create audit log entry
            self.audit_service.log_database_change(
                collection_name=collection_name,
                operation_type=operation_type,
                entity_id=entity_id,
                before_state=before_state,
                after_state=after_state,
                mcp_command='CHANGE_STREAM_DETECTED',
                metadata={
                    'changeStreamId': str(change_metadata.get('_id', {}).get('_data', '')),
                    'timestamp': change_metadata.get('wallTime', datetime.now()),
                    'source': 'mongodb_change_stream'
                }
            )
            
        except Exception as e:
            self.logger.error(f"Error logging change to audit: {str(e)}")
    
    def _send_change_notification(self, collection_name: str, operation_type: str, 
                                entity_id: str, change_data: Dict[str, Any]):
        """Send notification for significant changes"""
        try:
            # Only notify for certain types of changes
            if operation_type not in ['insert', 'delete']:
                return
            
            # Create notification based on collection and operation
            title, message = self._create_change_notification_content(
                collection_name, operation_type, entity_id, change_data
            )
            
            if title and message:
                self.notification_hub.send_custom_notification(
                    title=title,
                    message=message,
                    severity='info',
                    notification_type='database_change',
                    data={
                        'collection': collection_name,
                        'operation': operation_type,
                        'entityId': entity_id
                    }
                )
            
        except Exception as e:
            self.logger.error(f"Error sending change notification: {str(e)}")
    
    def _create_change_notification_content(self, collection_name: str, operation_type: str,
                                          entity_id: str, change_data: Dict[str, Any]) -> tuple[str, str]:
        """Create notification content for database changes"""
        try:
            full_document = change_data.get('fullDocument', {})
            
            if collection_name == 'students':
                if operation_type == 'insert':
                    name = self._get_student_name(full_document)
                    return 'New Student Added', f'Student {name} has been added to the system'
                elif operation_type == 'delete':
                    return 'Student Removed', f'Student record {entity_id} has been deleted'
            
            elif collection_name == 'courses':
                if operation_type == 'insert':
                    course_name = full_document.get('courseName', 'Unknown')
                    course_code = full_document.get('courseCode', 'Unknown')
                    return 'New Course Added', f'Course {course_code}: {course_name} has been created'
                elif operation_type == 'delete':
                    return 'Course Removed', f'Course {entity_id} has been deleted'
            
            elif collection_name == 'fees':
                if operation_type == 'insert':
                    amount = full_document.get('amount', 0)
                    fee_type = full_document.get('feeType', 'Unknown')
                    return 'New Fee Record', f'New {fee_type} fee of ${amount} has been created'
            
            elif collection_name == 'mcp_operations':
                if operation_type == 'insert':
                    op_type = full_document.get('operationType', 'Unknown')
                    status = full_document.get('status', 'Unknown')
                    return 'MCP Operation Started', f'{op_type} operation is now {status}'
            
            return None, None
            
        except Exception as e:
            self.logger.error(f"Error creating notification content: {str(e)}")
            return None, None
    
    def _get_student_name(self, student_doc: Dict[str, Any]) -> str:
        """Extract student name from document"""
        try:
            profile = student_doc.get('profile', {})
            first_name = profile.get('firstName', '')
            last_name = profile.get('lastName', '')
            
            if first_name and last_name:
                return f"{first_name} {last_name}"
            elif first_name:
                return first_name
            else:
                return student_doc.get('email', 'Unknown Student')
        except:
            return 'Unknown Student'
    
    def _sanitize_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from document"""
        if not document:
            return document
        
        sensitive_fields = ['password', 'token', 'secret', 'key', 'hash']
        sanitized = {}
        
        for key, value in document.items():
            if any(sensitive in key.lower() for sensitive in sensitive_fields):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_document(value)
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _call_event_handlers(self, operation_type: str, event_data: Dict[str, Any]):
        """Call registered event handlers"""
        try:
            handlers = self.event_handlers.get(operation_type, [])
            
            for handler in handlers:
                try:
                    handler(event_data)
                except Exception as e:
                    self.logger.error(f"Error calling event handler: {str(e)}")
        
        except Exception as e:
            self.logger.error(f"Error calling event handlers: {str(e)}")
    
    def register_event_handler(self, operation_type: str, handler: Callable[[Dict[str, Any]], None]):
        """Register an event handler for specific operation types"""
        if operation_type not in self.event_handlers:
            self.event_handlers[operation_type] = []
        
        self.event_handlers[operation_type].append(handler)
        self.logger.info(f"Registered event handler for {operation_type} operations")
    
    def configure_collection(self, collection_name: str, **kwargs):
        """Configure change stream settings for a collection"""
        if collection_name not in self.stream_configs:
            self.stream_configs[collection_name] = {
                'enabled': False,
                'operations': ['insert', 'update', 'delete'],
                'audit_logging': True,
                'notifications': False
            }
        
        # Update configuration
        for key, value in kwargs.items():
            if key in self.stream_configs[collection_name]:
                self.stream_configs[collection_name][key] = value
        
        # If running, restart the stream for this collection
        if self.running and collection_name in self.change_streams:
            self._restart_collection_stream(collection_name)
        
        return self.stream_configs[collection_name]
    
    def _restart_collection_stream(self, collection_name: str):
        """Restart change stream for a specific collection"""
        try:
            # Stop existing stream
            if collection_name in self.change_streams:
                self.change_streams[collection_name].close()
                del self.change_streams[collection_name]
            
            if collection_name in self.stream_threads:
                # Note: Thread will exit naturally when change stream closes
                del self.stream_threads[collection_name]
            
            # Start new stream if enabled
            config = self.stream_configs[collection_name]
            if config['enabled']:
                self._start_collection_stream(collection_name, config)
            
            self.logger.info(f"Restarted change stream for {collection_name}")
            
        except Exception as e:
            self.logger.error(f"Error restarting change stream for {collection_name}: {str(e)}")
    
    def get_stream_status(self) -> Dict[str, Any]:
        """Get status of all change streams"""
        status = {
            'running': self.running,
            'active_streams': len(self.change_streams),
            'configured_collections': len(self.stream_configs),
            'streams': {}
        }
        
        for collection_name, config in self.stream_configs.items():
            status['streams'][collection_name] = {
                'enabled': config['enabled'],
                'active': collection_name in self.change_streams,
                'operations': config['operations'],
                'audit_logging': config['audit_logging'],
                'notifications': config['notifications']
            }
        
        return status
    
    def get_change_statistics(self, hours: int = 24) -> Dict[str, Any]:
        """Get statistics about detected changes"""
        try:
            start_time = datetime.now() - timedelta(hours=hours)
            
            # Get changes from audit trail
            changes = self.audit_service.audit_trail.get_changes(
                limit=1000,
                start_date=start_time,
                end_date=datetime.now()
            )
            
            # Analyze changes
            stats = {
                'totalChanges': len(changes['changes']),
                'byCollection': {},
                'byOperation': {},
                'timeRange': f'Last {hours} hours'
            }
            
            for change in changes['changes']:
                collection = change.get('collectionName', 'unknown')
                operation = change.get('operationType', 'unknown')
                
                stats['byCollection'][collection] = stats['byCollection'].get(collection, 0) + 1
                stats['byOperation'][operation] = stats['byOperation'].get(operation, 0) + 1
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Error getting change statistics: {str(e)}")
            return {'error': str(e)}

# Global change stream manager instance
change_stream_manager = ChangeStreamManager()

def start_change_stream_monitoring():
    """Start change stream monitoring"""
    change_stream_manager.start_change_streams()

def stop_change_stream_monitoring():
    """Stop change stream monitoring"""
    change_stream_manager.stop_change_streams()

def get_change_stream_manager():
    """Get the global change stream manager instance"""
    return change_stream_manager
