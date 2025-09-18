from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
from config import Config
from utils.database import init_db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize CORS
    CORS(app, origins=["http://localhost:3000"])
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Initialize database
    init_db()
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.student import student_bp
    from routes.admin import admin_bp
    from routes.common import common_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(common_bp, url_prefix='/api/common')
    
    @app.route('/')
    def health_check():
        return {'message': 'College ERP Backend is running!', 'status': 'healthy'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
