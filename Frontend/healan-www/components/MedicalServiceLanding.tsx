import Link from 'next/link';
import { BookingCta } from './CtaLinks';

export type MedicalLandingContent = {
  eyebrow: string;
  title: string;
  lead: string;
  introTitle: string;
  intro: string[];
  symptomsTitle: string;
  symptomsLead: string;
  symptoms: string[];
  servicesTitle: string;
  services: { title: string; description: string }[];
  processTitle: string;
  process: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
  relatedHref: string;
  relatedLabel: string;
};

type Props = {
  content: MedicalLandingContent;
  doctorName: string;
  city: string;
  phone: string;
  phoneDisplay: string;
};

export function MedicalServiceLanding({
  content,
  doctorName,
  city,
  phone,
  phoneDisplay,
}: Props) {
  return (
    <main className="medical-landing">
      <section className="medical-hero">
        <div className="container medical-hero__inner">
          <nav className="breadcrumbs" aria-label="مسیر صفحه">
            <Link href="/">خانه</Link><span aria-hidden>←</span><span>{content.eyebrow}</span>
          </nav>
          <span className="section-badge">{content.eyebrow} در {city}</span>
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
          <div className="medical-hero__actions">
            <BookingCta className="btn btn--primary btn--lg" />
            <a className="btn btn--outline btn--lg" href={`tel:${phone}`}>
              تماس با مطب: {phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container medical-copy-grid">
          <article className="medical-copy">
            <h2>{content.introTitle}</h2>
            {content.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
          <aside className="medical-note">
            <strong>نکته مهم</strong>
            <p>اطلاعات این صفحه آموزشی است و جایگزین معاینه و تشخیص پزشک نیست.</p>
            <span>{doctorName} · متخصص قلب و عروق</span>
          </aside>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="section-head">
            <h2>{content.symptomsTitle}</h2>
            <p>{content.symptomsLead}</p>
          </div>
          <ul className="medical-checklist">
            {content.symptoms.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><h2>{content.servicesTitle}</h2></div>
          <div className="medical-card-grid">
            {content.services.map((service) => (
              <article className="medical-card" key={service.title}>
                <h3>{service.title}</h3><p>{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="section-head"><h2>{content.processTitle}</h2></div>
          <ol className="medical-steps">
            {content.process.map((step, index) => (
              <li key={step.title}><span>{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container medical-faq">
          <div className="section-head"><h2>پرسش‌های پرتکرار</h2></div>
          {content.faq.map((item) => (
            <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
          ))}
        </div>
      </section>

      <section className="medical-cta">
        <div className="container medical-cta__inner">
          <div><h2>برای ارزیابی تخصصی آماده‌اید؟</h2><p>برای انتخاب زمان مراجعه، نوبت خود را به‌صورت آنلاین ثبت کنید.</p></div>
          <div className="medical-hero__actions">
            <BookingCta className="btn btn--primary btn--lg" />
            <Link className="btn btn--outline btn--lg" href={content.relatedHref}>{content.relatedLabel}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
