import type { ComponentPropsWithRef } from "react";

export default function Input({ className = "", ...props }: ComponentPropsWithRef<"input">) {
  return <input className={`ui-input ${className}`.trim()} {...props} />;
}
