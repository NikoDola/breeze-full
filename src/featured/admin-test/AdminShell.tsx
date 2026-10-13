"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { pages, type PageId } from "../../../cms/shared/contract";
import css from "./shell.module.css";

// Extend this navigation as new admin features are introduced.
const navigation = [
  { label: "Pages", items: [{ pageId: "home", icon: "home" }] },
  { label: "Tools", items: [{ pageId: "cms-proof", icon: "grid" }] },
] as const;

export default function AdminShell({ pageId, onPageChange, onLeave, disabled, children }: {
  pageId: PageId;
  onPageChange: (pageId: PageId) => boolean;
  onLeave: () => boolean;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const drawer = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    return <nav className={css.navigation} aria-label="Admin pages">
      {navigation.map(group => <div className={css.navGroup} key={group.label}>
        <p className={css.groupLabel}>{group.label}</p>
        {group.items.map(item => <button type="button" key={item.pageId} className={css.navItem}
          aria-current={pageId === item.pageId ? "page" : undefined} disabled={disabled}
          onClick={() => selectPage(item.pageId)}>
          <Icon name={item.icon} /><span>{pages[item.pageId].label}</span>
        </button>)}
      </div>)}
    </nav>;
  }

  return <div className={css.shell}>
    <aside className={css.sidebar} aria-label="Administration sidebar">
      <div className={css.sidebarHeading}>Administration</div>
      {pageNavigation()}
    </aside>
    <div className={css.main}>
      <header className={css.topbar}>
        <a href="/" className={css.leaveLink} aria-disabled={disabled || undefined}
          onClick={event => { if (disabled || !onLeave()) event.preventDefault(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m10 5-7 7 7 7M3 12h18" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Leave admin
        </a>
        <button type="button" className={css.menuButton} ref={menuButton}
          aria-label="Open admin navigation" aria-controls="admin-mobile-navigation" aria-expanded={menuOpen}
          onClick={() => { drawer.current?.showModal(); setMenuOpen(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
        </button>
      </header>
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
    </dialog>
  </div>;
}
