import React, { useState, useEffect } from "react";
import { getResponses, saveResponse, deleteResponse, Response } from "../utils/api";

const App: React.FC = () => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    load();
    loadTheme();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    chrome.storage.sync.set({ theme: isDarkMode ? 'dark' : 'light' });
  }, [isDarkMode]);

  async function loadTheme() {
    const result = await chrome.storage.sync.get(['theme']);
    const theme = result.theme || 'light';
    setIsDarkMode(theme === 'dark');
  }

  async function load() {
    setLoading(true);
    try {
      const data = await getResponses();
      setResponses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = responses.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q) ||
      (Array.isArray(r.tags) ? r.tags.join(" ").toLowerCase() : String(r.tags || "")).includes(q)
    );
  });

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setNotification("⚠️ Title and content are required");
      return;
    }

    const newResp: Partial<Response> = {
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    try {
      await saveResponse(newResp as Response);
      setShowModal(false);
      setTitle("");
      setContent("");
      setTags("");
      await load();
      setNotification("✓ Response saved successfully");
    } catch (e) {
      console.error(e);
      setNotification("⚠️ Failed to save response");
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm("Delete this response permanently?")) return;
    
    setDeletingIds(prev => new Set(prev).add(id));
    
    setTimeout(async () => {
      try {
        await deleteResponse(id);
        await load();
        setDeletingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        setNotification("✓ Response deleted");
      } catch (e) {
        setDeletingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        setNotification("⚠️ Failed to delete");
      }
    }, 300); // Match animation duration
  }

  async function handleInsert(text: string) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: "insertResponse", content: text }, (res) => {
          if (res?.success) {
            setNotification("✓ Inserted successfully");
            setTimeout(() => window.close(), 500);
          } else {
            setNotification("⚠️ No input field detected");
          }
        });
      }
    } catch (e) {
      console.error(e);
      setNotification("⚠️ Failed to insert");
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setNotification("✓ Copied to clipboard");
    });
  }

  return (
    <div className="popup-container">
      {notification && (
        <div className="notification">{notification}</div>
      )}

      <header className="popup-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="brand-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.9"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="brand-text">
              <h1 className="brand-title">Canner</h1>
              <p className="brand-subtitle">{responses.length} {responses.length === 1 ? 'response' : 'responses'}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} aria-label="Toggle dark mode">
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <button className="btn-new" onClick={() => setShowModal(true)} aria-label="Create new response">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New
            </button>
          </div>
        </div>
      </header>

      <div className="popup-body">
        <div className="search-container">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search by title, content, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search responses"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="responses-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line long"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-actions">
                  <div className="skeleton-btn"></div>
                  <div className="skeleton-btn"></div>
                  <div className="skeleton-btn"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {query ? (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <h3>No matches found</h3>
                <p>Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <h3>No saved responses</h3>
                <p>Create your first response to get started</p>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                  Create Response
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="responses-list">
            {filtered.map((r) => (
              <div key={r.id} className={`response-card ${deletingIds.has(r.id!) ? 'sliding-out' : ''}`}>
                <div className="card-header">
                  <h3 className="card-title">{r.title}</h3>
                  {Array.isArray(r.tags) && r.tags.length > 0 && (
                    <div className="card-tags">
                      {r.tags.slice(0, 2).map((t: string, i: number) => (
                        <span key={i} className="tag">{t}</span>
                      ))}
                      {r.tags.length > 2 && <span className="tag-more">+{r.tags.length - 2}</span>}
                    </div>
                  )}
                </div>
                <p className="card-content">{r.content}</p>
                <div className="card-actions">
                  <button className="btn-action btn-insert" onClick={() => handleInsert(r.content)} aria-label="Insert response">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                    Insert
                  </button>
                  <button className="btn-action btn-copy" onClick={() => handleCopy(r.content)} aria-label="Copy response">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy
                  </button>
                  <button className="btn-action btn-delete" onClick={() => handleDelete(r.id)} aria-label="Delete response">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="popup-footer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        Press <kbd>Ctrl+Shift+L</kbd> on LinkedIn pages
      </footer>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header">
              <h2 id="modal-title">Create Response</h2>
              <button className="btn-close" onClick={() => setShowModal(false)} aria-label="Close modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="title-input" className="form-label">Title</label>
                <input
                  id="title-input"
                  className="form-input"
                  type="text"
                  placeholder="e.g., Introduction message"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="content-input" className="form-label">Content</label>
                <textarea
                  id="content-input"
                  className="form-textarea"
                  placeholder="Enter your response message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="form-group">
                <label htmlFor="tags-input" className="form-label">Tags</label>
                <input
                  id="tags-input"
                  className="form-input"
                  type="text"
                  placeholder="e.g., greeting, professional (comma separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
