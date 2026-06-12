chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_LIFEMODE' });
    await clearBadge(tab.id);
  } catch (error) {
    await showNeedsRefreshBadge(tab.id);
  }
});

async function showNeedsRefreshBadge(tabId) {
  try {
    await chrome.action.setBadgeText({ tabId, text: '!' });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#f59e0b' });
    setTimeout(() => clearBadge(tabId), 2200);
  } catch (error) {
    // Some browser pages do not allow extension UI. Keep this silent.
  }
}

async function clearBadge(tabId) {
  try {
    await chrome.action.setBadgeText({ tabId, text: '' });
  } catch (error) {
    // Some browser pages do not allow extension UI. Keep this silent.
  }
}
