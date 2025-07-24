
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Mail, Phone, Home, ShoppingCart, IndianRupee, Calendar, UserCheck, MessageSquare, ListTodo, CheckCircle, Clock, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string; // Should be added to employee data model
  joiningDate?: string;
  status: 'Active' | 'Paused';
  role: 'Admin' | 'Manager' | 'Task Handler';
}

interface Task {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: Timestamp;
}

interface ProgressReport {
  id: string;
  text: string;
  submittedAt: Timestamp;
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const employeeId = id as string;

        // Fetch Employee Profile
        const employeeRef = doc(db, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeRef);
        if (employeeSnap.exists()) {
          setEmployee({ id: employeeSnap.id, ...employeeSnap.data() } as EmployeeProfile);
        } else {
          router.push('/admin/employees');
          return;
        }

        // Fetch Assigned Tasks
        const tasksQuery = query(collection(db, 'tasks'), where('assignedTo', '==', employeeId), orderBy('createdAt', 'desc'));
        const tasksSnapshot = await getDocs(tasksQuery);
        setTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));

        // Fetch Progress Reports
        const reportsQuery = query(collection(db, 'progress-reports'), where('userId', '==', employeeId), orderBy('submittedAt', 'desc'));
        const reportsSnapshot = await getDocs(reportsQuery);
        setReports(reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgressReport)));

        // Fetch Attendance Records
        const attendanceQuery = query(collection(db, 'employees', employeeId, 'attendance'));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        setAttendanceCount(attendanceSnapshot.size);


      } catch (error) {
        console.error("Failed to fetch employee data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, router]);
  
  const stats = useMemo(() => {
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const pendingTasks = tasks.length - completedTasks;
      return { completedTasks, pendingTasks, totalTasks: tasks.length };
  }, [tasks]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }

  if (!employee) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Employee not found.</p></div>;
  }
  
  const getPriorityBadgeVariant = (priority: Task['priority']) => {
     switch(priority) {
        case 'Low': return 'secondary';
        case 'Medium': return 'default';
        case 'High': return 'destructive';
        default: return 'default';
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Employees
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={employee.avatarUrl} alt={employee.name} />
            <AvatarFallback className="text-3xl">{employee.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{employee.name}</h1>
            <p className="text-muted-foreground">{employee.email}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
              <CardHeader><CardTitle>Performance Stats</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><CheckCircle/> Completed Tasks</span> <span className="font-bold">{stats.completedTasks}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Clock/> Pending Tasks</span> <span className="font-bold">{stats.pendingTasks}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><ListTodo/> Total Tasks</span> <span className="font-bold">{stats.totalTasks}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><MessageSquare/> Reports Submitted</span> <span className="font-bold">{reports.length}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><CalendarDays/> Days Present</span> <span className="font-bold">{attendanceCount}</span></div>
              </CardContent>
          </Card>
           <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4"><Mail className="text-muted-foreground"/> <span>{employee.email}</span></div>
                  <div className="flex items-center gap-4"><Phone className="text-muted-foreground"/> <span>{employee.phone || 'Not provided'}</span></div>
                  <div className="flex items-center gap-4"><Calendar className="text-muted-foreground"/> <span>Joined: {employee.joiningDate || 'N/A'}</span></div>
                  <div className="flex items-center gap-4"><UserCheck className="text-muted-foreground"/> <span>Status: <Badge>{employee.status}</Badge></span></div>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Assigned Tasks</CardTitle></CardHeader>
        <CardContent>
           {tasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell><Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge></TableCell>
                    <TableCell><Badge variant={task.status === 'Completed' ? 'default' : 'secondary'}>{task.status}</Badge></TableCell>
                    <TableCell>{task.dueDate ? format(task.dueDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">This employee has not been assigned any tasks yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Daily Progress Reports</CardTitle></CardHeader>
        <CardContent>
           {reports.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {reports.map((report) => (
                    <Card key={report.id} className="bg-muted/40">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">
                                Report for {format(report.submittedAt.toDate(), 'PPP')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground whitespace-pre-wrap">{report.text}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No progress reports submitted by this employee yet.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
