
"use client"

import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function EmployeeAccountPage() {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const router = useRouter();

    const [isDeleting, setIsDeleting] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const adminDeletionPassword = "VanuLtd.";

    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsDeleting(true);

        try {
            // Delete Firestore documents
            // The main employee record is in 'employees' collection with user.uid as doc ID
            const employeeRef = doc(db, 'employees', user.uid);
            await deleteDoc(employeeRef);
            
            // The original application might be in 'coordinator-applications'
            // We can check if it exists and delete it too.
            const appRef = doc(db, 'coordinator-applications', user.uid); // Assuming applicationId is uid from when they were created
            const appSnap = await getDoc(appRef);
            if(appSnap.exists()) {
                await deleteDoc(appRef);
            }

            // Finally, delete the Firebase Auth user. This is the irreversible step.
            await deleteUser(user);

            toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
            router.push('/');
        } catch (error: any) {
            console.error(error);
            // This error often happens if the user's auth token is old. Re-authentication is required for this sensitive operation.
            // We guide them to re-login to refresh their credentials.
            toast({ 
                variant: 'destructive', 
                title: 'Deletion Failed', 
                description: 'An error occurred. For security, you might need to log out and log back in before you can delete your account.' 
            });
        } finally {
            setIsDeleting(false);
            setDeletePassword(''); // Reset password field
        }
    }


    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">My Account</h1>
            
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><Trash2/> Delete Account</CardTitle>
                    <CardDescription>This action is irreversible. All your data, including attendance and performance records, will be permanently removed.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete My Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. To proceed, please enter the administrative password for deletion.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid gap-2">
                                <Label htmlFor="delete-password">Deletion Password</Label>
                                <Input 
                                    id="delete-password"
                                    type="password"
                                    placeholder="Enter password to confirm"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeletePassword('')}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleDeleteAccount} 
                                    disabled={isDeleting || deletePassword !== adminDeletionPassword}
                                >
                                     {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Delete Account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    )
}
