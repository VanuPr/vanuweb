
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp, getDocs, collection, where, query, limit } from 'firebase/firestore';
import { Loader2, LogOut, LayoutDashboard, ShoppingBag, ListOrdered, SlidersHorizontal, Users, FileText, ChevronDown, ClipboardList, ShieldAlert, Wrench, Shapes, Truck, MapPin, UserPlus, GalleryHorizontal } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { AdminHeader } from '@/components/admin-header';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();
  const [adminStatus, setAdminStatus] = React.useState('live');
  const [adminPageStatus, setAdminPageStatus] = React.useState<{ [key: string]: string }>({});
  const [validUntil, setValidUntil] = React.useState<Timestamp | null>(null);
  const [loadingLock, setLoadingLock] = React.useState(true);
  const [loadingRole, setLoadingRole] = React.useState(true);
  const [isRedirecting, setIsRedirecting] = React.useState(false);


  React.useEffect(() => {
    const settingsRef = doc(db, "siteSettings", "lockState");
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setAdminStatus(data.adminStatus || 'live');
            setValidUntil(data.validUntil || null);
            setAdminPageStatus(data.adminPageStatus || {});
        }
        setLoadingLock(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (loading) return; // Wait until Firebase auth state is resolved

    const verifyAdminRole = async () => {
        if (!user) {
            router.push('/employee-login');
            return;
        }

        setLoadingRole(true);
        // Special access for dev and main admin
        if (user.email === 'dev@akm.com' || user.email === 'admin@vanu.com') {
            setLoadingRole(false);
            return; 
        }
        
        // Check for other admins in the employees collection
        const q = query(collection(db, 'employees'), where('email', '==', user.email), limit(1));
        const employeeSnapshot = await getDocs(q);
        
        if (employeeSnapshot.empty || employeeSnapshot.docs[0].data().role !== 'Admin') {
            // Not an admin, redirect
            router.push('/employee-login');
        } else {
            setLoadingRole(false);
        }
    };

    verifyAdminRole();
  }, [user, loading, router]);

  React.useEffect(() => {
    if (loading || loadingLock || loadingRole) return;

    if (!user) {
      router.push('/employee-login');
      return;
    }
    
    const isExempted = pathname === '/admin/billing-overdue' || pathname === '/admin/status';
    if(isExempted) {
        setIsRedirecting(false);
        return;
    };

    const isExpired = validUntil ? validUntil.toDate() < new Date() : false;
    if (adminStatus === 'billing_overdue' || isExpired) {
        setIsRedirecting(true);
        router.push('/admin/billing-overdue');
        return;
    }

    const currentPageStatus = adminPageStatus[pathname] || 'live';
    if (currentPageStatus !== 'live') {
        setIsRedirecting(true);
        router.push(`/admin/status?page=${pathname}&status=${currentPageStatus}`);
        return;
    }
    
    setIsRedirecting(false);

  }, [user, loading, loadingLock, loadingRole, router, pathname, adminStatus, validUntil, adminPageStatus]);


  if (loading || loadingLock || loadingRole || isRedirecting) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                 <Logo />
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/admin/dashboard" passHref>
                            <SidebarMenuButton tooltip="Dashboard">
                                <LayoutDashboard />
                                Dashboard
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem asChild>
                        <Collapsible>
                        <SidebarMenuButton asChild>
                            <CollapsibleTrigger className="w-full">
                                <ListOrdered />
                                Order Management
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarMenuButton>
                        <CollapsibleContent asChild>
                            <SidebarMenuSub>
                            <SidebarMenuSubItem>
                                <Link href="/admin/orders" passHref>
                                <SidebarMenuSubButton>All Orders</SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                                <Link href="/admin/shipping" passHref>
                                <SidebarMenuSubButton>Shipping</SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </CollapsibleContent>
                        </Collapsible>
                    </SidebarMenuItem>
                     <SidebarMenuItem asChild>
                      <Collapsible>
                        <SidebarMenuButton asChild>
                           <CollapsibleTrigger className="w-full">
                                <ShoppingBag />
                                Products
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                        </SidebarMenuButton>
                        <CollapsibleContent asChild>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <Link href="/admin/products" passHref>
                                <SidebarMenuSubButton>All Products</SidebarMenuSubButton>
                              </Link>
                            </SidebarMenuSubItem>
                             <SidebarMenuSubItem>
                              <Link href="/admin/categories" passHref>
                                <SidebarMenuSubButton>Categories</SidebarMenuSubButton>
                              </Link>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                    <SidebarMenuItem asChild>
                      <Collapsible>
                        <SidebarMenuButton asChild>
                           <CollapsibleTrigger className="w-full">
                            <FileText />
                              Content
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                        </SidebarMenuButton>
                        <CollapsibleContent asChild>
                          <SidebarMenuSub>
                             <SidebarMenuSubItem>
                                <Link href="/admin/slideshow" passHref>
                                    <SidebarMenuSubButton>Slideshow</SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuSubItem>
                             <SidebarMenuSubItem>
                                <Link href="/admin/services" passHref>
                                    <SidebarMenuSubButton>Services</SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuSubItem>
                             <SidebarMenuSubItem>
                                <Link href="/admin/gallery" passHref>
                                    <SidebarMenuSubButton>Gallery</SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/coordinators" passHref>
                            <SidebarMenuButton tooltip="Employees/Coordinators">
                                <Users />
                                Employees
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/users" passHref>
                            <SidebarMenuButton tooltip="Users">
                                <UserPlus />
                                Users
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => auth.signOut()}>
                            <LogOut />
                            Logout
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <div className="flex flex-col">
              <AdminHeader />
              <main className="p-4 md:p-6 lg:p-8">
                  {children}
              </main>
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
