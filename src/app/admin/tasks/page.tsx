
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: Timestamp;
  dueDate?: Timestamp;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task> | null>(null);
  const { toast } = useToast();

  const fetchTasksAndEmployees = async () => {
    setLoading(true);
    try {
      const employeesQuery = query(collection(db, 'employees'), orderBy('name', 'asc'));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(employeesData);

      const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndEmployees();
  }, []);

  const handleOpenDialog = (task: Partial<Task> | null = null) => {
    setCurrentTask(task ? { ...task } : { title: '', description: '', assignedTo: '', priority: 'Medium', status: 'Pending' });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setCurrentTask(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentTask) return;
    const { id, value } = e.target;
    setCurrentTask(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (name: keyof Task, value: string) => {
    if (!currentTask) return;
    setCurrentTask(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!currentTask || !date) return;
    setCurrentTask(prev => ({ ...prev, dueDate: Timestamp.fromDate(date) }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask || !currentTask.title || !currentTask.assignedTo) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill all required fields.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedEmployee = employees.find(emp => emp.id === currentTask.assignedTo);
      const taskData = {
        ...currentTask,
        assignedToName: assignedEmployee?.name || 'Unknown',
      };

      if (currentTask.id) {
        const taskRef = doc(db, 'tasks', currentTask.id);
        await updateDoc(taskRef, taskData);
        toast({ title: 'Task Updated' });
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...taskData,
          createdAt: serverTimestamp()
        });
        toast({ title: 'Task Added' });
      }
      fetchTasksAndEmployees();
      handleDialogClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Operation Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
      toast({ title: 'Task Deleted' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Deletion Failed' });
    }
  };

  const getStatusBadgeVariant = (status: Task['status']) => {
    switch(status) {
        case 'Pending': return 'default';
        case 'In Progress': return 'secondary';
        case 'Completed': return 'outline';
        default: return 'default';
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Task Management</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2" /> Add Task
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>Assign, view, edit, or remove tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tasks found. Add one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.assignedToName}</TableCell>
                    <TableCell><Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge></TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(task.status)}>{task.status}</Badge></TableCell>
                    <TableCell>{task.dueDate ? format(task.dueDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(task)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => { e.preventDefault(); }}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{currentTask?.id ? 'Edit Task' : 'Add Task'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the task. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={currentTask?.title || ''} onChange={handleInputChange} required disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={currentTask?.description || ''} onChange={handleInputChange} disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select value={currentTask?.assignedTo} onValueChange={(v) => handleSelectChange('assignedTo', v)} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={currentTask?.priority} onValueChange={(v) => handleSelectChange('priority', v)} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={currentTask?.status} onValueChange={(v) => handleSelectChange('status', v)} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                             <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !currentTask?.dueDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentTask?.dueDate ? format(currentTask.dueDate.toDate(), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={currentTask?.dueDate?.toDate()}
                        onSelect={handleDateChange}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
