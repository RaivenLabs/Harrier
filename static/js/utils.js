// utils.js
const Utils = {
    // Toast notification system
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) {
            console.error('Toast element not found');
            return;
        }

        toast.textContent = message;
        toast.style.backgroundColor = type === 'error' ? '#dc3545' : '#333';
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    },

    // Debug logging with timestamp
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ${message}`;
        
        switch(type) {
            case 'error':
                console.error(formattedMessage);
                break;
            case 'warn':
                console.warn(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    },

    // DOM helper functions
    toggleClass(element, className) {
        if (element.classList.contains(className)) {
            element.classList.remove(className);
            return false;
        } else {
            element.classList.add(className);
            return true;
        }
    },

    // Simple element creation helper
    createElement(tag, className, text = '') {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (text) {
            element.textContent = text;
        }
        return element;
    }
};

// Initialize utils when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Utils.log('Utils module initialized');
});

// Make Utils available globally
window.Utils = Utils;