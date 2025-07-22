
"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, MoreHorizontal, KeyRound } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Manager' | 'Task Handler';
  status: 'Active' | 'Paused';
  createdAt: any;
  authUid?: string; // To store Firebase Auth UID
}

// A simplified auth function to run on the server - in a real app, this would be a secure backend call
async function createAuthUser(email: string, name: string) {
    // This is a placeholder for a secure backend function.
    // In a real application, you would call a Cloud Function to create the user
    // to avoid exposing admin credentials on the client.
    console.warn("Using insecure method to create user. This is for demonstration only.");
    
    // For now, we are skipping actual user creation from the client for security.
    // We will just send a password reset link to the email.
    // This assumes the user has already been created in the Firebase console.
    return { success: true, message: "Password reset can be sent." };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> | null>(null);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const employeesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(employeesData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching employees' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        await updateDoc(employeeRef, { ...currentEmployee });
        toast({ title: 'Employee Updated' });
      } else {
        // Check if employee email already exists
        const q = query(collection(db, 'employees'), where('email', '==', currentEmployee.email));
        const existing = await getDocs(q);
        if (!existing.empty) {
            toast({ variant: 'destructive', title: 'User Exists', description: 'An employee with this email already exists.'});
            setIsSubmitting(false);
            return;
        }

        // IMPORTANT: In a production app, user creation MUST be handled by a secure backend (e.g., Firebase Cloud Function).
        // The placeholder function below simulates this. We are not creating the user here from the client.
        const authResult = await createAuthUser(currentEmployee.email, currentEmployee.name);

        if (!authResult.success) {
            throw new Error(authResult.message || "Failed to create authentication user.");
        }
        
        await addDoc(collection(db, 'employees'), {
          ...currentEmployee,
          createdAt: serverTimestamp()
        });
        toast({ title: 'Employee Added', description: 'You can now send them a password reset email.' });
      }
      fetchEmployees();
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
          fetchEmployees();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Deletion Failed'});
      }
  };

  const handleSendPasswordReset = async (email: string) => {
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
          <PlusCircle className="mr-2" /> Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>View, add, edit, or remove employees. NOTE: You must create employee accounts in the Firebase Authentication console first.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8"/></div>
            ) : employees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No employees found. Add one to get started.</p>
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
          <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => { e.preventDefault(); }} >
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{currentEmployee?.id ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the employee. Click save when you're done. Remember to create their login in Firebase Auth.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={currentEmployee?.name || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={currentEmployee?.email || ''} onChange={handleInputChange} required disabled={isSubmitting || !!currentEmployee?.id}/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" value={currentEmployee?.phone || ''} onChange={handleInputChange} disabled={isSubmitting}/>
                    </div>
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
