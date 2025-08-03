"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/language-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { AppBody } from './app-body';
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Script from 'next/script';
import Image from 'next/image';

function SiteLoader() {
  return (
    <div className="loader-container">
      <div className="loader-logo">
        <Image 
          src="https://github.com/akm12109/assets_vanu/blob/main/logo.png?raw=true" 
          alt="Vanu Organic Logo" 
          width={100} 
          height={100} 
        />
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteSettings, setSiteSettings] = useState({ status: 'live' });
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const settingsRef = doc(db, "siteSettings", "lockState");
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings({ status: docSnap.data().websiteStatus || 'live' });
      }
      // Delay to show loader
      setTimeout(() => setLoading(false), 1500); 
    }, (error) => {
      console.error("Failed to load site settings, proceeding anyway.", error);
      setTimeout(() => setLoading(false), 1500);
    });
    return () => unsubscribe();
  }, []);

  const isExempted = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/dev') || 
    pathname.startsWith('/maintenance') ||
    pathname === '/employee-login' || 
    pathname === '/customer-login' ||
    pathname === '/register' ||
    pathname === '/forgot-password';

  if (!loading && siteSettings.status !== 'live' && !isExempted) {
    router.push(`/maintenance?status=${siteSettings.status}`);
    return (
       <html lang="en" className="scroll-smooth">
         <head>
          <title>Site Unavailable</title>
        </head>
        <body>
           <div className="flex min-h-screen flex-col items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                <p className="mt-2 text-muted-foreground">Redirecting...</p>
           </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/logo/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=Sarala:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo/logo.png"></link>
        <meta name="theme-color" content="#ffffff" />
        <title>Vanu Organic</title>
        <meta name="description" content="Vanu Organic Pvt Ltd - Specializing in organic farming, education, and social work." />
      </head>
      <LanguageProvider>
        <CartProvider>
          <WishlistProvider>
            <AppBody>
              {loading && <SiteLoader />}
              {!loading && children}
              <Toaster />
            </AppBody>
          </WishlistProvider>
        </CartProvider>
      </LanguageProvider>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    </html>
  );
}
