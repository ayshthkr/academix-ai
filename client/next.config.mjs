/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  images: {
    remotePatterns: [],
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  }
};

export default nextConfig;
