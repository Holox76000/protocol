/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // /program is now handled by app/program route
  serverExternalPackages: ["@react-pdf/renderer"],
};

module.exports = nextConfig;
