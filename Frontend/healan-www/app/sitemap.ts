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
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/about-doctor`,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${base}/cardiology`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${base}/varicose-veins`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${base}/editorial-policy`,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    ...[
      '/cardiology/chest-pain',
      '/cardiology/palpitations',
      '/varicose-veins/symptoms',
      '/varicose-veins/treatment',
    ].map((path) => ({
      url: `${base}${path}`,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ];

  if (!blogEnabled) {
    return entries;
  }

  entries.push({
    url: `${base}/blog`,
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
          lastModified: post.lastModifiedAt
            ? new Date(post.lastModifiedAt)
            : post.publishedAt
              ? new Date(post.publishedAt)
              : post.createdAt
                ? new Date(post.createdAt)
                : undefined,
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
