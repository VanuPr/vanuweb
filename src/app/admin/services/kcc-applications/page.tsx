
"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface KccApplication {
  id: string;
  applicantName: string;
  bankName: string;
  loanAmount: string;
  submittedAt: Timestamp;
  status: 'Received' | 'Under Review' | 'Submitted' | 'Approved' | 'Rejected';
}


export default function KccApplicationsPage() {
  const [applications, setApplications] = useState<KccApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'kcc-applications'), orderBy('submittedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KccApplication));
            setApplications(appsData);
        } catch (error) {
            console.error("Error fetching KCC applications: ", error);
            toast({ variant: 'destructive', title: 'Failed to fetch applications.' });
        } finally {
            setLoading(false);
        }
    };

    fetchApplications();
  }, [toast]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Received': return 'default';
      case 'Under Review': return 'secondary';
      case 'Submitted': return 'default';
      case 'Approved': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Kisan Credit Card (KCC) Applications</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All KCC Applications</CardTitle>
          <CardDescription>View, manage, and process KCC application forms.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No applications found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.applicantName}</TableCell>
                    <TableCell>{app.bankName}</TableCell>
                    <TableCell>₹{Number(app.loanAmount).toLocaleString()}</TableCell>
                    <TableCell>{app.submittedAt.toDate().toLocaleDateString()}</TableCell>
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
                          <DropdownMenuItem>View Full Application</DropdownMenuItem>
                          <DropdownMenuItem>Update Status</DropdownMenuItem>
                          <DropdownMenuItem>Assign to Employee</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
