import type { ComponentPropsWithoutRef } from "react";

export default function Input({ className = "", ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={`ui-input ${className}`.trim()} {...props} />;
}
