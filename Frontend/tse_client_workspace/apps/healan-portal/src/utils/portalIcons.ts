import React from 'react';
import {
  IconClock,
  IconEcg,
  IconGraduation,
  IconHeart,
  IconHospital,
  IconLocation,
  IconLogin,
  IconPhone,
  IconShield,
  IconStethoscope,
} from '../components/Icons';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  IconClock,
  IconEcg,
  IconGraduation,
  IconHeart,
  IconHospital,
  IconLocation,
  IconLogin,
  IconPhone,
  IconShield,
  IconStethoscope,
};

export function resolvePortalIcon(name?: string, fallback: React.ComponentType<{ className?: string }> = IconHeart) {
  if (!name) return fallback;
  return ICON_MAP[name] ?? fallback;
}
