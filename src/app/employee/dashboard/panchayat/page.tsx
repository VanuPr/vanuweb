
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, BarChart, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { startOfMonth } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Application {
    id: string;
    name: string; // Farmer's name
    village: string;
    panchayat: string;
    submittedAt: Timestamp;
}

export default function PanchayatDashboardPage() {
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<Application[]>([]);

    useEffect(() => {
        if (!user) return;
        
        const fetchMyData = async () => {
            setLoading(true);
            try {
                const monthStart = startOfMonth(new Date());
                const appsQuery = query(
                    collection(db, 'kisan-jaivik-card-applications'),
                    where('coordinatorId', '==', user.uid),
                    where('submittedAt', '>=', monthStart),
                    orderBy('submittedAt', 'desc')
                );
                const appsSnapshot = await getDocs(appsQuery);
                const appsData = appsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Application));
                setApplications(appsData);

            } catch (error) {
                console.error("Error fetching my data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyData();
    }, [user]);


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Panchayat Coordinator Dashboard</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
            <Landmark className="mx-auto h-12 w-12 text-primary mb-4"/>
            <CardTitle className="text-2xl">Create Kisan Jaivik Card</CardTitle>
            <CardDescription>Your primary role is to register farmers and create Kisan Jaivik Cards for them. Click the button below to get started.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
             <Link href="/employee/create-kisan-card">
                <Button size="lg">
                    Create a New Card
                </Button>
            </Link>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cards Created by You</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin"/> : applications.length}</div>
                <p className="text-xs text-muted-foreground">Total cards this month</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Pending tasks assigned to you</p>
            </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>My Created Cards (This Month)</CardTitle>
                <CardDescription>A list of all Kisan Jaivik Cards you have created in the current month.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center"><Loader2 className="animate-spin"/></div> :
                 applications.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Farmer Name</TableHead>
                            <TableHead>Panchayat</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map(app => (
                            <TableRow key={app.id}>
                                <TableCell>{app.name}</TableCell>
                                <TableCell>{app.panchayat}</TableCell>
                                <TableCell>{app.submittedAt.toDate().toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
                 ) : (
                    <p className="text-center text-muted-foreground py-8">You haven't created any cards this month.</p>
                 )}
            </CardContent>
        </Card>

    </div>
  );
}
