import React from 'react';
import { PageHeader } from '../components/Ui';

interface PlaceholderPageProps {
  title: string;
  sprint?: string;
}

export function PlaceholderPage({ title, sprint = 'اسپرینت بعدی' }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} subtitle={`این بخش در ${sprint} تکمیل می‌شود.`} />
      <div className="healan-card">
        <div className="healan-card__body healan-empty">
          <p>🚧 در حال توسعه</p>
        </div>
      </div>
    </>
  );
}

export default PlaceholderPage;
