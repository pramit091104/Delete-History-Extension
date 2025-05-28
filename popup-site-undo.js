// Undo functionality for site-specific history deletion
// This file must be loaded after popup-site.js in popup.html

// Store last deleted items for undo (if backup not checked)
let lastDeletedItems = [];

function showUndoOption(items, domain, statusDiv) {
    let undoTimeout = 30; // seconds
    lastDeletedItems = items;
    statusDiv.innerHTML += `<br><button id="undo-delete-btn" class="undo-btn">Undo (${undoTimeout})</button>`;
    const undoBtn = document.getElementById('undo-delete-btn');
    let timer = setInterval(() => {
        undoTimeout--;
        if (undoBtn) undoBtn.textContent = `Undo (${undoTimeout})`;
        if (undoTimeout <= 0) {
            clearInterval(timer);
            lastDeletedItems = [];
            if (undoBtn) undoBtn.remove();
            statusDiv.innerHTML += '<br><span style="color:#888;">Undo expired.</span>';
        }
    }, 1000);
    if (undoBtn) {
        undoBtn.onclick = function() {
            clearInterval(timer);
            statusDiv.textContent = 'Restoring history...';
            chrome.runtime.sendMessage({ action: 'restoreHistoryForSite', items }, function(resp) {
                if (resp && resp.success) {
                    statusDiv.textContent = 'History restored!';
                } else {
                    statusDiv.textContent = 'Failed to restore history.';
                }
            });
            lastDeletedItems = [];
            undoBtn.remove();
        };
    }
}
