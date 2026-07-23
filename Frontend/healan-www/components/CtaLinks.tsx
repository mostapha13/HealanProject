'use client';

import type { ReactNode } from 'react';

type Props = {
  className?: string;
  children?: ReactNode;
};

export function BookingCta({ className, children }: Props) {
  return (
    <a href="/booking" className={className}>
      {children ?? 'رزرو نوبت'}
    </a>
  );
}

export function PatientCta({ className, children }: Props) {
  return (
    <a href="/patient" className={className}>
      {children ?? 'ورود بیمار'}
    </a>
  );
}
