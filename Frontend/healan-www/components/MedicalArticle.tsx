import Link from 'next/link';
import { BookingCta } from './CtaLinks';

export type MedicalArticleContent = {
  title: string;
  description: string;
  parentHref: string;
  parentLabel: string;
  intro: string;
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  faq: { question: string; answer: string }[];
};

export function MedicalArticle({ content }: { content: MedicalArticleContent }) {
  return (
    <main className="article-page">
      <div className="container article-page__grid">
        <article className="article-body">
          <nav className="breadcrumbs" aria-label="مسیر صفحه">
            <Link href="/">خانه</Link><span>←</span><Link href={content.parentHref}>{content.parentLabel}</Link><span>←</span><span>راهنمای پزشکی</span>
          </nav>
          <header className="article-header">
            <span className="section-badge">راهنمای پزشکی</span>
            <h1>{content.title}</h1>
            <p>{content.intro}</p>
          </header>
          <div className="medical-warning"><strong>توجه:</strong> این مطلب برای آگاهی عمومی است و تشخیص قطعی فقط با ارزیابی پزشک امکان‌پذیر است.</div>
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
          <section className="article-faq">
            <h2>پرسش‌های پرتکرار</h2>
            {content.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </section>
        </article>
        <aside className="article-sidebar">
          <div><strong>نیاز به بررسی تخصصی دارید؟</strong><p>برای ارزیابی علائم و انتخاب مسیر مناسب، نوبت مراجعه ثبت کنید.</p><BookingCta className="btn btn--primary">رزرو نوبت</BookingCta></div>
          <Link href={content.parentHref}>مشاهده صفحه {content.parentLabel} ←</Link>
        </aside>
      </div>
    </main>
  );
}
