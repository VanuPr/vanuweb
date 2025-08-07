
"use client"

import React from "react";
import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Leaf, Shield, HeartHandshake, Users, Sparkles, Loader2, Search, Tractor } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuthInstance, getDB } from '@/lib/firebase';
import { ProductCard } from "@/components/product-card";
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { ServiceSlideshow } from "@/components/service-slideshow";
import { FilterSidebar, FilterState } from "@/components/filter-sidebar";
import { TypewriterWelcome } from "@/components/typewriter-welcome";
import { ServicesModal } from "@/components/services-modal";


interface Product {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  imageHover?: string;
  aiHint?: string;
  category?: string;
  categoryName?: string;
  featured?: boolean;
  status: 'Active' | 'Draft';
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Service {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    aiHint: string;
    link: string;
}

export default function Home() {
  const { translations } = useLanguage();
  const auth = getAuthInstance();
  const db = getDB();
  const [user, loadingAuth] = useAuthState(auth);
  const t = translations.home;
  
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    maxPrice: 1000, // Default max price
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("status", "==", "Active"));
        const productsSnapshot = await getDocs(q);
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setAllProducts(productsData);

        const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(categoriesData);
        
        const servicesSnapshot = await getDocs(query(collection(db, 'services'), orderBy('createdAt')));
        const servicesData = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setServices(servicesData);

        const maxProductPrice = productsData.reduce((max, p) => p.price > max ? p.price : max, 0);
        if (maxProductPrice > 0) {
            setFilters(prev => ({...prev, maxPrice: Math.ceil(maxProductPrice)}));
        }

      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [db]);

  const activeProducts = useMemo(() => allProducts.filter(p => p.status === 'Active'), [allProducts]);
  
  const filteredProducts = useMemo(() => {
    return activeProducts
      .filter(p => {
          if (filters.categories.length > 0) {
              return p.category && filters.categories.includes(p.category);
          }
          return true;
      })
      .filter(p => {
          return p.price <= filters.maxPrice;
      });
  }, [activeProducts, filters]);

  const productSections = useMemo(() => {
    return categories
      .map(category => {
          const products = activeProducts.filter(p => p.category === category.slug);
          return {
              title: category.name,
              link: `/products/${category.slug}`,
              products: products.slice(0, 4),
              count: products.length,
          };
      })
      .filter(section => section.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [activeProducts, categories]);

  const topPicks = useMemo(() => activeProducts.slice(0, 4), [activeProducts]);


  const renderProductSection = (title: string, products: Product[], link: string, showLoading: boolean) => (
      <section className="w-full py-16 md:py-24 bg-background last-of-type:bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
              <div className="flex justify-between items-center mb-12">
                  <h2 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
                  <Link href={link}>
                      <Button variant="outline">{t.viewAll}</Button>
                  </Link>
              </div>
              {showLoading ? (
                  <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {products.map((product) => (
                          <ProductCard key={product.id} product={product} />
                      ))}
                  </div>
              ) : (
                  <p className="text-center text-muted-foreground">No products found in this category yet.</p>
              )}
          </div>
      </section>
  );

  return (
    <>
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        
        { !user && !loadingAuth && (
          <>
            <section 
                className="w-full py-24 md:py-32 lg:py-40 bg-cover bg-center bg-no-repeat relative"
                style={{backgroundImage: `url('https://github.com/akm12109/assets_vanu/blob/main/herosection.png?raw=true')`}}
            >
                <div className="absolute inset-0 bg-black/50 z-0"></div>
                <div className="container mx-auto px-4 md:px-6 text-center text-white relative z-10">
                    <h1 className="text-4xl md:text-6xl font-headline font-bold text-shadow-lg">Vanu Organic Pvt Ltd</h1>
                    <p className="mt-4 text-lg md:text-xl text-shadow-md">{t.heroTitle}</p>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/register">
                            <Button size="lg" className="w-full sm:w-auto">Create an Account</Button>
                        </Link>
                         <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={() => setIsServicesModalOpen(true)}>
                            <Tractor className="mr-2 h-5 w-5"/>
                            Our Services
                        </Button>
                    </div>
                </div>
            </section>

             <section className="w-full py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-6">
                    <ServiceSlideshow />
                </div>
            </section>
            
            <section id="why-choose-us" className="w-full py-16 md:py-24 bg-secondary/30">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h2 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">{t.whyChooseUsTitle}</h2>
                    <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">
                       {t.whyChooseUsDesc}
                    </p>
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-primary/10 rounded-full"><Leaf className="w-10 h-10 text-primary" /></div>
                            <h3 className="text-xl font-semibold font-headline">{t.purelyOrganicTitle}</h3>
                            <p className="text-muted-foreground">{t.purelyOrganicDesc}</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                             <div className="p-4 bg-primary/10 rounded-full"><HeartHandshake className="w-10 h-10 text-primary" /></div>
                            <h3 className="text-xl font-semibold font-headline">{t.socialImpactTitle}</h3>
                            <p className="text-muted-foreground">{t.socialImpactDesc}</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-primary/10 rounded-full"><Shield className="w-10 h-10 text-primary" /></div>
                            <h3 className="text-xl font-semibold font-headline">{t.qualityAssuredTitle}</h3>
                            <p className="text-muted-foreground">{t.qualityAssuredDesc}</p>
                        </div>
                    </div>
                </div>
            </section>
            
            <section id="services-showcase" className="w-full py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                     <div className="flex justify-between items-center mb-12">
                        <h2 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">{t.ourServicesTitle}</h2>
                        <Link href="/services">
                            <Button variant="outline">{t.viewAll}</Button>
                        </Link>
                    </div>
                    {loading ? (
                         <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : services.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((service) => (
                               <Link key={service.id} href={service.link || "#"} className="group">
                                 <Card className="h-full transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
                                   <CardHeader className="p-0">
                                     <div className="w-full h-48 relative">
                                       <Image src={service.imageUrl} alt={service.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint={service.aiHint} />
                                     </div>
                                   </CardHeader>
                                   <CardContent className="p-6">
                                     <h3 className="text-lg font-semibold font-headline">{service.name}</h3>
                                     <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                                   </CardContent>
                                 </Card>
                               </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">Services will be listed here soon.</p>
                    )}
                </div>
            </section>

            {renderProductSection(t.topPicks, topPicks, "/products", loading)}
            
            {productSections.map(section => (
                <React.Fragment key={section.title}>
                    {renderProductSection(section.title, section.products, section.link, loading)}
                </React.Fragment>
            ))}

            <section id="careers" className="w-full py-16 md:py-24 bg-primary/90 text-primary-foreground">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4" />
                    <h2 className="text-3xl font-headline font-bold tracking-tight sm:text-4xl">{t.joinMissionTitle}</h2>
                     <p className="mt-4 max-w-3xl mx-auto text-primary-foreground/80">
                       {t.joinMissionDesc}
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Link href="/coordinator-application">
                            <Button size="lg" variant="secondary">{t.applyCoordinator}</Button>
                        </Link>
                    </div>
                </div>
            </section>
          </>
        )}
        
        { user && !loadingAuth && (
            <div className="container mx-auto px-4 md:px-6 py-12">
                <div className="mb-8">
                    <TypewriterWelcome 
                        user={user} 
                        fullText="Ready to find the perfect products for a thriving farm? Let's get started!" 
                    />
                </div>
                <div className="grid lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1">
                       <FilterSidebar 
                            filters={filters}
                            onFilterChange={setFilters}
                            categories={categories}
                            maxPrice={Math.ceil(allProducts.reduce((max, p) => p.price > max ? p.price : max, 0))}
                       />
                    </aside>
                    <div className="lg:col-span-3">
                        <div className="mb-8 flex justify-between items-center">
                           <p className="text-muted-foreground">{t.showingProducts.replace('{filtered}', filteredProducts.length).replace('{total}', activeProducts.length)}</p>
                        </div>
                        {loading ? (
                             <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-16">No products match your current filters.</p>
                        )}
                    </div>
                </div>
            </div>
        )}

      </main>
      <Footer />
    </div>
    <ServicesModal isOpen={isServicesModalOpen} onClose={() => setIsServicesModalOpen(false)} />
    </>
  );
}
