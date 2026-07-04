import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="healan-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

export function StatCard({ label, value, icon, color = '#0d9488' }: StatCardProps) {
  return (
    <div className="healan-stat-card">
      <div className="healan-stat-card__icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="healan-stat-card__label">{label}</div>
      <div className="healan-stat-card__value">{value}</div>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  label: string;
  color: string;
}

export function StatusBadge({ label, color }: StatusBadgeProps) {
  return (
    <span className="healan-badge" style={{ background: `${color}18`, color }}>
      {label}
    </span>
  );
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('fa-IR').format(n);
}
