/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const fallbackUrl = isDev ? 'http://127.0.0.1:8000' : 'http://backend:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || fallbackUrl}/:path*`,
      },
    ]
  },
};

export default nextConfig;
