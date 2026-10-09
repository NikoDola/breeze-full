"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
   Types — mirror content/site.json and content/promotions.json
--------------------------------------------------------------------------- */

type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type Social = { platform: string; label: string; href: string };

type SiteContent = {
  name: string;
  fullName: string;
  legalName: string;
  tagline: string;
  serviceArea: string;
  phone: string;
  email: string;
  owner: string;
  address: Address;
  socials: Social[];
};

type Promo = {
  slug: string;
  title: string;
  tagline: string;
  offer: string;
  code: string;
  image: string;
  icon: string;
  blurb: string;
  otherHref: string;
  otherLabel: string;
  metaDescription: string;
};

type Promotions = { items: Promo[] };

const PW_KEY = "breeze-admin-pw";

const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "x",
  "youtube",
  "linkedin",
  "tiktok",
  "yelp",
  "google",
  "link",
];

const PROMO_ICONS = [
  "flame",
  "snowflake",
  "tag",
  "bolt",
  "star",
  "drop",
  "wrench",
  "leaf",
  "shield",
  "check",
];

/* ---------------------------------------------------------------------------
   Small presentational helpers
--------------------------------------------------------------------------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-extrabold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Login gate
--------------------------------------------------------------------------- */

function Login({
  onSubmit,
  error,
  busy,
}: {
  onSubmit: (pw: string) => void;
  error: string | null;
  busy: boolean;
}) {
  const [pw, setPw] = useState("");
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="rounded-4xl border border-slate-100 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-extrabold text-ink">Content admin</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the admin password to edit site content.
        </p>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(pw);
          }}
        >
          <Field label="Password" type="password" value={pw} onChange={setPw} />
          {error && (
            <p className="mt-3 text-sm font-semibold text-flame-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Main editor
--------------------------------------------------------------------------- */

type Tab = "company" | "social" | "promotions";

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [site, setSite] = useState<SiteContent | null>(null);
  const [promotions, setPromotions] = useState<Promotions | null>(null);

  const [tab, setTab] = useState<Tab>("company");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async (pw: string) => {
    setBusy(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-password": pw },
        cache: "no-store",
      });
      if (res.status === 401) {
        setLoginError("Wrong password.");
        sessionStorage.removeItem(PW_KEY);
        return;
      }
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const data = await res.json();
      setSite(data.site);
      setPromotions(data.promotions);
      setPassword(pw);
      setAuthed(true);
      sessionStorage.setItem(PW_KEY, pw);
    } catch (err) {
      setLoginError(String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  // Restore a session password on refresh.
  useEffect(() => {
    const stored = sessionStorage.getItem(PW_KEY);
    if (stored) load(stored);
  }, [load]);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    window.setTimeout(() => setToast(null), 3500);
  };

  const save = async () => {
    if (!password || !site || !promotions) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ site, promotions }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      showToast(true, "Saved. Refresh the site to see changes.");
    } catch (err) {
      showToast(false, String(err));
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(PW_KEY);
    setAuthed(false);
    setPassword(null);
    setSite(null);
    setPromotions(null);
  };

  if (!authed || !site || !promotions) {
    return <Login onSubmit={load} error={loginError} busy={busy} />;
  }

  /* -- site helpers -- */
  const setSiteField = <K extends keyof SiteContent>(
    key: K,
    value: SiteContent[K]
  ) => setSite({ ...site, [key]: value });

  const setAddress = (key: keyof Address, value: string) =>
    setSite({ ...site, address: { ...site.address, [key]: value } });

  const setSocial = (i: number, key: keyof Social, value: string) => {
    const socials = site.socials.map((s, idx) =>
      idx === i ? { ...s, [key]: value } : s
    );
    setSite({ ...site, socials });
  };
  const addSocial = () =>
    setSite({
      ...site,
      socials: [
        ...site.socials,
        { platform: "facebook", label: "Facebook", href: "https://" },
      ],
    });
  const removeSocial = (i: number) =>
    setSite({ ...site, socials: site.socials.filter((_, idx) => idx !== i) });

  /* -- promo helpers -- */
  const setPromo = (i: number, key: keyof Promo, value: string) => {
    const items = promotions.items.map((p, idx) =>
      idx === i ? { ...p, [key]: value } : p
    );
    setPromotions({ items });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-ink">Content admin</span>
            <span className="hidden rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 sm:inline">
              {site.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-ink"
            >
              View site ↗
            </a>
            <button
              onClick={logout}
              className="rounded-full px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-ink"
            >
              Log out
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-flame-500 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-flame-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="mx-auto flex max-w-4xl gap-1 px-5 pb-1">
          {(
            [
              ["company", "Company info"],
              ["social", "Social links"],
              ["promotions", "Promotions & coupons"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-t-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                tab === id
                  ? "bg-slate-50 text-brand-700"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg ${
            toast.ok ? "bg-brand-600" : "bg-flame-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-4xl px-5 py-8">
        {tab === "company" && (
          <div className="space-y-6">
            <Card title="Business details">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Business name"
                  value={site.name}
                  onChange={(v) => setSiteField("name", v)}
                />
                <Field
                  label="Full name"
                  value={site.fullName}
                  onChange={(v) => setSiteField("fullName", v)}
                />
                <Field
                  label="Legal name"
                  value={site.legalName}
                  onChange={(v) => setSiteField("legalName", v)}
                />
                <Field
                  label="Owner"
                  value={site.owner}
                  onChange={(v) => setSiteField("owner", v)}
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Tagline"
                    value={site.tagline}
                    onChange={(v) => setSiteField("tagline", v)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Field
                    label="Service area line"
                    value={site.serviceArea}
                    onChange={(v) => setSiteField("serviceArea", v)}
                  />
                </div>
              </div>
            </Card>

            <Card title="Contact">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Phone"
                  value={site.phone}
                  onChange={(v) => setSiteField("phone", v)}
                  placeholder="615-523-9898"
                />
                <Field
                  label="Email"
                  value={site.email}
                  onChange={(v) => setSiteField("email", v)}
                  placeholder="you@example.com"
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Click-to-call and mailto links update automatically from these.
              </p>
            </Card>

            <Card title="Address">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Street"
                    value={site.address.street}
                    onChange={(v) => setAddress("street", v)}
                  />
                </div>
                <Field
                  label="City"
                  value={site.address.city}
                  onChange={(v) => setAddress("city", v)}
                />
                <Field
                  label="State"
                  value={site.address.state}
                  onChange={(v) => setAddress("state", v)}
                />
                <Field
                  label="ZIP"
                  value={site.address.zip}
                  onChange={(v) => setAddress("zip", v)}
                />
                <Field
                  label="Country"
                  value={site.address.country}
                  onChange={(v) => setAddress("country", v)}
                />
              </div>
            </Card>
          </div>
        )}

        {tab === "social" && (
          <Card
            title="Social media links"
            action={
              <button
                onClick={addSocial}
                className="rounded-full bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100"
              >
                + Add link
              </button>
            }
          >
            {site.socials.length === 0 && (
              <p className="text-sm text-slate-400">
                No social links yet. Add one above.
              </p>
            )}
            <div className="space-y-4">
              {site.socials.map((s, i) => (
                <div
                  key={i}
                  className="grid items-end gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-[160px_1fr_1fr_auto]"
                >
                  <Select
                    label="Platform"
                    value={s.platform}
                    onChange={(v) => setSocial(i, "platform", v)}
                    options={SOCIAL_PLATFORMS}
                  />
                  <Field
                    label="Label"
                    value={s.label}
                    onChange={(v) => setSocial(i, "label", v)}
                  />
                  <Field
                    label="URL"
                    value={s.href}
                    onChange={(v) => setSocial(i, "href", v)}
                  />
                  <button
                    onClick={() => removeSocial(i)}
                    className="mb-0.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-flame-600 transition-colors hover:bg-flame-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "promotions" && (
          <div className="space-y-6">
            {promotions.items.map((p, i) => (
              <Card key={p.slug} title={p.title || p.slug}>
                <div className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Title"
                      value={p.title}
                      onChange={(v) => setPromo(i, "title", v)}
                    />
                    <Field
                      label="Tagline"
                      value={p.tagline}
                      onChange={(v) => setPromo(i, "tagline", v)}
                    />
                    <Field
                      label="Offer (big text)"
                      value={p.offer}
                      onChange={(v) => setPromo(i, "offer", v)}
                    />
                    <Field
                      label="Coupon code"
                      value={p.code}
                      onChange={(v) => setPromo(i, "code", v)}
                    />
                    <Select
                      label="Icon"
                      value={p.icon}
                      onChange={(v) => setPromo(i, "icon", v)}
                      options={PROMO_ICONS}
                    />
                    <Field
                      label="Button label"
                      value={p.otherLabel}
                      onChange={(v) => setPromo(i, "otherLabel", v)}
                    />
                    <Field
                      label="Button link"
                      value={p.otherHref}
                      onChange={(v) => setPromo(i, "otherHref", v)}
                    />
                  </div>
                  <TextArea
                    label="Description"
                    value={p.blurb}
                    rows={4}
                    onChange={(v) => setPromo(i, "blurb", v)}
                  />
                  <TextArea
                    label="Search description (SEO)"
                    value={p.metaDescription}
                    rows={2}
                    onChange={(v) => setPromo(i, "metaDescription", v)}
                  />
                  <ImageField
                    password={password!}
                    value={p.image}
                    onChange={(v) => setPromo(i, "image", v)}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Image field with upload
--------------------------------------------------------------------------- */

function ImageField({
  value,
  onChange,
  password,
}: {
  value: string;
  onChange: (v: string) => void;
  password: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      onChange(data.path);
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
        Image
      </span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt=""
          className="h-24 w-36 shrink-0 rounded-xl border border-slate-200 object-cover"
        />
        <div className="flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload new image"}
            </button>
            {error && (
              <span className="text-xs font-semibold text-flame-600">
                {error}
              </span>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
