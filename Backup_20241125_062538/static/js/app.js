// app.js
const App = {
    init() {
        Utils.log('Initializing Application');
        
        try {
            // Check for required modules
            this.checkDependencies();
            
            // Initialize all modules in correct order
            this.initializeModules();
            
            // Set up global error handling
            this.setupErrorHandling();
            
            Utils.log('Application initialized successfully');
        } catch (error) {
            Utils.log(`Application initialization failed: ${error}`, 'error');
            Utils.showToast('Error initializing application', 'error');
        }
    },

    checkDependencies() {
        const requiredModules = ['Utils', 'modalManager', 'FileUploadManager', 'DashboardManager'];
        
        const missingModules = requiredModules.filter(module => !window[module]);
        
        if (missingModules.length > 0) {
            throw new Error(`Missing required modules: ${missingModules.join(', ')}`);
        }
    },

    initializeModules() {
        // Initialize modules in dependency order
        // Utils is already initialized by this point
        
        // Initialize core functionality
        modalManager.init();
        
        // Initialize sidebar navigation
        setupSidebar(); // This is the global function from sidebar.js
        
        // Initialize features
        FileUploadManager.init();
        DashboardManager.init();
        
        // Set initial state based on URL hash if present
        this.handleInitialRoute();
    },

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            Utils.log(`Global error: ${event.error.message}`, 'error');
            Utils.showToast('An unexpected error occurred', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            Utils.log(`Unhandled promise rejection: ${event.reason}`, 'error');
            Utils.showToast('An unexpected error occurred', 'error');
        });
    },

    handleInitialRoute() {
        // Check for hash in URL and navigate if present
        const hash = window.location.hash.slice(1); // Remove the # symbol
        if (hash) {
            const menuItem = document.querySelector(`.menu-item[data-section="${hash}"]`);
            if (menuItem) {
                menuItem.click();
            }
        }
    }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App available globally
window.App = App;