from flask import Flask, render_template, redirect, url_for
from auth_blueprint import auth_bp
import logging
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configure logging
    logging.basicConfig(level=logging.DEBUG)
    
    # Enable debug mode for development
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Secret key for sessions and CSRF
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY')
    if not app.config['SECRET_KEY']:
        app.logger.error('No secret key set! Please check your .env file.')
        raise RuntimeError('No secret key set. Check your environment variables.')
    
    # Register the auth blueprint
    app.register_blueprint(auth_bp)

    # Root route
    @app.route('/')
    def index():
        return redirect(url_for('auth.login'))

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        app.logger.error(f'Page not found: {error}')
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        return render_template('500.html'), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000, host='localhost')