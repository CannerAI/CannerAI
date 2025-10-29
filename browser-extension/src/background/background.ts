// Background service worker for Canner

console.log("Canner: Background script loaded");

// Use a configurable API URL with a fallback to localhost
const API_URL = process.env.API_URL || "http://localhost:5000";

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Canner installed!");

    // Set default settings
    chrome.storage.local.set({
      responses: [],
      settings: {
        autoShowButton: true,
        apiUrl: API_URL,
      },
    });

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html"),
    });
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.action === "openPopup") {
    if (message.editId) {
      // Store the edit ID to be picked up by popup
      chrome.storage.session.set({ editId: message.editId }, () => {
        chrome.action.openPopup();
        sendResponse({ success: true });
      });
    } else {
      // Clear any existing edit ID
      chrome.storage.session.remove(["editId"], () => {
        chrome.action.openPopup();
        sendResponse({ success: true });
      });
    }
  }

  return true; // Keep message channel open for async response
});

// Handle keyboard commands (if configured in manifest)
chrome.commands?.onCommand.addListener((command) => {
  console.log("Command:", command);

  if (command === "open-quick-response") {
    // Send message to active tab to show quick response menu
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "showQuickResponse",
        });
      }
    });
  }
});

// Sync with backend periodically
setInterval(async () => {
  try {
    const result = await fetch(`${API_URL}/api/health`);
    if (result.ok) {
      // Backend is available, sync data
      const responses = await fetch(`${API_URL}/api/responses`);
      if (responses.ok) {
        const data = await responses.json();
        chrome.storage.local.set({ responses: data });
        console.log("Synced with backend:", data.length, "responses");
      }
    }
  } catch (error) {
    // Backend not available, continue using local storage
  }
}, 5 * 60 * 1000); // Every 5 minutes