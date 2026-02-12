// PWA utility functions
// Note: Service Worker registration is handled by vite-plugin-pwa automatically

export const isPWAInstalled = () => {
  // Check if running as standalone (installed PWA)
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

export const isOnline = () => {
  return navigator.onLine;
};

export const getInstallPrompt = () => {
  return window.deferredPrompt;
};

export const clearInstallPrompt = () => {
  window.deferredPrompt = null;
};

// Check for service worker updates
export const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return registration;
    } catch (error) {
      console.error('Service Worker update check failed:', error);
      return null;
    }
  }
  return null;
};

// Listen for service worker updates
export const listenForUpdates = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New service worker activated, reload page
      window.location.reload();
    });
  }
};

