/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // /program is now handled by app/program route

  // @react-pdf/renderer v4 is pure ESM. transpilePackages forces webpack to bundle
  // it instead of externalizing (externalizing would use require(), which fails on ESM).
  transpilePackages: ["@react-pdf/renderer"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...(config.resolve?.fallback ?? {}),
          // canvas is an optional peer dep of @react-pdf, not installed — skip it.
          canvas: false,
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
