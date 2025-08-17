import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AEAMS - Authentication Management System",
  description: "Secure authentication system built with Next.js, NextAuth, and modern security practices. Enterprise-grade user management and session handling.",
  keywords: ["authentication", "login", "security", "user management", "nextjs", "enterprise"],
  authors: [{ name: "AEAMS Development Team" }],
  creator: "AEAMS",
  publisher: "AEAMS",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nextjs-lilac-theta-57.vercel.app',
    title: 'AEAMS - Authentication Management System',
    description: 'Secure authentication system built with Next.js and modern security practices.',
    siteName: 'AEAMS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AEAMS - Authentication Management System',
    description: 'Secure authentication system built with Next.js and modern security practices.',
  },
  verification: {
    google: 'your-google-site-verification-code', // Add this when you get it
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
