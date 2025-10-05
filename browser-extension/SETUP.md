# Browser Extension - Quick Setup

## 📝 Note About Icons

The extension requires icon files. You can:

1. **Use placeholders**: Create simple colored squares as PNGs:

   - 16x16px - `icon16.png`
   - 32x32px - `icon32.png`
   - 48x48px - `icon48.png`
   - 128x128px - `icon128.png`

2. **Create your own**: Use any image editor to create icons with:

   - LinkedIn colors (#0A66C2 blue)
   - Simple "LH" text or a message icon
   - Save in `public/icons/` folder

3. **Use a tool**: Try https://realfavicongenerator.net/ to generate all sizes

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# The extension is now in the 'dist' folder!
```

## 📦 Load in Browser

**Chrome:**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

**Firefox:**

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in `dist` folder

## ✅ Test It

1. Go to LinkedIn.com
2. Open any message or connection request
3. Look for the "💬 Quick Response" button
4. Or press `Ctrl+Shift+L`!

## 🔧 Troubleshooting

If the extension doesn't work:

- Check browser console (F12) for errors
- Make sure TypeScript compiled without errors
- Refresh LinkedIn page after loading extension
- Check that manifest.json is valid

## 🎯 First Use

1. Click extension icon in browser toolbar
2. Click "➕ New" to create your first response
3. Fill in title, content, and tags
4. Save and test on LinkedIn!

The extension works standalone OR with the Flask backend for syncing across devices.
