
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, Timestamp, where } from 'firebase/firestore';
import { getDB, getAuthInstance } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface JaivikCardApplication {
  id: string;
  name: string;
  fatherName: string;
  mobile: string;
  village: string;
  panchayat: string;
  block: string;
  district: string;
  state: string;
  status: 'Received' | 'Approved' | 'Rejected' | 'payment_pending';
  submittedAt: Timestamp;
  coordinatorId: string;
  coordinatorName: string;
}

interface Employee {
  authUid: string;
  role: 'district' | 'block' | 'panchayat';
  district?: string;
  blockName?: string;
}

const ApplicationTable = ({ applications }: { applications: JaivikCardApplication[] }) => (
    <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Applicant Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {applications.map((app) => (
            <TableRow key={app.id}>
                <TableCell className="font-medium">
                    <div>{app.name}</div>
                    <div className="text-xs text-muted-foreground">S/O: {app.fatherName}</div>
                </TableCell>
                <TableCell>{`${app.village}, ${app.panchayat}`}</TableCell>
                <TableCell>{app.coordinatorName}</TableCell>
                <TableCell>{format(app.submittedAt.toDate(), 'PPP')}</TableCell>
                <TableCell>
                <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <Link href={`/employee/kisan-jaivik-card/${app.id}`}>
                        <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
    </Table>
);

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Received': return 'default';
      case 'Approved': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'payment_pending': return 'outline';
      default: return 'outline';
    }
  };


export default function KisanJaivikCardApplicationsPage() {
  const auth = getAuthInstance();
  const db = getDB();
  const [user, loadingAuth] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [myApplications, setMyApplications] = useState<JaivikCardApplication[]>([]);
  const [blockTeamApps, setBlockTeamApps] = useState<JaivikCardApplication[]>([]);
  const [panchayatTeamApps, setPanchayatTeamApps] = useState<JaivikCardApplication[]>([]);
  

  useEffect(() => {
    if (!user) return;

    const fetchApplications = async () => {
      setLoading(true);
      try {
        const empQuery = query(collection(db, 'employees'), where('authUid', '==', user.uid));
        const empSnapshot = await getDocs(empQuery);
        if (empSnapshot.empty) {
          setLoading(false);
          toast({variant: 'destructive', title: 'Employee profile not found'});
          return;
        }

        const profile = empSnapshot.docs[0].data() as Employee;
        setEmployeeProfile(profile);

        let subordinateIds: string[] = [];
        let blockCoordinatorIds: string[] = [];
        let panchayatCoordinatorIds: string[] = [];

        if (profile.role === 'district') {
            const teamQuery = query(collection(db, 'employees'), where('district', '==', profile.district));
            const teamSnapshot = await getDocs(teamQuery);
            teamSnapshot.forEach(doc => {
                const subordinate = doc.data();
                if(subordinate.authUid !== user.uid) { // Exclude self
                    subordinateIds.push(subordinate.authUid);
                    if (subordinate.role === 'block') blockCoordinatorIds.push(subordinate.authUid);
                    if (subordinate.role === 'panchayat') panchayatCoordinatorIds.push(subordinate.authUid);
                }
            });
        } else if (profile.role === 'block') {
             const teamQuery = query(collection(db, 'employees'), where('blockName', '==', profile.blockName), where('role', '==', 'panchayat'));
             const teamSnapshot = await getDocs(teamQuery);
             teamSnapshot.forEach(doc => {
                 subordinateIds.push(doc.data().authUid);
                 panchayatCoordinatorIds.push(doc.data().authUid);
            });
        }

        const allIdsToFetch = [user.uid, ...subordinateIds];
        
        if (allIdsToFetch.length > 0) {
            // Firestore 'in' queries are limited to 30 items. For larger teams, this needs pagination.
            const appsQuery = query(
                collection(db, 'kisan-jaivik-card-applications'), 
                where('coordinatorId', 'in', allIdsToFetch.slice(0, 30)),
                orderBy('submittedAt', 'desc')
            );
            const appsSnapshot = await getDocs(appsQuery);
            const allApps = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JaivikCardApplication));
            
            // Filter applications for each category
            setMyApplications(allApps.filter(app => app.coordinatorId === user.uid));
            if(profile.role === 'district') {
                setBlockTeamApps(allApps.filter(app => blockCoordinatorIds.includes(app.coordinatorId)));
            }
            setPanchayatTeamApps(allApps.filter(app => panchayatCoordinatorIds.includes(app.coordinatorId)));
        }

      } catch (error) {
        console.error("Error fetching applications: ", error);
        toast({ variant: 'destructive', title: 'Failed to fetch applications.' });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, toast, db]);


  if (loading || loadingAuth) {
    return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const renderContent = () => {
    if (!employeeProfile) return <p className="text-center text-muted-foreground py-10">Could not load your profile.</p>;
    
    if (employeeProfile.role === 'panchayat') {
        return <ApplicationTable applications={myApplications} />;
    }

    const tabs = [
        { value: 'my', label: `My Applications (${myApplications.length})`, data: myApplications },
    ];
    if(employeeProfile.role === 'district') {
         tabs.push({ value: 'block', label: `Block Team (${blockTeamApps.length})`, data: blockTeamApps });
    }
    tabs.push({ value: 'panchayat', label: `Panchayat Team (${panchayatTeamApps.length})`, data: panchayatTeamApps });


    return (
        <Tabs defaultValue="my">
            <TabsList>
                {tabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
            </TabsList>
            {tabs.map(tab => (
                 <TabsContent key={tab.value} value={tab.value} className="mt-4">
                     {tab.data.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">No applications found in this tab.</p>
                     ) : (
                        <ApplicationTable applications={tab.data} />
                     )}
                </TabsContent>
            ))}
        </Tabs>
    );
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Kisan Jaivik Card Applications</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Application Review</CardTitle>
          <CardDescription>Review and manage Kisan Jaivik Card applications created by you and your team.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
