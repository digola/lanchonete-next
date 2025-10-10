import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
// import { ClientToastProvider } from '@/components/ui/ClientToastProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: {
    default: 'Lanchonete - Sistema de GestÃ£o',
    template: '%s | Lanchonete'
  },
  description: 'Sistema completo de gestÃ£o para lanchonetes com cardÃ¡pio online, pedidos e delivery.',
  keywords: ['lanchonete', 'delivery', 'cardÃ¡pio', 'pedidos', 'gestÃ£o', 'nextjs'],
  authors: [{ name: 'Lanchonete Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Lanchonete - Sistema de GestÃ£o',
    description: 'Sistema completo de gestÃ£o para lanchonetes',
    type: 'website',
    locale: 'pt_BR',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}

