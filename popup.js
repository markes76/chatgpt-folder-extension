// Popup script for ChatGPT Folder Organizer
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  setupEventListeners();
});

async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['folders', 'conversations']);
    const folders = new Map(result.folders || []);
    const conversations = new Map(result.conversations || []);
    
    // Update UI
    document.getElementById('folderCount').textContent = folders.size;
    document.getElementById('organizedCount').textContent = conversations.size;
    document.getElementById('status').textContent = 'Active';
    
    // Check if we're on ChatGPT
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab && (currentTab.url.includes('chat.openai.com') || currentTab.url.includes('chatgpt.com'))) {
      document.getElementById('status').textContent = 'Active on ChatGPT';
    } else {
      document.getElementById('status').textContent = 'Visit ChatGPT to use';
    }
    
  } catch (error) {
    console.error('Error loading stats:', error);
    document.getElementById('status').textContent = 'Error';
  }
}

function setupEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (currentTab && (currentTab.url.includes('chat.openai.com') || currentTab.url.includes('chatgpt.com'))) {
        // Reload the content script
        await chrome.tabs.reload(currentTab.id);
        showMessage('Extension refreshed!');
      } else {
        showMessage('Please visit ChatGPT first');
      }
    } catch (error) {
      showMessage('Error refreshing extension');
    }
  });
  
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', importData);
  document.getElementById('helpLink').addEventListener('click', showHelp);
}

async function exportData() {
  try {
    const result = await chrome.storage.local.get(['folders', 'conversations']);
    const data = {
      folders: result.folders || [],
      conversations: result.conversations || [],
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatgpt-folders-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showMessage('Data exported successfully!');
    
  } catch (error) {
    showMessage('Error exporting data');
  }
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data.folders || !data.conversations) {
        throw new Error('Invalid data format');
      }
      
      // Confirm import
      if (confirm('This will replace your current folder organization. Continue?')) {
        await chrome.storage.local.set({
          folders: data.folders,
          conversations: data.conversations
        });
        
        showMessage('Data imported successfully!');
        await loadStats();
      }
      
    } catch (error) {
      showMessage('Error importing data: ' + error.message);
    }
  });
  
  input.click();
}

function showHelp() {
  const helpText = `
ChatGPT Folder Organizer Help:

1. Create folders using the + button
2. Click "Organize Conversations" to enter organize mode
3. Click conversations to select them
4. Choose a folder to move them to
5. Use the popup to export/import your organization

Tips:
- Folders are saved locally in your browser
- Export your data regularly as backup
- Use descriptive folder names for better organization
  `;
  
  alert(helpText);
}

function showMessage(message) {
  // Create temporary message element
  const messageEl = document.createElement('div');
  messageEl.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #10a37f;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 1000;
  `;
  messageEl.textContent = message;
  
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, 2000);
}