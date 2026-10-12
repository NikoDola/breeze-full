// Loopback optimization is enabled ONLY for isolated local integration tests.
const localProofOrigin = !process.env.VERCEL && process.env.CMS_LOCAL_PROOF_BUILD === "true" &&
  /^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.CMS_WORKER_URL ?? "") ? new URL(process.env.CMS_WORKER_URL) : null;
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "breeze-test-api.nikodola.workers.dev", port: "", pathname: "/media/**", search: "" },
      ...(localProofOrigin ? [{ protocol: "http", hostname: "127.0.0.1", port: localProofOrigin.port, pathname: "/media/**", search: "" }] : [])],
    dangerouslyAllowLocalIP: Boolean(localProofOrigin),
    maximumRedirects: 0,
  },
  // Isolate the production-mode CMS proof from an existing next dev/build workspace.
  distDir: process.env.CMS_LOCAL_PROOF_BUILD === "true" ? ".next-cms-proof" : ".next",
};

export default nextConfig;
