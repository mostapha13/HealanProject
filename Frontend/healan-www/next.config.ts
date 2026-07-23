import type { NextConfig } from 'next';

const siteHost = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.drshahrooei.ir'
    ).hostname;
  } catch {
    return 'www.drshahrooei.ir';
  }
})();

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: siteHost,
        pathname: '/File/**',
      },
      {
        protocol: 'http',
        hostname: siteHost,
        pathname: '/File/**',
      },
    ],
  },
};

export default nextConfig;
