// Allow only the configured loopback Worker in local CMS development/proofs.
// Vercel builds never receive private-network image access, including Preview.
const localCmsDevelopment = process.env.NODE_ENV === "development" &&
  process.env.CMS_TEST_ENABLED === "true" &&
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(process.env.CMS_TEST_ORIGIN ?? "");
const localMediaOrigin = !process.env.VERCEL && process.env.VERCEL_ENV !== "production" &&
  (localCmsDevelopment || process.env.CMS_LOCAL_PROOF_BUILD === "true") &&
  /^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.CMS_WORKER_URL ?? "") ? new URL(process.env.CMS_WORKER_URL) : null;
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "breeze-test-api.nikodola.workers.dev", port: "", pathname: "/media/**", search: "" },
      ...(localMediaOrigin ? [{ protocol: "http", hostname: "127.0.0.1", port: localMediaOrigin.port, pathname: "/media/**", search: "" }] : [])],
    dangerouslyAllowLocalIP: Boolean(localMediaOrigin),
    maximumRedirects: 0,
  },
  // Isolate the production-mode CMS proof from an existing next dev/build workspace.
  distDir: process.env.CMS_LOCAL_PROOF_BUILD === "true" ? ".next-cms-proof" : ".next",
};

export default nextConfig;
