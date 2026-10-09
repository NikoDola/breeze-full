"use client";

import { useState } from "react";
import Icon from "./Icon";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

/**
 * The live site posts this through a WordPress plugin. With no backend here,
 * the form composes a pre-filled email so a submission still reaches Breeze.
 * Swap `onSubmit` for a real endpoint when one exists.
 */
export default function ServiceRequestForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = [
      `Name: ${data.get("name")}`,
      `Phone: ${data.get("phone")}`,
      `Email: ${data.get("email")}`,
      `Service needed: ${data.get("service")}`,
      "",
      `${data.get("message")}`,
    ].join("\n");

    window.location.href = `${site.emailHref}?subject=${encodeURIComponent(
      "Service request from breezehc.com",
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-4xl border border-slate-100 bg-white shadow-xl shadow-brand-900/5 ${
        compact ? "p-6 sm:p-7" : "p-7 sm:p-9"
      }`}
    >
      <h3 className="text-xl font-extrabold text-ink">Schedule Service</h3>
      <p className="mt-1.5 text-sm text-slate-500">
        Tell us what you need and we&rsquo;ll be in touch before you know it.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" placeholder="Jane Smith" required />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          placeholder="615-555-0100"
          required
        />
        <div className="sm:col-span-2">
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="service"
            className="block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Service needed
          </label>
          <select
            id="service"
            name="service"
            defaultValue=""
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          >
            <option value="" disabled>
              Choose a service…
            </option>
            {services.map((s) => (
              <option key={s.slug} value={s.title}>
                {s.title}
              </option>
            ))}
            <option value="Emergency service">Emergency service</option>
            <option value="Something else">Something else</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="message"
            className="block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            How can we help?
          </label>
          <textarea
            id="message"
            name="message"
            rows={compact ? 3 : 4}
            placeholder="Tell us what's going on with your system…"
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <button
        type="submit"
        className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-flame-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-flame-500/25 transition-transform hover:-translate-y-0.5 hover:bg-flame-600"
      >
        Request service
        <Icon
          name="arrow"
          className="h-5 w-5 transition-transform group-hover:translate-x-1"
        />
      </button>

      {sent && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Icon name="check" className="h-4 w-4" />
          Opening your email app — or just call {site.phone}.
        </p>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        Need someone now? Call{" "}
        <a href={site.phoneHref} className="font-bold text-brand-600">
          {site.phone}
        </a>{" "}
        — a live person answers 24/7.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
