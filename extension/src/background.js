async function openLifeMode(tab) {
  if (!tab || !tab.id || !isSupportedUrl(tab.url || '')) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_LIFEMODE' });
    return;
  } catch (error) {
    // Content script may not be awake yet. Inject it after the user clicks the icon.
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['src/lifemode.css'],
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content.js'],
    });

    await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_LIFEMODE' });
  } catch (error) {
    console.warn('LifeMode could not open on this page.', error);
  }
}

function isSupportedUrl(url) {
  return /^https?:\/\//i.test(url) || /^file:\/\//i.test(url);
}

chrome.action.onClicked.addListener(openLifeMode);