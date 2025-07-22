
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, PackageSearch, LogOut, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/employee-login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center justify-between">
                    <Logo />
                    <SidebarTrigger />
                 </div>
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/employee/dashboard" tooltip="Dashboard">
                        <LayoutDashboard />
                        Dashboard
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/employee/orders" tooltip="My Orders">
                        <PackageSearch />
                        My Orders
                    </SidebarMenuButton>
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
            <main className="p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
