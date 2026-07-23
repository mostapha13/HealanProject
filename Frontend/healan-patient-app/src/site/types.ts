export type PortalServiceItem = {
  id: number;
  title: string;
  subtitle?: string;
  body?: string;
  iconName?: string;
  color?: string;
  imageUrl?: string;
  sortOrder: number;
};

export type PortalSiteContent = {
  services: PortalServiceItem[];
  about: {
    badge: string;
    title: string;
    p1: string;
    p2: string;
    quote: string;
    doctorName: string;
    specialty: string;
    board: string;
  };
  contact: {
    title: string;
    lead: string;
    address: string;
    city: string;
    phone: string;
    phoneDisplay: string;
    hours: string;
  };
  map: {
    header: string;
    building: string;
    detail: string;
    link: string;
  };
};
