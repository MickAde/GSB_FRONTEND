import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { RootProviders } from '@/components/layout/RootProviders';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Genius Study Buddy',
  description: 'AI-powered educational platform for Nigerian secondary schools',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased" suppressHydrationWarning>
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
