import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import {
  fetchBlogPost,
  fetchSite,
  portalSectionEnabled,
  portalSetting,
} from '@/lib/api';
import {
  buildBlogPostingJsonLd,
  buildMetadata,
  doctorFromSettings,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [site, post] = await Promise.all([fetchSite(), fetchBlogPost(slug)]);
  if (!portalSectionEnabled(site, 'blog') || !post) {
    return {
      ...buildMetadata({
        site,
        path: '/blog',
        titleFallback: !post ? 'مطلب یافت نشد' : 'بلاگ غیرفعال است',
        overrides: {
          title: !post ? 'مطلب یافت نشد' : 'بلاگ غیرفعال است',
        },
      }),
      robots: 'noindex,follow',
    };
  }
  return buildMetadata({
    site,
    path: `/blog/${slug}`,
    titleFallback: post.title,
    descriptionFallback: post.excerpt || undefined,
    ogImageFallback: post.coverImageUrl || undefined,
    overrides: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      ogImageUrl: post.ogImageUrl || post.coverImageUrl || undefined,
    },
  });
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [site, post] = await Promise.all([fetchSite(), fetchBlogPost(slug)]);
  const doctor = doctorFromSettings(site);
  const topbar = portalSetting(site, 'site.topbar', 'مطب تخصصی قلب و عروق · شوشتر');
  const blogEnabled = portalSectionEnabled(site, 'blog');

  if (!blogEnabled || !post) notFound();

  const jsonLd = buildBlogPostingJsonLd(site, post);

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader
        brandName={doctor.shortName}
        specialty={doctor.specialty}
        phone={doctor.phone}
        phoneDisplay={doctor.phoneDisplay}
        topbar={topbar}
      />
      <article className="article">
        <div className="container">
          <Link href="/blog" className="article__back">
            ← بازگشت به لیست بلاگ
          </Link>
          {post.coverImageUrl ? (
            <div className="article__cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImageUrl} alt={post.title} />
            </div>
          ) : null}
          <header className="article__header">
            <time>{formatDate(post.publishedAt || post.createdAt)}</time>
            <h1>{post.title}</h1>
            {post.excerpt ? (
              <p className="article__excerpt">{post.excerpt}</p>
            ) : null}
          </header>
          <div
            className="article__content"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </div>
      </article>
      <SiteFooter
        name={doctor.name}
        specialty={doctor.specialty}
        city={doctor.city}
      />
    </>
  );
}
