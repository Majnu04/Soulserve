// main.js - Shared functionality across all pages

// Check if localStorage is available
function isLocalStorageAvailable() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// Format date for display
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString(undefined, options);
}

// Calculate time remaining until expiry
function getTimeRemaining(expiryTime) {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const timeDiff = expiry - now;
    
    if (timeDiff <= 0) {
        return 'Expired';
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    
    if (hours < 1) {
        const minutes = Math.floor(timeDiff / (1000 * 60));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
    } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} left`;
    } else {
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''} left`;
    }
}

// Get expiry status class
function getExpiryStatusClass(expiryTime) {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const timeDiff = expiry - now;
    
    if (timeDiff <= 0) {
        return 'expiry-critical';
    } else if (timeDiff < 3 * 60 * 60 * 1000) { // Less than 3 hours
        return 'expiry-critical';
    } else if (timeDiff < 12 * 60 * 60 * 1000) { // Less than 12 hours
        return 'expiry-soon';
    } else {
        return '';
    }
}

// Update stats on homepage
function updateStats() {
    if (!isLocalStorageAvailable() || !document.querySelector('.stats')) {
        return;
    }
    
    const listings = JSON.parse(localStorage.getItem('foodListings') || '[]');
    const statsElements = document.querySelectorAll('.stat .number');
    
    if (statsElements.length >= 3) {
        // Number of food posts
        statsElements[0].textContent = listings.length;
        
        // Estimate meals saved (based on quantity)
        const totalServings = listings.reduce((total, listing) => total + parseInt(listing.quantity), 0);
        statsElements[1].textContent = totalServings;
        
        // Estimate CO2 saved (rough estimate of 2.5kg per meal)
        const co2Saved = totalServings * 2.5;
        statsElements[2].textContent = co2Saved;
    }
}

// Initialize the page
function initPage() {
    // Set min datetime for expiry field to current time
    const expiryTimeInput = document.getElementById('expiryTime');
    if (expiryTimeInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const minDateTime = now.toISOString().slice(0, 16);
        expiryTimeInput.min = minDateTime;
    }
    
    // Update stats if on homepage
    updateStats();
}

// Call initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage);