
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [websiteStatus, setWebsiteStatus] = useState('live');
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const settingsRef = doc(db, "siteSettings", "lockState");
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setWebsiteStatus(docSnap.data().websiteStatus || 'live');
      }
      setLoading(false);
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

  if (loading) {
     return (
      <html lang="en" className="scroll-smooth">
         <head>
          <title>Vanu Organic</title>
        </head>
        <body>
           <div className="flex min-h-screen flex-col items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary"/>
           </div>
        </body>
      </html>
    );
  }

  if (websiteStatus !== 'live' && !isExempted) {
    router.push(`/maintenance?status=${websiteStatus}`);
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
    )
  }

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=Sarala:wght@400;700&display=swap" rel="stylesheet" />
        <title>Vanu Organic</title>
        <meta name="description" content="Vanu Organic Pvt Ltd - Specializing in organic farming, education, and social work." />
      </head>
      <LanguageProvider>
        <CartProvider>
          <WishlistProvider>
            <AppBody>
              {children}
              <Toaster />
            </AppBody>
          </WishlistProvider>
        </CartProvider>
      </LanguageProvider>
      {/* Add the Razorpay Checkout script to the bottom of your layout */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    </html>
  );
}
