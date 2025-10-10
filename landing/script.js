// Waitlist Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('waitlistForm');
    const phoneInput = document.getElementById('phone');
    const joinButton = document.querySelector('.join-button');
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phone = phoneInput.value.trim();
        
        if (!phone) {
            return;
        }
        
        // Validate phone using country phone mask
        if (window.countryPhoneMask && !window.countryPhoneMask.validatePhone(phone)) {
            alert('Please enter a valid phone number');
            return;
        }
        
        // Get full phone number with country code
        const fullPhone = window.countryPhoneMask ? window.countryPhoneMask.getFullPhoneNumber(phone) : phone;
        
        // Show loading state
        joinButton.style.transition = 'all 0.3s ease';
        joinButton.classList.add('loading');
        joinButton.textContent = 'Joining...';
        joinButton.disabled = true;
        
        try {
            // Track form submission
            gtag('event', 'waitlist_signup', {
                'event_category': 'engagement',
                'event_label': 'email_signup'
            });
            
            // Send to backend
            // Use environment variable or fallback to localhost for development
            const backendUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3000' 
                : 'https://vo1d-backend-production.up.railway.app';
            
            const response = await fetch(`${backendUrl}/api/waitlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: fullPhone })
            });
            
            if (response.ok) {
                const responseData = await response.json();
                
                // Success animation on button
                joinButton.style.transition = 'all 0.3s ease';
                joinButton.style.background = '#ffffff';
                joinButton.style.color = '#000000';
                joinButton.style.border = '2px solid #000000';
                
                if (responseData.message && responseData.message.includes('já existe')) {
                    joinButton.textContent = "You're already on the list, please wait";
                } else {
                    joinButton.textContent = 'Your invitation will be sent till october 31';
                }
                
                // Mark button as in success state
                buttonInSuccessState = true;
                
                // Track successful signup
                gtag('event', 'waitlist_success', {
                    'event_category': 'conversion',
                    'event_label': 'email_signup_success'
                });
                
                // Don't clear form - keep the number
                // phoneInput.value = '';
                
                // Button stays in success state until user changes phone number
                // No automatic timeout reset
                
            } else {
                throw new Error('Failed to join waitlist');
            }
            
        } catch (error) {
            console.error('Error joining waitlist:', error);
            
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'success-message';
            errorMessage.style.background = '#fef2f2';
            errorMessage.style.borderColor = '#f87171';
            errorMessage.style.color = '#991b1b';
            errorMessage.textContent = '❌ Something went wrong. Please try again.';
            
            form.parentNode.insertBefore(errorMessage, form.nextSibling);
            
            // Hide error message after 3 seconds
            setTimeout(() => {
                errorMessage.remove();
            }, 3000);
            
            // Track error
            gtag('event', 'waitlist_error', {
                'event_category': 'error',
                'event_label': 'email_signup_error'
            });
        } finally {
            // Always reset button state for errors
            if (!response || !response.ok) {
                joinButton.style.transition = 'all 0.3s ease';
                joinButton.style.background = '#000000';
                joinButton.style.color = '#ffffff';
                joinButton.style.border = '2px solid #000000';
                joinButton.classList.remove('loading');
                joinButton.textContent = 'Join the waitlist';
                joinButton.disabled = false;
            }
        }
    });
    
    // Phone validation and button reset
    let lastPhoneValue = '';
    let buttonInSuccessState = false;
    
    // Reset everything on page load
    phoneInput.value = '';
    lastPhoneValue = '';
    buttonInSuccessState = false;
    
    phoneInput.addEventListener('input', function() {
        const phone = phoneInput.value.trim();
        const isValid = phone.length >= 10; // Basic phone validation
        
        // Only reset button if the phone number actually changed AND button is in success state
        if (phone !== lastPhoneValue && buttonInSuccessState) {
            joinButton.style.background = '#000000';
            joinButton.style.color = '#ffffff';
            joinButton.style.border = '2px solid #000000';
            joinButton.textContent = 'Join the waitlist';
            joinButton.disabled = false;
            joinButton.classList.remove('loading');
            buttonInSuccessState = false;
        }
        
        lastPhoneValue = phone;
        
        if (isValid) {
            phoneInput.style.borderColor = '#10b981';
        } else {
            phoneInput.style.borderColor = '#333333';
        }
    });
    
    // Track page views
    gtag('event', 'page_view', {
        'page_title': 'vo1d Landing Page',
        'page_location': window.location.href
    });
    
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            
            // Track scroll milestones
            if (scrollPercent >= 25 && maxScroll < 50) {
                gtag('event', 'scroll', {
                    'event_category': 'engagement',
                    'event_label': '25_percent'
                });
            } else if (scrollPercent >= 50 && maxScroll < 75) {
                gtag('event', 'scroll', {
                    'event_category': 'engagement',
                    'event_label': '50_percent'
                });
            } else if (scrollPercent >= 75 && maxScroll < 100) {
                gtag('event', 'scroll', {
                    'event_category': 'engagement',
                    'event_label': '75_percent'
                });
            } else if (scrollPercent >= 100) {
                gtag('event', 'scroll', {
                    'event_category': 'engagement',
                    'event_label': '100_percent'
                });
            }
        }
    });
    
    // Track time on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', function() {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        
        gtag('event', 'time_on_page', {
            'event_category': 'engagement',
            'event_label': 'page_duration',
            'value': timeOnPage
        });
    });
    
    // Track button clicks
    joinButton.addEventListener('click', function() {
        gtag('event', 'button_click', {
            'event_category': 'engagement',
            'event_label': 'join_waitlist_button'
        });
    });
    
    // Track feature interactions
    const features = document.querySelectorAll('.feature');
    features.forEach((feature, index) => {
        feature.addEventListener('click', function() {
            gtag('event', 'feature_click', {
                'event_category': 'engagement',
                'event_label': `feature_${index + 1}`
            });
        });
    });
});

// Utility function to track custom events
function trackEvent(category, action, label, value) {
    gtag('event', action, {
        'event_category': category,
        'event_label': label,
        'value': value
    });
}

// Export for use in other scripts
window.trackEvent = trackEvent;
