/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // `domains` is deprecated in Next 14 in favor of `remotePatterns`.
    // Keep the same allowed remote host via a pattern.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.edgestore.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
