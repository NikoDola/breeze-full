/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Isolate the production-mode CMS proof from an existing next dev/build workspace.
  distDir: process.env.CMS_LOCAL_PROOF_BUILD === "true" ? ".next-cms-proof" : ".next",
};

export default nextConfig;
