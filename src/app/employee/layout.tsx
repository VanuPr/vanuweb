
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { Loader2, LogOut, LayoutDashboard, Landmark, Users, ClipboardList, PlusCircle, CalendarCheck, TrendingUp } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from '@/components/ui/sidebar';
import { AdminHeader } from '@/components/admin-header';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [isEmployee, setIsEmployee] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const { toast } = useToast();
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

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
          setEmployeeId(user.uid);
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
        setEmployeeId(employeeSnapshot.docs[0].id); // The document ID is the employee ID
      }
      setLoadingRole(false);
    };
    verifyEmployeeRole();
  }, [user, loadingAuth, router]);

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
