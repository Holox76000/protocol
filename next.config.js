/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // /program is now handled by app/program route
  webpack: (config, { isServer }) => {
    if (isServer) {
      // @react-pdf/renderer is pure ESM (v4+) — webpack bundles it fine.
      // canvas is an optional peer dep that doesn't exist in this project; skip it.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        "canvas",
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
