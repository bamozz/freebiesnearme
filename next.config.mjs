/** @type {import('next').NextConfig} */
const nextConfig = {
  // Clean-URL rewrites/redirects for the legacy static pages
  // (/toronto/map -> /toronto/map.html, etc.) already live in vercel.json
  // and run at the platform level regardless of framework - intentionally
  // not duplicated here to avoid two competing sources of truth.
};

export default nextConfig;
