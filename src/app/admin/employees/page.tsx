
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


export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
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

        const tempPassword = Math.random().toString(36).slice(-8);
        const { tempApp, tempAuth } = createSecondaryApp();
        const userCredential = await createUserWithEmailAndPassword(tempAuth, currentEmployee.email!, tempPassword);

        await addDoc(collection(db, 'employees'), {
          ...currentEmployee,
          authUid: userCredential.user.uid,
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

  const getStatusBadgeVariant = (status: string) => {
      return status === 'Active' ? 'default' : 'secondary';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2" /> Invite Employee
        </Button>
      </div>
      
      {loading && (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8"/></div>
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
                    <DialogTitle>{currentEmployee?.id ? 'Edit Employee' : 'Invite New Employee'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the employee. An email will be sent for them to set their password and log in.
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
