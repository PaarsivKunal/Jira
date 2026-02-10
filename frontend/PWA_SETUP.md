# PWA Setup Guide

## ✅ Completed Setup

The PWA (Progressive Web App) functionality has been successfully configured! Here's what has been implemented:

### Features Implemented:
- ✅ Service Worker with auto-update
- ✅ Web App Manifest
- ✅ Install Prompt Component
- ✅ Offline Support
- ✅ Caching Strategy (NetworkFirst for API, CacheFirst for images)
- ✅ PWA Meta Tags
- ✅ Nginx Configuration for PWA

## 📋 Required Icon Files

You need to create the following icon files in the `frontend/public/` directory:

### Required Icons:
1. **pwa-192x192.png** - 192x192 pixels (for Android)
2. **pwa-512x512.png** - 512x512 pixels (for Android and splash screens)
3. **apple-touch-icon.png** - 180x180 pixels (for iOS)
4. **favicon.ico** - 32x32 pixels (browser favicon)

### Icon Generation Tools:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

### Quick Icon Generation:
If you have a logo image (preferably 512x512 or larger), you can use:

```bash
# Using pwa-asset-generator (if installed globally)
npx pwa-asset-generator public/logo.png public --icon-only --favicon

# Or manually create icons using any image editor
```

## 🚀 Testing PWA

### Development:
1. Run `npm run dev`
2. Open Chrome DevTools > Application tab
3. Check "Service Workers" section
4. Check "Manifest" section

### Production Build:
1. Run `npm run build`
2. The build will generate:
   - `dist/manifest.webmanifest`
   - `dist/sw.js` (service worker)
   - All cached assets

### Testing Install Prompt:
1. Build the app: `npm run build`
2. Serve with a local server (not file://)
3. Open in Chrome/Edge
4. Look for install prompt in address bar or the custom InstallPrompt component

### Testing Offline Mode:
1. Open Chrome DevTools > Network tab
2. Enable "Offline" mode
3. Refresh the page
4. App should show offline.html or cached content

## 📱 Mobile Testing

### Android:
1. Open app in Chrome
2. Tap menu (3 dots) > "Add to Home screen"
3. App will install as PWA

### iOS:
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. App will install as PWA

## 🔧 Configuration

### Manifest Settings (vite.config.js):
- **name**: "Paarsiv - Project Management"
- **short_name**: "Paarsiv"
- **theme_color**: "#0052CC" (matches your brand color)
- **display**: "standalone" (app-like experience)
- **start_url**: "/"

### Caching Strategy:
- **API calls**: NetworkFirst (tries network, falls back to cache)
- **Images**: CacheFirst (uses cache, updates in background)
- **Static assets**: Cached for 1 year

## 🐛 Troubleshooting

### Service Worker Not Registering:
- Ensure you're using HTTPS (or localhost for development)
- Check browser console for errors
- Verify service worker file is accessible

### Install Prompt Not Showing:
- App must meet PWA criteria (HTTPS, manifest, service worker)
- User must not have dismissed it before
- Check if app is already installed

### Icons Not Showing:
- Verify icon files exist in `public/` directory
- Check manifest.json references correct paths
- Clear browser cache and reload

## 📝 Next Steps

1. **Create Icons**: Add the required icon files to `public/` directory
2. **Test Build**: Run `npm run build` and test the production build
3. **Deploy**: Deploy to production with HTTPS enabled
4. **Monitor**: Use Chrome DevTools to monitor service worker activity

## 🔗 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

