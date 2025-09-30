// listings.js - Food listings manager

class FoodListingsManager {
    constructor() {
        this.listings = [];
        this.filteredListings = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.loadListings();
    }
    
    setupElements() {
        this.listingsContainer = document.getElementById('listingsContainer');
    }
    
    loadListings() {
        try {
            const stored = localStorage.getItem('foodListings');
            this.listings = stored ? JSON.parse(stored) : [];
            
            if (this.listings.length === 0) {
                this.createSampleData();
            }
            
            this.renderListings();
            
        } catch (error) {
            console.error('Error loading listings:', error);
        }
    }
    
    createSampleData() {
        const sampleListings = [
            {
                id: 'sample_1',
                name: 'Green Valley Restaurant',
                contact: 'manager@greenvalley.com',
                location: '123 Main Street, Downtown',
                foodDescription: 'Fresh vegetarian pasta with seasonal vegetables',
                quantity: 15,
                quantityType: 'servings',
                foodType: 'prepared',
                availableFrom: new Date().toISOString(),
                expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
                specialInstructions: 'Please bring containers. Available at back entrance.',
                allowNotifications: true,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                views: 12,
                interested: []
            },
            {
                id: 'sample_2',
                name: 'Community Center Event',
                contact: '+1-555-0123',
                location: 'Community Center, Park Avenue',
                foodDescription: 'Assorted baked goods from community bake sale',
                quantity: 25,
                quantityType: 'items',
                foodType: 'baked',
                availableFrom: new Date().toISOString(),
                expiryTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
                specialInstructions: 'Available until 6 PM. Contact reception desk.',
                allowNotifications: true,
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                views: 8,
                interested: []
            }
        ];
        
        this.listings = sampleListings;
        localStorage.setItem('foodListings', JSON.stringify(this.listings));
    }
    
    renderListings() {
        if (!this.listingsContainer) return;
        
        if (this.listings.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        this.listingsContainer.innerHTML = '';
        
        this.listings.forEach(listing => {
            const listingElement = this.createListingElement(listing);
            this.listingsContainer.appendChild(listingElement);
        });
    }
    
    createListingElement(listing) {
        const div = document.createElement('div');
        div.className = 'listing-card';
        
        div.innerHTML = `
            <div class="listing-header">
                <div class="food-category">${listing.foodType}</div>
                <div class="expiry-badge">6h left</div>
            </div>
            
            <div class="listing-details">
                <h3>${listing.foodDescription}</h3>
                
                <div class="listing-meta">
                    <span>📦 ${listing.quantity} ${listing.quantityType}</span>
                    <span>📍 ${listing.location}</span>
                    <span>👀 ${listing.views} views</span>
                </div>
                
                <div class="listing-info">
                    <p><strong>Posted by:</strong> ${listing.name}</p>
                    <p><strong>Contact:</strong> ${listing.contact}</p>
                    ${listing.specialInstructions ? `<p><strong>Instructions:</strong> ${listing.specialInstructions}</p>` : ''}
                </div>
            </div>
            
            <div class="listing-actions">
                <a href="mailto:${listing.contact}" class="btn btn-primary">📧 Contact</a>
                <button class="btn btn-secondary">💝 Interested</button>
            </div>
        `;
        
        return div;
    }
    
    renderEmptyState() {
        this.listingsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍽️</div>
                <h3>No food listings found</h3>
                <p>Be the first to post food in your area!</p>
                <a href="post.html" class="btn btn-primary">Post Food Now</a>
            </div>
        `;
    }
}

// Initialize when DOM is ready
let foodListingsManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        foodListingsManager = new FoodListingsManager();
    });
} else {
    foodListingsManager = new FoodListingsManager();
}

window.foodListingsManager = foodListingsManager;
