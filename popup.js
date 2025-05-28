'use strict';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const clearBtn = document.getElementById('clearBtn');
    const timeSelect = document.getElementById('timeSelect');
    const btnText = document.querySelector('.btn-text');
    const spinner = document.querySelector('.spinner');
    const currentYear = document.getElementById('currentYear');
    
    // Set current year in footer
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
    
    if (!clearBtn || !timeSelect || !btnText || !spinner) {
        console.error('Required elements not found');
        return;
    }
    
    // Initialize time slider and labels
    initTimeSlider();
    
    // Add click event listener to the clear button
    clearBtn.addEventListener('click', handleClearClick);
    
    // Initialize the time slider functionality
    function initTimeSlider() {
        const timeDisplay = document.getElementById('timeDisplay');
        const sliderLabels = document.querySelectorAll('#section-clear-history .slider-label');
        
        // Set initial active label
        updateActiveLabel(timeSelect.value);
        
        // Update display and active label when slider changes
        timeSelect.addEventListener('input', function() {
            updateActiveLabel(this.value);
            updateTimeDisplay(this.value, timeDisplay);
        });
        
        // Make labels clickable
        sliderLabels.forEach(label => {
            label.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                timeSelect.value = value;
                updateActiveLabel(value);
                updateTimeDisplay(value, timeDisplay);
            });
        });
        
        // Set initial time display
        updateTimeDisplay(timeSelect.value, timeDisplay);
    }
    
    // Update which label is active based on slider value
    function updateActiveLabel(value) {
        const sliderLabels = document.querySelectorAll('#section-clear-history .slider-label');
        sliderLabels.forEach(label => {
            if (label.getAttribute('data-value') === value) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    }
    
    // Update the time display text
    function updateTimeDisplay(value, displayElement) {
        const labels = {
            '1': 'Last 1 hour',
            '2': 'Last 24 hours',
            '3': 'Last 7 days',
            '4': 'Last 4 weeks',
            '5': 'All time'
        };
        
        if (displayElement) {
            displayElement.textContent = labels[value] || 'Select time range';
        }
    }
    
    // Handle clear button click
    async function handleClearClick() {
        // Get the data-time attribute from the active label
        const activeLabel = document.querySelector('#section-clear-history .slider-label.active');
        const interval = activeLabel ? parseInt(activeLabel.getAttribute('data-time'), 10) : 86400000;
        
        if (isNaN(interval)) {
            showAlert('Please select a valid time range', 'error');
            return;
        }
        
        try {
            // Update UI for loading state
            setButtonState(true);
            
            // Send message to background script
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { action: 'clearHistory', interval },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            resolve({
                                success: false,
                                error: chrome.runtime.lastError.message
                            });
                        } else {
                            resolve(response || { success: false });
                        }
                    }
                );
            });
            
            // Handle the response
            if (response && response.success) {
                showAlert('History cleared successfully!', 'success');
                
                // Reset form after success
                setTimeout(() => {
                    timeSelect.value = '86400000'; // Reset to default 24h
                }, 1500);
            } else {
                showAlert(
                    response?.error || 'Failed to clear history. Please try again.',
                    'error'
                );
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert(
                'An unexpected error occurred. Please try again.',
                'error'
            );
        } finally {
            // Always reset button state
            setButtonState(false);
        }
    }
    
    // Update button state (loading/ready)
    function setButtonState(isLoading) {
        clearBtn.disabled = isLoading;
        btnText.textContent = isLoading ? 'Clearing...' : 'Clear History';
        spinner.style.display = isLoading ? 'block' : 'none';
        clearBtn.style.cursor = isLoading ? 'wait' : 'pointer';
    }
    
    // Show alert message
    function showAlert(message, type = 'info') {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.style.opacity = '0';
            setTimeout(() => existingAlert.remove(), 300);
        }
        
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Insert after the button
        clearBtn.insertAdjacentElement('afterend', alert);
        
        // Trigger reflow for animation
        void alert.offsetWidth;
        alert.style.opacity = '1';
        
        // Auto-remove alert after 4 seconds
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 4000);
    }
    
    // Add subtle animation to the button on hover
    clearBtn.addEventListener('mouseenter', () => {
        if (!clearBtn.disabled) {
            clearBtn.style.transform = 'translateY(-1px)';
            clearBtn.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }
    });
    
    clearBtn.addEventListener('mouseleave', () => {
        clearBtn.style.transform = 'translateY(0)';
        clearBtn.style.boxShadow = 'none';
    });
    
    // Add focus styles for better accessibility
    clearBtn.addEventListener('focus', () => {
        clearBtn.style.outline = 'none';
        clearBtn.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.3)';
    });
    
    clearBtn.addEventListener('blur', () => {
        clearBtn.style.boxShadow = 'none';
    });
});
