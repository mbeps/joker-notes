/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  typescript: {
    // Type checking is strictly enforced in CI (.github/workflows/merge.yml) via `yarn tsc --noEmit`.
    // Skipping in-build type validation prevents Vercel container OOM / deadlock during Next.js TypeScript check.
    ignoreBuildErrors: true,
  },

  images: {
    // `domains` is deprecated in Next 14 in favor of `remotePatterns`.
    // Keep the same allowed remote host via a pattern.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.edgestore.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
