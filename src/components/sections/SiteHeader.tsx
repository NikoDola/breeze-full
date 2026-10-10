"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";

const hvacLinks = [
  ["Heating", "/heating"], ["Cooling", "/cooling"],
  ["Repairs & Services", "/repairs-and-services"], ["Indoor quality", "/indoor-quality"],
  ["Water heater solutions", "/water-heater-solutions"], ["Mini-split systems", "/mini-split-systems"],
  ["Energy audits", "/energy-audits"], ["Commercial & Industrial", "/commercial-industrial"],
  ["Residential", "/residential"], ["Property manager", "/property-manager"],
  ["Comfort club", "/comfort-club"], ["Financing", "/financing"],
  ["Wi-Fi and Learning Thermostats", "/wi-fi-and-learning-thermostats"],
] as const;

const aboutLinks = [
  ["Meet the HVAC experts", "/meet-the-hvac-experts"], ["Contact us", "/contact-us"],
  ["Why Choose Breeze", "/why-choose-breeze"], ["Going green", "/going-green"],
  ["Careers", "/careers"],
] as const;

export default function TemplateHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<"hvac" | "about" | null>(null);

  useEffect(() => { setMenuOpen(false); setOpenSubmenu(null); }, [pathname]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") closeMenu(); }
    function onClick(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest(".site-header")) closeMenu();
    }
    function onResize() { if (window.innerWidth > 930) closeMenu(); }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function closeMenu() { setMenuOpen(false); setOpenSubmenu(null); }

  function submenu(key: "hvac" | "about", label: string, href: string, links: readonly (readonly [string, string])[]) {
    const expanded = openSubmenu === key;
    return <li
      className={`has-submenu${expanded ? " is-open" : ""}`}
      onPointerEnter={(event) => { if (event.pointerType === "mouse" && window.innerWidth > 930) setOpenSubmenu(key); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse" && window.innerWidth > 930) setOpenSubmenu(null); }}
    >
      <div className="nav-parent">
        <Link className={`nav-link${pathname === href ? " current" : ""}`} href={href} onClick={closeMenu}>{label}</Link>
        <button className="submenu-toggle" type="button" aria-label={`Toggle ${label} submenu`} aria-controls={`${key}-submenu`} aria-expanded={expanded} onClick={() => setOpenSubmenu(expanded ? null : key)}><span aria-hidden="true">⌄</span></button>
      </div>
      <ul className={`submenu${key === "about" ? " submenu-about" : ""}`} id={`${key}-submenu`}>
        {links.map(([name, route]) => <li key={route}><Link href={route} onClick={closeMenu}>{name}</Link></li>)}
      </ul>
    </li>;
  }

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header" id="top">
      <div className="header-topbar">
        <nav className="header-secondary-nav wrap" aria-label="Quick contact">
          <span className="header-tagline">1st Class Service With A Smile. <span className="header-tagline-smile" aria-hidden="true">☺</span></span>
          <a className="header-call" href={site.phoneHref} aria-label={`Call Breeze at ${site.phone}`}>
            <span className="call-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" focusable="false"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01z" /></svg></span>
            <span className="call-text">{site.phone}</span>
          </a>
        </nav>
      </div>
      <div className="header-inner wrap">
        <Link className="brand" href="/" aria-label="Breeze Heating and Cooling home" onClick={closeMenu}>
          <img src="/template-2/breeze-logo-light.svg" alt="Breeze Heating & Cooling" width="211" height="41" />
        </Link>
        <nav className={`site-nav${menuOpen ? " is-open" : ""}`} id="site-nav" aria-label="Main navigation">
          <ul className="nav-list">
            {submenu("hvac", "HVAC", "/services", hvacLinks)}
            <li><Link className={`nav-link${pathname === "/promotions" ? " current" : ""}`} href="/promotions" onClick={closeMenu}>Promotions</Link></li>
            <li><Link className={`nav-link${pathname === "/emergency" ? " current" : ""}`} href="/emergency" onClick={closeMenu}>Emergency</Link></li>
            <li><Link className={`nav-link${pathname === "/reviews" ? " current" : ""}`} href="/reviews" onClick={closeMenu}>Client</Link></li>
            {submenu("about", "About us", "/about-us", aboutLinks)}
          </ul>
        </nav>
        <div className="header-actions">
          <Link className="header-request" href={pathname === "/" ? "#contact" : "/contact-us#service-form"} onClick={closeMenu}>Request service <span aria-hidden="true">↗</span></Link>
          <button className="menu-toggle" type="button" aria-controls="site-nav" aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => { setMenuOpen(!menuOpen); if (menuOpen) setOpenSubmenu(null); }}><span /><span /><span /></button>
        </div>
      </div>
    </header>
  </>;
}
