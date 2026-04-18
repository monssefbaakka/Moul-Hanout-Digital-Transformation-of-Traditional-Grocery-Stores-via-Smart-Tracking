import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import '../styles/theme.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { appTheme } from '@/styles/theme';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: appTheme.brand,
  description: appTheme.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" className={cn("font-sans", inter.variable)}>
      <body data-theme={appTheme.id}>{children}</body>
    </html>
  );
}
