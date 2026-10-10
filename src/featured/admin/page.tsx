"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
   Types — mirror src/content/site.json and src/content/promotions.json
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
    <label className="admin-label-1">
      <span className="admin-text-1">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input-1"
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
    <label className="admin-label-2">
      <span className="admin-text-2">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="admin-textarea-1"
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
    <label className="admin-label-3">
      <span className="admin-text-3">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-select-1"
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
    <section className="admin-section-1">
      <div className="admin-layout-1">
        <h2 className="admin-heading-1">{title}</h2>
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
    <div className="admin-layout-2">
      <div className="admin-card-1">
        <h1 className="admin-heading-2">Content admin</h1>
        <p className="admin-copy-1">
          Enter the admin password to edit site content.
        </p>
        <form
          className="admin-form-1"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(pw);
          }}
        >
          <Field label="Password" type="password" value={pw} onChange={setPw} />
          {error && (
            <p className="admin-copy-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="admin-button-1"
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
    <div className="admin-block-1">
      {/* Sticky action bar */}
      <div className="admin-block-2">
        <div className="admin-layout-3">
          <div className="admin-layout-4">
            <span className="admin-text-4">Content admin</span>
            <span className="admin-badge-1">
              {site.name}
            </span>
          </div>
          <div className="admin-layout-5">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-button-2"
            >
              View site ↗
            </a>
            <button
              onClick={logout}
              className="admin-button-3"
            >
              Log out
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="admin-button-4"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="admin-layout-6">
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
              className={`admin-button-5 ${
                tab === id
                  ? "admin-button-5-state-1-active"
                  : "admin-button-5-state-1-inactive"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div
          className={`admin-card-2 ${
            toast.ok ? "admin-card-2-state-1-active" : "admin-card-2-state-1-inactive"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="admin-block-3">
        {tab === "company" && (
          <div className="admin-block-4">
            <Card title="Business details">
              <div className="admin-layout-7">
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
                <div className="admin-block-5">
                  <Field
                    label="Tagline"
                    value={site.tagline}
                    onChange={(v) => setSiteField("tagline", v)}
                  />
                </div>
                <div className="admin-block-6">
                  <Field
                    label="Service area line"
                    value={site.serviceArea}
                    onChange={(v) => setSiteField("serviceArea", v)}
                  />
                </div>
              </div>
            </Card>

            <Card title="Contact">
              <div className="admin-layout-8">
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
              <p className="admin-copy-3">
                Click-to-call and mailto links update automatically from these.
              </p>
            </Card>

            <Card title="Address">
              <div className="admin-layout-9">
                <div className="admin-block-7">
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
                className="admin-button-6"
              >
                + Add link
              </button>
            }
          >
            {site.socials.length === 0 && (
              <p className="admin-copy-4">
                No social links yet. Add one above.
              </p>
            )}
            <div className="admin-block-8">
              {site.socials.map((s, i) => (
                <div
                  key={i}
                  className="admin-layout-10"
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
                    className="admin-button-7"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "promotions" && (
          <div className="admin-block-9">
            {promotions.items.map((p, i) => (
              <Card key={p.slug} title={p.title || p.slug}>
                <div className="admin-layout-11">
                  <div className="admin-layout-12">
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
      <span className="admin-text-5">
        Image
      </span>
      <div className="admin-layout-13">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt=""
          className="admin-image-1"
        />
        <div className="admin-layout-14">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="admin-input-2"
          />
          <div className="admin-layout-15">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="admin-button-8"
            >
              {uploading ? "Uploading…" : "Upload new image"}
            </button>
            {error && (
              <span className="admin-text-6">
                {error}
              </span>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="admin-input-3"
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
