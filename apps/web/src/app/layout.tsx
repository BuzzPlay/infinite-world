import type { Metadata } from 'next';

import './globals.css';
import { I18nProvider } from '../components/i18n-provider';

export const metadata: Metadata = {
  title: 'Infinite World · Live World',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="text-foreground bg-background min-h-screen w-full scroll-smooth font-sans font-medium antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
