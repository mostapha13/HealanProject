import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination } from 'antd';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { PortalBlogChrome } from '../../components/PortalBlogChrome';
import { fetchBlogPosts, portalSectionEnabled } from '../../api/portalApi';
import type { BlogPostSummary } from '../../api/portalApi';
import { usePortalSite } from '../../hooks/usePortalSite';

const PAGE_SIZE = 6;

export function BlogListPage() {
  const { site, loading: siteLoading } = usePortalSite();
  const [items, setItems] = useState<BlogPostSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');

  const blogEnabled = portalSectionEnabled(site, 'blog');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchBlogPosts({
        filterText: filterText || undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch {
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!siteLoading && blogEnabled) {
      void load();
    } else if (!siteLoading) {
      setLoading(false);
    }
  }, [page, siteLoading, blogEnabled]);

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
    <PortalBlogChrome>
      <section className="portal-blog-page">
        <div className="portal-container">
          <div className="portal-blog-page__header">
            <h1>بلاگ سلامت قلب</h1>
            <p>مطالب آموزشی و توصیه‌های تخصصی</p>
          </div>

          <div className="portal-blog-search">
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="جستجو در مطالب..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  void load();
                }
              }}
            />
            <button type="button" className="p-btn p-btn--primary p-btn--sm" onClick={() => { setPage(1); void load(); }}>
              جستجو
            </button>
          </div>

          {loading ? (
            <div className="portal-blog-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="portal-blog-empty">مطلبی منتشر نشده است.</div>
          ) : (
            <div className="portal-blog-grid">
              {items.map((item) => (
                <article key={item.blogPostId} className="portal-blog-card">
                  {item.coverImageUrl ? (
                    <Link to={`/blog/${item.slug}`} className="portal-blog-card__image">
                      <img src={item.coverImageUrl} alt={item.title} loading="lazy" />
                    </Link>
                  ) : null}
                  <div className="portal-blog-card__body">
                    <time>{convertDateAndTimeToJalali(item.publishedAt ?? item.createdAt)}</time>
                    <h2>
                      <Link to={`/blog/${item.slug}`}>{item.title}</Link>
                    </h2>
                    {item.excerpt ? <p>{item.excerpt}</p> : null}
                    <Link to={`/blog/${item.slug}`} className="portal-blog-card__more">
                      ادامه مطلب
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalCount > PAGE_SIZE && (
            <div className="portal-blog-pagination">
              <Pagination current={page} pageSize={PAGE_SIZE} total={totalCount} onChange={setPage} showSizeChanger={false} />
            </div>
          )}
        </div>
      </section>
    </PortalBlogChrome>
  );
}

export default BlogListPage;
