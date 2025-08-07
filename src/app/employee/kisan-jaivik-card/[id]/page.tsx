
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDB, getAuthInstance } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useAuthState } from 'react-firebase-hooks/auth';

interface Application {
  id: string;
  name: string;
  fatherName: string;
  dob: string;
  idType: string;
  idNumber: string;
  mobile: string;
  village: string;
  panchayat: string;
  block: string;
  district: string;
  pinCode: string;
  state: string;
  paymentMethod: string;
  paymentId?: string;
  photoUrl?: string;
  signatureUrl?: string;
  status: 'Received' | 'Approved' | 'Rejected' | 'payment_pending';
  submittedAt: any;
  coordinatorName: string;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();
  const auth = getAuthInstance();
  const db = getDB();
  const [user, loadingAuth] = useAuthState(auth);

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isAdmin = user && user.email === 'admin@vanu.com';

  useEffect(() => {
    if (!id) return;

    const fetchApplication = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'kisan-jaivik-card-applications', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setApplication({ id: docSnap.id, ...docSnap.data() } as Application);
        } else {
          toast({ variant: 'destructive', title: 'Application not found' });
          router.push('/employee/kisan-jaivik-card');
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching application data' });
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, router, toast, db]);

  const handleStatusUpdate = async (newStatus: 'Approved' | 'Rejected') => {
    if (!application) return;
    setIsUpdating(true);
    try {
      const docRef = doc(db, 'kisan-jaivik-card-applications', application.id);
      await updateDoc(docRef, { status: newStatus });
      setApplication(prev => prev ? { ...prev, status: newStatus } : null);
      toast({ title: 'Status Updated', description: `Application has been ${newStatus}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update failed' });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Received': return 'default';
      case 'Approved': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'payment_pending': return 'outline';
      default: return 'outline';
    }
  };


  if (loading || loadingAuth) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }

  if (!application) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Application not found.</p></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <div className="mt-4 sm:mt-0">
            <h1 className="text-3xl font-bold">{application.name}</h1>
            <p className="text-muted-foreground">S/O: {application.fatherName}</p>
             <div className="flex items-center gap-4 mt-2">
                <Badge variant={getStatusBadgeVariant(application.status)}>{application.status}</Badge>
                <p className="text-sm text-muted-foreground">Created by: {application.coordinatorName}</p>
             </div>
          </div>
          {isAdmin && application.status === 'Received' && (
            <div className="sm:ml-auto mt-4 sm:mt-0 flex gap-2">
                <Button onClick={() => handleStatusUpdate('Approved')} disabled={isUpdating}>
                    <Check className="mr-2 h-4 w-4"/> Approve
                </Button>
                <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isUpdating}>
                    <X className="mr-2 h-4 w-4"/> Reject
                </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Applicant Details</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Date of Birth</span><span className="font-medium">{application.dob}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Mobile No.</span><span className="font-medium">{application.mobile}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">ID Type</span><span className="font-medium capitalize">{application.idType}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">ID Number</span><span className="font-medium">{application.idNumber}</span></div>
                <div className="flex justify-between border-b pb-2 md:col-span-2"><span className="text-muted-foreground">Address</span><span className="font-medium text-right">{`${application.village}, ${application.panchayat}, ${application.block}, ${application.district}, ${application.state} - ${application.pinCode}`}</span></div>
            </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
              <CardHeader className="p-4"><CardTitle className="text-lg">Applicant Photo</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                  {application.photoUrl ? (
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md border">
                        <Image src={application.photoUrl} alt={application.name} layout="fill" objectFit="cover" />
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No photo uploaded</p>}
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-lg">Payment Information</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium capitalize">{application.paymentMethod}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment ID</span><span className="font-mono text-xs text-right break-all">{application.paymentId || 'N/A'}</span></div>
              </CardContent>
          </Card>
        </div>
      </div>

      <Card>
          <CardHeader><CardTitle>Uploaded Documents</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                  <h4 className="font-semibold mb-2">Signature</h4>
                  {application.signatureUrl ? (
                      <a href={application.signatureUrl} target="_blank" rel="noopener noreferrer">
                          <Image src={application.signatureUrl} alt="Signature" width={200} height={100} className="rounded-md border p-2 object-contain bg-muted hover:opacity-80 transition-opacity" />
                      </a>
                  ) : <p className="text-sm text-muted-foreground">Not uploaded</p>}
              </div>
          </CardContent>
      </Card>

    </div>
  );
}
