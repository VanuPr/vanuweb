
"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function Footer() {
  const { translations } = useLanguage();
  const t = translations.footer;

  return (
    <footer id="contact" className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col">
            <Logo isFooter={true} />
            <p className="mt-4 text-sm text-primary-foreground/70">
              {t.tagline}
            </p>
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold">{t.quickLinks}</h3>
            <ul className="mt-4 space-y-2">
                <li><Link href="/about" className="text-sm text-primary-foreground/70 hover:underline">{t.aboutUs}</Link></li>
                <li><Link href="/products" className="text-sm text-primary-foreground/70 hover:underline">{t.products}</Link></li>
                <li><Link href="/services" className="text-sm text-primary-foreground/70 hover:underline">{t.services}</Link></li>
                <li><Link href="/customer-support" className="text-sm text-primary-foreground/70 hover:underline">{t.contact}</Link></li>
                <li><Link href="/legal" className="text-sm text-primary-foreground/70 hover:underline">Legal & Documents</Link></li>
                <li><Link href="/policy" className="text-sm text-primary-foreground/70 hover:underline">Policies & Terms</Link></li>
                 <li><Link href="/downloads" className="text-sm text-primary-foreground/70 hover:underline">Download Forms</Link></li>
                 <li><Link href="/coordinator-login" className="text-sm text-primary-foreground/70 hover:underline">Coordinator Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold">{t.locations}</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold">{t.goddaOffice}</p>
                  <p className="text-sm text-primary-foreground/70">Nahar Chowk, Godda, Jharkhand 814133, India.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold">{t.registeredOffice}</p>
                  <p className="text-sm text-primary-foreground/70">C/O Rishav Kumar, Vill-Matiahi, Madhepura, Bihar - 852121.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-headline text-lg font-semibold">{t.workingHours}</h3>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-3"><Clock className="w-4 h-4 shrink-0" /><span>{t.weekdays}</span></li>
              <li className="flex items-center gap-3"><Clock className="w-4 h-4 shrink-0" /><span>{t.saturday}</span></li>
              <li className="flex items-center gap-3"><Clock className="w-4 h-4 shrink-0" /><span>{t.sunday}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/70">
          <p>{t.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
        </div>
      </div>
    </footer>
  );
}
