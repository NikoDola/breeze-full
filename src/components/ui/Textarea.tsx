import type { ComponentPropsWithoutRef } from "react";

export default function Textarea({ className = "", ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={`ui-textarea ${className}`.trim()} {...props} />;
}
