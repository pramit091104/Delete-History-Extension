'use strict';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'clearHistory') {
        handleClearHistory(request, sendResponse);
        return true; // Keep the message channel open for async response
    }
    if (request.action === 'clearHistoryForSite') {
        handleClearHistoryForSite(request, sendResponse);
        return true;
    }
    if (request.action === 'getHistoryForSite') {
        handleGetHistoryForSite(request, sendResponse);
        return true;
    }
    if (request.action === 'restoreHistoryForSite') {
        // Restore each item using chrome.history.addUrl
        const items = request.items || [];
        let restored = 0;
        if (items.length === 0) {
            sendResponse({ success: false, error: 'No items to restore' });
            return true;
        }
        items.forEach((item, idx) => {
            chrome.history.addUrl({ url: item.url }, function() {
                restored++;
                if (restored === items.length) {
                    sendResponse({ success: true, restored });
                }
            });
        });
        return true;
    }
    // Add more actions here if needed
    return false;
});

/**
 * Handles getting history for a specific site/domain for backup
 * @param {Object} request - The request object
 * @param {Function} sendResponse - Function to send response back to the sender
 */
function handleGetHistoryForSite(request, sendResponse) {
    try {
        let domain = request.domain.trim().toLowerCase();
        const interval = typeof request.interval === 'number' ? request.interval : 0;
        if (!domain) {
            sendResponse({ success: false, error: 'No domain specified' });
            return;
        }
        domain = domain.replace(/^https?:\/\//, '');
        domain = domain.replace(/\/$/, '');
        const domainNoWww = domain.replace(/^www\./, '');
        const since = interval > 0 ? Date.now() - interval : 0;
        chrome.history.search({ text: '', startTime: since, maxResults: 10000 }, function(results) {
            try {
                const items = results.filter(item => {
                    try {
                        const hostname = new URL(item.url).hostname.toLowerCase();
                        return (
                            hostname === domain ||
                            hostname === domainNoWww ||
                            hostname.endsWith('.' + domainNoWww)
                        );
                    } catch (e) {
                        return false;
                    }
                });
                sendResponse({ success: true, items });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
        });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}



/**
 * Handles the clear history for a specific site/domain
 * @param {Object} request - The request object
 * @param {Function} sendResponse - Function to send response back to the sender
 */
async function handleClearHistoryForSite(request, sendResponse) {
    try {
        let domain = request.domain.trim().toLowerCase();
        const interval = typeof request.interval === 'number' ? request.interval : 0;
        if (!domain) {
            sendResponse({ success: false, error: 'No domain specified' });
            return;
        }
        // Remove protocol if user enters it
        domain = domain.replace(/^https?:\/\//, '');
        // Remove trailing slashes
        domain = domain.replace(/\/$/, '');
        // Remove www. for matching
        const domainNoWww = domain.replace(/^www\./, '');
        const since = interval > 0 ? Date.now() - interval : 0;
        chrome.history.search({ text: '', startTime: since, maxResults: 10000 }, function(results) {
            const toDelete = results.filter(item => {
                try {
                    const hostname = new URL(item.url).hostname.toLowerCase();
                    // Match exact domain, www subdomain, or any subdomain
                    return (
                        hostname === domain ||
                        hostname === domainNoWww ||
                        hostname.endsWith('.' + domainNoWww)
                    );
                } catch (e) {
                    console.warn('URL parse error:', item.url, e);
                    return false;
                }
            });
            console.log('Matching URLs for domain:', domain, 'Count:', toDelete.length);
            let deleted = 0;
            if (toDelete.length === 0) {
                sendResponse({ success: true, deleted: 0 });
                return;
            }
            toDelete.forEach((item, idx) => {
                chrome.history.deleteUrl({ url: item.url }, function() {
                    deleted++;
                    if (deleted === toDelete.length) {
                        sendResponse({ success: true, deleted });
                    }
                });
            });
        });
    } catch (err) {
        sendResponse({ success: false, error: err.message });
    }
}


/**
 * Handles the clear history request
 * @param {Object} request - The request object
 * @param {Function} sendResponse - Function to send response back to the sender
 */
async function handleClearHistory(request, sendResponse) {
    try {
        const since = request.interval > 0 ? Date.now() - request.interval : 0;
        
        // Clear browsing data
        await new Promise((resolve, reject) => {
            chrome.browsingData.remove(
                { since: since },
                { 
                    history: true,
                    // You can add more data types to clear if needed
                    // downloads: true,
                    // cache: true,
                    // cookies: true,
                    // formData: true,
                    // indexedDB: true,
                    // localStorage: true,
                    // passwords: true,
                    // serviceWorkers: true,
                    // webSQL: true
                },
                () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                }
            );
        });
        
        sendResponse({
            success: true,
            message: 'History cleared successfully',
            clearedSince: since,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error clearing history:', error);
        sendResponse({
            success: false,
            error: error.message || 'Unknown error occurred',
            timestamp: new Date().toISOString()
        });
    }
}

// Optional: Add event listeners for extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Extension installed');
        // You could open an options page or show a welcome message
        // chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
        console.log('Extension updated');
    }
});