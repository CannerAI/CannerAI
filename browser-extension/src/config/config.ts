/**
 * Configuration for CannerAI Extension
 * Environment-driven configuration for different deployment scenarios
 */

interface Config {
  BACKEND_URL: string;       // Backend for API and authentication
  AUTH_URL: string;          // Web app for OAuth login
  ENVIRONMENT: 'development' | 'production' | 'staging';
}

// Default development configuration
const defaultConfig: Config = {
  BACKEND_URL: 'http://localhost:5000',
  AUTH_URL: 'http://localhost:3000',
  ENVIRONMENT: 'development'
};

// Environment-based configuration
// These can be overridden by webpack DefinePlugin or build-time variables
const config: Config = {
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || defaultConfig.BACKEND_URL,
  AUTH_URL: process.env.REACT_APP_AUTH_URL || defaultConfig.AUTH_URL,
  ENVIRONMENT: (process.env.NODE_ENV as Config['ENVIRONMENT']) || defaultConfig.ENVIRONMENT
};

// Production overrides (when building for production)
if (config.ENVIRONMENT === 'production') {
  // Override with production URLs if not set via env
  if (!process.env.REACT_APP_BACKEND_URL) {
    config.BACKEND_URL = 'https://api.cannerai.com';
  }
  if (!process.env.REACT_APP_AUTH_URL) {
    config.AUTH_URL = 'https://app.cannerai.com';
  }
}

// Validate configuration
const validateConfig = () => {
  const requiredFields: (keyof Config)[] = ['BACKEND_URL', 'AUTH_URL'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      console.error(`❌ Missing required config: ${field}`);
    }
  }
  
  console.log('🔧 Extension Configuration:', {
    BACKEND_URL: config.BACKEND_URL,
    AUTH_URL: config.AUTH_URL,
    ENVIRONMENT: config.ENVIRONMENT
  });
};

// Validate on load
validateConfig();

export default config;
export type { Config };
