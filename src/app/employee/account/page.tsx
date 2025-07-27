
"use client"

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthState, useUpdatePassword } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Trash2, Eye, EyeOff } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const passwordSchema = z.object({
    newPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export default function EmployeeAccountPage() {
    const [user] = useAuthState(auth);
    const [updatePassword, updating, updateError] = useUpdatePassword(auth);
    const { toast } = useToast();
    const router = useRouter();

    const [isDeleting, setIsDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
        const success = await updatePassword(values.newPassword);
        if (success) {
            toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
            form.reset();
        } else if (updateError) {
             toast({ variant: 'destructive', title: 'Update Failed', description: updateError.message });
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsDeleting(true);

        try {
            // Delete Firestore documents
            const employeeRef = doc(db, 'employees', user.uid);
            await deleteDoc(employeeRef);
            
            const appRef = doc(db, 'coordinator-applications', user.uid); // Assuming applicationId is uid
            const appSnap = await doc(db, 'coordinator-applications', user.uid);
            if(appSnap) {
                await deleteDoc(appRef);
            }

            // Delete Auth user
            await deleteUser(user);

            toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
            router.push('/');
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Deletion Failed', description: 'An error occurred. You might need to log out and log back in to perform this action.' });
        } finally {
            setIsDeleting(false);
        }
    }


    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">My Account</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound/> Change Your Password</CardTitle>
                    <CardDescription>Enter a new password below to update your credentials.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                           <div className="relative">
                                             <Input type={showPassword ? 'text' : 'password'} {...field} disabled={updating}/>
                                              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOff /> : <Eye />}
                                             </Button>
                                           </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <Input type={showPassword ? 'text' : 'password'} {...field} disabled={updating}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={updating}>
                                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Update Password
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><Trash2/> Delete Account</CardTitle>
                    <CardDescription>This action is irreversible. All your data will be permanently removed.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isDeleting}>Delete My Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                                     {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    )
}
