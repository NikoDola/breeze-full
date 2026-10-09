"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import Icon from "./Icon";
import { nav, site } from "@/lib/site";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50">
      {/* Utility bar — the live site's "Proudly serving…" strip */}
      <div className="hidden bg-ink text-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-2 text-xs lg:px-8">
          <p className="font-medium tracking-wide text-white/70">
            {site.serviceArea}
          </p>
          <div className="flex items-center gap-5">
            <a
              href={site.emailHref}
              className="flex items-center gap-1.5 font-medium text-white/70 transition-colors hover:text-white"
            >
              <Icon name="mail" className="h-3.5 w-3.5" />
              {site.email}
            </a>
            <a
              href={site.phoneHref}
              className="flex items-center gap-1.5 font-bold text-flame-400 transition-colors hover:text-flame-300"
            >
              <Icon name="phone" className="h-3.5 w-3.5" />
              Call us now! {site.phone}
            </a>
          </div>
        </div>
      </div>

      <div
        className={`border-b transition-all duration-300 ${
          scrolled
            ? "border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-md"
            : "border-transparent bg-white"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) =>
              item.children ? (
                <div key={item.label} className="group relative">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive(item.href)
                        ? "text-brand-600"
                        : "text-slate-600 hover:text-brand-600"
                    }`}
                  >
                    {item.label}
                    <Icon
                      name="chevron"
                      className="h-3.5 w-3.5 transition-transform group-hover:rotate-180"
                    />
                  </Link>

                  <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/10">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                            pathname === child.href
                              ? "bg-brand-50 text-brand-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-brand-600"
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? "text-brand-600"
                      : "text-slate-600 hover:text-brand-600"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <Link
              href="/contact-us"
              className="rounded-full bg-flame-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-flame-500/25 transition-transform hover:-translate-y-0.5 hover:bg-flame-600"
            >
              Schedule Service
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="h-6 w-6"
            >
              {open ? (
                <path d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-3">
            {nav.map((item) =>
              item.children ? (
                <div key={item.label} className="border-b border-slate-100 py-1">
                  <button
                    onClick={() =>
                      setOpenGroup((g) => (g === item.label ? null : item.label))
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-bold text-ink"
                    aria-expanded={openGroup === item.label}
                  >
                    {item.label}
                    <Icon
                      name="chevron"
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        openGroup === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openGroup === item.label && (
                    <div className="pb-2 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-slate-100 px-3 py-4 text-base font-bold text-ink hover:text-brand-600"
                >
                  {item.label}
                </Link>
              ),
            )}

            <div className="mt-4 flex flex-col gap-2 pb-2">
              <a
                href={site.phoneHref}
                className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 font-bold text-ink"
              >
                <Icon name="phone" className="h-4 w-4 text-brand-600" />
                {site.phone}
              </a>
              <Link
                href="/contact-us"
                className="rounded-full bg-flame-500 px-5 py-3 text-center font-bold text-white"
              >
                Schedule Service
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
