import type { MetadataRoute } from "next";
import { services } from "@/lib/services";

const base = "https://www.breezehc.com";

const staticRoutes = [
  "",
  "/services",
  "/emergency",
  "/promotions",
  "/winter-promotions",
  "/summer-promotions",
  "/about-us",
  "/meet-the-hvac-experts",
  "/why-choose-breeze",
  "/going-green",
  "/careers",
  "/contact-us",
  "/reviews",
  "/gallery",
  "/privacy-policy",
  "/terms-and-conditions",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...services.map((s) => ({
      url: `${base}/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
