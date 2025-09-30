/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  serverExternalPackages: ['resend'],
  images: {
    remotePatterns: [],
    formats: ["image/webp", "image/avif"], // Modern image formats for better performance
  },
  eslint: {
    // Allow production builds to complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  // Enable compression for better performance
  compress: true,
  // Generate static sitemap and robots.txt
  trailingSlash: false,
  // Headers for better SEO
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
