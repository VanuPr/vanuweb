
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, Landmark, BarChart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth } from 'date-fns';

interface Employee {
  id: string;
  authUid: string;
  name: string;
  role: 'panchayat';
  panchayat?: string;
  phone?: string;
}

interface Profile {
    district?: string;
    blockName?: string;
}

interface Application {
    id: string;
    coordinatorId: string;
    coordinatorName: string;
    name: string; // Farmer's name
    submittedAt: Timestamp;
}

export default function BlockDashboardPage() {
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [panchayatCoordinators, setPanchayatCoordinators] = useState<Employee[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const profileQuery = query(collection(db, 'employees'), where('authUid', '==', user.uid), limit(1));
                const profileSnapshot = await getDocs(profileQuery);

                if (!profileSnapshot.empty) {
                    const userProfile = profileSnapshot.docs[0].data() as Profile;
                    setProfile(userProfile);
                    
                    if (userProfile.blockName) {
                        const subordinatesQuery = query(
                            collection(db, 'employees'), 
                            where('blockName', '==', userProfile.blockName),
                            where('role', '==', 'panchayat')
                        );
                        const subordinatesSnapshot = await getDocs(subordinatesQuery);
                        const employees = subordinatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
                        setPanchayatCoordinators(employees);
                        
                        // Fetch applications created by this block coordinator and their panchayat coordinators
                        const allEmployeeIdsInBlock = [user.uid, ...employees.map(e => e.authUid)];
                        if (allEmployeeIdsInBlock.length > 0) {
                             const monthStart = startOfMonth(new Date());
                             const appsQuery = query(
                                collection(db, 'kisan-jaivik-card-applications'), 
                                where('coordinatorId', 'in', allEmployeeIdsInBlock),
                                where('submittedAt', '>=', monthStart)
                            );
                            const appsSnapshot = await getDocs(appsQuery);
                            const appsData = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
                            setApplications(appsData);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);
    
    const cardsThisMonthByTeam = applications.filter(app => app.coordinatorId !== user?.uid).length;
    const cardsThisMonthByMe = applications.filter(app => app.coordinatorId === user?.uid).length;

    const performanceByPanchayat = useMemo(() => {
        const performanceMap = new Map<string, number>();
        panchayatCoordinators.forEach(pc => performanceMap.set(pc.name, 0));

        applications.forEach(app => {
            const coordinatorName = app.coordinatorName;
            if(performanceMap.has(coordinatorName)) {
                performanceMap.set(coordinatorName, (performanceMap.get(coordinatorName) || 0) + 1);
            }
        });
        return Array.from(performanceMap.entries()).map(([name, count]) => ({ name, count }));
    }, [applications, panchayatCoordinators]);


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Block Coordinator Dashboard</h1>
        <Link href="/employee/create-kisan-card">
             <Button>
                <Landmark className="mr-2 h-4 w-4" /> Make Kisan Jaivik Card
            </Button>
        </Link>
      </div>

       {loading ? (
        <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Panchayat Coordinators</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{panchayatCoordinators.length}</div>
                    <p className="text-xs text-muted-foreground">Active in your block</p>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cards by My Team (This Month)</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{cardsThisMonthByTeam}</div>
                    <p className="text-xs text-muted-foreground">Created by your Panchayat team</p>
                </CardContent>
                </Card>
                 <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cards by Me (This Month)</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{cardsThisMonthByMe}</div>
                    <p className="text-xs text-muted-foreground">Personally created cards</p>
                </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Panchayat Performance (This Month)</CardTitle>
                    <CardDescription>Number of Kisan Jaivik Cards created by each panchayat coordinator.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                         <RechartsBarChart data={performanceByPanchayat} accessibilityLayer>
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                            <Tooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Manage Panchayat Coordinators</CardTitle>
                            <CardDescription>View and add coordinators for your block.</CardDescription>
                        </div>
                        <Link href="/employee-registration">
                            <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                        </Link>
                    </CardHeader>
                     <CardContent>
                         {panchayatCoordinators.length > 0 ? (
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Panchayat</TableHead>
                                    <TableHead>Contact</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {panchayatCoordinators.map(c => (
                                    <TableRow key={c.id}>
                                    <TableCell>{c.name}</TableCell>
                                    <TableCell>{c.panchayat}</TableCell>
                                    <TableCell>{c.phone || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No Panchayat Coordinators found.</p>
                            )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recently Created Cards</CardTitle>
                        <CardDescription>A list of all cards created by your team this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Farmer Name</TableHead><TableHead>Coordinator</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>{app.name}</TableCell>
                                        <TableCell>{app.coordinatorName}</TableCell>
                                        <TableCell>{app.submittedAt.toDate().toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
      )}
    </div>
  );
}
