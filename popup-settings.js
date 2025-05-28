// Settings functionality for popup.html

document.addEventListener('DOMContentLoaded', function() {
  const disableExtensionToggle = document.getElementById('disable-extension-toggle');
  
  // Check Chrome storage for settings across devices
  try {
    if (chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['extensionDisabled'], function(result) {
        console.log('Loaded settings from storage:', result);
        
        // Set disable extension toggle state
        if (result && result.extensionDisabled) {
          disableExtensionToggle.checked = true;
          updateButtonsState(true);
        }
      });
    } else {
      // Check localStorage as fallback
      const isDisabled = localStorage.getItem('extensionDisabled') === 'true';
      if (isDisabled) {
        disableExtensionToggle.checked = true;
        updateButtonsState(true);
      }
    }
  } catch (error) {
    console.error('Error accessing storage:', error);
  }
  
  // Helper function to update buttons state
  function updateButtonsState(isDisabled) {
    const allButtons = document.querySelectorAll('button:not(#settingsBtn)');
    if (isDisabled) {
      allButtons.forEach(button => {
        button.disabled = true;
        button.title = 'Extension is disabled in settings';
      });
    } else {
      allButtons.forEach(button => {
        button.disabled = false;
        button.title = '';
      });
    }
  }
  
  // Disable extension toggle handler
  disableExtensionToggle.addEventListener('change', function() {
    const isDisabled = this.checked;
    
    // Save to localStorage as backup
    localStorage.setItem('extensionDisabled', isDisabled);
    
    // Try to save to Chrome storage if available
    try {
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({extensionDisabled: isDisabled}, function() {
          if (chrome.runtime.lastError) {
            console.error('Error saving disabled state to storage:', chrome.runtime.lastError);
          }
        });
      }
    } catch (error) {
      console.error('Error accessing chrome.storage:', error);
    }
    
    // Notify background script about the state change
    try {
      chrome.runtime.sendMessage({
        action: 'setExtensionState',
        disabled: isDisabled
      });
    } catch (error) {
      console.error('Error sending message to background script:', error);
    }
    
    // Update UI to reflect disabled state
    updateButtonsState(isDisabled);
  });
});
