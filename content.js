// ChatGPT Folder Organizer - Simplified Version
class ChatGPTFolderOrganizer {
  constructor() {
    this.folders = new Map();
    this.conversations = new Map();
    this.isPinned = true; // Default to pinned mode
    this.dragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    };
    this.init();
  }

  async init() {
    // Wait for ChatGPT interface to load
    await this.waitForElement('main, [role="main"], .flex');
    
    // Load saved data
    await this.loadData();
    
    // Create the panel
    this.createPanel();
    
    // Set up observers for new conversations
    this.setupObservers();
    
    console.log('ChatGPT Folder Organizer initialized');
  }

  waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found`));
      }, timeout);
    });
  }

  async loadData() {
    try {
      const result = await chrome.storage.local.get(['folders', 'conversations', 'folderPanelPinned', 'folderPanelPosition']);
      this.folders = new Map(result.folders || []);
      this.conversations = new Map(result.conversations || []);
      this.isPinned = result.folderPanelPinned !== false; // Default true
      this.savedPosition = result.folderPanelPosition || { x: 100, y: 100 };
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async saveData() {
    try {
      await chrome.storage.local.set({
        folders: Array.from(this.folders.entries()),
        conversations: Array.from(this.conversations.entries())
      });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  async savePanelState() {
    try {
      await chrome.storage.local.set({
        folderPanelPinned: this.isPinned,
        folderPanelPosition: this.savedPosition
      });
    } catch (error) {
      console.error('Error saving panel state:', error);
    }
  }

  createPanel() {
    // Remove any existing panel
    const existing = document.getElementById('chatgpt-folder-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'chatgpt-folder-panel';
    panel.className = 'folder-panel';
    
    panel.innerHTML = `
      <div class="panel-header">
        <div class="panel-drag-handle" title="Drag to move">⋮⋮</div>
        <div class="panel-title">
          <span class="title-icon">📁</span>
          <span class="title-text">My Folders</span>
          <span class="folder-count" id="folderCount"></span>
        </div>
        <div class="panel-controls">
          <button class="pin-btn" id="pinToggle" title="Pin/Unpin Panel">📌</button>
          <button class="collapse-btn" id="collapseToggle" title="Collapse/Expand">↕</button>
          <button class="add-btn" id="addFolder" title="Add Folder">+</button>
        </div>
      </div>
      <div class="panel-content" id="panelContent">
        <div class="folder-list" id="folderList"></div>
        <div class="panel-actions">
          <button class="action-btn primary" id="addCurrentChat">Add Current Chat</button>
          <button class="action-btn secondary" id="organizeMode">Organize Mode</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    
    // Set initial mode
    this.setMode(this.isPinned);
    
    // Setup all event listeners
    this.setupEventListeners(panel);
    
    // Render folders
    this.renderFolders();
  }

  setMode(pinned) {
    const panel = document.getElementById('chatgpt-folder-panel');
    if (!panel) return;

    this.isPinned = pinned;
    
    if (pinned) {
      // Pinned mode - bottom left, ChatGPT styling
      panel.className = 'folder-panel pinned';
      panel.style.position = 'fixed';
      panel.style.bottom = '20px';
      panel.style.left = '20px';
      panel.style.top = 'auto';
      panel.style.right = 'auto';
      
      // Update pin button
      document.getElementById('pinToggle').innerHTML = '📌';
      document.getElementById('pinToggle').title = 'Unpin panel';
      
    } else {
      // Floating mode - draggable, prominent styling
      panel.className = 'folder-panel floating';
      panel.style.position = 'fixed';
      panel.style.left = this.savedPosition.x + 'px';
      panel.style.top = this.savedPosition.y + 'px';
      panel.style.bottom = 'auto';
      panel.style.right = 'auto';
      
      // Update pin button
      document.getElementById('pinToggle').innerHTML = '📍';
      document.getElementById('pinToggle').title = 'Pin to corner';
    }
    
    this.savePanelState();
  }

  setupEventListeners(panel) {
    // Pin toggle
    document.getElementById('pinToggle').addEventListener('click', () => {
      this.setMode(!this.isPinned);
    });

    // Collapse toggle
    document.getElementById('collapseToggle').addEventListener('click', () => {
      this.toggleCollapse();
    });

    // Add folder
    document.getElementById('addFolder').addEventListener('click', () => {
      this.addFolder();
    });

    // Add current chat
    document.getElementById('addCurrentChat').addEventListener('click', () => {
      this.addCurrentChat();
    });

    // Organize mode
    document.getElementById('organizeMode').addEventListener('click', () => {
      this.toggleOrganizeMode();
    });

    // Drag functionality
    this.setupDrag(panel);
  }

  setupDrag(panel) {
    const dragHandle = panel.querySelector('.panel-drag-handle');
    
    const onMouseDown = (e) => {
      if (this.isPinned) return; // No dragging in pinned mode
      
      this.dragState.isDragging = true;
      this.dragState.startX = e.clientX;
      this.dragState.startY = e.clientY;
      
      const rect = panel.getBoundingClientRect();
      this.dragState.offsetX = e.clientX - rect.left;
      this.dragState.offsetY = e.clientY - rect.top;
      
      panel.classList.add('dragging');
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!this.dragState.isDragging || this.isPinned) return;

      const newX = e.clientX - this.dragState.offsetX;
      const newY = e.clientY - this.dragState.offsetY;
      
      // Constrain to viewport
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));
      
      panel.style.left = constrainedX + 'px';
      panel.style.top = constrainedY + 'px';
      
      this.savedPosition = { x: constrainedX, y: constrainedY };
    };

    const onMouseUp = () => {
      if (this.dragState.isDragging) {
        this.dragState.isDragging = false;
        panel.classList.remove('dragging');
        this.savePanelState();
      }
    };

    dragHandle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  toggleCollapse() {
    const content = document.getElementById('panelContent');
    const btn = document.getElementById('collapseToggle');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      btn.innerHTML = '↕';
    } else {
      content.style.display = 'none';
      btn.innerHTML = '↕';
    }
  }

  addFolder() {
    const name = prompt('Enter folder name:');
    if (name && name.trim()) {
      const folderId = 'folder_' + Date.now();
      this.folders.set(folderId, {
        name: name.trim(),
        created: Date.now()
      });
      this.saveData();
      this.renderFolders();
    }
  }

  renderFolders() {
    const folderList = document.getElementById('folderList');
    const folderCount = document.getElementById('folderCount');
    
    if (!folderList) return;

    folderList.innerHTML = '';

    // Update count
    folderCount.textContent = `(${this.folders.size})`;

    // Show All option
    const showAll = this.createFolderItem('all', 'Show All', '📋', this.getConversationCount('all'));
    folderList.appendChild(showAll);

    // Unorganized folder
    const unorganized = this.createFolderItem('unorganized', 'Unorganized', '📁', this.getConversationCount('unorganized'));
    folderList.appendChild(unorganized);

    // Custom folders
    this.folders.forEach((folderData, folderId) => {
      const item = this.createFolderItem(folderId, folderData.name, '📁', this.getConversationCount(folderId));
      folderList.appendChild(item);
    });
  }

  createFolderItem(folderId, name, icon, count) {
    const div = document.createElement('div');
    div.className = 'folder-item';
    div.dataset.folderId = folderId;
    
    div.innerHTML = `
      <span class="folder-icon">${icon}</span>
      <span class="folder-name">${name}</span>
      <span class="folder-count">(${count})</span>
      ${folderId !== 'all' && folderId !== 'unorganized' ? '<button class="delete-btn">×</button>' : ''}
    `;

    div.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-btn')) {
        this.selectFolder(folderId);
      }
    });

    if (folderId !== 'all' && folderId !== 'unorganized') {
      div.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteFolder(folderId);
      });
    }

    return div;
  }

  getConversationCount(folderId) {
    if (folderId === 'all') {
      return document.querySelectorAll('a[href*="/c/"]').length;
    }
    
    if (folderId === 'unorganized') {
      const allLinks = document.querySelectorAll('a[href*="/c/"]');
      let count = 0;
      allLinks.forEach(link => {
        const convId = this.getConversationId(link);
        if (convId && !this.conversations.has(convId)) {
          count++;
        }
      });
      return count;
    }

    let count = 0;
    this.conversations.forEach(conv => {
      if (conv.folderId === folderId) count++;
    });
    return count;
  }

  selectFolder(folderId) {
    // Remove previous selection
    document.querySelectorAll('.folder-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Add selection
    const item = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (item) item.classList.add('selected');
    
    // Filter conversations
    this.filterConversations(folderId);
  }

  filterConversations(folderId) {
    const conversationLinks = document.querySelectorAll('a[href*="/c/"]');
    
    conversationLinks.forEach(link => {
      const convId = this.getConversationId(link);
      const conversation = this.conversations.get(convId);
      
      let shouldShow = false;
      
      if (folderId === 'all') {
        shouldShow = true;
      } else if (folderId === 'unorganized') {
        shouldShow = !conversation || conversation.folderId === 'unorganized';
      } else {
        shouldShow = conversation && conversation.folderId === folderId;
      }
      
      const container = link.closest('li, .group, div[class*="flex"]') || link;
      container.style.display = shouldShow ? '' : 'none';
    });
  }

  getConversationId(element) {
    if (element.href) {
      const match = element.href.match(/\/c\/([a-f0-9-]+)/);
      return match ? match[1] : null;
    }
    
    const link = element.querySelector('a[href*="/c/"]');
    if (link) {
      const match = link.href.match(/\/c\/([a-f0-9-]+)/);
      return match ? match[1] : null;
    }
    
    return null;
  }

  deleteFolder(folderId) {
    if (confirm('Delete this folder? Conversations will be moved to Unorganized.')) {
      // Move conversations to unorganized
      this.conversations.forEach((conv, convId) => {
        if (conv.folderId === folderId) {
          conv.folderId = 'unorganized';
        }
      });
      
      this.folders.delete(folderId);
      this.saveData();
      this.renderFolders();
    }
  }

  addCurrentChat() {
    const currentUrl = window.location.href;
    const match = currentUrl.match(/\/c\/([a-f0-9-]+)/);
    
    if (!match) {
      alert('No active conversation found.');
      return;
    }
    
    const convId = match[1];
    const title = document.title.replace(' | ChatGPT', '') || 'Current Conversation';
    
    this.showFolderSelector(convId, title);
  }

  showFolderSelector(convId, title) {
    const modal = document.createElement('div');
    modal.className = 'folder-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Organize: "${title}"</h3>
        <div class="folder-options">
          <button class="folder-option" data-folder-id="unorganized">📁 Unorganized</button>
          ${Array.from(this.folders.entries()).map(([id, data]) => 
            `<button class="folder-option" data-folder-id="${id}">📁 ${data.name}</button>`
          ).join('')}
        </div>
        <div class="modal-actions">
          <button class="cancel-btn">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('folder-option')) {
        const folderId = e.target.dataset.folderId;
        this.moveConversation(convId, title, folderId);
        document.body.removeChild(modal);
      } else if (e.target.classList.contains('cancel-btn') || e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  moveConversation(convId, title, folderId) {
    this.conversations.set(convId, {
      folderId: folderId,
      title: title,
      updated: Date.now()
    });

    this.saveData();
    this.renderFolders();
    
    // Show success and filter to that folder
    this.showMessage(`Moved to ${folderId === 'unorganized' ? 'Unorganized' : this.folders.get(folderId)?.name}`);
    this.selectFolder(folderId);
  }

  showMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'success-message';
    msg.textContent = text;
    document.body.appendChild(msg);
    
    setTimeout(() => {
      if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 2000);
  }

  toggleOrganizeMode() {
    // TODO: Implement organize mode for bulk operations
    alert('Organize mode - select multiple conversations to move (coming soon)');
  }

  setupObservers() {
    // Watch for conversation changes
    const observer = new MutationObserver(() => {
      setTimeout(() => this.renderFolders(), 500);
    });

    const target = document.querySelector('nav, main, [role="main"]');
    if (target) {
      observer.observe(target, {
        childList: true,
        subtree: true
      });
    }
  }
}

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ChatGPTFolderOrganizer());
} else {
  new ChatGPTFolderOrganizer();
}