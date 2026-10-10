import type { ComponentPropsWithoutRef } from "react";

export default function Select({ className = "", ...props }: ComponentPropsWithoutRef<"select">) {
  return <select className={`ui-select ${className}`.trim()} {...props} />;
}
