import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
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
      // Cache Quran text data
      urlPattern: /\/data\/.*\.json$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'quran-data-cache',
      },
    },
    {
      // Cache pages
      urlPattern: /^https:\/\/(www\.)?tilawah\.site\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
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
