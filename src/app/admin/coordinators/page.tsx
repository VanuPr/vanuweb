
"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, Check, X, Eye, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CoordinatorApplication {
  id: string;
  fullName: string;
  mobile: string;
  district: string;
  blockName: string;
  panchayat: string;
  status: 'Received' | 'Approved' | 'Rejected' | 'payment_pending';
  submittedAt: Timestamp;
}

export default function CoordinatorApplicationsPage() {
  const [applications, setApplications] = useState<CoordinatorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApplications = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'coordinator-applications'), orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const allApps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoordinatorApplication));
        setApplications(allApps);
      } catch (error) {
        console.error("Error fetching applications: ", error);
        toast({ variant: 'destructive', title: 'Failed to fetch applications.' });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchApplications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleRejectStatus = async (id: string) => {
      try {
          const docRef = doc(db, 'coordinator-applications', id);
          await updateDoc(docRef, { status: 'Rejected' });
          toast({ title: 'Status updated successfully' });
          fetchApplications(); // Refresh list
      } catch (error) {
          toast({ variant: 'destructive', title: 'Failed to update status'});
      }
  }
  
  const pendingApplications = applications.filter(app => app.status === 'Received' || app.status === 'payment_pending');
  const approvedApplications = applications.filter(app => app.status === 'Approved');

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Received': return 'default';
      case 'Approved': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'payment_pending': return 'outline';
      default: return 'outline';
    }
  };

  const ApplicationTable = ({ applications }: { applications: CoordinatorApplication[] }) => (
     <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {applications.map((app) => (
            <TableRow key={app.id}>
                <TableCell className="font-medium">{app.fullName}</TableCell>
                <TableCell>{app.mobile}</TableCell>
                <TableCell>{`${app.panchayat}, ${app.blockName}, ${app.district}`}</TableCell>
                <TableCell>{app.submittedAt?.toDate().toLocaleDateString() || 'N/A'}</TableCell>
                <TableCell>
                <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/coordinators/${app.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                    </DropdownMenuItem>
                    {app.status === 'Received' && (
                        <>
                        <DropdownMenuItem asChild>
                           <Link href={`/admin/coordinators/${app.id}`}>
                                <Check className="mr-2 h-4 w-4" /> Approve
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleRejectStatus(app.id)}>
                            <X className="mr-2 h-4 w-4" /> Reject
                        </DropdownMenuItem>
                        </>
                    )}
                    </DropdownMenuContent>
                </DropdownMenu>
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
    </Table>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Coordinator Applications</h1>
         <Link href="/employee-registration">
          <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Coordinator
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Application Management</CardTitle>
          <CardDescription>Review and manage coordinator applications.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({approvedApplications.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                     {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                     ) : pendingApplications.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">No pending applications found.</p>
                     ) : (
                        <ApplicationTable applications={pendingApplications} />
                     )}
                </TabsContent>
                <TabsContent value="approved" className="mt-4">
                     {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                     ) : approvedApplications.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">No approved applications found.</p>
                     ) : (
                        <ApplicationTable applications={approvedApplications} />
                     )}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
