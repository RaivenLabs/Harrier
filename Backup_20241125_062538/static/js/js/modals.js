// modals.js
const modalManager = {
    // Registry of all modals and their configurations
    modals: {},

    init() {
        Utils.log('Initializing Modal Manager');
        this.registerDefaultModals();
        this.setupCloseHandlers();
    },

    // Register all default modals
    registerDefaultModals() {
        // Register each modal with its configuration
        const defaultModals = {
            'transactionDashboard': {
                id: 'transactionDashboard',
                element: document.getElementById('transactionDashboard')
            },
            'engineeringConsole': {
                id: 'engineeringConsole',
                element: document.getElementById('engineeringConsole')
            },
            'analyticsConsole': {
                id: 'analyticsConsole',
                element: document.getElementById('analyticsConsole')
            },
            'familiesConsole': {
                id: 'familiesConsole',
                element: document.getElementById('familiesConsole')
            },
            'configurationConsole': {
                id: 'configurationConsole',
                element: document.getElementById('configurationConsole')
            },
            'operationsCommand': {
                id: 'operationsCommand',
                element: document.getElementById('operationsCommand')
            },
            'platformTour': {
                id: 'platformTour',
                element: document.getElementById('platformTour')
            },
            'importModal': {
                id: 'importModal',
                element: document.getElementById('importModal')
            }
        };

        Object.entries(defaultModals).forEach(([id, config]) => {
            if (config.element) {
                this.register(id, config);
            } else {
                Utils.log(`Modal element not found for ${id}`, 'warn');
            }
        });
    },

    // Register a new modal
    register(modalId, config) {
        this.modals[modalId] = {
            ...config,
            open: () => this.open(modalId),
            close: () => this.close(modalId)
        };
        Utils.log(`Registered modal: ${modalId}`);
    },

    // Setup close handlers for all modals
    setupCloseHandlers() {
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAll();
        });

        // Setup close buttons
        document.querySelectorAll('[data-close-modal]').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.closest('[id]').id;
                this.close(modalId);
            });
        });
    },

    // Open a specific modal
    open(modalId) {
        if (!this.modals[modalId]) {
            Utils.log(`Modal ${modalId} not registered`, 'error');
            return;
        }

        const modal = this.modals[modalId];
        
        // Close all other modals first unless it's the import modal
        if (modalId !== 'importModal') {
            this.closeAll();
        }

        if (modal.element) {
            modal.element.classList.add('active');
            Utils.log(`Opened modal: ${modalId}`);
        }
    },

    // Close a specific modal
    close(modalId) {
        if (!this.modals[modalId]) {
            Utils.log(`Modal ${modalId} not registered`, 'error');
            return;
        }

        const modal = this.modals[modalId];
        if (modal.element) {
            modal.element.classList.remove('active');
            Utils.log(`Closed modal: ${modalId}`);
        }

        // Clear file input if it's the import modal
        if (modalId === 'importModal') {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.value = '';
        }
    },

    // Close all modals
    closeAll() {
        Object.keys(this.modals).forEach(modalId => {
            const modal = this.modals[modalId];
            if (modal.element) {
                modal.element.classList.remove('active');
            }
        });
        Utils.log('Closed all modals');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    modalManager.init();
});

// Make modalManager available globally
window.modalManager = modalManager;