/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
  
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },

  
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
      {
        source: '/staff',
        destination: '/staff/dashboard',
        permanent: false,
      },
      {
        source: '/customer',
        destination: '/customer/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
