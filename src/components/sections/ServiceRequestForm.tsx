"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

export default function TemplateServiceForm({ compact = false }: { compact?: boolean }) {
  const [prepared, setPrepared] = useState(false);

  useEffect(() => {
    function selectService(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("[data-service]");
      const select = document.querySelector<HTMLSelectElement>("#service");
      if (link?.dataset.service && select) select.value = link.dataset.service;
    }
    document.addEventListener("click", selectService);
    return () => document.removeEventListener("click", selectService);
  }, []);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = [
      `Name: ${data.get("name")}`,
      `Phone: ${data.get("phone")}`,
      `Email: ${data.get("email")}`,
      `Service needed: ${data.get("service")}`,
      `SMS contact permission: ${data.get("sms_consent") === "yes" ? "Yes, for service request and appointment updates" : "No"}`,
      "",
      "Details:",
      data.get("message") || "No additional details provided.",
    ].join("\n");
    window.location.href = `${site.emailHref}?subject=${encodeURIComponent("Service request from Breeze website")}&body=${encodeURIComponent(body)}`;
    setPrepared(true);
  }

  return <form className={`contact-form${compact ? " contact-form-compact" : ""}`} id="service-form" onSubmit={onSubmit}>
    <h3>Request service</h3>
    <p className="form-intro">A few details and we&rsquo;ll be on our way.</p>
    <div className="form-grid">
      <div className="field"><label htmlFor="name">Your name <span>*</span></label><Input id="name" name="name" type="text" autoComplete="name" placeholder="Jane Smith" required /></div>
      <div className="field"><label htmlFor="phone">Phone number <span>*</span></label><Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="(615) 555-0100" required /></div>
      <div className="field"><label htmlFor="email">Email address <span>*</span></label><Input id="email" name="email" type="email" autoComplete="email" placeholder="jane@example.com" required /></div>
      <div className="field"><label htmlFor="service">Service needed <span>*</span></label><Select id="service" name="service" defaultValue="" required>
        <option value="" disabled>Select a service</option>
        {services.map((service) => <option key={service.slug} value={service.title}>{service.title}</option>)}
        <option value="Emergency service">Emergency service</option><option value="Other">Other</option>
      </Select></div>
      <div className="field field-wide"><label htmlFor="message">Tell us more <small>(optional)</small></label><Textarea id="message" name="message" rows={compact ? 3 : 4} placeholder="What is going on with your system?" /></div>
    </div>
    <div className="sms-consent"><Input id="sms-consent" name="sms_consent" type="checkbox" value="yes" /><label htmlFor="sms-consent">Yes, Breeze Heating &amp; Cooling may text me at the phone number above about my service request and appointment updates. This is optional. Message and data rates may apply. Reply STOP to opt out.</label></div>
    <Button className="button orange submit-button" type="submit">Prepare service request <span aria-hidden="true">↗</span></Button>
    <p className="form-note">Your email app will open with the request ready to send. See our <Link href="/privacy-policy">Privacy Policy</Link>.</p>
    {prepared && <p className="form-status" role="status" aria-live="polite">Your email app is opening. Please send the prepared message to complete your request. You can also call {site.phone}.</p>}
  </form>;
}
