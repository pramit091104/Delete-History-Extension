// Handles the site-specific clear history UI and logic

document.addEventListener('DOMContentLoaded', function() {
    const clearSiteBtn = document.getElementById('clear-site-btn');
    if (clearSiteBtn) {
        clearSiteBtn.addEventListener('click', function() {
            const domain = document.getElementById('site-input').value.trim();
            const statusDiv = document.getElementById('site-status');
            const backupChecked = document.getElementById('backup-before-delete').checked;
            if (!domain) {
                statusDiv.textContent = 'Please enter a domain.';
                return;
            }
            // Confirmation dialog
            const interval = parseInt(document.getElementById('site-time-range').value, 10);
            let confirmMsg = `Are you sure you want to clear history for '${domain}'`;
            if (interval > 0) {
                const days = Math.round(interval / 86400000);
                if (days >= 1) {
                    confirmMsg += ` from the last ${days} day(s)`;
                } else {
                    confirmMsg += ` from the selected time range`;
                }
            } else {
                confirmMsg += ' (all time)';
            }
            confirmMsg += backupChecked ? ' (A backup will be created first).' : '?';
            if (!window.confirm(confirmMsg)) {
                statusDiv.textContent = 'Operation cancelled.';
                return;
            }
            if (backupChecked) {
                statusDiv.textContent = 'Preparing backup...';
                chrome.runtime.sendMessage({ action: 'getHistoryForSite', domain, interval }, function(response) {
                    if (response && response.success && response.items) {
                        // Trigger download
                        const blob = new Blob([JSON.stringify(response.items, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const now = new Date();
                        const timestamp = now.toISOString().replace(/[:.]/g, '-');
                        a.download = `history-backup-${domain}-${timestamp}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        statusDiv.textContent = 'Backup downloaded. Deleting history...';
                        // Proceed to delete
                        chrome.runtime.sendMessage({ action: 'clearHistoryForSite', domain, interval }, function(delResponse) {
                            if (delResponse && delResponse.success) {
    statusDiv.textContent = 'History cleared for ' + domain + '! (' + (delResponse.deleted || 0) + ' items)';
    if (response.items && response.items.length > 0) {
        showUndoOption(response.items, domain, statusDiv);
    }
} else {
    statusDiv.textContent = 'Failed to clear history for ' + domain + '.';
}
                        });
                    } else {
                        statusDiv.textContent = 'Failed to create backup.';
                    }
                });
            } else {
                statusDiv.textContent = 'Clearing history for ' + domain + '...';
                chrome.runtime.sendMessage({ action: 'clearHistoryForSite', domain, interval }, function(response) {
                    if (response && response.success) {
    statusDiv.textContent = 'History cleared for ' + domain + '! (' + (response.deleted || 0) + ' items)';
    if (lastDeletedItems && lastDeletedItems.length > 0) {
        showUndoOption(lastDeletedItems, domain, statusDiv);
    }
} else {
    statusDiv.textContent = 'Failed to clear history for ' + domain + '.';
}
                });
            }
        });
    }
});
