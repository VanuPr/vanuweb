
"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth, createSecondaryApp } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, MoreHorizontal, KeyRound, Mail, Phone, Home, Calendar, User, Check, X, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { sendNotificationEmail } from '@/ai/flows/send-email-flow';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';


interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Manager' | 'Task Handler';
  status: 'Active' | 'Paused';
  dob?: string;
  address?: string;
  joiningDate?: string;
  aadharNo?: string;
  panNo?: string;
  createdAt: any;
  authUid?: string;
}

interface EmployeeApplication {
  id: string;
  fullName: string;
  personalEmail: string;
  employeeEmail: string;
  phone: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: any;
  password?: string;
  dob?: string;
  address?: string;
  aadharNo?: string;
  panNo?: string;
  joiningDate?: string;
}


export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [applications, setApplications] = useState<EmployeeApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const qEmployees = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
      const employeesSnapshot = await getDocs(qEmployees);
      const employeesData = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(employeesData);

      const qApps = query(collection(db, 'employee-applications'), where('status', '==', 'Pending'), orderBy('fullName', 'asc'));
      const appsSnapshot = await getDocs(qApps);
      const appsData = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeApplication));
      setApplications(appsData);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: 'destructive', title: 'Error fetching data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = (employee: Partial<Employee> | null = null) => {
    setCurrentEmployee(employee ? { ...employee } : { name: '', email: '', phone: '', role: 'Task Handler', status: 'Active' });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setCurrentEmployee(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentEmployee) return;
    const { id, value } = e.target;
    setCurrentEmployee(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (name: keyof Employee, value: string) => {
    if (!currentEmployee) return;
    setCurrentEmployee(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    if (!currentEmployee.name || !currentEmployee.email || !currentEmployee.role || !currentEmployee.status) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill all required fields.'});
        return;
    }

    setIsSubmitting(true);
    try {
      if (currentEmployee.id) {
        // Update existing employee
        const employeeRef = doc(db, 'employees', currentEmployee.id);
        await updateDoc(employeeRef, currentEmployee);
        toast({ title: 'Employee Updated' });
      } else {
        // Create new employee
        const q = query(collection(db, 'employees'), where('email', '==', currentEmployee.email));
        const existing = await getDocs(q);
        if (!existing.empty) {
            toast({ variant: 'destructive', title: 'User Exists', description: 'An employee with this email already exists.'});
            setIsSubmitting(false);
            return;
        }
        await addDoc(collection(db, 'employees'), {
          ...currentEmployee,
          createdAt: serverTimestamp()
        });
        await sendPasswordResetEmail(auth, currentEmployee.email!);
        toast({ 
            title: 'Employee Added & Invite Sent', 
            description: `An email has been sent to ${currentEmployee.email} for them to set their password.` 
        });
      }
      fetchData();
      handleDialogClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Operation Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteEmployee = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this employee? This will only remove them from the database, not their authentication account.")) return;
      try {
          await deleteDoc(doc(db, 'employees', id));
          toast({ title: 'Employee Deleted' });
          fetchData();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Deletion Failed'});
      }
  };

  const handleSendPasswordReset = async (email: string) => {
    if (!window.confirm(`Are you sure you want to send a password reset link to ${email}?`)) return;
    try {
        await sendPasswordResetEmail(auth, email);
        toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${email} with instructions.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to Send', description: error.message });
    }
  }

  const handleApprove = async (app: EmployeeApplication) => {
    if (!app.password) {
        toast({ variant: 'destructive', title: 'Approval Failed', description: 'Password not found for this application.' });
        return;
    }

    const { tempApp, tempAuth } = createSecondaryApp();

    try {
        const userCredential = await createUserWithEmailAndPassword(tempAuth, app.employeeEmail, app.password);
        const user = userCredential.user;

        await addDoc(collection(db, 'employees'), {
            name: app.fullName,
            email: app.employeeEmail,
            phone: app.phone,
            role: 'Task Handler',
            status: 'Active',
            dob: app.dob,
            address: app.address,
            aadharNo: app.aadharNo,
            panNo: app.panNo,
            joiningDate: app.joiningDate,
            createdAt: serverTimestamp(),
            authUid: user.uid,
        });

        const appRef = doc(db, 'employee-applications', app.id);
        await updateDoc(appRef, { status: 'Approved' });
        
        await sendNotificationEmail({
            to: app.personalEmail,
            subject: "Your Application to Vanu Organic has been Approved!",
            text: `Congratulations, ${app.fullName}! Your application has been approved. You can now log in using the email ${app.employeeEmail} and the password you created.`,
            html: `<p>Congratulations, ${app.fullName}!</p><p>Your application has been approved. You can now log in using the email <strong>${app.employeeEmail}</strong> and the password you created.</p>`
        });
        
        toast({ title: "Application Approved!", description: `${app.fullName}'s account has been created.` });
        fetchData();

      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Approval Failed', description: error.message });
      }
  }

  const handleReject = async (app: EmployeeApplication) => {
       try {
        const appRef = doc(db, 'employee-applications', app.id);
        await updateDoc(appRef, { status: 'Rejected' });

        await sendNotificationEmail({
            to: app.personalEmail,
            subject: "Update on your Vanu Organic Application",
            text: `Hello ${app.fullName},\n\nThank you for your interest. After careful consideration, we have decided not to move forward with your application at this time.\n\nBest regards,\nVanu Organic Team`,
            html: `<p>Hello ${app.fullName},</p><p>Thank you for your interest. After careful consideration, we have decided not to move forward with your application at this time.</p><p>Best regards,<br/>Vanu Organic Team</p>`
        });
        
        toast({ title: "Application Rejected", variant: 'destructive' });
        fetchData();
       } catch (error: any) {
           toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
       }
  }


  const getStatusBadgeVariant = (status: string) => {
      return status === 'Active' ? 'default' : 'secondary';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2" /> Add Employee
        </Button>
      </div>
      
      {loading && (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8"/></div>
      )}

      {!loading && applications.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle>Pending Applications ({applications.length})</CardTitle>
                <CardDescription>Review and manage new employee applications.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Applicant Name</TableHead>
                            <TableHead>Login Email</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map(app => (
                            <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.fullName}</TableCell>
                                <TableCell>{app.employeeEmail}</TableCell>
                                <TableCell>{app.submittedAt?.toDate().toLocaleDateString() || 'N/A'}</TableCell>
                                <TableCell className="text-right flex gap-2 justify-end">
                                     <Dialog>
                                        <DialogTrigger asChild>
                                           <Button variant="ghost" size="sm">View Details</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Application Details</DialogTitle>
                                                <DialogDescription>Reviewing application for {app.fullName}.</DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-16 w-16"><AvatarFallback>{app.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{app.fullName}</h3>
                                                        <p className="text-sm text-muted-foreground">{app.employeeEmail}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> {app.personalEmail}</p>
                                                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> {app.phone}</p>
                                                    <p className="flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground"/> {app.address}</p>
                                                    <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/> DOB: {app.dob}</p>
                                                    <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> Aadhar: {app.aadharNo}</p>
                                                    <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> PAN: {app.panNo}</p>
                                                    <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/> Joining: {app.joiningDate}</p>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    <Button size="sm" onClick={() => handleApprove(app)}><Check className="mr-2 h-4 w-4"/>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleReject(app)}><X className="mr-2 h-4 w-4"/>Reject</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>
            Manage active employees. Click 'View Profile' to see detailed stats.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {!loading && employees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active employees found.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email & Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map(emp => (
                            <TableRow key={emp.id}>
                                <TableCell className="font-medium">{emp.name}</TableCell>
                                <TableCell>
                                    <div>{emp.email}</div>
                                    <div className="text-muted-foreground text-xs">{emp.phone}</div>
                                </TableCell>
                                <TableCell>{emp.role}</TableCell>
                                <TableCell><Badge variant={getStatusBadgeVariant(emp.status)}>{emp.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/employees/${emp.id}`}><Eye className="mr-2 h-4 w-4"/> View Profile</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenDialog(emp)}><Edit className="mr-2 h-4 w-4"/>Edit Details</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleSendPasswordReset(emp.email)}><KeyRound className="mr-2 h-4 w-4"/>Send Password Reset</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteEmployee(emp.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete from DB</DropdownMenuItem>
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => { e.preventDefault(); }} >
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{currentEmployee?.id ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the employee. Click save when you're done. A password setup link will be sent to their email.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={currentEmployee?.name || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={currentEmployee?.email || ''} onChange={handleInputChange} required disabled={isSubmitting || !!currentEmployee?.id}/>
                        </div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" type="tel" value={currentEmployee?.phone || ''} onChange={handleInputChange} disabled={isSubmitting}/>
                        </div>
                        <div className="grid gap-2">
                           <Label htmlFor="dob">Date of Birth</Label>
                           <Input id="dob" type="date" value={currentEmployee?.dob || ''} onChange={handleInputChange} disabled={isSubmitting}/>
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" value={currentEmployee?.address || ''} onChange={handleInputChange} disabled={isSubmitting}/>
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="aadharNo">Aadhar Number</Label>
                            <Input id="aadharNo" value={currentEmployee?.aadharNo || ''} onChange={handleInputChange} disabled={isSubmitting}/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="panNo">PAN Number</Label>
                            <Input id="panNo" value={currentEmployee?.panNo || ''} onChange={handleInputChange} disabled={isSubmitting}/>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={currentEmployee?.role} onValueChange={(v) => handleSelectChange('role', v as Employee['role'])} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Task Handler">Task Handler</SelectItem>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={currentEmployee?.status} onValueChange={(v) => handleSelectChange('status', v as Employee['status'])} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Paused">Paused</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="joiningDate">Joining Date</Label>
                        <Input id="joiningDate" type="date" value={currentEmployee?.joiningDate || ''} onChange={handleInputChange} disabled={isSubmitting}/>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 animate-spin"/>}
                        Save changes
                    </Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}

    