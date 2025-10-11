import React, { useState, useEffect } from "react";
import {
  getResponses,
  saveResponse,
  deleteResponse,
  Response,
} from "../utils/api";

function App() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<Response[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // New response form state
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");

  useEffect(() => {
    loadResponses();
  }, []);

  useEffect(() => {
    filterResponses();
  }, [searchQuery, responses]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const data = await getResponses();
      setResponses(data);
      setFilteredResponses(data);
    } catch (error) {
      console.error("Error loading responses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterResponses = () => {
    if (!searchQuery.trim()) {
      setFilteredResponses(responses);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = responses.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.content.toLowerCase().includes(query) ||
        (r.tags && Array.isArray(r.tags)
          ? r.tags.some((tag: string) => tag.toLowerCase().includes(query))
          : typeof r.tags === 'string' && r.tags.toLowerCase().includes(query))
    );
    setFilteredResponses(filtered);
  };

  const handleSaveNew = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showToastMessage("Please enter both title and content", "error");
      return;
    }
    setIsLoading(true);

    try {
      const newResponse: Response = {
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: newTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
      };

      await saveResponse(newResponse);
      await loadResponses();
      // Reset form
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setShowNewForm(false);
      showToastMessage("Response saved successfully!", "success");
    } catch (error) {
      console.error("Error saving response:", error);
      showToastMessage("Failed to save response", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setResponseToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!responseToDelete) return;

    try {
      setDeletingId(responseToDelete);
      setShowDeleteConfirm(false);
      await deleteResponse(responseToDelete);
      await loadResponses();
      showToastMessage("Response deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting response:", error);
      showToastMessage("Failed to delete response", "error");
    } finally {
      setDeletingId(null);
      setResponseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setResponseToDelete(null);
  };

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleInsert = async (response: Response) => {
    try {
      // Send message to content script to insert the response
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            action: "insertResponse",
            content: response.content,
          },
          (response) => {
            if (response?.success) {
              window.close(); // Close popup after successful insertion
            } else {
              showToastMessage("Please click on a LinkedIn message box first", "error");
            }
          }
        );
      }
    } catch (error) {
      console.error("Error inserting response:", error);
      showToastMessage("Failed to insert response", "error");
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    showToastMessage("Copied to clipboard!", "success");
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>💼 Canner</h1>
        <p>Your saved responses library</p>
      </header>

      <div className="popup-content">
        {/* Search Bar */}
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search responses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="btn-new"
            onClick={() => setShowNewForm(!showNewForm)}
          >
            {showNewForm ? "❌ Cancel" : "➕ New"}
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Delete Response</h3>
              <p>Are you sure you want to delete this response? This action cannot be undone.</p>
              <div className="modal-actions">
                <button onClick={cancelDelete} className="btn-cancel">
                  Cancel
                </button>
                <button onClick={confirmDelete} className="btn-delete-confirm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className={`toast ${toastType}`}>
            <span>{toastMessage}</span>
            <button onClick={() => setShowToast(false)} className="toast-close">
              &times;
            </button>
          </div>
        )}

        {/* New Response Form */}
        {showNewForm && (
          <div className="new-form">
            <form onSubmit={handleSaveNew}>
            <h2 className="form-title">Add New Response</h2>
            <input
              type="text"
              placeholder="Title *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="form-input"
              disabled={isLoading}
            />
            <textarea
              placeholder="Content *"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="form-textarea"
              rows={4}
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="form-input"
              disabled={isLoading}
            />
            <button type="submit" className="btn-save" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Response"}
            </button>
            </form>
          </div>
        )}

        {/* Responses List */}
        <div className="responses-list">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : filteredResponses.length === 0 ? (
            <div className="empty">
              <p>📭 No responses found</p>
              <p className="empty-sub">Create your first response!</p>
            </div>
          ) : (
            filteredResponses.map((response) => (
              <div key={response.id} className="response-card">
                <div className="response-title">{response.title}</div>
                <div className="response-content">{response.content}</div>
                {response.tags && (
                  <div className="response-tags">
                    {(Array.isArray(response.tags) ? response.tags : [response.tags])
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <span key={idx} className="tag">
                          {tag}
                        </span>
                      ))}
                  </div>
                )}
                <div className="response-actions">
                  <button
                    onClick={() => handleInsert(response)}
                    className="btn-action btn-insert"
                    title="Insert into LinkedIn"
                  >
                    📝 Insert
                  </button>
                  <button
                    onClick={() => handleCopy(response.content)}
                    className="btn-action btn-copy"
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => response.id && handleDelete(response.id)}
                    className="btn-action btn-delete"
                    title="Delete"
                    disabled={deletingId === response.id}
                  >
                    {deletingId === response.id ? "Deleting..." : "🗑️"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="popup-footer">
        <small>Tip: Use Ctrl+Shift+L on LinkedIn pages</small>
      </footer>
    </div>
  );
}

export default App;
