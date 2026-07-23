import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchPortalSite } from '../api/portal';
import type { PortalHeroSlide } from '../api/portal';
import type { PortalSiteContent } from './types';

const EMPTY: PortalSiteContent = {
  services: [],
  about: {
    badge: 'درباره پزشک',
    title: 'پزشکی دقیق، همراهی صمیمانه',
    p1: '',
    p2: '',
    quote: '',
    doctorName: 'دکتر معصومه شهرویی',
    specialty: 'فوق تخصص قلب و عروق',
    board: 'فارغ التحصیل و دارای بورد تخصصی از بیمارستان فوق تخصصی شهید رجایی تهران',
  },
  contact: {
    title: 'تماس و آدرس مطب',
    lead: '',
    address: '',
    city: 'شوشتر',
    phone: '',
    phoneDisplay: '',
    hours: '',
  },
  map: {
    header: '',
    building: '',
    detail: '',
    link: 'https://www.google.com/maps/search/Shushtar+Taleghani',
  },
};

type SiteContextValue = {
  loading: boolean;
  slides: PortalHeroSlide[];
  content: PortalSiteContent;
  refresh: () => Promise<void>;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<PortalHeroSlide[]>([]);
  const [content, setContent] = useState<PortalSiteContent>(EMPTY);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPortalSite();
      setSlides(data.slides);
      setContent(data.content);
    } catch {
      // keep last good / defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ loading, slides, content, refresh }),
    [loading, slides, content, refresh]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
