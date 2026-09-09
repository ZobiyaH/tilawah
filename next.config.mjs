import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // NEVER cache API requests (transcribe, version, session, etc.) so Vercel logs and live endpoints work immediately
      urlPattern: /^https?:\/\/.*\/api\/.*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'api-cache',
      },
    },
    {
      // Cache Qari audio files for offline use
      urlPattern: /^https:\/\/(cdn\.islamic\.network|audio\.qurancdn\.com)\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'qari-audio-cache',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Cache Google Analytics and Tag Manager scripts for offline execution
      urlPattern: /^https:\/\/(www\.googletagmanager\.com|www\.google-analytics\.com)\/(gtag\/js|analytics\.js|gtm\.js).*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-analytics-scripts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Cache Quran text data
      urlPattern: /\/data\/.*\.json$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'quran-data-cache',
      },
    },
    {
      // Always fetch pages from network first with rapid fallback, ensuring live deployment updates
      urlPattern: /^https:\/\/(www\.)?tilawah\.site\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 2,
        expiration: {
          maxEntries: 50,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);
