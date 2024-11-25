from flask import Flask, render_template, redirect, url_for
import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import auth blueprint
try:
    from Authentication_Package.auth_blueprint import auth_bp
except ImportError as e:
    print(f"Error importing auth_blueprint: {e}")
    sys.exit(1)

def create_app():
    """Application factory function for Elastic Beanstalk Flask application"""
    app = Flask(__name__)
    
    # Configuration
    app.config.update(
        # Core Flask Configuration
        SECRET_KEY=os.environ.get('FLASK_SECRET_KEY'),
        DEBUG=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true',
        ENV=os.environ.get('FLASK_ENV', 'production'),
        
        # AWS Cognito Configuration
        COGNITO_CONFIG={
            'REGION': os.environ.get('COGNITO_REGION'),
            'USER_POOL_ID': os.environ.get('COGNITO_USER_POOL_ID'),
            'APP_CLIENT_ID': os.environ.get('COGNITO_APP_CLIENT_ID'),
            'DOMAIN': os.environ.get('COGNITO_DOMAIN')
        }
    )

    # Validate required configuration
    required_vars = [
        ('FLASK_SECRET_KEY', app.config['SECRET_KEY']),
        ('COGNITO_USER_POOL_ID', app.config['COGNITO_CONFIG']['USER_POOL_ID']),
        ('COGNITO_APP_CLIENT_ID', app.config['COGNITO_CONFIG']['APP_CLIENT_ID']),
        ('COGNITO_DOMAIN', app.config['COGNITO_CONFIG']['DOMAIN'])
    ]

    missing_vars = [var for var, value in required_vars if not value]
    if missing_vars:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}")

    # Configure Logging
    configure_logging(app)
    
    # Register Blueprints
    register_blueprints(app)
    
    # Register Error Handlers
    register_error_handlers(app)
    
    # Register Routes
    register_routes(app)
    
    return app

def configure_logging(app):
    """Configure application logging"""
    if not app.debug:
        # Ensure logs directory exists
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        # Set up rotating file handler
        file_handler = RotatingFileHandler(
            'logs/application.log',
            maxBytes=1024 * 1024,  # 1MB
            backupCount=10
        )
        
        # Set logging format
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s '
            '[in %(pathname)s:%(lineno)d]'
        ))
        
        # Set logging level
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        
        # Log application startup
        app.logger.info(f'Harrier startup [Environment: {app.config["ENV"]}]')
        
        # Log configuration (excluding sensitive details)
        app.logger.info(f'Cognito Region: {app.config["COGNITO_CONFIG"]["REGION"]}')
        app.logger.info(f'Debug Mode: {app.config["DEBUG"]}')

def register_blueprints(app):
    """Register Flask blueprints"""
    app.register_blueprint(auth_bp)
    # Add additional blueprints here as needed
    app.logger.info("Registered blueprints: auth")

def register_error_handlers(app):
    """Register error handlers"""
    
    @app.errorhandler(404)
    def not_found_error(error):
        app.logger.error(f'Page not found: {request.url}')
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        return render_template('500.html'), 500

def register_routes(app):
    """Register main application routes"""
    
    @app.route('/')
    def index():
        """Main index route"""
        return render_template('index.html',
                             cognito_config=app.config['COGNITO_CONFIG'])
    @app.route("/testing_modal")

    def engineering_modal():
        """Serve the Engineering Modal directly."""
        return render_template("engineering_testing_modal.html")

    @app.route('/health')
    def health_check():
        """Health check endpoint for ELB"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat()
        })

# Create the application instance
application = create_app()

if __name__ == '__main__':
    # Local development server configuration
    port = int(os.environ.get('PORT', 5000))
    
    application.logger.info(f'Starting development server on port {port}')
    application.run(
        host='0.0.0.0',
        port=port,
        debug=True  # Enable debug mode for local development
    )