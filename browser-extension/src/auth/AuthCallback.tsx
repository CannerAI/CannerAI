import React, { useEffect, useState } from 'react';
import './auth-callback.css';
import config from '../config/config';

const BACKEND_URL = config.BACKEND_URL;

interface TokenResponse {
  jwt_token: string;
  user_id: string;
  expires_in?: number;
}

type AuthState = 'loading' | 'success' | 'error';

const AuthCallback: React.FC = () => {
  const [state, setState] = useState<AuthState>('loading');
  const [message, setMessage] = useState('Completing authentication...');
  const [errorDetail, setErrorDetail] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Extract the auth code from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');

      console.log('Auth callback URL:', window.location.href);
      console.log('Auth code extracted:', authCode);

      if (!authCode) {
        throw new Error('No authorization code found. Please try logging in again.');
      }

      // Exchange the code for a JWT token
      setMessage('Exchanging authorization code...');
      
      console.log('Sending exchange request to:', `${BACKEND_URL}/api/auth/extension/exchange-code`);
      
      const response = await fetch(`${BACKEND_URL}/api/auth/extension/exchange-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auth_code: authCode }),
      });

      console.log('Exchange response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Exchange failed:', errorData);
        throw new Error(errorData.detail || errorData.error || `Authentication failed (${response.status})`);
      }

      const tokenData: TokenResponse = await response.json();
      console.log('Token received, user_id:', tokenData.user_id);

      if (!tokenData.jwt_token || !tokenData.user_id) {
        throw new Error('Invalid response from server. Missing token or user_id.');
      }

      // Store the JWT token and user_id in chrome.storage.local
      setMessage('Saving credentials...');
      
      await chrome.storage.local.set({
        app_jwt_token: tokenData.jwt_token,
        user_id: tokenData.user_id,
        token_timestamp: Date.now(),
      });

      console.log('Credentials saved to storage');

      // Show success
      setState('success');
      setUserId(tokenData.user_id);
      setMessage('You can now use Canner');

      // Close the tab after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);

    } catch (error: any) {
      console.error('Authentication error:', error);
      setState('error');
      setMessage('Authentication failed');
      setErrorDetail(error.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-content">
        <div className="brand-section">
          <div className={`brand-logo ${state === 'success' ? 'success' : state === 'error' ? 'error' : ''}`}>
            {state === 'loading' && (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="spinner-icon">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  fill="currentColor"
                  opacity="0.9"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {state === 'success' && (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            {state === 'error' && (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
          </div>
          <h1 className="auth-title">{message}</h1>
          {state === 'loading' && (
            <p className="auth-subtitle">Please wait while we securely log you in</p>
          )}
          {state === 'success' && (
            <>
              <p className="auth-subtitle success-text">Successfully authenticated as {userId}</p>
              <p className="auth-close-text">This window will close automatically</p>
            </>
          )}
          {state === 'error' && (
            <div className="error-container">
              <p className="error-text">{errorDetail}</p>
              <button className="btn-retry" onClick={() => window.close()}>
                Close Window
              </button>
            </div>
          )}
        </div>

        {state === 'loading' && (
          <div className="progress-steps">
            <div className="step active">
              <div className="step-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                </svg>
              </div>
              <span>Code received</span>
            </div>
            <div className="step active">
              <div className="step-icon loading">
                <div className="spinner-small"></div>
              </div>
              <span>Verifying identity</span>
            </div>
            <div className="step">
              <div className="step-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2" />
                  <path d="M12 3v2" />
                  <rect x="3" y="8" width="18" height="8" rx="1" />
                </svg>
              </div>
              <span>Saving credentials</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
