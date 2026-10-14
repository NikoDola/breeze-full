"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import css from "./service-navigation.module.css";

type ServiceLink = { slug: string; title: string; icon: string };

export default function ServiceNavigation({ services }: { services: ServiceLink[] }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 761px)");
    const closeOnDesktop = () => { if (desktop.matches) dialog.current?.close(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  function links(mobile = false) {
    return <nav className={mobile ? css.mobileLinks : css.links} aria-label="Other HVAC services">
      {services.map(service => <Link key={service.slug} href={`/${service.slug}`} className={css.link}
        onClick={mobile ? () => dialog.current?.close() : undefined}>
        <span className={css.icon}><Icon name={service.icon} /></span>
        <span>{service.title}</span>
      </Link>)}
    </nav>;
  }

  return <div className={css.navigation}>
    <div className={css.desktop}>
      <h2>Other services</h2>
      {links()}
    </div>
    <button type="button" ref={trigger} className={css.trigger} aria-controls={id} aria-expanded={open}
      onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
      <Icon name="grid" />Show all services<span aria-hidden="true">+</span>
    </button>
    <dialog id={id} ref={dialog} className={css.dialog} aria-labelledby={`${id}-title`}
      onClose={() => { setOpen(false); if (trigger.current?.offsetParent) trigger.current.focus(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
      }}>
      <div className={css.dialogHeader}>
        <h2 id={`${id}-title`}>Other services</h2>
        <button type="button" aria-label="Close services" onClick={() => dialog.current?.close()}><Icon name="x" /></button>
      </div>
      {links(true)}
    </dialog>
  </div>;
}
