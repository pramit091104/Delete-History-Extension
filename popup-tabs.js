// Tab switching logic for popup.html

document.addEventListener('DOMContentLoaded', function() {
  const tabClearHistory = document.getElementById('tab-clear-history');
  const tabClearSiteHistory = document.getElementById('tab-clear-site-history');
  const tabSettings = document.getElementById('tab-settings');

  const sectionClearHistory = document.getElementById('section-clear-history');
  const sectionClearSiteHistory = document.getElementById('section-clear-site-history');
  const sectionSettings = document.getElementById('section-settings');

  function setActive(tab, section) {
    [tabClearHistory, tabClearSiteHistory, tabSettings].forEach(t => t.classList.remove('active'));
    [sectionClearHistory, sectionClearSiteHistory, sectionSettings].forEach(s => s.style.display = 'none');
    tab.classList.add('active');
    section.style.display = 'block';
  }

  tabClearHistory.addEventListener('click', () => setActive(tabClearHistory, sectionClearHistory));
  tabClearSiteHistory.addEventListener('click', () => setActive(tabClearSiteHistory, sectionClearSiteHistory));
  tabSettings.addEventListener('click', () => setActive(tabSettings, sectionSettings));

  // Default: show clear history
  setActive(tabClearHistory, sectionClearHistory);
});
