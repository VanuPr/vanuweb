
"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import { getDB } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Employee {
  id: string; // authUid
  name: string;
  role: string;
  avatarUrl?: string;
}

export default function AdminAttendancePage() {
  const db = getDB();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [presentEmployees, setPresentEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const employeesQuery = query(collection(db, 'employees'));
        const employeesSnapshot = await getDocs(employeesQuery);
        const allEmployees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        setEmployees(allEmployees);

        const presentIds: string[] = [];
        for (const emp of allEmployees) {
          const attendanceRef = doc(db, 'employees', emp.id, 'attendance', todayDateString);
          const attendanceSnap = await getDoc(attendanceRef);
          if (attendanceSnap.exists()) {
            presentIds.push(emp.id);
          }
        }
        setPresentEmployees(presentIds);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        toast({ variant: 'destructive', title: 'Failed to fetch attendance data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [toast, todayDateString, db]);

  const absentEmployees = employees.filter(emp => !presentEmployees.includes(emp.id));
  const presentEmployeesList = employees.filter(emp => presentEmployees.includes(emp.id));

  const AttendanceTable = ({ employees, isPresentList }: { employees: Employee[], isPresentList: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map(emp => (
          <TableRow key={emp.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                  <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{emp.name}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="capitalize">{emp.role}</TableCell>
            <TableCell>
              {isPresentList ? (
                <span className="flex items-center text-green-600"><CheckCircle className="mr-2 h-4 w-4" /> Present</span>
              ) : (
                <span className="flex items-center text-red-600"><XCircle className="mr-2 h-4 w-4" /> Absent</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Daily Attendance</h1>
        <p className="text-muted-foreground">Status for {format(today, 'PPP')}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Present ({presentEmployeesList.length})</CardTitle>
            <CardDescription>Employees who have marked their attendance today.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="mx-auto animate-spin" /> : <AttendanceTable employees={presentEmployeesList} isPresentList={true} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Absent ({absentEmployees.length})</CardTitle>
            <CardDescription>Employees who have not yet marked attendance today.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="mx-auto animate-spin" /> : <AttendanceTable employees={absentEmployees} isPresentList={false} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
