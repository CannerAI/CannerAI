# Environment Configuration

## Configuration Variables

The extension uses two environment variables:

- **REACT_APP_BACKEND_URL** - Backend API URL (Flask server for API and authentication)
- **REACT_APP_AUTH_URL** - Web app URL (for OAuth login page)

## Environment Files

### Development (`.env.development`)
```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_AUTH_URL=http://localhost:3000
```

### Production (`.env.production`)
```env
REACT_APP_BACKEND_URL=https://api.cannerai.com
REACT_APP_AUTH_URL=https://app.cannerai.com
```

## Build Commands

```bash
# Development build
npm run build:dev

# Production build
npm run build

# Watch mode (auto-rebuild)
npm run dev
```

## Updating URLs

1. Edit `.env.development` or `.env.production`
2. Update the URLs
3. Run the appropriate build command
4. Reload the extension in Chrome

## How It Works

- `config.ts` reads environment variables at build time
- Webpack DefinePlugin injects values during compilation
- All API calls use the configured URLs

That's it! Simple and clean. 🎯
