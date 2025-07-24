
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, setDoc, getDoc, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Clock, ListTodo, ThumbsUp, X, ShoppingBag, Target, CalendarCheck, Landmark, ArrowRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { format, startOfToday } from 'date-fns';
import { TypewriterWelcome } from '@/components/typewriter-welcome';
import Link from 'next/link';


interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate?: Timestamp;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

interface Order {
    id: string;
    // For simplicity, we only care about the count
}

interface JaivikCardApplication {
  id: string;
  name: string;
  submittedAt: Timestamp;
}


interface Attendance {
    markedAt: Timestamp;
}

interface EmployeeProfile {
    id: string;
    name: string;
    email: string;
}

export default function EmployeeDashboardPage() {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  
  // Data states
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [kisanCardApplications, setKisanCardApplications] = useState<JaivikCardApplication[]>([]);


  // Loading states
  const [loading, setLoading] = useState(true);
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  
  // Input states
  const [progressText, setProgressText] = useState("");


  useEffect(() => {
    if (!user || !user.email) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch Employee Profile to get their document ID
        const empQuery = query(collection(db, 'employees'), where('email', '==', user.email), limit(1));
        const empSnapshot = await getDocs(empQuery);
        
        if (empSnapshot.empty) {
            toast({ variant: 'destructive', title: 'Employee profile not found.' });
            setLoading(false);
            return;
        }

        const empDoc = empSnapshot.docs[0];
        const currentEmployeeProfile = { id: empDoc.id, name: empDoc.data().name, email: empDoc.data().email } as EmployeeProfile;
        setEmployeeProfile(currentEmployeeProfile);

        // Now use the employee's document ID to fetch related data
        const employeeId = currentEmployeeProfile.id;

        // Fetch all assigned tasks
        const tasksQuery = query(
          collection(db, 'tasks'), 
          where('assignedTo', '==', employeeId),
          orderBy('createdAt', 'desc')
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const userTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(userTasks);
        
        // Fetch attendance record for today
        const todayDateString = new Date().toISOString().split('T')[0];
        const attendanceRef = doc(db, 'employees', employeeId, 'attendance', todayDateString);
        const docSnap = await getDoc(attendanceRef);
        if (docSnap.exists()) {
            setAttendance({ markedAt: docSnap.data().markedAt });
        }

        // Fetch recent Kisan Card applications
        const kisanCardQuery = query(
            collection(db, 'kisan-jaivik-card-applications'),
            where('status', '==', 'Pending'),
            orderBy('submittedAt', 'desc'),
            limit(5)
        );
        const kisanCardSnapshot = await getDocs(kisanCardQuery);
        setKisanCardApplications(kisanCardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data()} as JaivikCardApplication)));

        // Fetch orders managed today (placeholder, depends on tracking mechanism)
        // For now, this will be 0.
        setOrders([]);

      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Failed to fetch dashboard data.' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, toast]);
  
  const dailyStats = useMemo(() => {
    const todayStart = startOfToday();
    const tasksAssignedToday = tasks.filter(t => t.createdAt.toDate() >= todayStart).length;
    const tasksDoneToday = tasks.filter(t => t.completedAt && t.completedAt.toDate() >= todayStart).length;
    
    return { tasksAssignedToday, tasksDoneToday };
  }, [tasks]);

  const handleMarkAsFinished = async (taskId: string) => {
    if (!employeeProfile) return;
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: 'Completed', completedAt: Timestamp.now() });
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, status: 'Completed' as 'Completed', completedAt: Timestamp.now() } : task
      ));
      toast({ title: 'Task Completed!', description: 'Great job!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update failed', description: 'Could not update the task status.' });
    }
  };

  const handleMarkAttendance = async () => {
    if (!employeeProfile || isMarkingAttendance) return;
     setIsMarkingAttendance(true);
     try {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const attendanceRef = doc(db, 'employees', employeeProfile.id, 'attendance', dateString);
        
        const newAttendanceMark = { markedAt: Timestamp.now() };
        await setDoc(attendanceRef, newAttendanceMark);
        
        setAttendance({ markedAt: newAttendanceMark.markedAt });
        toast({ title: "Attendance Marked!", description: `${employeeProfile.name} marked present for today.`});
     } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to mark attendance.' });
     } finally {
        setIsMarkingAttendance(false);
     }
  }
  
  const handleShareProgress = async () => {
      if (!employeeProfile || !progressText.trim()) {
          toast({ variant: 'destructive', title: 'Progress report cannot be empty.' });
          return;
      }
      setIsSubmittingProgress(true);
      try {
         await addDoc(collection(db, 'progress-reports'), {
            userId: employeeProfile.id,
            userName: employeeProfile.name,
            text: progressText,
            submittedAt: serverTimestamp()
         });
         toast({ title: "Progress Shared!", description: `${employeeProfile.name} has submitted a report.`});
         setProgressText("");
      } catch (error) {
         toast({ variant: 'destructive', title: 'Failed to share progress.' });
      } finally {
        setIsSubmittingProgress(false);
      }
  }

  const isAttendanceMarkedToday = !!attendance;
  
  const getPriorityBadgeVariant = (priority: Task['priority']) => {
     switch(priority) {
        case 'Low': return 'secondary';
        case 'Medium': return 'default';
        case 'High': return 'destructive';
        default: return 'default';
    }
  }

  const pendingTasks = tasks.filter(task => task.status !== 'Completed');

  if (loading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>;
  }

  return (
    <div className="space-y-8">
      {employeeProfile && (
         <TypewriterWelcome 
            user={user}
            displayName={employeeProfile.name}
            fullText="Ready to make an impact today? Let's get started!" 
         />
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Today's Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Tasks</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dailyStats.tasksDoneToday} / {tasks.filter(t => t.status !== 'Completed').length + dailyStats.tasksDoneToday}</div>
                        <p className="text-xs text-muted-foreground">Completed / Total Assigned</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders Managed</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                        <p className="text-xs text-muted-foreground">Orders handled today (coming soon)</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isAttendanceMarkedToday ? (
                            <>
                                <div className="text-2xl font-bold text-green-600">Present</div>
                                <p className="text-xs text-muted-foreground">Marked at {format(attendance!.markedAt.toDate(), 'p')}</p>
                            </>
                        ) : (
                            <Button onClick={handleMarkAttendance} size="sm" className="mt-2" disabled={isMarkingAttendance}>
                                {isMarkingAttendance ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Clock className="mr-2 h-4 w-4"/>}
                                Mark Present
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
      
      <div className="grid lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>My Pending Tasks ({pendingTasks.length})</CardTitle>
                <CardDescription>Tasks assigned to you that are not yet completed.</CardDescription>
            </CardHeader>
            <CardContent>
                {pendingTasks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">You have no pending tasks. Great job!</p>
                ) : (
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {pendingTasks.map(task => (
                            <div key={task.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold">{task.title}</h4>
                                        <p className="text-sm text-muted-foreground">{task.description}</p>
                                    </div>
                                    <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground">
                                        Due: {task.dueDate ? format(task.dueDate.toDate(), 'PPP') : 'N/A'}
                                    </p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm">
                                                <CheckCircle className="mr-2 h-4 w-4" /> I Finished
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will mark the task "{task.title}" as completed. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleMarkAsFinished(task.id)}>
                                                    Yes, Mark as Finished
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Daily Progress Report</CardTitle>
                    <CardDescription>Briefly describe what you accomplished today.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        placeholder="Today I worked on..." 
                        value={progressText}
                        onChange={(e) => setProgressText(e.target.value)}
                        disabled={isSubmittingProgress}
                        className="h-32"
                    />
                </CardContent>
                 <CardFooter>
                     <Button onClick={handleShareProgress} className="w-full" disabled={isSubmittingProgress}>
                        {isSubmittingProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ThumbsUp className="mr-2 h-4 w-4"/>}
                        Share Progress
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>New Kisan Card Applications</CardTitle>
                        <CardDescription>Review new farmer applications.</CardDescription>
                    </div>
                     <Link href="/employee/kisan-jaivik-card">
                        <Button variant="outline" size="sm">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {kisanCardApplications.length > 0 ? (
                        <div className="space-y-3">
                            {kisanCardApplications.map(app => (
                                <div key={app.id} className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{app.name}</span>
                                    <span className="text-muted-foreground">{format(app.submittedAt.toDate(), 'PP')}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No new applications.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
