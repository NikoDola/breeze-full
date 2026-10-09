import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Uses the real brand marks in /public. `logo_horizontal_light.svg` is the same
 * artwork with the black wordmark recoloured white, so the orange and blue stay
 * on-brand over dark surfaces instead of being flattened by a CSS invert.
 */
export default function Logo({
  light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label={`${site.fullName} — home`}
      className={`inline-flex shrink-0 items-center ${className}`}
    >
      <Image
        src={light ? "/logo_horizontal_light.svg" : "/logo_horizontal.svg"}
        alt={site.fullName}
        width={211}
        height={41}
        priority
        className="h-9 w-auto transition-opacity hover:opacity-85 sm:h-10"
      />
    </Link>
  );
}
