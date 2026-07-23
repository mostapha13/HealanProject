'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PaginatedReviews, PatientReviewPublic } from '@/lib/api';
import { ReviewForm } from './ReviewForm';

const PAGE_SIZE = 6;

type Props = {
  title: string;
  subtitle: string;
};

function publicApiBase(): string {
  return (process.env.NEXT_PUBLIC_HEALAN_API_URL || '/Healan/api/v1/').replace(
    /\/?$/,
    '/'
  );
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

async function loadPage(page: number): Promise<PaginatedReviews> {
  const qs = new URLSearchParams({
    pageNumber: String(page),
    pageSize: String(PAGE_SIZE),
  });
  const res = await fetch(`${publicApiBase()}PortalPublic/ReviewList?${qs}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`ReviewList ${res.status}`);
  return (await res.json()) as PaginatedReviews;
}

export function ReviewsSection({ title, subtitle }: Props) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PatientReviewPublic[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(false);
    try {
      const data = await loadPage(pageNumber);
      setItems(data.items ?? []);
      setPageCount(data.pageCount ?? data.totalPages ?? 0);
      setPage(data.pageNumber || pageNumber);
    } catch {
      setError(true);
      setItems([]);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(1);
  }, [refresh]);

  return (
    <section id="reviews" className="section section--muted">
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="reviews-layout">
          <div className="reviews-layout__form">
            <ReviewForm />
          </div>

          <div className="reviews-layout__list">
            <h3 className="reviews-layout__list-title">نظرات تأیید‌شده</h3>

            {loading ? (
              <p className="empty">در حال بارگذاری نظرات...</p>
            ) : error ? (
              <p className="empty">
                بارگذاری نظرات ممکن نشد. کمی بعد دوباره تلاش کنید.
              </p>
            ) : items.length === 0 ? (
              <p className="empty">هنوز نظری ثبت نشده است.</p>
            ) : (
              <>
                <div className="reviews reviews--stack">
                  {items.map((review) => (
                    <article key={review.patientReviewId} className="review">
                      <div className="review__head">
                        <div>
                          <strong>{review.displayName}</strong>
                          {(review.reviewedAt || review.createdAt) && (
                            <time className="review__date">
                              {formatDate(review.reviewedAt || review.createdAt)}
                            </time>
                          )}
                        </div>
                        <span
                          className="review__stars"
                          aria-label={`امتیاز ${review.rating} از ۵`}
                        >
                          {'★'.repeat(Math.max(0, Math.min(5, review.rating)))}
                          {'☆'.repeat(Math.max(0, 5 - review.rating))}
                        </span>
                      </div>
                      <p>{review.reviewText}</p>
                    </article>
                  ))}
                </div>

                {pageCount > 1 ? (
                  <div className="pager reviews__pager">
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      disabled={page <= 1 || loading}
                      onClick={() => void refresh(page - 1)}
                    >
                      قبلی
                    </button>
                    <span>
                      صفحه {page} از {pageCount}
                    </span>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      disabled={page >= pageCount || loading}
                      onClick={() => void refresh(page + 1)}
                    >
                      بعدی
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
