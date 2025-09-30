// main.js - Enhanced shared functionality across all pages

// Global application state
const FoodShareApp = {
    version: '2.0.0',
    initialized: false,
    user: null,
    settings: {
        theme: 'auto',
        notifications: true,
        autoRefresh: true
    }
};

// Check if localStorage is available
function isLocalStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('localStorage is not available:', e);
        return false;
    }
}

// Enhanced date formatting with relative time
function formatDate(dateString, options = {}) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Return relative time for recent dates
    if (options.relative !== false) {
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }

    // Fallback to formatted date
    const formatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };
    
    return new Intl.DateTimeFormat(undefined, formatOptions).format(date);
}

// Calculate time remaining until expiry with enhanced precision
function getTimeRemaining(expiryTime) {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const timeDiff = expiry - now;
    
    if (timeDiff <= 0) {
        return 'Expired';
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `${days} day${days !== 1 ? 's' : ''} left`;
    } else if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} left`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
    } else {
        return 'Expiring soon';
    }
}

// Enhanced expiry status with more granular levels
function getExpiryStatusClass(expiryTime) {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const timeDiff = expiry - now;
    
    if (timeDiff <= 0) {
        return 'expiry-critical';
    } else if (timeDiff < 2 * 60 * 60 * 1000) { // Less than 2 hours
        return 'expiry-critical';
    } else if (timeDiff < 6 * 60 * 60 * 1000) { // Less than 6 hours
        return 'expiry-soon';
    } else {
        return '';
    }
}

// Enhanced stats calculation with better error handling
function updateStats() {
    if (!isLocalStorageAvailable() || !document.querySelector('.stats')) {
        return;
    }
    
    try {
        const listings = JSON.parse(localStorage.getItem('foodListings') || '[]');
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const statsElements = document.querySelectorAll('.stat .number');
        
        if (statsElements.length >= 3) {
            // Number of active food posts (non-expired)
            const now = new Date();
            const activeListings = listings.filter(listing => new Date(listing.expiryTime) > now);
            
            // Animate counter for food posts
            animateCounter(statsElements[0], activeListings.length);
            
            // Total meals saved (based on quantity)
            const totalServings = listings.reduce((total, listing) => {
                return total + (parseInt(listing.quantity) || 0);
            }, 0);
            animateCounter(statsElements[1], totalServings);
            
            // CO2 saved (estimate: 2.5kg per meal)
            const co2Saved = Math.round(totalServings * 2.5);
            animateCounter(statsElements[2], co2Saved);
            
            // Active users (if 4th stat exists)
            if (statsElements[3]) {
                const activeUserCount = users.length + listings.length; // Basic estimation
                animateCounter(statsElements[3], activeUserCount);
            }
            
            // Update progress ring if it exists
            updateProgressRing(totalServings);
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Animate counter with easing
function animateCounter(element, targetValue, duration = 2000) {
    const startValue = parseInt(element.textContent) || 0;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Update progress ring visualization
function updateProgressRing(currentValue, targetValue = 100) {
    const progressRing = document.querySelector('.progress-ring-progress');
    const progressNumber = document.querySelector('.progress-number');
    
    if (progressRing && progressNumber) {
        const progress = Math.min((currentValue / targetValue) * 100, 100);
        const circumference = 2 * Math.PI * 52; // radius = 52
        const offset = circumference - (progress / 100) * circumference;
        
        progressRing.style.strokeDashoffset = offset;
        progressNumber.textContent = `${Math.round(progress)}%`;
    }
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            
            mobileToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
            
            // Handle body scroll
            if (!isExpanded) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('nav') && navMenu.classList.contains('active')) {
                mobileToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                mobileToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
                mobileToggle.focus();
            }
        });
    }
}

// Scroll-based header styling
function initScrollHeader() {
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;
    
    if (header) {
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScrollY = currentScrollY;
        });
    }
}

// Form validation utilities
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}

// Form field validation with visual feedback
function validateField(field, validatorFn, errorMessage) {
    const value = field.value.trim();
    const errorElement = field.parentNode.querySelector('.form-error');
    
    if (!validatorFn(value)) {
        field.classList.add('invalid');
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
        }
        return false;
    } else {
        field.classList.remove('invalid');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
        return true;
    }
}

// Initialize enhanced datetime input
function initDateTimeInput() {
    const expiryTimeInput = document.getElementById('expiryTime');
    if (expiryTimeInput) {
        const now = new Date();
        // Set minimum to current time + 1 hour
        const minTime = new Date(now.getTime() + 60 * 60 * 1000);
        minTime.setMinutes(minTime.getMinutes() - minTime.getTimezoneOffset());
        expiryTimeInput.min = minTime.toISOString().slice(0, 16);
        
        // Set default to current time + 4 hours
        const defaultTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        defaultTime.setMinutes(defaultTime.getMinutes() - defaultTime.getTimezoneOffset());
        if (!expiryTimeInput.value) {
            expiryTimeInput.value = defaultTime.toISOString().slice(0, 16);
        }
    }
}

// Newsletter subscription handler
function initNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('newsletter-email');
            const email = emailInput.value.trim();
            
            if (!validateEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Simulate subscription (in real app, this would call an API)
            const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
            
            if (subscribers.includes(email)) {
                showNotification('You are already subscribed!', 'info');
                return;
            }
            
            subscribers.push(email);
            localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
            
            showNotification('Thank you for subscribing! You will receive updates about new food donations.', 'success');
            emailInput.value = '';
        });
    }
}

// Data cleanup - remove expired listings
function cleanupExpiredListings() {
    if (!isLocalStorageAvailable()) return;
    
    try {
        const listings = JSON.parse(localStorage.getItem('foodListings') || '[]');
        const now = new Date();
        const validListings = listings.filter(listing => {
            const expiryTime = new Date(listing.expiryTime);
            return expiryTime > now;
        });
        
        if (validListings.length !== listings.length) {
            localStorage.setItem('foodListings', JSON.stringify(validListings));
            console.log(`Cleaned up ${listings.length - validListings.length} expired listings`);
        }
    } catch (error) {
        console.error('Error cleaning up expired listings:', error);
    }
}

// Auto-refresh functionality
function initAutoRefresh() {
    if (FoodShareApp.settings.autoRefresh) {
        // Refresh stats every 30 seconds
        setInterval(updateStats, 30000);
        
        // Clean up expired listings every 5 minutes
        setInterval(cleanupExpiredListings, 5 * 60 * 1000);
        
        // Refresh current page data every 2 minutes if on listings page
        if (window.location.pathname.includes('listings.html')) {
            setInterval(() => {
                if (typeof loadListings === 'function') {
                    loadListings();
                }
            }, 2 * 60 * 1000);
        }
    }
}

// Initialize the application
function initApp() {
    if (FoodShareApp.initialized) return;
    
    try {
        // Set up UI components
        initMobileMenu();
        initScrollHeader();
        initDateTimeInput();
        initNewsletterForm();
        
        // Update data
        updateStats();
        cleanupExpiredListings();
        
        // Start auto-refresh
        initAutoRefresh();
        
        // Load user preferences
        loadUserPreferences();
        
        FoodShareApp.initialized = true;
        console.log(`FoodShare App v${FoodShareApp.version} initialized successfully`);
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Load user preferences
function loadUserPreferences() {
    if (!isLocalStorageAvailable()) return;
    
    try {
        const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        FoodShareApp.settings = { ...FoodShareApp.settings, ...preferences };
        
        // Apply theme
        if (preferences.theme && preferences.theme !== 'auto') {
            document.documentElement.setAttribute('data-theme', preferences.theme);
        }
    } catch (error) {
        console.error('Error loading user preferences:', error);
    }
}

// Save user preferences
function saveUserPreferences() {
    if (!isLocalStorageAvailable()) return;
    
    try {
        localStorage.setItem('userPreferences', JSON.stringify(FoodShareApp.settings));
    } catch (error) {
        console.error('Error saving user preferences:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && FoodShareApp.initialized) {
        // Refresh data when page becomes visible
        updateStats();
        cleanupExpiredListings();
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    // In production, you might want to send this to an error tracking service
});

// Expose utilities globally for other scripts
window.FoodShareApp = FoodShareApp;
window.formatDate = formatDate;
window.getTimeRemaining = getTimeRemaining;
window.getExpiryStatusClass = getExpiryStatusClass;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validateRequired = validateRequired;
window.validateField = validateField;
window.isLocalStorageAvailable = isLocalStorageAvailable;