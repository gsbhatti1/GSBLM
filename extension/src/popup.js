const statusEl = document.getElementById('status');
const openBtn = document.getElementById('openLifeMode');
const focusBtn = document.getElementById('toggleFocus');

function setStatus(message) {
  statusEl.textContent = message;
}

async function sendToCurrentTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    setStatus('No active page found.');
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, message);
    setStatus('Done.');
  } catch (error) {
    setStatus('Refresh the page, then try again.');
  }
}

openBtn.addEventListener('click', () => {
  setStatus('Opening LifeMode...');
  sendToCurrentTab({ type: 'OPEN_LIFEMODE' });
});

focusBtn.addEventListener('click', () => {
  setStatus('Toggling focus mode...');
  sendToCurrentTab({ type: 'TOGGLE_FOCUS_MODE' });
});
