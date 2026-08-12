import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tilawah.site';

  const routes = [
    '',
    '/learn',
    '/learn/arabic-letters',
    '/learn/common-words',
    '/learn/harakat',
    '/learn/joining',
    '/learn/makharij',
    '/learn/short-surahs',
    '/learn/tajweed',
    '/recite',
    '/progress',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
