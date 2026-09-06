/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview, setUserProperties, trackEvent } from '@/lib/analytics/ga';

function TrackRouteChanges() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Detect if launching from installed standalone PWA vs browser tab
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator && Boolean((window.navigator as any).standalone)));

    setUserProperties({
      app_platform: isStandalone ? 'pwa_installed' : 'browser_tab',
    });

    // 2. Track new future installs via browser appinstalled event
    const handleAppInstalled = () => {
      trackEvent('pwa_install_success', 'PWA', 'App Installed', {
        app_platform: 'pwa_installed',
      });
      setUserProperties({
        app_platform: 'pwa_installed',
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const q = searchParams ? searchParams.toString() : '';
    const url = q ? (pathname + '?' + q) : pathname;
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <TrackRouteChanges />
    </Suspense>
  );
}
