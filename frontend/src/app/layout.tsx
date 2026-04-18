import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import '../styles/theme.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { appTheme } from '@/styles/theme';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body data-theme={appTheme.id}>{children}</body>
    </html>
  );
}
