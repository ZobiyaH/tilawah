'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '@/lib/analytics/ga';

function TrackRouteChanges() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
