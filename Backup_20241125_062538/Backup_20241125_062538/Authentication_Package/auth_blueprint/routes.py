from flask import render_template, jsonify, request, current_app
from . import auth_bp

@auth_bp.route('/login')
def login():
    """Render the login page"""
    cognito_config = {
        'UserPoolId': 'us-west-2_PK6TMkBjL',
        'ClientId': '1ndgkdrg86ll17nrsl93bkg545',
        'Domain': 'https://ssopackagec197c9bc-c197c9bc-dev.auth.us-west-2.amazoncognito.com'
    }
    return render_template('auth/login.html', cognito_config=cognito_config)

@auth_bp.route('/callback')
def callback():
    """Handle the SSO callback"""
    code = request.args.get('code')
    error = request.args.get('error')
    
    if code:
        # Log successful authentication
        current_app.logger.info(f"Successful authentication with code: {code}")
        return render_template('auth/callback.html', 
                             success=True, 
                             message="Successfully authenticated!")
    else:
        # Log authentication error
        current_app.logger.error(f"Authentication error: {error}")
        return render_template('auth/callback.html', 
                             success=False, 
                             message=f"Authentication error: {error}")

@auth_bp.route('/logout')
def logout():
    """Handle logout"""
    return render_template('auth/login.html', message="Successfully logged out")