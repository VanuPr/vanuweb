
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Loader2, LogOut, LayoutDashboard, Landmark, Users, ClipboardList, PlusCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from '@/components/ui/sidebar';
import { AdminHeader } from '@/components/admin-header';


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

      const q = query(collection(db, 'employees'), where('authUid', '==', user.uid));
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
                        <Link href="/employee/create-kisan-card" passHref>
                            <SidebarMenuButton tooltip="Create Kisan Jaivik Card">
                                <PlusCircle />
                                Create Kisan Card
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/employee/kisan-jaivik-card" passHref>
                            <SidebarMenuButton tooltip="View Kisan Jaivik Card Applications">
                                <ClipboardList />
                                View Card Applications
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/admin/coordinators" passHref>
                            <SidebarMenuButton tooltip="Coordinators">
                                <Users />
                                Coordinators
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
