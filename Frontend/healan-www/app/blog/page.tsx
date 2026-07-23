import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { fetchBlogList, fetchSite, portalSectionEnabled } from '@/lib/api';
import { buildMetadata, doctorFromSettings } from '@/lib/seo';
import { portalSetting } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<{ page?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSite();
  const enabled = portalSectionEnabled(site, 'blog');
  const meta = buildMetadata({
    site,
    path: '/blog',
    titleFallback: 'بلاگ سلامت قلب',
    descriptionFallback: 'مطالب آموزشی و توصیه‌های تخصصی قلب و عروق',
  });
  if (!enabled) {
    return { ...meta, robots: 'noindex,follow' };
  }
  return meta;
}

function formatDate(value?: string) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function BlogListPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const page = Math.max(1, Number(params.page) || 1);
  const [site, list] = await Promise.all([fetchSite(), fetchBlogList(page, 9)]);
  const doctor = doctorFromSettings(site);
  const topbar = portalSetting(site, 'site.topbar', 'مطب تخصصی قلب و عروق · شوشتر');
  const blogEnabled = portalSectionEnabled(site, 'blog');

  return (
    <>
      <SiteHeader
        brandName={doctor.shortName}
        specialty={doctor.specialty}
        phone={doctor.phone}
        phoneDisplay={doctor.phoneDisplay}
        topbar={topbar}
      />
      <section className="blog-page">
        <div className="container">
          <div className="blog-page__header">
            <h1>بلاگ سلامت قلب</h1>
            <p>مطالب آموزشی و توصیه‌های تخصصی</p>
          </div>

          {!blogEnabled ? (
            <p className="empty">بخش بلاگ در حال حاضر غیرفعال است.</p>
          ) : list.items.length === 0 ? (
            <p className="empty">مطلبی منتشر نشده است.</p>
          ) : (
            <>
              <div className="blog-grid">
                {list.items.map((post) => (
                  <Link
                    key={post.blogPostId}
                    href={`/blog/${post.slug}`}
                    className="blog-card"
                  >
                    <div className="blog-card__cover">
                      {post.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.coverImageUrl} alt={post.title} />
                      ) : null}
                    </div>
                    <div className="blog-card__body">
                      <time>{formatDate(post.publishedAt || post.createdAt)}</time>
                      <h2>{post.title}</h2>
                      {post.excerpt ? <p>{post.excerpt}</p> : null}
                    </div>
                  </Link>
                ))}
              </div>
              {(list.hasPreviousPage || list.hasNextPage) && (
                <div className="pager">
                  {list.hasPreviousPage ? (
                    <Link
                      className="btn btn--outline btn--sm"
                      href={`/blog?page=${page - 1}`}
                    >
                      قبلی
                    </Link>
                  ) : null}
                  <span>
                    صفحه {list.pageNumber} از {list.totalPages || 1}
                  </span>
                  {list.hasNextPage ? (
                    <Link
                      className="btn btn--outline btn--sm"
                      href={`/blog?page=${page + 1}`}
                    >
                      بعدی
                    </Link>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <SiteFooter
        name={doctor.name}
        specialty={doctor.specialty}
        city={doctor.city}
      />
    </>
  );
}
