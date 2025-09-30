// post.js - Enhanced food post submissions with multi-step form

class FoodPostForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        this.validationRules = {
            name: { required: true, minLength: 2 },
            contact: { required: true, custom: this.validateContact },
            location: { required: true, minLength: 5 },
            foodDescription: { required: true, minLength: 10 },
            quantity: { required: true, min: 1 },
            foodType: { required: true },
            availableFrom: { required: true, custom: this.validateAvailableFrom },
            expiryTime: { required: true, custom: this.validateExpiryTime }
        };
        
        this.init();
    }
    
    init() {
        this.form = document.getElementById('foodPostForm');
        this.confirmationMessage = document.getElementById('confirmationMessage');
        
        if (!this.form) return;
        
        this.setupEventListeners();
        this.setupFormNavigation();
        this.initializeDefaultValues();
        this.updateProgress();
        
        console.log('Food post form initialized');
    }
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.form.addEventListener('input', (e) => this.handleInput(e));
        this.form.addEventListener('blur', (e) => this.handleBlur(e), true);
        
        // Navigation buttons
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());
        
        // Auto-save draft
        this.form.addEventListener('input', debounce(() => this.saveDraft(), 1000));
        
        // Load draft on page load
        this.loadDraft();
    }
    
    setupFormNavigation() {
        this.steps = this.form.querySelectorAll('.form-step');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.submitBtn = document.getElementById('submitBtn');
        
        this.updateStepVisibility();
    }
    
    initializeDefaultValues() {
        // Set available from to current time
        const availableFromInput = document.getElementById('availableFrom');
        if (availableFromInput && !availableFromInput.value) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            availableFromInput.value = now.toISOString().slice(0, 16);
        }
        
        // Set default expiry to 4 hours from now
        const expiryTimeInput = document.getElementById('expiryTime');
        if (expiryTimeInput && !expiryTimeInput.value) {
            const defaultExpiry = new Date();
            defaultExpiry.setHours(defaultExpiry.getHours() + 4);
            defaultExpiry.setMinutes(defaultExpiry.getMinutes() - defaultExpiry.getTimezoneOffset());
            expiryTimeInput.value = defaultExpiry.toISOString().slice(0, 16);
        }
        
        // Set minimum times
        this.updateMinTimes();
    }
    
    updateMinTimes() {
        const now = new Date();
        const availableFromInput = document.getElementById('availableFrom');
        const expiryTimeInput = document.getElementById('expiryTime');
        
        if (availableFromInput) {
            const minTime = new Date(now.getTime());
            minTime.setMinutes(minTime.getMinutes() - minTime.getTimezoneOffset());
            availableFromInput.min = minTime.toISOString().slice(0, 16);
            
            // Update expiry min time when available from changes
            availableFromInput.addEventListener('change', () => {
                if (expiryTimeInput && availableFromInput.value) {
                    const availableFrom = new Date(availableFromInput.value);
                    availableFrom.setHours(availableFrom.getHours() + 1); // Minimum 1 hour duration
                    availableFrom.setMinutes(availableFrom.getMinutes() - availableFrom.getTimezoneOffset());
                    expiryTimeInput.min = availableFrom.toISOString().slice(0, 16);
                    
                    // Adjust expiry time if it's now invalid
                    if (expiryTimeInput.value && new Date(expiryTimeInput.value) <= new Date(availableFromInput.value)) {
                        expiryTimeInput.value = availableFrom.toISOString().slice(0, 16);
                    }
                }
            });
        }
        
        if (expiryTimeInput) {
            const minExpiryTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
            minExpiryTime.setMinutes(minExpiryTime.getMinutes() - minExpiryTime.getTimezoneOffset());
            expiryTimeInput.min = minExpiryTime.toISOString().slice(0, 16);
        }
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateStepVisibility();
                this.updateProgress();
                this.scrollToTop();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepVisibility();
            this.updateProgress();
            this.scrollToTop();
        }
    }
    
    updateStepVisibility() {
        // Hide all steps
        this.steps.forEach(step => step.classList.remove('active'));
        
        // Show current step
        const currentStepElement = this.form.querySelector(`[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }
        
        // Update navigation buttons
        if (this.prevBtn) {
            this.prevBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        }
        
        if (this.nextBtn && this.submitBtn) {
            if (this.currentStep === this.totalSteps) {
                this.nextBtn.style.display = 'none';
                this.submitBtn.style.display = 'inline-flex';
            } else {
                this.nextBtn.style.display = 'inline-flex';
                this.submitBtn.style.display = 'none';
            }
        }
    }
    
    updateProgress() {
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        const progressContainer = document.querySelector('.form-progress');
        
        if (progressBar && progressText && progressContainer) {
            const progress = (this.currentStep / this.totalSteps) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
            progressContainer.setAttribute('aria-valuenow', progress);
        }
    }
    
    scrollToTop() {
        const formSection = document.querySelector('.post-section');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    validateCurrentStep() {
        const currentStepElement = this.form.querySelector(`[data-step="${this.currentStep}"]`);
        if (!currentStepElement) return false;
        
        const fields = currentStepElement.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    handleInput(e) {
        const field = e.target;
        if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA' || field.tagName === 'SELECT') {
            this.clearFieldError(field);
        }
    }
    
    handleBlur(e) {
        const field = e.target;
        if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA' || field.tagName === 'SELECT') {
            this.validateField(field);
        }
    }
    
    validateField(field) {
        const name = field.name;
        const value = field.value.trim();
        const rules = this.validationRules[name];
        
        if (!rules) return true;
        
        // Required validation
        if (rules.required && !value) {
            this.showFieldError(field, `${this.getFieldLabel(field)} is required`);
            return false;
        }
        
        if (!value) return true; // Skip other validations if field is empty and not required
        
        // Min length validation
        if (rules.minLength && value.length < rules.minLength) {
            this.showFieldError(field, `${this.getFieldLabel(field)} must be at least ${rules.minLength} characters`);
            return false;
        }
        
        // Min value validation
        if (rules.min && parseFloat(value) < rules.min) {
            this.showFieldError(field, `${this.getFieldLabel(field)} must be at least ${rules.min}`);
            return false;
        }
        
        // Custom validation
        if (rules.custom) {
            const customResult = rules.custom.call(this, value, field);
            if (customResult !== true) {
                this.showFieldError(field, customResult);
                return false;
            }
        }
        
        this.clearFieldError(field);
        return true;
    }
    
    validateContact(value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
        
        const cleanValue = value.replace(/[\s\-\(\)]/g, '');
        
        if (emailPattern.test(value) || phonePattern.test(cleanValue)) {
            return true;
        }
        
        return 'Please enter a valid email address or phone number';
    }
    
    validateAvailableFrom(value) {
        const availableFrom = new Date(value);
        const now = new Date();
        
        if (availableFrom < now) {
            return 'Available from time cannot be in the past';
        }
        
        return true;
    }
    
    validateExpiryTime(value) {
        const expiryTime = new Date(value);
        const now = new Date();
        const availableFromInput = document.getElementById('availableFrom');
        
        if (expiryTime <= now) {
            return 'Available until time must be in the future';
        }
        
        if (availableFromInput && availableFromInput.value) {
            const availableFrom = new Date(availableFromInput.value);
            if (expiryTime <= availableFrom) {
                return 'Available until time must be after available from time';
            }
            
            // Check if duration is at least 1 hour
            const durationHours = (expiryTime - availableFrom) / (1000 * 60 * 60);
            if (durationHours < 1) {
                return 'Food must be available for at least 1 hour';
            }
        }
        
        return true;
    }
    
    showFieldError(field, message) {
        const errorElement = field.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
        field.classList.add('invalid');
    }
    
    clearFieldError(field) {
        const errorElement = field.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
        field.classList.remove('invalid');
    }
    
    getFieldLabel(field) {
        const label = field.parentNode.querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : field.name;
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        if (!isLocalStorageAvailable()) {
            showError('Sorry, your browser does not support local storage. This demo requires local storage to work.');
            return;
        }
        
        // Validate all fields
        if (!this.validateForm()) {
            showError('Please correct the errors in the form before submitting.');
            return;
        }
        
        // Show loading
        this.showLoading(true);
        
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Create post object
            const post = this.createPostObject();
            
            // Save to localStorage
            this.savePost(post);
            
            // Clear draft
            this.clearDraft();
            
            // Show success
            this.showSuccess();
            
        } catch (error) {
            console.error('Error submitting form:', error);
            showError('There was an error submitting your food post. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }
    
    validateForm() {
        const allFields = this.form.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;
        
        allFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    createPostObject() {
        const formData = new FormData(this.form);
        
        return {
            id: this.generateId(),
            name: formData.get('name').trim(),
            contact: formData.get('contact').trim(),
            location: formData.get('location').trim(),
            foodDescription: formData.get('foodDescription').trim(),
            quantity: parseInt(formData.get('quantity')),
            quantityType: formData.get('quantityType') || 'servings',
            foodType: formData.get('foodType'),
            availableFrom: formData.get('availableFrom'),
            expiryTime: formData.get('expiryTime'),
            specialInstructions: formData.get('specialInstructions')?.trim() || '',
            allowNotifications: formData.get('allowNotifications') === 'on',
            createdAt: new Date().toISOString(),
            status: 'active',
            views: 0,
            interested: []
        };
    }
    
    savePost(post) {
        const existingListings = JSON.parse(localStorage.getItem('foodListings') || '[]');
        existingListings.push(post);
        localStorage.setItem('foodListings', JSON.stringify(existingListings));
        
        // Update user statistics
        this.updateUserStats();
    }
    
    updateUserStats() {
        try {
            const stats = JSON.parse(localStorage.getItem('userStats') || '{}');
            stats.totalPosts = (stats.totalPosts || 0) + 1;
            stats.lastPost = new Date().toISOString();
            localStorage.setItem('userStats', JSON.stringify(stats));
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }
    
    showSuccess() {
        this.form.style.display = 'none';
        this.confirmationMessage.classList.remove('hidden');
        
        showSuccess('Your food post has been submitted successfully! Thank you for helping reduce food waste.');
        
        // Auto redirect after 5 seconds
        setTimeout(() => {
            window.location.href = 'listings.html';
        }, 5000);
    }
    
    showLoading(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            if (show) {
                loadingIndicator.classList.remove('hidden');
            } else {
                loadingIndicator.classList.add('hidden');
            }
        }
    }
    
    saveDraft() {
        try {
            const formData = new FormData(this.form);
            const draft = {};
            
            for (let [key, value] of formData.entries()) {
                draft[key] = value;
            }
            
            draft.currentStep = this.currentStep;
            draft.savedAt = new Date().toISOString();
            
            localStorage.setItem('foodPostDraft', JSON.stringify(draft));
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    }
    
    loadDraft() {
        try {
            const draft = JSON.parse(localStorage.getItem('foodPostDraft') || '{}');
            
            if (Object.keys(draft).length === 0) return;
            
            // Check if draft is not too old (24 hours)
            const savedAt = new Date(draft.savedAt);
            const now = new Date();
            const hoursDiff = (now - savedAt) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                this.clearDraft();
                return;
            }
            
            // Load draft data
            Object.keys(draft).forEach(key => {
                if (key === 'currentStep' || key === 'savedAt') return;
                
                const field = this.form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = draft[key] === 'on';
                    } else {
                        field.value = draft[key];
                    }
                }
            });
            
            // Restore current step
            if (draft.currentStep) {
                this.currentStep = parseInt(draft.currentStep);
                this.updateStepVisibility();
                this.updateProgress();
            }
            
            showInfo('Draft loaded from your previous session', { duration: 3000 });
            
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    }
    
    clearDraft() {
        localStorage.removeItem('foodPostDraft');
    }
    
    generateId() {
        return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FoodPostForm());
} else {
    new FoodPostForm();
}