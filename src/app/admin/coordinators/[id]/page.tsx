
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Mail, Phone, Home, Calendar, User, Banknote, ChevronsRight, Briefcase, FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';
import { sendNotificationEmail } from '@/ai/flows/send-email-flow';

interface CoordinatorApplication {
  id: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  nationality: string;
  qualification: string;
  mobile: string;
  whatsappNo: string;
  email: string;
  village: string;
  post: string;
  panchayat: string;
  policeStation: string;
  blockName: string;
  pinCode: string;
  district: string;
  state: string;
  aadharNo: string;
  panNo: string;
  referenceDetails: string;
  referenceMobile: string;
  computerKnowledge: string;
  experience: string;
  prevJob: string;
  languages: string[];
  positionType: string;
  preferredLocation: string;
  whyJoin: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  paymentId: string;
  status: 'Received' | 'Approved' | 'Rejected';
  submittedAt: Timestamp;
  photoUrl?: string;
  aadharUrl?: string;
  panUrl?: string;
  signatureUrl?: string;
  passbookUrl?: string;
}

export default function CoordinatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();

  const [application, setApplication] = useState<CoordinatorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchApplication = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'coordinator-applications', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setApplication({ id: docSnap.id, ...docSnap.data() } as CoordinatorApplication);
        } else {
          toast({ variant: 'destructive', title: 'Application not found' });
          router.push('/admin/coordinators');
        }
      } catch (error) {
        console.error("Failed to fetch application data:", error);
        toast({ variant: 'destructive', title: 'Error fetching data' });
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, router, toast]);
  
  const handleStatusUpdate = async (newStatus: 'Approved' | 'Rejected') => {
      if (!application) return;
      setIsUpdating(true);
      try {
        const docRef = doc(db, 'coordinator-applications', application.id);
        await updateDoc(docRef, { status: newStatus });
        setApplication(prev => prev ? {...prev, status: newStatus} : null);
        toast({ title: 'Status Updated', description: `Application has been ${newStatus.toLowerCase()}.` });

        if (newStatus === 'Approved') {
            await sendNotificationEmail({
                to: application.email,
                subject: "Congratulations! Your Coordinator Application has been Approved",
                text: `Dear ${application.fullName},\n\nCongratulations! We are pleased to inform you that your application for the ${application.positionType} Coordinator role at Vanu Organic has been approved.\n\nPlease complete your employee registration by visiting this link: https://vanuorganic.com/employee-signup\n\nWelcome to the team!\n\nVanu Organic Pvt Ltd`,
                html: `<p>Dear ${application.fullName},</p>
                       <p>Congratulations! We are pleased to inform you that your application for the <strong>${application.positionType} Coordinator</strong> role at Vanu Organic has been approved.</p>
                       <p>To get started, please complete your employee registration by clicking the link below:</p>
                       <p><a href="https://vanuorganic.com/employee-signup">Create Your Employee Account</a></p>
                       <p>Welcome to the team!</p>
                       <p>Best regards,<br/><strong>Vanu Organic Pvt Ltd</strong></p>`
            });
            toast({ title: 'Approval Email Sent', description: 'The applicant has been notified.' });
        }

      } catch (error) {
          toast({ variant: 'destructive', title: 'Update failed' });
      } finally {
          setIsUpdating(false);
      }
  }
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Received': return 'default';
      case 'Approved': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };


  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }

  if (!application) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Application not found.</p></div>;
  }

  const documentLinks = [
    { name: 'Bank Passbook', url: application.passbookUrl },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <Avatar className="h-24 w-24">
            {application.photoUrl && <AvatarImage src={application.photoUrl} alt={application.fullName} />}
            <AvatarFallback className="text-4xl">{application.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="mt-4 sm:mt-0">
            <h1 className="text-3xl font-bold">{application.fullName}</h1>
            <p className="text-muted-foreground">{application.email}</p>
             <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="capitalize"><Briefcase className="mr-2 h-4 w-4" />{application.positionType} Coordinator</Badge>
                <Badge variant={getStatusBadgeVariant(application.status)}>{application.status}</Badge>
             </div>
          </div>
          <div className="sm:ml-auto mt-4 sm:mt-0 flex gap-2">
              <Button onClick={() => handleStatusUpdate('Approved')} disabled={isUpdating || application.status === 'Approved'}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Approve
              </Button>
              <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isUpdating || application.status === 'Rejected'}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Reject
              </Button>
          </div>
        </div>
      </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Personal & Contact Information</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Father's Name</span><span className="font-medium">{application.fatherName}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Mother's Name</span><span className="font-medium">{application.motherName}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Date of Birth</span><span className="font-medium">{application.dob}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Gender</span><span className="font-medium capitalize">{application.gender}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Qualification</span><span className="font-medium">{application.qualification}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Nationality</span><span className="font-medium">{application.nationality}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Mobile No.</span><span className="font-medium">{application.mobile}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">WhatsApp No.</span><span className="font-medium">{application.whatsappNo}</span></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Address Details</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><span className="font-medium">Village:</span> {application.village}</p>
                    <p><span className="font-medium">Post:</span> {application.post}</p>
                    <p><span className="font-medium">Panchayat:</span> {application.panchayat}</p>
                    <p><span className="font-medium">Block:</span> {application.blockName}</p>
                    <p><span className="font-medium">District:</span> {application.district}, {application.state} - {application.pinCode}</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>ID & Reference</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Aadhar No.</span><span className="font-medium">{application.aadharNo}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">PAN No.</span><span className="font-medium">{application.panNo}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Reference Name</span><span className="font-medium">{application.referenceDetails}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Reference Mobile</span><span className="font-medium">{application.referenceMobile}</span></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Bank Name</span><span className="font-medium">{application.bankName}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Account No.</span><span className="font-medium">{application.accountNumber}</span></div>
                    <div className="flex justify-between border-b pb-2 md:col-span-2"><span className="text-muted-foreground">IFSC Code</span><span className="font-medium">{application.ifscCode}</span></div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
                 <div className="grid md:grid-cols-3 gap-4">
                    <p><span className="font-medium">Computer Knowledge:</span> <Badge variant="outline">{application.computerKnowledge}</Badge></p>
                    <p><span className="font-medium">Work Experience:</span> <Badge variant="outline">{application.experience} years</Badge></p>
                    <p><span className="font-medium">Languages:</span> <Badge variant="outline">{application.languages.join(', ')}</Badge></p>
                 </div>
                 <div className="border-t pt-4">
                     <h4 className="font-medium">Previous Job Role:</h4>
                     <p className="text-muted-foreground">{application.prevJob}</p>
                 </div>
                 <div className="border-t pt-4">
                     <h4 className="font-medium">Preferred Location:</h4>
                     <p className="text-muted-foreground">{application.preferredLocation}</p>
                 </div>
                 <div className="border-t pt-4">
                     <h4 className="font-medium">Why do you want to join us?</h4>
                     <p className="text-muted-foreground whitespace-pre-wrap">{application.whyJoin}</p>
                 </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>Application Documents</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">Signature</h4>
                        {application.signatureUrl ? (
                            <a href={application.signatureUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={application.signatureUrl} alt="Signature" width={200} height={100} className="rounded-md border p-2 object-contain bg-muted hover:opacity-80 transition-opacity" />
                            </a>
                        ) : <p className="text-sm text-muted-foreground">Not uploaded</p>}
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Aadhar Card</h4>
                        {application.aadharUrl ? (
                             <a href={application.aadharUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={application.aadharUrl} alt="Aadhar Card" width={200} height={126} className="rounded-md border p-2 object-contain bg-muted hover:opacity-80 transition-opacity" />
                            </a>
                        ) : <p className="text-sm text-muted-foreground">Not uploaded</p>}
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">PAN Card</h4>
                        {application.panUrl ? (
                            <a href={application.panUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={application.panUrl} alt="PAN Card" width={200} height={126} className="rounded-md border p-2 object-contain bg-muted hover:opacity-80 transition-opacity" />
                            </a>
                        ) : <p className="text-sm text-muted-foreground">Not uploaded</p>}
                    </div>
                </div>
                 <div className="grid md:grid-cols-3 gap-4 border-t pt-6">
                    {documentLinks.map(doc => (
                        doc.url ? (
                            <a href={doc.url} key={doc.name} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="w-full">
                                    <Download className="mr-2 h-4 w-4"/> View {doc.name}
                                </Button>
                            </a>
                        ) : null
                    ))}
                 </div>
                 <p className="text-sm text-muted-foreground">Payment ID: {application.paymentId}</p>
            </CardContent>
        </Card>

    </div>
  );
}
