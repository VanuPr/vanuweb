
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuthInstance, getDB } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface EmployeeProfile {
    role: 'district' | 'block' | 'panchayat' | 'Admin';
}

export default function EmployeeDashboardRouter() {
  const auth = getAuthInstance();
  const db = getDB();
  const [user, loadingAuth] = useAuthState(auth);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      router.replace('/employee-login');
      return;
    }

    const fetchRoleAndRedirect = async () => {
      try {
        const empQuery = query(collection(db, 'employees'), where('authUid', '==', user.uid), limit(1));
        const empSnapshot = await getDocs(empQuery);

        if (!empSnapshot.empty) {
          const profile = empSnapshot.docs[0].data() as EmployeeProfile;
          setEmployeeProfile(profile);
          // Redirect based on role
          switch (profile.role) {
            case 'district':
              router.replace('/employee/dashboard/district');
              break;
            case 'block':
              router.replace('/employee/dashboard/block');
              break;
            case 'panchayat':
              router.replace('/employee/dashboard/panchayat');
              break;
            default:
              // Fallback for other roles or misconfigurations
              router.replace('/employee-login');
              break;
          }
        } else {
          // If no employee profile found, sign out and redirect
          auth.signOut();
          router.replace('/employee-login');
        }
      } catch (error) {
        console.error("Error fetching employee role:", error);
        auth.signOut();
        router.replace('/employee-login');
      } finally {
        // setLoadingRole(false) is not strictly needed because a redirect will happen
      }
    };

    fetchRoleAndRedirect();
  }, [user, loadingAuth, router, db, auth]);

  // Display a loader while we determine the user's role and redirect
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="ml-2">Loading your dashboard...</p>
    </div>
  );
}
