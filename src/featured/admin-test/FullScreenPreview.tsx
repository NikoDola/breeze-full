"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import styles from "./full-screen-preview.module.css";

export default function FullScreenPreview({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousOverflow = window.document.body.style.overflow;
    const previousFocus = window.document.activeElement;
    element.showModal();
    window.document.body.style.overflow = "hidden";
    return () => {
      element.close();
      window.document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="full-screen-preview-title" onClose={event => { if (!event.currentTarget.open) onClose(); }}>
    <header className={styles.header}>
      <h2 id="full-screen-preview-title"><Icon name="eye" />Preview</h2>
      <button type="button" className={styles.closeButton} onClick={() => dialog.current?.close()}>
        <Icon name="x" />Cancel preview
      </button>
    </header>
    <div className={styles.content}>{children}</div>
  </dialog>;
}
