
"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface JaivikCardApplication {
    id: string;
    name: string;
    village: string;
    mobile: string;
    status: 'Pending' | 'Completed';
    submittedAt: Timestamp;
}

export default function EmployeeDashboard() {
    const [applications, setApplications] = useState<JaivikCardApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'kisan-jaivik-card-applications'), where('status', '==', 'Pending'));
            const querySnapshot = await getDocs(q);
            const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JaivikCardApplication));
            setApplications(appsData);
        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch applications.' });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFinishTask = async (id: string) => {
        try {
            const appRef = doc(db, 'kisan-jaivik-card-applications', id);
            await updateDoc(appRef, { status: 'Completed' });
            toast({ title: 'Task Completed', description: 'The application has been marked as finished.' });
            fetchApplications(); // Refresh the list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update the task status.' });
        }
    }


  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Employee Dashboard</h1>
       <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending Kisaan Jaivik Card Applications</CardTitle>
            <CardDescription>Review and process the applications assigned to you.</CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
             ) : applications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending applications.</p>
             ) : (
                <ul className="space-y-3">
                    {applications.map(app => (
                        <li key={app.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                            <div>
                                <p className="font-semibold">{app.name}</p>
                                <p className="text-sm text-muted-foreground">{app.village} - {app.mobile}</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline"><Check className="mr-2 h-4 w-4"/> Finish Task</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will mark the application for {app.name} as completed. This cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleFinishTask(app.id)}>Yes, Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </li>
                    ))}
                </ul>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
