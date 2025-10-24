// Quick Response UI - Matches popup design exactly
export class QuickResponseUI {
  private menu: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private targetBox: HTMLElement;
  private currentResponses: any[] = [];
  private deletingIds: Set<string> = new Set();

  constructor(targetBox: HTMLElement) {
    this.targetBox = targetBox;
  }

  async showMenu() {
    // Remove existing menu/modal
    this.closeAll();

    // Create menu container
    this.menu = document.createElement('div');
    this.menu.className = 'canner-quick-response-menu';
    this.menu.innerHTML = `
      <div class="canner-popup-container">
        ${this.createNotificationHTML()}
        ${this.createHeaderHTML()}
        <div class="canner-popup-body">
          <div class="canner-search-container">
            <svg class="canner-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input class="canner-search-input" type="text" placeholder="Search by title, content, or tags..." />
            <button class="canner-search-clear" style="display: none;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="canner-responses-list">Loading responses...</div>
        </div>
        <div class="canner-popup-footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Press <kbd>Ctrl+Shift+L</kbd> on LinkedIn pages
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(this.menu);

    // Position menu
    this.positionMenu();

    // Load responses
    await this.loadResponses();

    // Setup event listeners
    this.setupEventListeners();
  }

  private createNotificationHTML(): string {
    return `<div class="canner-notification" style="display: none;"></div>`;
  }

  private createHeaderHTML(): string {
    return `
      <header class="canner-popup-header">
        <div class="canner-header-content">
          <div class="canner-brand-section">
            <div class="canner-brand-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.9" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
            <div class="canner-brand-text">
              <h1 class="canner-brand-title">Canner</h1>
              <p class="canner-brand-subtitle">0 responses</p>
            </div>
          </div>
          <div class="canner-header-actions">
            <button class="canner-theme-toggle" aria-label="Toggle dark mode">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            <button class="canner-btn-new" aria-label="Create new response">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New
            </button>
          </div>
        </div>
      </header>
    `;
  }

  private async loadResponses() {
    try {
      // Fetch responses from storage
      const responses = await this.fetchResponses();
      this.currentResponses = responses;
      
      // Update subtitle
      const subtitle = this.menu?.querySelector('.canner-brand-subtitle');
      if (subtitle) {
        subtitle.textContent = `${responses.length} ${responses.length === 1 ? 'response' : 'responses'}`;
      }

      // Render responses
      this.renderResponses(responses);
    } catch (error) {
      console.error('Error loading responses:', error);
      this.renderError();
    }
  }

  private async fetchResponses(): Promise<any[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['responses'], (result) => {
        resolve(result.responses || []);
      });
    });
  }

  private renderResponses(responses: any[]) {
    const responsesList = this.menu?.querySelector('.canner-responses-list');
    if (!responsesList) return;

    if (responses.length === 0) {
      responsesList.innerHTML = `
        <div class="canner-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <h3>No saved responses</h3>
          <p>Create your first response to get started</p>
          <button class="canner-btn-primary">Create Response</button>
        </div>
      `;
    } else {
      responsesList.innerHTML = responses.map(response => this.createResponseCard(response)).join('');
    }
  }

  private createResponseCard(response: any): string {
    const tags = response.tags || [];
    const tagHTML = tags.length > 0 ? `
      <div class="canner-card-tags">
        ${tags.slice(0, 2).map((tag: string) => `<span class="canner-tag">${tag}</span>`).join('')}
        ${tags.length > 2 ? `<span class="canner-tag-more">+${tags.length - 2}</span>` : ''}
      </div>
    ` : '';

    return `
      <div class="canner-response-card ${this.deletingIds.has(response.id) ? 'canner-sliding-out' : ''}" data-id="${response.id}">
        <div class="canner-card-header">
          <h3 class="canner-card-title">${response.title}</h3>
          ${tagHTML}
        </div>
        <p class="canner-card-content">${response.content}</p>
        <div class="canner-card-actions">
          <button class="canner-btn-action canner-btn-insert" data-id="${response.id}" aria-label="Insert response">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Insert
          </button>
          <button class="canner-btn-action" data-id="${response.id}" aria-label="Edit response">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
              <path d="M14.06 4.94l3.75 3.75" />
            </svg>
            Edit
          </button>
          <button class="canner-btn-action canner-btn-delete" data-id="${response.id}" aria-label="Delete response">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    `;
  }

  private renderError() {
    const responsesList = this.menu?.querySelector('.canner-responses-list');
    if (!responsesList) return;

    responsesList.innerHTML = `
      <div class="canner-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <h3>Failed to load responses</h3>
        <p>Please check your connection</p>
      </div>
    `;
  }

  private setupEventListeners() {
    if (!this.menu) return;

    // Search functionality
    const searchInput = this.menu.querySelector('.canner-search-input') as HTMLInputElement;
    const searchClear = this.menu.querySelector('.canner-search-clear') as HTMLButtonElement;

    searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      searchClear.style.display = query ? 'flex' : 'none';
      this.filterResponses(query);
    });

    searchClear?.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      this.filterResponses('');
    });

    // Theme toggle
    const themeToggle = this.menu.querySelector('.canner-theme-toggle') as HTMLButtonElement;
    themeToggle?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // New button
    const newBtn = this.menu.querySelector('.canner-btn-new') as HTMLButtonElement;
    const createBtn = this.menu.querySelector('.canner-btn-primary') as HTMLButtonElement;
    
    [newBtn, createBtn].forEach(btn => {
      btn?.addEventListener('click', () => {
        this.showCreateModal();
      });
    });

    // Response card actions
    this.menu.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const card = target.closest('.canner-response-card') as HTMLElement;
      if (!card) return;

      const responseId = (card as HTMLElement).dataset.id;
      const response = this.currentResponses.find(r => r.id === responseId);
      if (!response) return;

      if (target.closest('.canner-btn-insert')) {
        this.insertResponse(response.content);
      } else if (target.closest('.canner-btn-action:not(.canner-btn-insert):not(.canner-btn-delete)')) {
        this.showEditModal(response);
      } else if (target.closest('.canner-btn-delete')) {
        this.deleteResponse(response);
      }
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 100);
  }

  private filterResponses(query: string) {
    const cards = this.menu?.querySelectorAll('.canner-response-card');
    if (!cards) return;

    cards.forEach(card => {
      const responseId = (card as HTMLElement).dataset.id;
      const response = this.currentResponses.find(r => r.id === responseId);
      if (!response) return;

      const matches = this.responseMatches(response, query);
      (card as HTMLElement).style.display = matches ? 'block' : 'none';
    });
  }

  private responseMatches(response: any, query: string): boolean {
    if (!query.trim()) return true;
    
    const q = query.toLowerCase();
    return (
      response.title.toLowerCase().includes(q) ||
      response.content.toLowerCase().includes(q) ||
      (Array.isArray(response.tags) && response.tags.some((tag: string) => tag.toLowerCase().includes(q)))
    );
  }

  private insertResponse(content: string) {
    this.insertText(this.targetBox, content);
    this.showNotification('✓ Inserted successfully');
    setTimeout(() => this.closeAll(), 500);
  }

  private showEditModal(response: any) {
    this.showModal(response);
  }

  private async deleteResponse(response: any) {
    if (!confirm('Delete this response permanently?')) return;

    this.deletingIds.add(response.id);
    const card = this.menu?.querySelector(`[data-id="${response.id}"]`) as HTMLElement;
    if (card) card.classList.add('canner-sliding-out');

    setTimeout(async () => {
      try {
        await this.deleteResponseFromStorage(response.id);
        this.currentResponses = this.currentResponses.filter(r => r.id !== response.id);
        this.renderResponses(this.currentResponses);
        this.showNotification('✓ Response deleted');
      } catch (error) {
        console.error('Delete failed:', error);
        this.showNotification('⚠️ Failed to delete');
      } finally {
        this.deletingIds.delete(response.id);
      }
    }, 300);
  }

  private async deleteResponseFromStorage(id: string) {
    return new Promise<void>((resolve, reject) => {
      chrome.storage.local.get(['responses'], (result) => {
        const responses = result.responses || [];
        const updatedResponses = responses.filter((r: any) => r.id !== id);
        chrome.storage.local.set({ responses: updatedResponses }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    });
  }

  private showModal(response?: any) {
    this.closeAll();

    this.modal = document.createElement('div');
    this.modal.className = 'canner-modal-overlay';
    this.modal.innerHTML = `
      <div class="canner-modal">
        <div class="canner-modal-header">
          <h2 id="canner-modal-title">${response ? 'Edit Response' : 'Create Response'}</h2>
          <button class="canner-btn-close" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="canner-modal-body">
          <div class="canner-form-group">
            <label for="canner-title-input" class="canner-form-label">Title</label>
            <input id="canner-title-input" class="canner-form-input" type="text" placeholder="e.g., Introduction message" value="${response?.title || ''}" />
          </div>
          <div class="canner-form-group">
            <label for="canner-content-input" class="canner-form-label">Content</label>
            <textarea id="canner-content-input" class="canner-form-textarea" placeholder="Enter your response message..." rows="5">${response?.content || ''}</textarea>
          </div>
          <div class="canner-form-group">
            <label for="canner-tags-input" class="canner-form-label">Tags</label>
            <input id="canner-tags-input" class="canner-form-input" type="text" placeholder="e.g., greeting, professional (comma separated)" value="${response?.tags ? response.tags.join(', ') : ''}" />
          </div>
        </div>
        <div class="canner-modal-footer">
          <button class="canner-btn-secondary">Cancel</button>
          <button class="canner-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            ${response ? 'Save Changes' : 'Save Response'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Setup modal events
    this.setupModalEvents(response);
  }

  private showCreateModal() {
    this.showModal();
  }

  private setupModalEvents(response?: any) {
    if (!this.modal) return;

    const closeBtn = this.modal.querySelector('.canner-btn-close') as HTMLButtonElement;
    const cancelBtn = this.modal.querySelector('.canner-btn-secondary') as HTMLButtonElement;
    const saveBtn = this.modal.querySelector('.canner-btn-primary') as HTMLButtonElement;

    const closeModal = () => this.closeAll();

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) closeModal();
    });

    saveBtn?.addEventListener('click', async () => {
      const title = (this.modal?.querySelector('#canner-title-input') as HTMLInputElement).value.trim();
      const content = (this.modal?.querySelector('#canner-content-input') as HTMLTextAreaElement).value.trim();
      const tagsStr = (this.modal?.querySelector('#canner-tags-input') as HTMLInputElement).value.trim();

      if (!title || !content) {
        this.showNotification('⚠️ Title and content are required');
        return;
      }

      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

      try {
        if (response) {
          await this.updateResponse(response.id, { title, content, tags });
          this.showNotification('✓ Updated successfully');
        } else {
          await this.createResponse({ title, content, tags });
          this.showNotification('✓ Response saved successfully');
        }

        closeModal();
        await this.loadResponses(); // Refresh the menu
      } catch (error) {
        console.error('Save failed:', error);
        this.showNotification('⚠️ Failed to save');
      }
    });

    // Focus first input
    setTimeout(() => {
      (this.modal?.querySelector('#canner-title-input') as HTMLInputElement)?.focus();
    }, 100);
  }

  private async updateResponse(id: string, data: any) {
    return new Promise<void>((resolve, reject) => {
      chrome.storage.local.get(['responses'], (result) => {
        const responses = result.responses || [];
        const index = responses.findIndex((r: any) => r.id === id);
        if (index === -1) {
          reject(new Error('Response not found'));
          return;
        }

        responses[index] = { ...responses[index], ...data };
        chrome.storage.local.set({ responses }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    });
  }

  private async createResponse(data: any) {
    return new Promise<void>((resolve, reject) => {
      chrome.storage.local.get(['responses'], (result) => {
        const responses = result.responses || [];
        const newResponse = {
          id: Date.now().toString(),
          ...data,
          created_at: new Date().toISOString(),
        };
        responses.push(newResponse);
        chrome.storage.local.set({ responses }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    });
  }

  private toggleTheme() {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', isDark ? 'light' : 'dark');
  }

  private showNotification(message: string) {
    const notification = this.menu?.querySelector('.canner-notification') as HTMLElement;
    if (!notification) return;

    notification.textContent = message;
    notification.style.display = 'block';

    setTimeout(() => {
      notification.style.display = 'none';
    }, 2000);
  }

  private positionMenu() {
    if (!this.menu) return;

    // Position near the target box with smart positioning
    const rect = this.targetBox.getBoundingClientRect();
    const menuHeight = 600; // Same as popup height
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Show above button if not enough space below
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      this.menu.style.top = `${rect.top - menuHeight - 10}px`;
    } else {
      this.menu.style.top = `${rect.bottom + 5}px`;
    }

    // Ensure menu doesn't go off-screen horizontally
    const menuWidth = 420; // Same as popup width
    const spaceRight = window.innerWidth - rect.left;

    if (spaceRight < menuWidth) {
      this.menu.style.left = `${rect.right - menuWidth}px`;
    } else {
      this.menu.style.left = `${rect.left}px`;
    }
  }

  private insertText(box: HTMLElement, text: string) {
    // Focus element first
    box.focus();

    if (box.getAttribute('contenteditable') === 'true') {
      // Contenteditable divs
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(box);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);

      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, text);
      } catch (e) {
        inserted = false;
      }

      if (!inserted || !box.innerText.includes(text)) {
        range.deleteContents();
        const tn = document.createTextNode(text);
        range.insertNode(tn);
        range.setStartAfter(tn);
        range.setEndAfter(tn);
        sel?.removeAllRanges();
        sel?.addRange(range);
        box.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: text, inputType: 'insertText' }));
        box.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (box.tagName === 'TEXTAREA' || (box.tagName === 'INPUT' && (box as HTMLInputElement).type === 'text')) {
      // Regular input elements
      const inputElement = box as HTMLInputElement | HTMLTextAreaElement;
      inputElement.value = text;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
      inputElement.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      setTimeout(() => {
        inputElement.setSelectionRange(text.length, text.length);
      }, 10);
    }
  }

  private handleOutsideClick = (e: Event) => {
    if (!this.menu?.contains(e.target as Node)) {
      this.closeAll();
    }
  };

  closeAll() {
    document.removeEventListener('click', this.handleOutsideClick);
    
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
    
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}
