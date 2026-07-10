import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { PortalBlogChrome } from '../../components/PortalBlogChrome';
import { fetchBlogPostBySlug, portalSectionEnabled } from '../../api/portalApi';
import type { BlogPostDetail } from '../../api/portalApi';
import { usePortalSite } from '../../hooks/usePortalSite';

export function BlogPostPage() {
  const { slug = '' } = useParams();
  const { site, loading: siteLoading } = usePortalSite();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const blogEnabled = portalSectionEnabled(site, 'blog');

  useEffect(() => {
    if (!slug || siteLoading || !blogEnabled) {
      if (!siteLoading) setLoading(false);
      return;
    }

    setLoading(true);
    void fetchBlogPostBySlug(slug)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug, siteLoading, blogEnabled]);

  if (!siteLoading && !blogEnabled) {
    return (
      <PortalBlogChrome>
        <div className="portal-container portal-blog-page">
          <div className="portal-blog-empty">بخش بلاگ در حال حاضر غیرفعال است.</div>
        </div>
      </PortalBlogChrome>
    );
  }

  return (
    <PortalBlogChrome title="بازگشت به بلاگ">
      <article className="portal-blog-article">
        <div className="portal-container">
          <Link to="/blog" className="portal-blog-back">← بازگشت به لیست بلاگ</Link>

          {loading ? (
            <div className="portal-blog-empty">در حال بارگذاری...</div>
          ) : !post ? (
            <div className="portal-blog-empty">مطلب یافت نشد.</div>
          ) : (
            <>
              {post.coverImageUrl ? (
                <div className="portal-blog-article__cover">
                  <img src={post.coverImageUrl} alt={post.title} />
                </div>
              ) : null}
              <header className="portal-blog-article__header">
                <time>{convertDateAndTimeToJalali(post.publishedAt ?? post.createdAt)}</time>
                <h1>{post.title}</h1>
                {post.excerpt ? <p className="portal-blog-article__excerpt">{post.excerpt}</p> : null}
              </header>
              <div
                className="portal-blog-article__content"
                dangerouslySetInnerHTML={{ __html: post.body }}
              />
            </>
          )}
        </div>
      </article>
    </PortalBlogChrome>
  );
}

export default BlogPostPage;
