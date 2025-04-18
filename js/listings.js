// listings.js - Handle displaying of food listings

document.addEventListener('DOMContentLoaded', function() {
    const listingsContainer = document.getElementById('listingsContainer');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    if (!listingsContainer) return;
    
    // Load and display listings
    loadListings();
    
    // Add event listeners for search and sort
    if (searchInput) {
        searchInput.addEventListener('input', loadListings);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', loadListings);
    }
    
    // Refresh listings every minute to update expiry times
    setInterval(loadListings, 60000);
    
    function loadListings() {
        if (!isLocalStorageAvailable()) {
            listingsContainer.innerHTML = `
                <div class="no-listings-message">
                    <p>Sorry, your browser does not support local storage. This demo requires local storage to work.</p>
                </div>
            `;
            return;
        }
        
        // Get listings from localStorage
        let listings = JSON.parse(localStorage.getItem('foodListings') || '[]');
        
        // Filter by search term if search input exists
        if (searchInput && searchInput.value.trim() !== '') {
            const searchTerm = searchInput.value.trim().toLowerCase();
            listings = listings.filter(listing => 
                listing.name.toLowerCase().includes(searchTerm) ||
                listing.foodDescription.toLowerCase().includes(searchTerm) ||
                listing.location.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort listings
        if (sortSelect) {
            const sortValue = sortSelect.value;
            
            if (sortValue === 'newest') {
                listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else if (sortValue === 'expiry') {
                listings.sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));
            } else if (sortValue === 'quantity') {
                listings.sort((a, b) => b.quantity - a.quantity);
            }
        }
        
        // Display listings
        if (listings.length === 0) {
            listingsContainer.innerHTML = `
                <div class="no-listings-message">
                    <p>No food listings available at the moment. Check back later or <a href="post.html">post some food</a> yourself!</p>
                </div>
            `;
        } else {
            listingsContainer.innerHTML = '';
            
            // Filter out expired listings
            const now = new Date();
            const validListings = listings.filter(listing => new Date(listing.expiryTime) > now);
            
            if (validListings.length === 0) {
                listingsContainer.innerHTML = `
                    <div class="no-listings-message">
                        <p>All listings have expired. <a href="post.html">Post some food</a> to help reduce waste!</p>
                    </div>
                `;
                return;
            }
            
            validListings.forEach(listing => {
                const timeRemaining = getTimeRemaining(listing.expiryTime);
                const expiryClass = getExpiryStatusClass(listing.expiryTime);
                
                const listingElement = document.createElement('div');
                listingElement.className = 'listing-card';
                listingElement.innerHTML = `
                    <div class="listing-details">
                        <h3>${listing.foodDescription}</h3>
                        <div class="listing-meta">
                            <span><strong>Quantity:</strong> ${listing.quantity} servings</span>
                            <span><strong>Location:</strong> ${listing.location}</span>
                        </div>
                        <p><strong>Posted by:</strong> ${listing.name}</p>
                        <p><strong>Contact:</strong> ${listing.contact}</p>
                        <p><strong>Posted:</strong> ${formatDate(listing.createdAt)}</p>
                    </div>
                    <div class="listing-actions">
                        <span class="expiry-badge ${expiryClass}">
                            ${timeRemaining}
                        </span>
                        <a href="tel:${listing.contact.replace(/\D/g, '')}" class="btn btn-primary">Contact</a>
                    </div>
                `;
                
                listingsContainer.appendChild(listingElement);
            });
            
            // Update localStorage to remove expired listings
            if (validListings.length < listings.length) {
                localStorage.setItem('foodListings', JSON.stringify(validListings));
            }
        }
    }
});