// API utility for communicating with backend and Chrome storage
import config from '../config/config';

const BACKEND_URL = config.BACKEND_URL;
const AUTH_URL = config.AUTH_URL;

export interface CannedMessage {
  id?: string;
  title: string;
  content: string;
  tags?: string[] | string;
  created_at?: string;
}

export interface AuthState {
  app_jwt_token: string | null;
  user_id: string | null;
  token_timestamp: number | null;
}

// ==================== Authentication Helpers ====================

/**
 * Get the current authentication state from storage
 */
export async function getAuthState(): Promise<AuthState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['app_jwt_token', 'user_id', 'token_timestamp'], (result) => {
      resolve({
        app_jwt_token: result.app_jwt_token || null,
        user_id: result.user_id || null,
        token_timestamp: result.token_timestamp || null,
      });
    });
  });
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { app_jwt_token } = await getAuthState();
  return !!app_jwt_token;
}

/**
 * Clear authentication state (logout)
 */
export async function clearAuth(): Promise<void> {
  return new Promise((resolve) => {
    // Clear all user-specific data including auth tokens and cached content
    chrome.storage.local.remove([
      // Authentication
      'app_jwt_token', 
      'user_id', 
      'token_timestamp',
      // User data
      'responses',
      'cannedMessages',
      // Welcome page tracking
      'welcomePageViewed',
      'welcomePageViewedAt',
      'welcomePageVersion',
      // Unnecessary analytics (cleanup old data)
      'userAgent',
      'language',
      'platform',
      'screenResolution'
    ], () => {
      console.log('✅ Cleared all authentication data and cached content');
      resolve();
    });
  });
}

/**
 * Initiate OAuth login by opening the web app auth page
 */
export async function initiateLogin(): Promise<void> {
  const extensionId = chrome.runtime.id;
  const authUrl = `${AUTH_URL}/extension-auth?extension_id=${extensionId}`;
  
  // Open the web app in a new tab for authentication
  chrome.tabs.create({ url: authUrl });
}

/**
 * Make an authenticated API request with JWT token
 * Automatically handles 401 errors by clearing auth and throwing
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<globalThis.Response> {
  const { app_jwt_token } = await getAuthState();
  
  if (!app_jwt_token) {
    throw new Error('Not authenticated');
  }

  // Add Authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${app_jwt_token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    await clearAuth();
    throw new Error('Authentication expired. Please log in again.');
  }

  return response;
}

// ==================== Canned Messages / Templates API ====================

/**
 * Fetch user-specific canned messages from the backend
 * REQUIRES AUTHENTICATION
 */
export async function getCannedMessages(): Promise<CannedMessage[]> {
  try {
    const response = await authenticatedFetch(`${BACKEND_URL}/api/responses`);
    
    if (response.ok) {
      const data = await response.json();
      // Cache in Chrome storage
      chrome.storage.local.set({ cannedMessages: data });
      return data;
    }
    
    throw new Error('Failed to fetch canned messages');
  } catch (error) {
    console.error('Error fetching canned messages:', error);
    
    // If auth error, throw it up
    if (error instanceof Error && error.message.includes('Authentication')) {
      throw error;
    }
    
    // Fallback to cached data
    return new Promise((resolve) => {
      chrome.storage.local.get(['cannedMessages'], (result) => {
        resolve(result.cannedMessages || []);
      });
    });
  }
}

// ==================== Legacy Response API (keeping for backwards compatibility) ====================

// Try backend first, fall back to Chrome storage
export async function getResponses(): Promise<CannedMessage[]> {
  try {
    // Get JWT token
    const storage = await chrome.storage.local.get(['app_jwt_token']);
    const token = storage.app_jwt_token;
    
    if (!token) {
      console.log("No auth token, using local storage");
      // Fallback to Chrome storage
      return new Promise((resolve) => {
        chrome.storage.local.get(["responses"], (result) => {
          const responses = (result.responses || []).map((r: any) => ({
            ...r,
            tags: Array.isArray(r.tags) ? r.tags : (r.tags ? [r.tags] : [])
          }));
          resolve(responses);
        });
      });
    }
    
    // Try backend with authentication
    const response = await fetch(`${BACKEND_URL}/api/responses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Cache in Chrome storage
      chrome.storage.local.set({ responses: data });
      return data;
    }
  } catch (error) {
    console.log("Backend not available, using local storage");
  }

  // Fallback to Chrome storage
  return new Promise((resolve) => {
    chrome.storage.local.get(["responses"], (result) => {
      const responses = (result.responses || []).map((r: any) => ({
        ...r,
        tags: Array.isArray(r.tags) ? r.tags : (r.tags ? [r.tags] : [])
      }));
      resolve(responses);
    });
  });
}

export async function updateResponse(id: string, data: Partial<CannedMessage>): Promise<CannedMessage> {
  try {
    // Get JWT token
    const storage = await chrome.storage.local.get(['app_jwt_token']);
    const token = storage.app_jwt_token;
    
    const headers: any = { "Content-Type": "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try backend with PATCH first, fall back to PUT if needed
    const result = await fetch(`${BACKEND_URL}/api/responses/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });

    if (result.ok) {
      const updated = await result.json();
      // Sync Chrome storage cache
      const current = await getResponses();
      const next = current.map((r) => (r.id === id ? { ...r, ...updated } : r));
      chrome.storage.local.set({ responses: next });
      return updated;
    }
  } catch (error) {
    console.log("Backend not available, updating local storage");
  }

  // Fallback to Chrome storage
  return new Promise((resolve) => {
    chrome.storage.local.get(["responses"], (result) => {
      const responses: CannedMessage[] = (result.responses || []).map((r: any) => ({
        ...r,
        tags: Array.isArray(r.tags) ? r.tags : r.tags ? [r.tags] : [],
      }));
      const next = responses.map((r) => (r.id === id ? { ...r, ...data } as CannedMessage : r));
      chrome.storage.local.set({ responses: next }, () => {
        const updated = next.find((r) => r.id === id)!;
        resolve(updated);
      });
    });
  });
}

export async function saveResponse(response: CannedMessage): Promise<CannedMessage> {
  try {
    // Get JWT token
    const storage = await chrome.storage.local.get(['app_jwt_token']);
    const token = storage.app_jwt_token;
    
    const headers: any = { "Content-Type": "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try backend
    const result = await fetch(`${BACKEND_URL}/api/responses`, {
      method: "POST",
      headers,
      body: JSON.stringify(response),
    });

    if (result.ok) {
      const saved = await result.json();

      // Update Chrome storage
      //Fix: fetch from local and .unshift(saved)
      const { responses } = await chrome.storage.local.get({ responses: [] });
      responses.unshift(saved);
      await chrome.storage.local.set({ responses });

      return saved;
    }
  } catch (error) {
    console.log("Backend not available, saving to local storage");
  }

  // Fallback to Chrome storage
  const id = `lh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const savedResponse = {
    ...response,
    id,
    created_at: new Date().toISOString(),
    tags: Array.isArray(response.tags) ? response.tags : (response.tags ? [response.tags] : [])
  };

  return new Promise((resolve) => {
    chrome.storage.local.get(["responses"], (result) => {
      const responses = result.responses || [];

      //Fix: use .unshift()
      responses.unshift(savedResponse);
      chrome.storage.local.set({ responses }, () => {
        resolve(savedResponse);
      });
    });
  });
}

export async function deleteResponse(id: string): Promise<void> {
  try {
    // Get JWT token
    const storage = await chrome.storage.local.get(['app_jwt_token']);
    const token = storage.app_jwt_token;
    
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try backend
    const result = await fetch(`${BACKEND_URL}/api/responses/${id}`, {
      method: "DELETE",
      headers,
    });

    if (result.ok) {
      // Update Chrome storage
      const responses = await getResponses();
      const filtered = responses.filter((r) => r.id !== id);
      chrome.storage.local.set({ responses: filtered });
      return;
    }
  } catch (error) {
    console.log("Backend not available, deleting from local storage");
  }

  // Fallback to Chrome storage
  return new Promise((resolve) => {
    chrome.storage.local.get(["responses"], (result) => {
      const responses = result.responses || [];
      const filtered = responses.filter((r: CannedMessage) => r.id !== id);
      chrome.storage.local.set({ responses: filtered }, () => {
        resolve();
      });
    });
  });
}
