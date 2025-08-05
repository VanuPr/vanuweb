
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2, CalendarCheck, ClipboardList, TrendingUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { startOfMonth } from 'date-fns';

interface Task {
  id: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: Timestamp;
}

interface AttendanceRecord {
    lastMarked: Timestamp;
}

interface ProgressReport {
    text: string;
    submittedAt: Timestamp;
}

export default function EmployeeRecapPage() {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchRecapData = async () => {
            setLoading(true);
            const now = new Date();
            const monthStart = startOfMonth(now);
            
            try {
                // Fetch tasks for the current month
                const tasksQuery = query(
                    collection(db, 'tasks'),
                    where('assignedTo', '==', user.uid),
                    where('createdAt', '>=', monthStart)
                );
                const tasksSnapshot = await getDocs(tasksQuery);
                const tasksData = tasksSnapshot.docs.map(doc => doc.data() as Task);
                setTasks(tasksData);

                // Fetch attendance
                const attendanceRef = collection(db, 'employees', user.uid, 'attendance');
                const attendanceQuery = query(attendanceRef, where('markedAt', '>=', monthStart));
                const attendanceSnapshot = await getDocs(attendanceQuery);
                setAttendanceCount(attendanceSnapshot.size);

                // Fetch progress reports
                const progressQuery = query(collection(db, 'progress-reports'), where('userId', '==', user.uid), where('submittedAt', '>=', monthStart));
                const progressSnapshot = await getDocs(progressQuery);
                setProgressReports(progressSnapshot.docs.map(doc => doc.data() as ProgressReport));

            } catch (error) {
                console.error("Error fetching recap data:", error);
                toast({ variant: 'destructive', title: 'Failed to load recap data' });
            } finally {
                setLoading(false);
            }
        };

        fetchRecapData();
    }, [user, toast]);

    const taskStatusData = useMemo(() => {
        const statusCounts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    }, [tasks]);

    const tasksCompleted = useMemo(() => tasks.filter(t => t.status === 'Completed').length, [tasks]);

    const PIE_COLORS = ['#FFBB28', '#00C49F', '#0088FE']; // Yellow, Green, Blue

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">My Monthly Recap</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasksCompleted}</div>
                        <p className="text-xs text-muted-foreground">in the last 30 days</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Days Present</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attendanceCount}</div>
                         <p className="text-xs text-muted-foreground">based on attendance marks this month</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Progress Reports</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progressReports.length}</div>
                        <p className="text-xs text-muted-foreground">reports submitted this month</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Task Status Overview</CardTitle>
                        <CardDescription>Breakdown of your tasks this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {taskStatusData.length > 0 ? (
                            <ChartContainer config={{}} className="mx-auto aspect-square h-[300px]">
                                <RechartsPieChart>
                                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {taskStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend/>
                                </RechartsPieChart>
                            </ChartContainer>
                        ) : (
                             <p className="text-center text-muted-foreground py-10">No task data for this month.</p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Daily Progress Log</CardTitle>
                        <CardDescription>A log of your submitted progress reports.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {progressReports.length > 0 ? (
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Report</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {progressReports.map((report, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="w-1/3">{report.submittedAt.toDate().toLocaleDateString()}</TableCell>
                                            <TableCell>{report.text}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                             <p className="text-center text-muted-foreground py-10">You have not submitted any progress reports this month.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
