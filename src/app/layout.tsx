import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../lib/cron';

import './globals.css';
import 'sweetalert2/dist/sweetalert2.min.css';

import { getConfig } from '@/lib/config';
import { SiteProvider } from '../components/SiteProvider';
import { ThemeProvider } from '../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const config = getConfig();

  return {
    title: config.SiteConfig.SiteName,
    description: '影视聚合',
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getConfig();

  return (
    <html lang='zh-CN'>
      <body>
        <SiteProvider
          siteName={config.SiteConfig.SiteName}
          announcement={config.SiteConfig.Announcement}
        >
          <ThemeProvider>{children}</ThemeProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
