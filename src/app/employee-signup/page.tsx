
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { setDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function EmployeeSignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        personalEmail: '',
        phone: '',
        username: '',
        password: '',
        confirmPassword: '',
        dob: '',
        address: '',
        aadharNo: '',
        panNo: '',
        joiningDate: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast({ variant: 'destructive', title: 'Passwords do not match.' });
            return;
        }
        if (formData.password.length < 6) {
            toast({ variant: 'destructive', title: 'Password must be at least 6 characters.' });
            return;
        }

        setIsLoading(true);

        const employeeEmail = `${formData.username}@vanuemp.in`;
        
        try {
            // Check if username is already taken in applications or employees
            const appQuery = query(collection(db, 'employee-applications'), where('employeeEmail', '==', employeeEmail));
            const empQuery = query(collection(db, 'employees'), where('email', '==', employeeEmail));
            const [appSnapshot, empSnapshot] = await Promise.all([getDocs(appQuery), getDocs(empQuery)]);

            if (!appSnapshot.empty || !empSnapshot.empty) {
                toast({ variant: 'destructive', title: 'Username taken', description: 'This username is already in use or pending approval. Please choose another.'});
                setIsLoading(false);
                return;
            }

            // Save application to Firestore
            const { confirmPassword, ...applicationData } = formData;
            const finalData = {
                ...applicationData,
                employeeEmail,
                status: 'Pending',
                submittedAt: serverTimestamp()
            };
            
            await addDoc(collection(db, 'employee-applications'), finalData);
            
            toast({ title: 'Application Submitted', description: 'Your application has been sent for review. You will be notified upon approval.' });
            router.push('/employee-login');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Application Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 flex items-center justify-center py-16 md:py-24">
                <Card className="w-full max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle className="text-2xl font-headline">Employee Registration</CardTitle>
                            <CardDescription>Fill out the form to apply to join our team. Your application will be reviewed by an admin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" value={formData.fullName} onChange={handleInputChange} required disabled={isLoading} />
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="personalEmail">Personal Email (for communication)</Label>
                                    <Input id="personalEmail" type="email" value={formData.personalEmail} onChange={handleInputChange} required disabled={isLoading} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} required disabled={isLoading} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} required disabled={isLoading} />
                                </div>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Textarea id="address" value={formData.address} onChange={handleInputChange} required disabled={isLoading} />
                            </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="aadharNo">Aadhar Number</Label>
                                    <Input id="aadharNo" value={formData.aadharNo} onChange={handleInputChange} required disabled={isLoading} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="panNo">PAN Number</Label>
                                    <Input id="panNo" value={formData.panNo} onChange={handleInputChange} required disabled={isLoading} />
                                </div>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="joiningDate">Preferred Joining Date</Label>
                                <Input id="joiningDate" type="date" value={formData.joiningDate} onChange={handleInputChange} required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2 border-t pt-4">
                                 <Label htmlFor="username">Choose your official username</Label>
                                <div className="flex items-center">
                                    <Input id="username" value={formData.username} onChange={handleInputChange} className="rounded-r-none" required disabled={isLoading} />
                                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 bg-muted text-muted-foreground text-sm h-10">
                                        @vanuemp.in
                                    </span>
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required disabled={isLoading} />
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required disabled={isLoading} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 pt-6">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : null}
                                Submit Application
                            </Button>
                            <p className="text-center text-sm text-muted-foreground">
                              Already applied?{' '}
                              <Link href="/employee-login" className="underline">
                                Back to Login
                              </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
