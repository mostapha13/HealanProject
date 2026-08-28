import { fetchBlogList } from '@/lib/api';
import { cardiologyArticles, varicoseArticles } from '@/lib/medical-articles';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

function xml(value: string): string {
  return value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] || char);
}

export async function GET() {
  const base = SITE_URL.replace(/\/$/, '');
  const staticItems = [
    ...Object.entries(cardiologyArticles).map(([slug, item]) => ({ ...item, url: `${base}/cardiology/${slug}` })),
    ...Object.entries(varicoseArticles).map(([slug, item]) => ({ ...item, url: `${base}/varicose-veins/${slug}` })),
  ];
  const blog = await fetchBlogList(1, 20);
  const blogItems = blog.items.map((item) => ({ title: item.title, description: item.excerpt || item.metaDescription || '', url: `${base}/blog/${item.slug}`, date: item.publishedAt || item.createdAt }));
  const items = [
    ...staticItems.map((item) => `<item><title>${xml(item.title)}</title><link>${xml(item.url)}</link><guid isPermaLink="true">${xml(item.url)}</guid><description>${xml(item.description)}</description><pubDate>${new Date('2026-08-28T00:00:00+03:30').toUTCString()}</pubDate></item>`),
    ...blogItems.map((item) => `<item><title>${xml(item.title)}</title><link>${xml(item.url)}</link><guid isPermaLink="true">${xml(item.url)}</guid><description>${xml(item.description)}</description>${item.date ? `<pubDate>${new Date(item.date).toUTCString()}</pubDate>` : ''}</item>`),
  ].join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>راهنمای قلب، عروق و واریس دکتر شهرویی</title><link>${xml(base)}</link><description>مطالب آموزشی قلب و عروق و واریس</description><language>fa-ir</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
