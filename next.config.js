/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // /program is now handled by app/program route
  transpilePackages: ["recharts", "d3-shape", "d3-path", "d3-scale", "d3-array", "d3-interpolate", "d3-format", "d3-time", "d3-time-format", "d3-color"],
};

module.exports = nextConfig;
