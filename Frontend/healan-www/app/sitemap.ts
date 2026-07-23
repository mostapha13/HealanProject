import type { MetadataRoute } from 'next';
import { fetchBlogList, fetchSite, portalSectionEnabled } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, '');
  const site = await fetchSite();
  const blogEnabled = portalSectionEnabled(site, 'blog');

  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  if (!blogEnabled) {
    return entries;
  }

  entries.push({
    url: `${base}/blog`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  });

  try {
    let page = 1;
    let totalPages = 1;
    do {
      const list = await fetchBlogList(page, 20);
      totalPages = Math.max(1, list.totalPages || 1);
      for (const post of list.items) {
        entries.push({
          url: `${base}/blog/${post.slug}`,
          lastModified: post.publishedAt
            ? new Date(post.publishedAt)
            : post.createdAt
              ? new Date(post.createdAt)
              : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
      page += 1;
    } while (page <= totalPages && page <= 20);
  } catch {
    /* keep static entries */
  }

  return entries;
}
