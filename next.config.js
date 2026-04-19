/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // /program is now handled by app/program route

  // @react-pdf/renderer v4 is pure ESM. Next.js 14's default externals list
  // would try to require() it at runtime, which crashes on ESM modules.
  // transpilePackages forces webpack to bundle it instead of externalizing it.
  transpilePackages: ["@react-pdf/renderer"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // canvas is an optional peer dep of @react-pdf/renderer — not installed here.
      // Tell webpack to skip it rather than failing to resolve it.
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...(config.resolve?.fallback ?? {}),
          canvas: false,
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
