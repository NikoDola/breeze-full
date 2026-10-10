import type { ComponentPropsWithoutRef } from "react";

export default function Button({ className = "", ...props }: ComponentPropsWithoutRef<"button">) {
  return <button className={`ui-button ${className}`.trim()} {...props} />;
}
