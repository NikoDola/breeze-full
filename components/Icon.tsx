type IconProps = {
  name: string;
  className?: string;
};

const paths: Record<string, React.ReactNode> = {
  snowflake: (
    <>
      <path d="M12 2v20M4.93 5.64l14.14 14.14M2 12h20M4.93 18.36 19.07 4.22" />
      <path d="m9 4 3 2 3-2M9 20l3-2 3 2M4 9l2 3-2 3M20 9l-2 3 2 3" />
    </>
  ),
  flame: (
    <path d="M12 2c1 3-1.5 4.5-1.5 7A3.5 3.5 0 0 0 14 12c.8 0 1.4-.3 2-.8-.1 2.5-1.3 4-1.3 5.3a3.7 3.7 0 1 1-7.4 0C7.3 12.5 12 10 9.5 4.5 11 5 12 3.5 12 2Z" />
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.7-.7-.7-2.7 2.4-2.2Z" />
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 16-9 0 8-4 13-9 13Z" />
      <path d="M4 21c2-6 6-9 12-11" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M7 16v3M17 16v3M7 8h.01M11 8h.01M7 12h6" />
    </>
  ),
  drop: (
    <path d="M12 2.5S5.5 9.5 5.5 14a6.5 6.5 0 0 0 13 0C18.5 9.5 12 2.5 12 2.5Z" />
  ),
  gauge: (
    <>
      <path d="M4 18a9 9 0 1 1 16 0" />
      <path d="m12 14 4-4" />
      <circle cx="12" cy="15" r="1.5" />
    </>
  ),
  building: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16" />
      <path d="M14 9h3a2 2 0 0 1 2 2v10" />
      <path d="M8 7h2M8 11h2M8 15h2" />
    </>
  ),
  keys: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="m11 11 8 8-2 2-1.5-1.5M17 17l1.5-1.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.4 7.5 9.5 4.4-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 9a15 15 0 0 1 19 0" />
      <path d="M6 12.5a10 10 0 0 1 12 0" />
      <path d="M9.5 16a5 5 0 0 1 5 0" />
      <path d="M12 19.5h.01" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  phone: (
    <path d="M6.5 3h3l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 4.5 5a2 2 0 0 1 2-2Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  star: (
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
  ),
  quote: (
    <path d="M9 6c-3 1.2-5 3.9-5 7.5V18h6v-6H6.2c.2-1.9 1.3-3.4 2.8-4.2L9 6Zm11 0c-3 1.2-5 3.9-5 7.5V18h6v-6h-3.8c.2-1.9 1.3-3.4 2.8-4.2L20 6Z" />
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.8c2.1.6 3.5 2.5 3.5 5.2" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12h18" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 18 5-5 4 4 3-2.5 4 3.5" />
    </>
  ),
  link: (
    <>
      <path d="M9 15 15 9" />
      <path d="M11 7.5 12.5 6a3.5 3.5 0 0 1 5 5L16 12.5" />
      <path d="M13 16.5 11.5 18a3.5 3.5 0 0 1-5-5L8 11.5" />
    </>
  ),
  facebook: (
    <path d="M14 8h2.5V5H14a3 3 0 0 0-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V8a1 1 0 0 1 1-1" />
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M16.6 7.4h.01" />
    </>
  ),
  x: <path d="M5 5l14 14M19 5 5 19" />,
  twitter: <path d="M5 5l14 14M19 5 5 19" />,
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="m10.2 9.3 4.6 2.7-4.6 2.7Z" />
    </>
  ),
  linkedin: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 11v6M8 7.6h.01M12 17v-3.2a2 2 0 0 1 4 0V17" />
    </>
  ),
  tiktok: (
    <path d="M14.5 4c.4 2.2 1.9 3.6 4 3.8M14.5 4v9.8a3.3 3.3 0 1 1-3.3-3.3c.4 0 .7 0 1 .1" />
  ),
  yelp: (
    <>
      <path d="M12 4v6.5" />
      <path d="M17 8.5 12.5 11" />
      <path d="M17.5 16 13 14" />
      <path d="M9 18.5 11 14" />
      <path d="M6 12.5 11 12" />
    </>
  ),
  google: (
    <>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20.5 4.5v4h-4" />
    </>
  ),
};

export default function Icon({ name, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? null}
    </svg>
  );
}
