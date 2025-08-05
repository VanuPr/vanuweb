
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { Loader2, LogOut, LayoutDashboard, Landmark, Users, ClipboardList, PlusCircle, CalendarCheck, TrendingUp, Settings } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from '@/components/ui/sidebar';
import { AdminHeader } from '@/components/admin-header';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface EmployeeProfile {
    status: 'Active' | 'Paused' | 'Rejected';
}


export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [employeeStatus, setEmployeeStatus] = useState<'loading' | 'active' | 'suspended' | 'not_found'>('loading');
  const { toast } = useToast();
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    if (loadingAuth) {
      return; // Wait until auth state is loaded
    }
    if (!user) {
      router.replace('/employee-login');
      return;
    }

    const verifyEmployeeRole = async () => {
      // Allow special users immediate access
      if (user.email === 'dev@akm.com' || user.email === 'admin@vanu.com') {
          setEmployeeId(user.uid);
          setEmployeeStatus('active');
          return; 
      }

      // Check Firestore for employee record
      const q = query(collection(db, 'employees'), where('authUid', '==', user.uid), limit(1));
      const employeeSnapshot = await getDocs(q);

      if (employeeSnapshot.empty) {
        setEmployeeStatus('not_found');
      } else {
        const employeeData = employeeSnapshot.docs[0].data() as EmployeeProfile;
        const currentStatus = employeeData.status || 'Active';
        setEmployeeId(employeeSnapshot.docs[0].id);

        if (currentStatus === 'Paused' || currentStatus === 'Rejected') {
            setEmployeeStatus('suspended');
        } else {
            setEmployeeStatus('active');
        }
      }
    };
    verifyEmployeeRole();
  }, [user, loadingAuth, router]);

   useEffect(() => {
    if (employeeStatus === 'suspended') {
      router.replace('/employee/suspended');
    } else if (employeeStatus === 'not_found') {
      auth.signOut();
      router.replace('/employee-login');
    }
  }, [employeeStatus, router]);


   useEffect(() => {
    if (!employeeId) return;
    const checkAttendance = async () => {
      const today = new Date().toISOString().split('T')[0];
      const attendanceRef = doc(db, 'employees', employeeId, 'attendance', today);
      const docSnap = await getDoc(attendanceRef);
      if (docSnap.exists()) {
        setAttendanceMarked(true);
      }
    };
    checkAttendance();
  }, [employeeId]);

  const handleMarkAttendance = async () => {
    if (!employeeId) return;
    const today = new Date().toISOString().split('T')[0];
    const attendanceRef = doc(db, 'employees', employeeId, 'attendance', today);
    try {
      await setDoc(attendanceRef, { markedAt: Timestamp.now() });
      setAttendanceMarked(true);
      toast({ title: "Attendance Marked", description: "You have been marked present for today." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to mark attendance." });
    }
  };


  if (employeeStatus !== 'active') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
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
                        <Link href="/employee/coordinators" passHref>
                            <SidebarMenuButton tooltip="Coordinators">
                                <Users />
                                Coordinators
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/employee/recap" passHref>
                            <SidebarMenuButton tooltip="My Recap">
                                <TrendingUp />
                                My Recap
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/employee/account" passHref>
                            <SidebarMenuButton tooltip="My Account">
                                <Settings />
                                My Account
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
              <AdminHeader>
                  <Button onClick={handleMarkAttendance} disabled={attendanceMarked}>
                    <CalendarCheck className="mr-2 h-4 w-4"/>
                    {attendanceMarked ? 'Attendance Marked' : 'Mark Attendance'}
                  </Button>
              </AdminHeader>
              <main className="p-4 md:p-6 lg:p-8">
                  {children}
              </main>
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
