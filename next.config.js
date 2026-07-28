/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The /docs handbook reads markdown from the top-level docs/ folder at request
  // time (the route is dynamic because it gates on the admin session cookie).
  // Force-include those files in the serverless function bundle so the reads
  // resolve in production on Netlify.
  experimental: {
    outputFileTracingIncludes: {
      "/docs": ["./docs/**/*"],
      "/docs/[slug]": ["./docs/**/*"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
  // /program is now handled by app/program route

  // @react-pdf/renderer is used from the Pages Router API route (pages/api/admin/export-pdf.ts)
  // to avoid the RSC webpack layer which strips React.Component. No transpilePackages needed;
  // Next.js handles ESM interop for Pages Router routes automatically.

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
