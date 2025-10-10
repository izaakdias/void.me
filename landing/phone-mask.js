// Simple Country Selector - Working Version
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing country selector...');
    
    const countrySelector = document.getElementById('countrySelector');
    const countryDropdown = document.getElementById('countryDropdown');
    const phoneInput = document.getElementById('phone');
    
    console.log('Elements:', { countrySelector, countryDropdown, phoneInput });
    
    if (!countrySelector || !countryDropdown || !phoneInput) {
        console.error('Required elements not found');
        return;
    }
    
    // Countries data
    const countries = {
        '1': { name: 'United States', format: 'XXX-XXX-XXXX' },
        '55': { name: 'Brazil', format: 'XX XXXXX-XXXX' },
        '44': { name: 'United Kingdom', format: 'XXXX XXX XXX' },
        '33': { name: 'France', format: 'X XX XX XX XX' },
        '49': { name: 'Germany', format: 'XXX XXXXXXX' },
        '39': { name: 'Italy', format: 'XXX XXX XXXX' },
        '34': { name: 'Spain', format: 'XXX XX XX XX' },
        '61': { name: 'Australia', format: 'XXX XXX XXX' },
        '81': { name: 'Japan', format: 'XX-XXXX-XXXX' },
        '86': { name: 'China', format: 'XXX XXXX XXXX' },
        '91': { name: 'India', format: 'XXXXX XXXXX' },
        '7': { name: 'Russia', format: 'XXX XXX-XX-XX' }
    };
    
    let currentCountry = '1';
    
    // Toggle dropdown
    countrySelector.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (countryDropdown.classList.contains('show')) {
            countryDropdown.classList.remove('show');
        } else {
            countryDropdown.classList.add('show');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!countrySelector.contains(e.target)) {
            countryDropdown.classList.remove('show');
        }
    });
    
        // Handle country selection
        countryDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const option = e.target.closest('.country-option');
            if (option) {
                const code = option.dataset.code;
                const name = option.dataset.name;
                
                console.log('Country selected:', { code, name });
                
                // Update display
                const countryDisplay = document.getElementById('countryDisplay');
                countryDisplay.innerHTML = `
                    <span class="country-code">+${code}</span>
                `;
                
                // Update current country
                currentCountry = code;
                
                // Clear phone input and update placeholder
                phoneInput.value = '';
                phoneInput.placeholder = 'Phone number';
                
                // Close dropdown
                countryDropdown.classList.remove('show');
                console.log('Dropdown closed, show class removed');
                
                // Focus phone input
                phoneInput.focus();
                console.log('Phone input focused');
            }
        });
    
    // Format phone number
    phoneInput.addEventListener('input', function(e) {
        const value = e.target.value.replace(/\D/g, '');
        
        if (!value) {
            e.target.value = '';
            return;
        }
        
        const country = countries[currentCountry];
        if (!country) return;
        
        // Format the number
        let formatted = '';
        let digitIndex = 0;
        
        for (let i = 0; i < country.format.length && digitIndex < value.length; i++) {
            if (country.format[i] === 'X') {
                formatted += value[digitIndex];
                digitIndex++;
            } else {
                formatted += country.format[i];
            }
        }
        
        e.target.value = formatted;
    });
    
    // Make functions available globally
    window.countryPhoneMask = {
        validatePhone: function(phoneValue) {
            const digits = phoneValue.replace(/\D/g, '');
            const country = countries[currentCountry];
            
            if (!country) return false;
            
            const expectedDigits = country.format.replace(/\D/g, '').length;
            return digits.length >= expectedDigits;
        },
        
        getFullPhoneNumber: function(phoneValue) {
            const digits = phoneValue.replace(/\D/g, '');
            return `+${currentCountry}${digits}`;
        }
    };
    
    console.log('Country selector initialized successfully!');
});