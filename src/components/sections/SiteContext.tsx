"use client";

import { createContext, useContext } from "react";
import { site, type SiteData } from "@/lib/site";

const SiteContext = createContext<SiteData>(site);
export const useSite = () => useContext(SiteContext);
export default function SiteProvider({ value, children }: { value: SiteData; children: React.ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
