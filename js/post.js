// post.js - Handle food post submissions

document.addEventListener('DOMContentLoaded', function() {
    const foodPostForm = document.getElementById('foodPostForm');
    const confirmationMessage = document.getElementById('confirmationMessage');
    
    if (!foodPostForm) return;
    
    foodPostForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!isLocalStorageAvailable()) {
            alert('Sorry, your browser does not support local storage. This demo requires local storage to work.');
            return;
        }
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const contact = document.getElementById('contact').value.trim();
        const location = document.getElementById('location').value.trim();
        const foodDescription = document.getElementById('foodDescription').value.trim();
        const quantity = parseInt(document.getElementById('quantity').value);
        const expiryTime = document.getElementById('expiryTime').value;
        
        // Create post object
        const post = {
            id: Date.now().toString(),
            name,
            contact,
            location,
            foodDescription,
            quantity,
            expiryTime,
            createdAt: new Date().toISOString()
        };
        
        // Save to localStorage
        savePost(post);
        
        // Show confirmation and reset form
        foodPostForm.reset();
        foodPostForm.style.display = 'none';
        confirmationMessage.classList.remove('hidden');
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'listings.html';
        }, 3000);
    });
    
    // Function to save post to localStorage
    function savePost(post) {
        // Get existing listings from localStorage
        const existingListings = JSON.parse(localStorage.getItem('foodListings') || '[]');
        
        // Add new post
        existingListings.push(post);
        
        // Save back to localStorage
        localStorage.setItem('foodListings', JSON.stringify(existingListings));
    }
});