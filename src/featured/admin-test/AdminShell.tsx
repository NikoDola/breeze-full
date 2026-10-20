"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { pages, type PageId } from "../../../cms/shared/contract";
import css from "./shell.module.css";
import { contentDefinitions, type ContentPageId } from "../../../cms/shared/content";

type NavigationItem = { type: "page"; id: PageId } | { type: "group"; label: string; icon: "wrench" | "users" | "breeze" | "scales"; ids: readonly PageId[] };
const navigationItems: readonly NavigationItem[] = [
  { type: "page", id: "home" },
  { type: "group", label: "HVAC", icon: "wrench", ids: ["services", ...(Object.keys(contentDefinitions) as ContentPageId[]).filter(id => contentDefinitions[id].group === "HVAC")] },
  { type: "page", id: "promotions" },
  { type: "page", id: "emergency" },
  { type: "group", label: "Client", icon: "users", ids: ["reviews", "gallery"] },
  { type: "group", label: "About us", icon: "breeze", ids: ["about-us", "meet-the-hvac-experts", "contact-us", "why-choose-breeze", "going-green", "careers"] },
  { type: "page", id: "global" },
  { type: "group", label: "Legal", icon: "scales", ids: ["privacy-policy", "terms-and-conditions"] },
];

function SupportContact() {
  return <div className={css.supportContact} aria-label="Admin support contact">
    <p>For any questions, you can reach out on</p>
    <a href="mailto:nikodola@gmail.com"><Icon name="mail" /><span><span className={css.contactLabel}>Email</span>nikodola@gmail.com</span></a>
    <a href="tel:+38974222858"><Icon name="phone" /><span><span className={css.contactLabel}>Phone number</span>+389 74 222 858</span></a>
  </div>;
}

export default function AdminShell({ pageId, onPageChange, onLeave, disabled, children, proofEnabled = false }: {
  pageId: PageId;
  onPageChange: (pageId: PageId) => boolean;
  onLeave: () => boolean;
  disabled: boolean;
  children: React.ReactNode;
  proofEnabled?: boolean;
}) {
  const drawer = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>(() => navigationItems.flatMap(item => item.type === "group" && item.ids.some(id => id === pageId) ? [item.label] : []));

  async function signOut() {
    if (disabled || signingOut || !onLeave()) return;
    setSigningOut(true); setSignOutError("");
    try {
      const response = await fetch("/api/cms/session", { method: "DELETE", credentials: "same-origin",
        headers: { "x-cms-request": "editor" }, cache: "no-store" });
      if (!response.ok) throw new Error("Sign-out failed.");
      window.location.replace("/admin-test/login");
    } catch { setSignOutError("Could not sign out. Please try again."); setSigningOut(false); }
  }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => { if (desktop.matches) drawer.current?.close(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    return () => { window.document.body.style.overflow = previous; };
  }, [menuOpen]);

  function selectPage(next: PageId) {
    if (disabled) return;
    if (next === pageId || onPageChange(next)) drawer.current?.close();
  }

  function pageNavigation() {
    const query = search.trim().toLowerCase();
    const matches = (id: PageId) => pages[id].label.toLowerCase().includes(query) || (id === "promotions" && ("coupons".includes(query) || "offers".includes(query)));
    const groupMatches = (group: Extract<NavigationItem, { type: "group" }>) => group.label.toLowerCase().includes(query) || group.ids.some(matches);
    const pageButton = (id: PageId) => <button type="button" key={id} className={css.navItem}
      aria-current={pageId === id ? "page" : undefined} disabled={disabled}
      onClick={() => selectPage(id)}><Icon name={id === "home" ? "home" : id === "reviews" ? "star" : id === "global" ? "grid" : contentDefinitions[id as ContentPageId]?.icon ?? "image"} /><span>{pages[id].label}</span></button>;
    return <nav className={css.navigation} aria-label="Admin pages">
      <label className={css.searchLabel}>Find a page<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search pages" /></label>
      {navigationItems.map(item => {
        if (item.type === "page") return matches(item.id) ? pageButton(item.id) : null;
        const group = item;
        const ids = group.ids.filter(id => matches(id) || group.label.toLowerCase().includes(query));
        return ids.length > 0 && <details className={css.navGroup} key={group.label} open={Boolean(query) || openGroups.includes(group.label)} onToggle={event => {
          if (query) return;
          const nextOpen = event.currentTarget.open;
          setOpenGroups(current => nextOpen ? current.includes(group.label) ? current : [...current, group.label] : current.filter(label => label !== group.label));
        }}>
          <summary>
            {group.icon === "breeze" ? <span className={css.breezeIcon} aria-hidden="true" /> : <Icon name={group.icon} />}
            <span>{group.label}</span>
          </summary>
          <div className={css.groupItems}>{ids.map(pageButton)}</div>
        </details>;
      })}
      {proofEnabled && matches("cms-proof") && <div className={css.navGroup}>{pageButton("cms-proof")}</div>}
      {query && !navigationItems.some(item => item.type === "page" ? matches(item.id) : groupMatches(item)) && <p className={css.noResults}>No matching pages.</p>}
    </nav>;
  }

  return <div className={css.shell}>
    <aside className={css.sidebar} aria-label="Administration sidebar">
      <div className={css.sidebarHeading}>Administration</div>
      {pageNavigation()}
      <SupportContact />
    </aside>
    <div className={css.main}>
      <header className={css.topbar}>
        <a href="/" target="_blank" rel="noopener noreferrer" className={css.leaveLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m10 5-7 7 7 7M3 12h18" strokeLinecap="round" strokeLinejoin="round" /></svg>
          View website
        </a>
        <div className={css.accountActions}>
        <button type="button" className={css.signOut} disabled={disabled || signingOut} onClick={() => void signOut()}>{signingOut ? "Signing out…" : "Sign out"}</button>
        <button type="button" className={css.menuButton} ref={menuButton}
          aria-label="Open admin navigation" aria-controls="admin-mobile-navigation" aria-expanded={menuOpen}
          onClick={() => { drawer.current?.showModal(); setMenuOpen(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
        </button>
        </div>
      </header>
      {signOutError && <p className={css.signOutError} role="alert">{signOutError}</p>}
      <main id="main" className={css.content}>{children}</main>
    </div>
    <dialog id="admin-mobile-navigation" ref={drawer} className={css.drawer} aria-labelledby="admin-navigation-title"
      onClose={() => { setMenuOpen(false); menuButton.current?.focus(); }}
      onClick={event => {
        // Native dialog backdrops report the dialog as their click target.
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
        }
      }}>
      <div className={css.drawerHeading}><h2 id="admin-navigation-title">Administration</h2>
        <button type="button" className={css.closeButton} aria-label="Close admin navigation" onClick={() => drawer.current?.close()}><Icon name="x" /></button>
      </div>
      {pageNavigation()}
      <SupportContact />
    </dialog>
  </div>;
}
