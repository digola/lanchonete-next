/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desativar Strict Mode em desenvolvimento para evitar efeitos duplicados
  // e reduzir requisições automáticas duplicadas
  reactStrictMode: false,
  // Otimizações experimentais
  // Desabilitar temporariamente otimização de imports para evitar erros de
  // clientReferenceManifest em desenvolvimento com Next 15
  // Referência: problemas conhecidos ao otimizar pacotes de ícones
  experimental: {
    // Mantemos optimizePackageImports desabilitado manualmente aqui devido a erros
    // observados em desenvolvimento com Next 15.5 (clientReferenceManifest).
    // Nota: Algumas bibliotecas como lucide-react já são otimizadas por padrão
    // pelo Next.js, conforme a documentação oficial.
    // Referência: https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
    // optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },

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
  
  // Configurações de TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  
  // Configuração de imagens
  images: {
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
      {
        protocol: 'https',
        hostname: '*.supabase.co',
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

    // Otimizações de produção (apenas em build/start)
    // Evita sobrecarga no HMR durante desenvolvimento
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
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
