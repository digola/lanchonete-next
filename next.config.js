/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para produção
  reactStrictMode: true,
  
  // Configurações experimentais otimizadas para produção
  experimental: {
    // Otimizar imports de pacotes para melhor performance
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },

  // Otimizações para reduzir tamanho da função serverless
  output: 'standalone',
  
  // Configuração específica do Turbopack (Next.js) para suportar loaders
  // recomendados oficialmente, como @svgr/webpack para SVGs.
  // Referência: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Configurações de TypeScript para deploy
  typescript: {
    // Manter verificação de tipos em produção
    ignoreBuildErrors: false,
  },
  
  // Configurações de ESLint para deploy
  eslint: {
    // Manter verificação de ESLint em produção
    ignoreDuringBuilds: false,
  },
  
  // Configuração de imagens
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Otimizações de produção
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Webpack customizado
  webpack: (config, { isServer, dev }) => {
    // Suporte a SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Otimizações para reduzir tamanho do bundle
    if (!dev) {
      // Excluir dependências desnecessárias do bundle
      config.externals = config.externals || [];
      if (isServer) {
        config.externals.push({
          'pino-pretty': 'pino-pretty',
          'tsx': 'tsx'
        });
      }
      
      // Configurações de otimização
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // ~240KB para evitar exceder limite
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk menor
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              maxSize: 200000, // ~200KB
            },
            // Common chunk menor
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
              maxSize: 100000, // ~100KB
            },
          },
        },
      };
    }

    return config;
  },

  // Headers de segurança e cache
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
      {
        source: '/staff/dashboard',
        destination: '/staff',
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
