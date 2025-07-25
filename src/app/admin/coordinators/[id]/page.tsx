
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp, collection, addDoc, serverTimestamp, writeBatch, query, where, getDocs, limit } from 'firebase/firestore';
import { db, createSecondaryApp } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Mail, Phone, Home, Calendar, User, Banknote, ChevronsRight, Briefcase, FileText, Download, KeyRound, Check, AtSign, Users2, Landmark, CalendarDays, CheckSquare, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, getMonth, startOfMonth } from 'date-fns';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { deleteApp } from 'firebase/app';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart } from 'recharts';

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
  computerKnowledge: string;
  experience: string;
  prevJob: string;
  languages: string[];
  positionType: 'district' | 'block' | 'panchayat';
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
  authUid?: string; // This will be set on approval
}

interface KisanCardApplication {
    id: string;
    name: string;
    submittedAt: Timestamp;
}

interface RecruitedCoordinator {
    id: string;
    fullName: string;
    positionType: 'district' | 'block' | 'panchayat';
    status: 'Received' | 'Approved' | 'Rejected';
}


export default function CoordinatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();

  const [application, setApplication] = useState<CoordinatorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [recruitedCoordinators, setRecruitedCoordinators] = useState<RecruitedCoordinator[]>([]);
  const [kisanCardsCreated, setKisanCardsCreated] = useState<KisanCardApplication[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loadingExtraData, setLoadingExtraData] = useState(true);

  // States for approval dialog
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchApplication = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'coordinator-applications', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const appData = { id: docSnap.id, ...docSnap.data() } as CoordinatorApplication;
          setApplication(appData);
          
          if (appData.status === 'Approved' && appData.authUid) {
            setLoadingExtraData(true);
            const thisMonthStart = startOfMonth(new Date());

            // Fetch recruited coordinators
            const recruitedQuery = query(collection(db, 'coordinator-applications'), where('uplineCoordinatorId', '==', appData.authUid));
            const recruitedSnapshot = await getDocs(recruitedQuery);
            setRecruitedCoordinators(recruitedSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as RecruitedCoordinator));

            // Fetch kisan cards
            const kisanCardsQuery = query(collection(db, 'kisan-jaivik-card-applications'), where('coordinatorId', '==', appData.authUid));
            const kisanCardsSnapshot = await getDocs(kisanCardsQuery);
            setKisanCardsCreated(kisanCardsSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as KisanCardApplication));

            // Fetch Attendance
            const attendanceQuery = query(collection(db, 'employees', appData.authUid, 'attendance'), where('markedAt', '>=', thisMonthStart));
            const attendanceSnapshot = await getDocs(attendanceQuery);
            setAttendance(attendanceSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

            setLoadingExtraData(false);
          }

          // Set default domain based on position type
          const positionToDomain = {
              district: '@distvanu.in',
              block: '@blckvanu.in',
              panchayat: '@panvanu.in'
          };
          setDomain(positionToDomain[appData.positionType] || '@panvanu.in');
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

    const attendanceByMonth = useMemo(() => {
        const data = Array(12).fill(0).map((_, i) => ({ name: format(new Date(0, i), 'MMM'), days: 0 }));
        attendance.forEach(att => {
            const month = getMonth(att.markedAt.toDate());
            data[month].days++;
        });
        return data;
    }, [attendance]);
  
  const handleStatusUpdate = async (newStatus: 'Rejected') => {
      if (!application) return;
      setIsUpdating(true);
      try {
        const docRef = doc(db, 'coordinator-applications', application.id);
        await updateDoc(docRef, { status: newStatus });
        setApplication(prev => prev ? {...prev, status: newStatus} : null);
        toast({ title: 'Status Updated', description: `Application has been ${newStatus.toLowerCase()}.` });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Update failed' });
      } finally {
          setIsUpdating(false);
      }
  }

  const handleApproveAndCreateEmployee = async () => {
    if (!application || !username || !password || !domain) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a username and password.' });
        return;
    }

    setIsUpdating(true);
    let tempApp;
    
    try {
        const loginEmail = `${username}${domain}`;
        
        // Use a temporary app instance to create user without logging in the admin
        const { tempApp: app, tempAuth } = createSecondaryApp();
        tempApp = app;

        // 1. Create Auth user in Firebase
        const userCredential = await createUserWithEmailAndPassword(tempAuth, loginEmail, password);
        const authUid = userCredential.user.uid;

        // 2. Prepare data for 'employees' collection
        const newEmployeeData = {
            authUid,
            name: application.fullName,
            email: loginEmail, // The new system email for login
            contactEmail: application.email, // The original personal email
            phone: application.mobile,
            role: application.positionType,
            status: 'Active',
            createdAt: serverTimestamp(),
            applicationId: application.id,
            ...application // Copy all other application details
        };
        delete (newEmployeeData as any).id;

        // 3. Use a batch write to ensure atomicity
        const batch = writeBatch(db);
        const newEmployeeRef = doc(db, 'employees', authUid); // Use authUid as doc id for easier lookup
        batch.set(newEmployeeRef, newEmployeeData);
        
        const applicationRef = doc(db, 'coordinator-applications', application.id);
        batch.update(applicationRef, { status: 'Approved', authUid: authUid });

        await batch.commit();

        toast({ title: 'Employee Created!', description: `${application.fullName} is now an employee.` });
        setIsApprovalDialogOpen(false);
        setApplication(prev => prev ? { ...prev, status: 'Approved', authUid } : null);

    } catch (error: any) {
        console.error("Approval error:", error);
        toast({ variant: 'destructive', title: 'Approval Failed', description: error.message });
    } finally {
        if (tempApp) await deleteApp(tempApp);
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
              <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
                <DialogTrigger asChild>
                    <Button disabled={isUpdating || application.status !== 'Received'}>
                        <Check className="mr-2 h-4 w-4"/>Approve
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Employee Account</DialogTitle>
                        <DialogDescription>
                            Set a username and temporary password for {application.fullName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid items-center gap-2">
                            <Label htmlFor="username">Login Username</Label>
                            <div className="flex items-center">
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                    className="rounded-r-none"
                                    placeholder="e.g., rishavkumar"
                                />
                                <Select value={domain} onValueChange={setDomain}>
                                    <SelectTrigger className="w-[150px] rounded-l-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="@distvanu.in">@distvanu.in</SelectItem>
                                        <SelectItem value="@blckvanu.in">@blckvanu.in</SelectItem>
                                        <SelectItem value="@panvanu.in">@panvanu.in</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid items-center gap-2">
                            <Label htmlFor="password">Temporary Password</Label>
                            <Input id="password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsApprovalDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleApproveAndCreateEmployee} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Approve & Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isUpdating || application.status !== 'Received'}>
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
        
        {application.status === 'Approved' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users2 /> Team Recruited</CardTitle>
                        <CardDescription>Coordinators added by {application.fullName}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingExtraData ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
                            recruitedCoordinators.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>Status</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recruitedCoordinators.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell>{c.fullName}</TableCell>
                                                <TableCell className="capitalize">{c.positionType}</TableCell>
                                                <TableCell><Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : <p className="text-muted-foreground text-sm">No coordinators recruited yet.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Landmark /> Kisan Cards Created</CardTitle>
                        <CardDescription>Kisan Jaivik Cards created by {application.fullName}.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        {loadingExtraData ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
                            kisanCardsCreated.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Farmer Name</TableHead><TableHead>Date</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {kisanCardsCreated.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell>{c.name}</TableCell>
                                                <TableCell>{format(c.submittedAt.toDate(), 'PPP')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : <p className="text-muted-foreground text-sm">No Kisan Jaivik Cards created yet.</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart3 /> Attendance History</CardTitle>
                        <CardDescription>Monthly attendance record for the current year.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loadingExtraData ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
                            <ChartContainer config={{ days: { label: 'Days', color: 'hsl(var(--primary))' }}} className="h-[250px] w-full">
                                <BarChart data={attendanceByMonth} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                    <Bar dataKey="days" radius={4} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </BarChart>
                            </ChartContainer>
                         )}
                    </CardContent>
                </Card>
             </div>
        )}

    </div>
  );
}
