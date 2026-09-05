import type { Metadata } from 'next';

import '@xyflow/react/dist/style.css';
import './globals.css';
import { I18nProvider } from '../components/i18n-provider';
import { LazyMotionProvider } from '../components/lazy-motion-provider';
import { Toaster } from '../components/ui/sonner';

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
        <LazyMotionProvider>
          <I18nProvider>
            {children}
            <Toaster position="bottom-right" />
          </I18nProvider>
        </LazyMotionProvider>
      </body>
    </html>
  );
}
