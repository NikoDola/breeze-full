"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { homeSectionRegistry, homeSlotOrder, type HomeSlot } from "../../../cms/shared/home";
import Input from "@/components/ui/Input";
import css from "./section-select.module.css";

const options = homeSlotOrder.map((value, index) => ({ value, label: `${index + 1}. ${homeSectionRegistry[value].label}` }));

export default function HomeSectionSelect({ value, onChange, disabled }: { value: HomeSlot; onChange: (value: HomeSlot) => void; disabled: boolean }) {
  const id = useId(), input = useRef<HTMLInputElement>(null), container = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [query, setQuery] = useState<string | null>(null), [active, setActive] = useState(0);
  const selected = options.find(option => option.value === value)!;
  const filtered = query === null ? options : options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()));
  const activeOption = filtered[active];
  const optionId = (slot: HomeSlot) => `${id}-${slot}`;

  function show() {
    if (disabled) return;
    setOpen(true); setQuery(null); setActive(options.findIndex(option => option.value === value));
  }
  function close() { setOpen(false); setQuery(null); }
  function choose(slot: HomeSlot) {
    if (disabled) return;
    onChange(slot); close();
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive(!open ? options.findIndex(option => option.value === value) : filtered.length ? (active + step + filtered.length) % filtered.length : 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && activeOption) choose(activeOption.value);
      else if (!open) show();
    } else if (event.key === "Escape" && open) {
      event.preventDefault(); event.stopPropagation(); close(); input.current?.select();
    }
  }

  return <div className={css.field} ref={container} onBlur={event => {
    if (!container.current?.contains(event.relatedTarget)) close();
  }}>
    <label className={css.label} htmlFor={id}>Select Section</label>
    <div className={css.control}>
      <Input ref={input} id={id} className={css.input} role="combobox" autoComplete="off" disabled={disabled}
        aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-options` : undefined}
        aria-activedescendant={open && activeOption ? optionId(activeOption.value) : undefined}
        value={query ?? selected.label} placeholder="Search sections…"
        onFocus={event => { show(); event.target.select(); }} onClick={() => { if (!open) show(); }}
        onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }} onKeyDown={keyDown} />
      <button type="button" className={css.toggle} tabIndex={-1} aria-label={open ? "Close sections" : "Show sections"}
        aria-expanded={open} disabled={disabled} onMouseDown={event => event.preventDefault()}
        onClick={() => { if (open) close(); else { input.current?.focus(); show(); } }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
    </div>
    {open && <div className={css.dropdown}>
      <ul id={`${id}-options`} className={css.options} role="listbox" aria-label="Sections">
        {filtered.map((option, index) => <li key={option.value} id={optionId(option.value)} role="option"
          aria-selected={option.value === value} className={`${css.option} ${index === active ? css.active : ""}`}
          onPointerDown={event => event.preventDefault()} onMouseDown={event => event.preventDefault()}
          onPointerMove={() => setActive(index)} onClick={() => choose(option.value)}>{option.label}</li>)}
      </ul>
      {!filtered.length && <p className={css.empty} role="status">No sections found.</p>}
    </div>}
  </div>;
}
