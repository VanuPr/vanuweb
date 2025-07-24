
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Loader2, LogOut, LayoutDashboard, ShoppingBag, ListOrdered, ChevronDown, BarChart, Landmark } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { AdminHeader } from '@/components/admin-header';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [isEmployee, setIsEmployee] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const verifyEmployeeRole = async () => {
      if (loadingAuth) return;
      if (!user) {
        router.push('/employee-login');
        return;
      }
      
      setLoadingRole(true);
      // Admin and Dev users also have employee access
      if (user.email === 'dev@akm.com' || user.email === 'admin@vanu.com') {
          setIsEmployee(true);
          setLoadingRole(false);
          return; 
      }

      const q = query(collection(db, 'employees'), where('email', '==', user.email), limit(1));
      const employeeSnapshot = await getDocs(q);

      if (employeeSnapshot.empty) {
        // Not a valid employee, sign out and redirect
        auth.signOut();
        router.push('/employee-login');
      } else {
        setIsEmployee(true);
      }
      setLoadingRole(false);
    };
    verifyEmployeeRole();
  }, [user, loadingAuth, router]);

  if (loadingAuth || loadingRole) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }
  
  if (!isEmployee) {
      return null; // Or a redirection component
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
                        <Link href="/employee/dashboard" passHref>
                            <SidebarMenuButton tooltip="Dashboard">
                                <LayoutDashboard />
                                Dashboard
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/employee/recap" passHref>
                            <SidebarMenuButton tooltip="Monthly Recap">
                                <BarChart />
                                Monthly Recap
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/employee/kisan-jaivik-card" passHref>
                            <SidebarMenuButton tooltip="Kisan Jaivik Card Applications">
                                <Landmark />
                                Kisan Jaivik Card
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
                                <Link href="/employee/orders" passHref>
                                <SidebarMenuSubButton>All Orders</SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                                <Link href="/employee/shipping" passHref>
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
                                Product Management
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                        </SidebarMenuButton>
                        <CollapsibleContent asChild>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <Link href="/employee/products" passHref>
                                <SidebarMenuSubButton>All Products</SidebarMenuSubButton>
                              </Link>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <Link href="/employee/add-product" passHref>
                                <SidebarMenuSubButton>Add New Product</SidebarMenuSubButton>
                              </Link>
                            </SidebarMenuSubItem>
                             <SidebarMenuSubItem>
                              <Link href="/employee/categories" passHref>
                                <SidebarMenuSubButton>Categories</SidebarMenuSubButton>
                              </Link>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
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
