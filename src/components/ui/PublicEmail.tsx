export default function PublicEmail({ email, href, className = "" }: { email: string; href: string; className?: string }) {
  return <a className={`public-email ${className}`.trim()} href={href}>
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
    </svg>
    <span>{email}</span>
  </a>;
}
