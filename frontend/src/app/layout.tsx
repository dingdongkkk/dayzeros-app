import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Space_Grotesk, Space_Mono } from 'next/font/google';
import { DayzerosLayoutWrapper } from '@/components/DayzerosLayoutWrapper';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dayzeros',
  description: 'A calm focus app that lives on a single pixel-art meadow.',
  icons: {
    icon: '/assets/meadow.webp',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#12132a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="antialiased select-none">
        <DayzerosLayoutWrapper>{children}</DayzerosLayoutWrapper>
      </body>
    </html>
  );
}
