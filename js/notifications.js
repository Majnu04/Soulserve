// notifications.js - Toast notification system

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        
        this.init();
    }
    
    init() {
        // Create or get notification container
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            this.container.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.container);
        }
    }
    
    show(message, type = 'info', options = {}) {
        const notification = this.createNotification(message, type, options);
        this.addNotification(notification);
        return notification.id;
    }
    
    createNotification(message, type, options) {
        const id = this.generateId();
        const duration = options.duration || this.defaultDuration;
        const persistent = options.persistent || false;
        const actions = options.actions || [];
        
        const notification = {
            id,
            message,
            type,
            duration,
            persistent,
            actions,
            element: null,
            timer: null
        };
        
        notification.element = this.createElement(notification);
        return notification;
    }
    
    createElement(notification) {
        const toast = document.createElement('div');
        toast.className = `toast ${notification.type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.dataset.id = notification.id;
        
        const icon = this.getIcon(notification.type);
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${icon}</div>
                <div class="toast-body">
                    <h4>${this.getTypeTitle(notification.type)}</h4>
                    <p>${notification.message}</p>
                    ${notification.actions.length > 0 ? this.createActionsHTML(notification.actions) : ''}
                </div>
                ${!notification.persistent ? '<button class="toast-close" aria-label="Close notification">&times;</button>' : ''}
            </div>
        `;
        
        // Add event listeners
        if (!notification.persistent) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.remove(notification.id));
        }
        
        // Add action listeners
        notification.actions.forEach((action, index) => {
            const actionBtn = toast.querySelector(`[data-action="${index}"]`);
            if (actionBtn) {
                actionBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (action.handler) {
                        action.handler();
                    }
                    if (action.dismiss !== false) {
                        this.remove(notification.id);
                    }
                });
            }
        });
        
        // Add hover handlers to pause/resume timer
        if (!notification.persistent) {
            toast.addEventListener('mouseenter', () => this.pauseTimer(notification.id));
            toast.addEventListener('mouseleave', () => this.resumeTimer(notification.id));
        }
        
        return toast;
    }
    
    createActionsHTML(actions) {
        return `
            <div class="toast-actions">
                ${actions.map((action, index) => `
                    <button class="toast-action" data-action="${index}">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    addNotification(notification) {
        // Remove oldest notification if at limit
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.remove(oldestId);
        }
        
        this.notifications.set(notification.id, notification);
        this.container.appendChild(notification.element);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            notification.element.style.transform = 'translateX(0)';
        });
        
        // Set auto-dismiss timer
        if (!notification.persistent && notification.duration > 0) {
            this.setTimer(notification.id);
        }
        
        // Announce to screen readers
        this.announceToScreenReader(notification);
    }
    
    remove(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        this.clearTimer(id);
        
        // Animate out
        notification.element.style.transform = 'translateX(100%)';
        notification.element.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
    }
    
    setTimer(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.timer = setTimeout(() => {
            this.remove(id);
        }, notification.duration);
    }
    
    clearTimer(id) {
        const notification = this.notifications.get(id);
        if (notification && notification.timer) {
            clearTimeout(notification.timer);
            notification.timer = null;
        }
    }
    
    pauseTimer(id) {
        this.clearTimer(id);
    }
    
    resumeTimer(id) {
        const notification = this.notifications.get(id);
        if (notification && !notification.persistent) {
            this.setTimer(id);
        }
    }
    
    clear() {
        this.notifications.forEach((_, id) => this.remove(id));
    }
    
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    getTypeTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || titles.info;
    }
    
    announceToScreenReader(notification) {
        // Create a temporary element for screen reader announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${this.getTypeTitle(notification.type)}: ${notification.message}`;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    generateId() {
        return 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Create global instance
const notificationManager = new NotificationManager();

// Global notification functions
function showNotification(message, type = 'info', options = {}) {
    return notificationManager.show(message, type, options);
}

function showSuccess(message, options = {}) {
    return notificationManager.show(message, 'success', options);
}

function showError(message, options = {}) {
    return notificationManager.show(message, 'error', options);
}

function showWarning(message, options = {}) {
    return notificationManager.show(message, 'warning', options);
}

function showInfo(message, options = {}) {
    return notificationManager.show(message, 'info', options);
}

function clearNotifications() {
    notificationManager.clear();
}

// Add CSS for toast actions if not already present
function addToastActionStyles() {
    if (document.getElementById('toast-action-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'toast-action-styles';
    style.textContent = `
        .toast-actions {
            margin-top: var(--spacing-sm);
            display: flex;
            gap: var(--spacing-sm);
        }
        
        .toast-action {
            padding: var(--spacing-xs) var(--spacing-sm);
            background-color: var(--primary-color);
            color: var(--white);
            border: none;
            border-radius: var(--border-radius-sm);
            font-size: var(--font-size-xs);
            cursor: pointer;
            transition: var(--transition-fast);
        }
        
        .toast-action:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        
        .toast-action:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addToastActionStyles);
} else {
    addToastActionStyles();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NotificationManager,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        clearNotifications
    };
}

// Make functions globally available
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.clearNotifications = clearNotifications;