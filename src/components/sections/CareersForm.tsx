"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import SelectControl from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
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
      className="careers-form-form-1"
    >
      <h2 className="careers-form-heading-1">
        Please fill out our online form for employment
      </h2>

      <div className="careers-form-layout-1">
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

        <div className="careers-form-block-1">
          <label
            htmlFor="additional"
            className="careers-form-label-1"
          >
            Anything additional you would like us to know about you?
          </label>
          <Textarea
            id="additional"
            name="additional"
            rows={4}
            className="careers-form-textarea-1"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="careers-form-button-1"
      >
        Submit application
        <Icon
          name="arrow"
          className="careers-form-icon-1"
        />
      </Button>

      {sent && (
        <p className="careers-form-copy-1">
          <Icon name="check" className="careers-form-icon-2" />
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
        className="careers-form-label-2"
      >
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        className="careers-form-input-1"
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
        className="careers-form-label-3"
      >
        {label}
      </label>
      <SelectControl
        id={name}
        name={name}
        defaultValue=""
        className="careers-form-select-1"
      >
        <option value="" disabled>
          Choose…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </SelectControl>
    </div>
  );
}
