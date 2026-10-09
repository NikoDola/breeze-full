import data from "@/content/site.json";

// The editable source of truth lives in content/site.json (managed via /admin).
// Derived fields (tel:/mailto: links, formatted address, maps URL) are computed
// here so the client only ever edits the raw phone / email / address.

const digits = data.phone.replace(/\D/g, "");
const phoneDigits = digits.length === 10 ? `+1${digits}` : `+${digits}`;
const addressLine = `${data.address.street}, ${data.address.city}, ${data.address.state} ${data.address.zip}`;

export type Social = { platform: string; label: string; href: string };

export const site = {
  name: data.name,
  fullName: data.fullName,
  legalName: data.legalName,
  tagline: data.tagline,
  serviceArea: data.serviceArea,
  phone: data.phone,
  phoneHref: `tel:${phoneDigits}`,
  email: data.email,
  emailHref: `mailto:${data.email}`,
  address: data.address,
  addressLine,
  mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    addressLine
  )}`,
  owner: data.owner,
  socials: (data.socials ?? []) as Social[],
};

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "HVAC",
    href: "/services",
    children: [
      { label: "Heating", href: "/heating" },
      { label: "Cooling", href: "/cooling" },
      { label: "Repairs & Services", href: "/repairs-and-services" },
      { label: "Indoor quality", href: "/indoor-quality" },
      { label: "Water heater solutions", href: "/water-heater-solutions" },
      { label: "Mini-split systems", href: "/mini-split-systems" },
      { label: "Energy audits", href: "/energy-audits" },
      { label: "Commercial & Industrial", href: "/commercial-industrial" },
      { label: "Residential", href: "/residential" },
      { label: "Property manager", href: "/property-manager" },
      { label: "Comfort club", href: "/comfort-club" },
      { label: "Financing", href: "/financing" },
      {
        label: "Wi-Fi and Learning Thermostats",
        href: "/wi-fi-and-learning-thermostats",
      },
      { label: "Promotions", href: "/promotions" },
    ],
  },
  { label: "Emergency", href: "/emergency" },
  {
    label: "Client",
    href: "/reviews",
    children: [
      { label: "Reviews", href: "/reviews" },
      { label: "Gallery", href: "/gallery" },
      { label: "Promotions", href: "/promotions" },
    ],
  },
  {
    label: "About us",
    href: "/about-us",
    children: [
      { label: "About us", href: "/about-us" },
      { label: "Meet the HVAC experts", href: "/meet-the-hvac-experts" },
      { label: "Why Choose Breeze", href: "/why-choose-breeze" },
      { label: "Going green", href: "/going-green" },
      { label: "Careers", href: "/careers" },
      { label: "Contact us", href: "/contact-us" },
    ],
  },
];
