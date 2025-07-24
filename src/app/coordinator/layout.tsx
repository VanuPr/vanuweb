
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const verifyCoordinator = async () => {
      if (loadingAuth) return;
      if (!user) {
        router.push('/coordinator-login');
        return;
      }

      setLoadingRole(true);
      const q = query(collection(db, 'coordinator-applications'), where('email', '==', user.email), where('status', '==', 'Approved'));
      const coordinatorSnapshot = await getDocs(q);

      if (coordinatorSnapshot.empty) {
        auth.signOut();
        router.push('/coordinator-login');
      } else {
        setIsCoordinator(true);
      }
      setLoadingRole(false);
    };

    verifyCoordinator();
  }, [user, loadingAuth, router]);

  if (loadingAuth || loadingRole || !isCoordinator) {
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
                    <SidebarMenuButton href="/coordinator/dashboard" tooltip="Dashboard">
                        <LayoutDashboard />
                        Dashboard
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
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6" />
            <main className="p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
