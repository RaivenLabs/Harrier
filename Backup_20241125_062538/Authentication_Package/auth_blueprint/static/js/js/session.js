```javascript
// sessionManager.js
class SessionManager {
    constructor(config = {}) {
        this.poolData = {
            UserPoolId: 'us-west-2_84EKZhWZo',
            ClientId: '45iqis6o56ph11jm9p4m5h5pbq'
        };
        
        this.config = {
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
            maxInactivityTime: 15 * 60 * 1000, // 15 minutes
            checkInterval: 60 * 1000, // Check every minute
            ...config
        };

        this.userPool = new AmazonCognitoIdentity.CognitoUserPool(this.poolData);
        this.currentUser = null;
        this.sessionTokens = null;
        this.lastActivity = Date.now();
        this.refreshTimer = null;
        this.inactivityTimer = null;
        this.isRefreshing = false;
    }

    // Initialize session management
    initialize() {
        try {
            // Get current user and session
            this.currentUser = this.userPool.getCurrentUser();
            if (this.currentUser) {
                this.currentUser.getSession((err, session) => {
                    if (err) {
                        this.handleSessionError(err);
                        return;
                    }

                    if (session.isValid()) {
                        this.sessionTokens = {
                            accessToken: session.getAccessToken().getJwtToken(),
                            idToken: session.getIdToken().getJwtToken(),
                            refreshToken: session.getRefreshToken().getToken()
                        };

                        // Start session monitoring
                        this.startSessionMonitoring();
                    } else {
                        this.redirectToLogin();
                    }
                });
            }

            // Set up activity listeners
            this.setupActivityListeners();

            // Set up storage listener for multi-tab support
            this.setupStorageListener();

        } catch (error) {
            this.handleSessionError(error);
        }
    }

    // Start monitoring session
    startSessionMonitoring() {
        // Clear any existing timers
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        if (this.inactivityTimer) clearInterval(this.inactivityTimer);

        // Start refresh checker
        this.refreshTimer = setInterval(() => {
            this.checkAndRefreshSession();
        }, this.config.checkInterval);

        // Start inactivity checker
        this.inactivityTimer = setInterval(() => {
            this.checkInactivity();
        }, this.config.checkInterval);
    }

    // Check and refresh session if needed
    async checkAndRefreshSession() {
        if (!this.currentUser || this.isRefreshing) return;

        try {
            this.currentUser.getSession((err, session) => {
                if (err) {
                    this.handleSessionError(err);
                    return;
                }

                const expirationTime = session.getAccessToken().getExpiration() * 1000;
                const timeUntilExpiration = expirationTime - Date.now();

                if (timeUntilExpiration < this.config.refreshThreshold) {
                    this.refreshSession();
                }
            });
        } catch (error) {
            this.handleSessionError(error);
        }
    }

    // Refresh the session
    async refreshSession() {
        if (this.isRefreshing) return;
        this.isRefreshing = true;

        try {
            const refreshToken = new AmazonCognitoIdentity.CognitoRefreshToken({
                RefreshToken: this.sessionTokens.refreshToken
            });

            this.currentUser.refreshSession(refreshToken, (err, session) => {
                this.isRefreshing = false;

                if (err) {
                    this.handleSessionError(err);
                    return;
                }

                // Update session tokens
                this.sessionTokens = {
                    accessToken: session.getAccessToken().getJwtToken(),
                    idToken: session.getIdToken().getJwtToken(),
                    refreshToken: session.getRefreshToken().getToken()
                };

                // Broadcast token refresh to other tabs
                localStorage.setItem('sessionUpdate', Date.now().toString());

                // Dispatch event for application
                window.dispatchEvent(new CustomEvent('sessionRefreshed', {
                    detail: { tokens: this.sessionTokens }
                }));
            });
        } catch (error) {
            this.isRefreshing = false;
            this.handleSessionError(error);
        }
    }

    // Check for inactivity
    checkInactivity() {
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        
        if (timeSinceLastActivity > this.config.maxInactivityTime) {
            this.handleInactivityTimeout();
        }
    }

    // Handle inactivity timeout
    handleInactivityTimeout() {
        this.showTimeoutWarning(() => {
            this.logout();
        });
    }

    // Setup activity listeners
    setupActivityListeners() {
        const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            });
        });

        // Update activity on API calls
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            this.updateActivity();
            return originalFetch.apply(window, args);
        };
    }

    // Update last activity timestamp
    updateActivity() {
        this.lastActivity = Date.now();
        sessionStorage.setItem('lastActivity', this.lastActivity.toString());
    }

    // Setup storage listener for multi-tab support
    setupStorageListener() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'sessionUpdate') {
                this.synchronizeSession();
            } else if (event.key === 'logout') {
                this.handleLogoutEvent();
            }
        });
    }

    // Synchronize session across tabs
    synchronizeSession() {
        if (this.currentUser) {
            this.currentUser.getSession((err, session) => {
                if (err || !session.isValid()) {
                    this.redirectToLogin();
                }
            });
        }
    }

    // Get current session tokens
    getSessionTokens() {
        return this.sessionTokens;
    }

    // Check if session is active
    isSessionActive() {
        return !!this.currentUser && !!this.sessionTokens;
    }

    // Get user attributes
    getUserAttributes() {
        return new Promise((resolve, reject) => {
            if (!this.currentUser) {
                reject(new Error('No user session'));
                return;
            }

            this.currentUser.getUserAttributes((err, attributes) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(attributes);
            });
        });
    }

    // Show timeout warning dialog
    showTimeoutWarning(onTimeout) {
        const warningDialog = document.createElement('div');
        warningDialog.innerHTML = `
            <div class="timeout-warning" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 10000;
            ">
                <h3>Session Timeout Warning</h3>
                <p>Your session will expire due to inactivity. Click to stay logged in.</p>
                <button onclick="document.body.removeChild(this.parentElement.parentElement); SessionManager.updateActivity();">
                    Stay Logged In
                </button>
            </div>
        `;

        document.body.appendChild(warningDialog);

        // Set timeout for automatic logout
        setTimeout(() => {
            if (document.body.contains(warningDialog)) {
                document.body.removeChild(warningDialog);
                onTimeout();
            }
        }, 60000); // 1 minute warning
    }

    // Handle session errors
    handleSessionError(error) {
        console.error('Session error:', error);
        
        // Dispatch event for application
        window.dispatchEvent(new CustomEvent('sessionError', {
            detail: { error }
        }));

        // Redirect to login if necessary
        if (error.code === 'NotAuthorizedException' || 
            error.code === 'TokenExpiredError') {
            this.redirectToLogin();
        }
    }

    // Logout
    logout() {
        if (this.currentUser) {
            try {
                // Global sign-out
                this.currentUser.globalSignOut({
                    onSuccess: () => {
                        this.handleLogoutSuccess();
                    },
                    onFailure: (err) => {
                        console.error('Logout error:', err);
                        this.handleLogoutSuccess(); // Still cleanup local session
                    }
                });
            } catch (error) {
                console.error('Logout error:', error);
                this.handleLogoutSuccess(); // Still cleanup local session
            }
        } else {
            this.handleLogoutSuccess();
        }
    }

    // Handle successful logout
    handleLogoutSuccess() {
        // Clear timers
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        if (this.inactivityTimer) clearInterval(this.inactivityTimer);

        // Clear session data
        this.sessionTokens = null;
        this.currentUser = null;

        // Clear storage
        sessionStorage.clear();
        localStorage.setItem('logout', Date.now().toString());

        // Redirect to login
        this.redirectToLogin();
    }

    // Handle logout event from other tabs
    handleLogoutEvent() {
        // Clear local session without triggering another logout event
        this.sessionTokens = null;
        this.currentUser = null;
        sessionStorage.clear();
        this.redirectToLogin();
    }

    // Redirect to login page
    redirectToLogin() {
        window.location.href = '/login.html';
    }
}

// Export for use in application
export default SessionManager;
```

This Session Manager provides:

1. Session Monitoring:
```
- Automatic token refresh
- Inactivity detection
- Session timeout handling
- Multi-tab synchronization
```

2. Security Features:
```
- Token management
- Secure storage
- Activity monitoring
- Global sign-out
```

3. User Experience:
```
- Timeout warnings
- Seamless token refresh
- Activity tracking
- Multi-tab support
```

4. Integration Features:
```
- Event dispatching
- Error handling
- Session state management
- User attribute access
```

To use this in your application:

```javascript
// Initialize session manager
const sessionManager = new SessionManager({
    sessionTimeout: 30 * 60 * 1000, // Custom timeout
    refreshThreshold: 5 * 60 * 1000  // Custom refresh threshold
});

// Start session management
sessionManager.initialize();

// Listen for session events
window.addEventListener('sessionRefreshed', (event) => {
    // Handle refreshed session
    const tokens = event.detail.tokens;
});

window.addEventListener('sessionError', (event) => {
    // Handle session error
    const error = event.detail.error;
});
```

Would you like me to:
1. Add additional security features?
2. Create specific handlers for different types of session events?
3. Add role-based session management?
4. Implement session persistence options?

This completes your authentication and user management package with:
- Login
- Sign-up
- Password reset
- MFA handling
- Profile management
- Account recovery
- Logout
- Session management