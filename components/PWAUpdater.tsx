'use client';
import { useEffect } from 'react';

export function PWAUpdater() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAppVersion = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const currentVersion = localStorage.getItem('tilawah_app_version');
          if (currentVersion && currentVersion !== data.version) {
            console.log('[PWAUpdater] New deployment detected:', data.version, 'Old:', currentVersion);
            localStorage.setItem('tilawah_app_version', data.version);
            
            // Purge old service worker caches and unregister old worker for clean auto-update
            if ('caches' in window) {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
            if ('serviceWorker' in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
            }
            window.location.reload();
            return;
          }
          if (!currentVersion) {
            localStorage.setItem('tilawah_app_version', data.version);
          }
        }
      } catch (err) {
        console.warn('[PWAUpdater] Version check error:', err);
      }
    };

    checkAppVersion();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAppVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) reg.update().catch(() => {});
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return null;
}
