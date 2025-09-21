from flask import Flask
from flask_cors import CORS
import os
import atexit
from config import Config
from utils.database import init_db
from utils.websocket_manager import init_websocket_manager
from utils.change_streams import start_change_stream_monitoring, stop_change_stream_monitoring
from services.mcp_monitor import start_mcp_monitoring, stop_mcp_monitoring
from services.notification_hub import start_notification_monitoring, stop_notification_monitoring

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize CORS
    CORS(app, origins=["http://localhost:3000", "http://localhost:3001"])
    
    # Initialize database
    init_db()
    
    # Initialize WebSocket manager
    websocket_manager = init_websocket_manager(app)
    
    # Register blueprints - Admin only
    from routes.admin import admin_bp
    from routes.common import common_bp
    from routes.mcp import mcp_bp
    
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(common_bp, url_prefix='/api/common')
    app.register_blueprint(mcp_bp, url_prefix='/api/mcp')
    
    @app.route('/')
    def health_check():
        return {'message': 'College ERP Backend with MCP Integration is running!', 'status': 'healthy'}
    
    @app.route('/api/health')
    def api_health_check():
        return {
            'message': 'MCP-Enhanced ERP API is healthy',
            'status': 'healthy',
            'services': {
                'database': 'connected',
                'websocket': 'active',
                'mcp_monitor': 'running',
                'change_streams': 'monitoring',
                'notifications': 'active'
            }
        }
    
    # Start background services
    def start_services():
        try:
            # Start MCP monitoring
            start_mcp_monitoring()
            
            # Start change stream monitoring
            start_change_stream_monitoring()
            
            # Start notification monitoring
            start_notification_monitoring()
            
            print("✅ All MCP services started successfully")
            
        except Exception as e:
            print(f"❌ Error starting MCP services: {str(e)}")
    
    # Stop background services on shutdown
    def stop_services():
        try:
            stop_mcp_monitoring()
            stop_change_stream_monitoring()
            stop_notification_monitoring()
            print("✅ All MCP services stopped gracefully")
        except Exception as e:
            print(f"❌ Error stopping MCP services: {str(e)}")
    
    # Register cleanup function
    atexit.register(stop_services)
    
    # Start services after app initialization
    with app.app_context():
        start_services()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5005)
