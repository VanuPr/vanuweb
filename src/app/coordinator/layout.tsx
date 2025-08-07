
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuthInstance, getDB } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

interface CoordinatorProfile {
    status: 'Approved' | 'Paused' | 'Rejected' | 'Received';
}

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const auth = getAuthInstance();
  const db = getDB();
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [accessStatus, setAccessStatus] = useState<'loading' | 'granted' | 'suspended' | 'not_found'>('loading');

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      router.replace('/coordinator-login');
      return;
    }

    const verifyCoordinator = async () => {
      setAccessStatus('loading');
      try {
        const q = query(
          collection(db, 'coordinator-applications'), 
          where('email', '==', user.email), 
          limit(1)
        );
        const coordinatorSnapshot = await getDocs(q);

        if (coordinatorSnapshot.empty) {
          setAccessStatus('not_found');
        } else {
          const profile = coordinatorSnapshot.docs[0].data() as CoordinatorProfile;
          if (profile.status === 'Approved') {
            setAccessStatus('granted');
          } else {
            setAccessStatus('suspended');
          }
        }
      } catch (error) {
        console.error("Error verifying coordinator:", error);
        setAccessStatus('not_found'); // Treat errors as not found for security
      }
    };

    verifyCoordinator();
  }, [user, loadingAuth, router, db]);

  useEffect(() => {
    if (accessStatus === 'suspended') {
      router.replace('/employee/suspended');
    } else if (accessStatus === 'not_found') {
      auth.signOut();
      router.replace('/coordinator-login');
    }
  }, [accessStatus, router, auth]);


  if (accessStatus !== 'granted') {
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
