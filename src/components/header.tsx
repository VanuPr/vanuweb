
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Menu, ChevronDown, ShoppingCart, Globe, User, LogOut, Search, LogIn, ShieldCheck, FileText, Heart, Shapes, Tractor, Landmark, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { Badge } from '@/components/ui/badge';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { SearchPopover } from './search-popover';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Service {
    id: string;
    name: string;
    link: string;
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { language, setLanguage, translations } = useLanguage();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [openStates, setOpenStates] = useState<{ [key: string]: boolean }>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [user, loading] = useAuthState(auth);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    const fetchNavData = async () => {
        try {
            const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
            setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
            
            const servicesSnapshot = await getDocs(query(collection(db, 'services'), orderBy('createdAt')));
            setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
        } catch (error) {
            console.error("Failed to fetch navigation data:", error);
        }
    }
    fetchNavData();
  }, []);

  const handleOpenChange = (key: string, open: boolean) => {
    setOpenStates(prev => ({...prev, [key]: open}));
  };

  const handleLogout = () => {
    auth.signOut();
    toast({title: "Logged Out", description: "You have been successfully logged out."});
    router.push('/');
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = translations.header;
  const tc = translations.customerAuth;
  
  const productLinks = [
    { href: "/products", label: t.allProducts },
    ...categories.map(c => ({ href: `/products/${c.slug}`, label: c.name }))
  ];

  const staticServiceLinks = [
      { href: "/kisan-card-application", label: "Kisan Credit Card", icon: Tractor },
      { href: "/kisan-jaivik-card", label: "Kisan Jaivik Card", icon: Landmark },
      { href: "/coordinator-application", label: "Coordinator Application", icon: Briefcase }
  ];

  const dynamicServiceLinks = services.map(s => ({ href: s.link, label: s.name, icon: Shapes }));
  const allServiceLinks = [...dynamicServiceLinks, ...staticServiceLinks];

  const navLinks = [
    { href: "/", label: t.home },
    { href: "/about", label: t.about },
    { 
      label: t.products,
      isDropdown: true,
      items: productLinks
    },
    { 
      label: t.services,
      isDropdown: true,
      items: allServiceLinks.length > 0 ? allServiceLinks : [{ href: "/services", label: "Our Services" }]
    },
    { href: "/customer-support", label: t.customerSupport },
  ];

  const isAdmin = user && user.email === 'admin@vanu.com';

  return (
    <header className={cn('sticky top-0 z-50 w-full transition-all duration-300', isScrolled ? 'bg-background/80 backdrop-blur-sm shadow-md' : 'bg-transparent')}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden md:flex gap-1 items-center">
          {navLinks.map((link) => (
            link.isDropdown ? (
              <DropdownMenu key={link.label} open={openStates[link.label]} onOpenChange={(open) => handleOpenChange(link.label, open)}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-foreground/80 hover:text-foreground" onMouseEnter={() => handleOpenChange(link.label, true)}>
                    {link.label}
                    <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent onMouseLeave={() => handleOpenChange(link.label, false)}>
                  {link.items?.map(item => (
                    <Link key={item.href} href={item.href} passHref>
                      <DropdownMenuItem>
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        {item.label}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link key={link.href} href={link.href!} passHref>
                <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                  {link.label}
                </Button>
              </Link>
            )
          ))}
            <DropdownMenu open={openStates['language']} onOpenChange={(open) => handleOpenChange('language', open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground/80 hover:text-foreground" onMouseEnter={() => handleOpenChange('language', open)}>
                  <Globe className="h-5 w-5" />
                  <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onMouseLeave={() => handleOpenChange('language', false)}>
                <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('hi')}>हिन्दी</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </nav>
        <div className="flex items-center gap-2">
            <SearchPopover />
            <Link href="/account?view=wishlist" passHref>
              <Button size="icon" variant="ghost" className="relative">
                  {wishlistCount > 0 && <Badge variant="destructive" className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0">{wishlistCount}</Badge>}
                  <Heart className="h-5 w-5" />
                  <span className="sr-only">Wishlist</span>
              </Button>
            </Link>
            <Link href="/cart">
                <Button size="icon" variant="ghost" className="relative">
                    {cartCount > 0 && <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0">{cartCount}</Badge>}
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Shopping Cart</span>
                </Button>
            </Link>
            
            {isAdmin && (
                 <Link href="/admin/dashboard" passHref>
                    <Button variant="outline">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin
                    </Button>
                </Link>
            )}
             
            {user ? (
                 <DropdownMenu open={openStates['user']} onOpenChange={(open) => handleOpenChange('user', open)}>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" onMouseEnter={() => handleOpenChange('user', true)}>
                            <User className="h-5 w-5" />
                            <span className="sr-only">User Menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onMouseLeave={() => handleOpenChange('user', false)}>
                        <DropdownMenuLabel>{tc.welcome}, {user.displayName || user.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        <Link href="/account" passHref>
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>{tc.myAccount}</span>
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{tc.logout}</span>
                        </DropdownMenuItem>
                         <DropdownMenuSeparator/>
                        <Link href="/employee-login" passHref>
                            <DropdownMenuItem>{t.employeeLogin}</DropdownMenuItem>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Link href="/customer-login" passHref>
                    <Button variant="ghost">
                        <LogIn className="mr-2 h-4 w-4" />
                        {tc.customerLogin}
                    </Button>
                </Link>
            )}


            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                   <VisuallyHidden>
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </VisuallyHidden>
                  <div className="p-4">
                    <Logo />
                    <nav className="mt-8 grid gap-4">
                      {navLinks.map((link) => (
                         link.isDropdown ? (
                            <div key={link.label}>
                                <h3 className='px-4 font-semibold'>{link.label}</h3>
                                <div className='grid gap-2 mt-2'>
                                {link.items?.map(item => (
                                    <SheetClose key={item.href} asChild>
                                        <Link href={item.href} passHref>
                                            <Button variant="ghost" className="w-full justify-start pl-8 text-md">
                                                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                                {item.label}
                                            </Button>
                                        </Link>
                                    </SheetClose>
                                ))}
                                </div>
                            </div>
                         ) : (
                            <SheetClose key={link.href} asChild>
                                <Link href={link.href!} passHref>
                                <Button variant="ghost" className="w-full justify-start text-lg">
                                        {link.label}
                                </Button>
                                </Link>
                            </SheetClose>
                         )
                      ))}
                        <div className="px-4">
                            <h3 className='font-semibold'>Language</h3>
                            <div className='grid gap-2 mt-2'>
                                <SheetClose asChild>
                                    <Button variant="ghost" className="w-full justify-start pl-4" onClick={() => setLanguage('en')}>English</Button>
                                </SheetClose>
                                <SheetClose asChild>
                                     <Button variant="ghost" className="w-full justify-start pl-4" onClick={() => setLanguage('hi')}>हिन्दी</Button>
                                </SheetClose>
                            </div>
                        </div>
                       <SheetClose asChild>
                          <Link href="/employee-login" passHref>
                            <Button className="w-full justify-start text-lg">
                                {t.employeeLogin}
                            </Button>
                          </Link>
                        </SheetClose>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
