"use client";

import { useState } from "react";
import Icon from "./Icon";
import { site } from "@/lib/site";

const expertise = ["HVAC", "ELECTRICAL", "OTHER"];
const experience = ["Less than 1", "1-3 years", "3-5 years", "5+ years"];

/** Mirrors the fields on breezehc.com/careers. Submits via a pre-filled email. */
export default function CareersForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = [
      `Name: ${d.get("name")}`,
      `Phone: ${d.get("phone")}`,
      `Email: ${d.get("email")}`,
      `Address: ${d.get("address")}`,
      `Field of expertise: ${d.get("expertise")}`,
      `Years of experience: ${d.get("experience")}`,
      "",
      `Additional: ${d.get("additional")}`,
    ].join("\n");

    window.location.href = `${site.emailHref}?subject=${encodeURIComponent(
      "Employment application from breezehc.com",
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-4xl border border-slate-100 bg-white p-7 shadow-xl shadow-brand-900/5 sm:p-9"
    >
      <h2 className="text-xl font-extrabold text-ink">
        Please fill out our online form for employment
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Text label="Your name" name="name" required />
        <Text label="Your phone" name="phone" type="tel" required />
        <Text label="Your email" name="email" type="email" required />
        <Text label="Your address" name="address" />

        <Select label="Field of expertise" name="expertise" options={expertise} />
        <Select
          label="Years of experience"
          name="experience"
          options={experience}
        />

        <div className="sm:col-span-2">
          <label
            htmlFor="additional"
            className="block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Anything additional you would like us to know about you?
          </label>
          <textarea
            id="additional"
            name="additional"
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <button
        type="submit"
        className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-flame-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-flame-500/25 transition-transform hover:-translate-y-0.5 hover:bg-flame-600"
      >
        Submit application
        <Icon
          name="arrow"
          className="h-5 w-5 transition-transform group-hover:translate-x-1"
        />
      </button>

      {sent && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Icon name="check" className="h-4 w-4" />
          Opening your email app — or call {site.phone}.
        </p>
      )}
    </form>
  );
}

function Text({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
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
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue=""
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      >
        <option value="" disabled>
          Choose…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
