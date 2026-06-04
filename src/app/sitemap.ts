import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const staticRoutes = ['', '/login', '/signup', '/features', '/pricing', '/blog'];
  const blogSlugs = [
    'how-to-create-gst-invoice-freelancers-india-guide',
    'cgst-vs-sgst-vs-igst-freelancers-guide',
    'gst-registration-freelancers-need-it'
  ];

  const staticSitemaps = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const blogSitemaps = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticSitemaps, ...blogSitemaps];
}
