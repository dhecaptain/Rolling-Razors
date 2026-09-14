export interface BusinessConfig {
  name: string;
  legalName: string;
  tagline: string;
  shortTagline: string;
  phone: {
    raw: string; // e.g. 254712345678
    formatted: string; // e.g. 0712 345 678
    international: string; // e.g. +254 712 901 234
    telLink: string;
  };
  whatsapp: {
    number: string;
    link: string;
    defaultMessage: string;
  };
  email: {
    primary: string;
    support: string;
    billing: string;
  };
  mpesa: {
    paybill: string;
    businessNumber: string;
    accountName: string;
    tillNumber?: string;
  };
  location: {
    address: string;
    area: string;
    city: string;
    country: string;
    landmark: string;
    fullAddress: string;
    mapsUrl: string;
    mapsEmbedUrl: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
    summary: string;
  };
  warranty: {
    duration: string;
    description: string;
  };
  socials: {
    facebook: string;
    instagram: string;
    tiktok: string;
    whatsapp: string;
  };
}

export const BUSINESS_CONFIG: BusinessConfig = {
  name: "Rolling Razors Customs",
  legalName: "Rolling Razors Customs Kenya Limited",
  tagline: "Your Vision, Our Craftsmanship.",
  shortTagline: "Kenyan Master Upholsterers & Interior Customization",
  phone: {
    raw: "254795802466",
    formatted: "0795 802 466",
    international: "+254 795 802 466",
    telLink: "tel:+254795802466"
  },
  whatsapp: {
    number: "254795802466",
    link: "https://wa.me/254795802466",
    defaultMessage: "Hello Rolling Razors Customs! I would like to make an inquiry about automotive upholstery and custom seats."
  },
  email: {
    primary: "info@rollingrazors.co.ke",
    support: "support@rollingrazors.co.ke",
    billing: "accounts@rollingrazors.co.ke"
  },
  mpesa: {
    paybill: "400200",
    businessNumber: "400200",
    accountName: "ROLLING-RAZORS",
    tillNumber: "889922"
  },
  location: {
    address: "Enterprise Road / Off Commercial Street",
    area: "Industrial Area",
    city: "Nairobi",
    country: "Kenya",
    landmark: "Close to Mombasa Road & Southern Bypass Interchange",
    fullAddress: "Enterprise Road / Off Commercial Street, Industrial Area, Nairobi, Kenya",
    mapsUrl: "https://maps.google.com/?q=-1.3098,36.8524+(Rolling+Razors+Customs)",
    mapsEmbedUrl: "https://www.google.com/maps?q=-1.3098,36.8524&z=16&hl=en&output=embed",
    coordinates: {
      lat: -1.3098,
      lng: 36.8524
    }
  },
  hours: {
    weekdays: "8:00 AM – 6:00 PM",
    saturday: "8:00 AM – 6:00 PM",
    sunday: "Closed (Special appointments only)",
    summary: "Mon – Sat: 8:00 AM – 6:00 PM (Sunday Closed)"
  },
  warranty: {
    duration: "1 Year",
    description: "1-year warranty on all stitchwork, structural foams, and material seams."
  },
  socials: {
    facebook: "https://facebook.com/rollingrazorskenya",
    instagram: "https://instagram.com/rollingrazorscustoms",
    tiktok: "https://tiktok.com/@rollingrazorscustoms",
    whatsapp: "https://wa.me/254795802466"
  }
};
