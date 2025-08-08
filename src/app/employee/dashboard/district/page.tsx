
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, User, Users, Landmark, BarChart, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuthInstance, getDB } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, Timestamp, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth } from 'date-fns';

interface Employee {
  id: string;
  authUid: string;
  name: string;
  role: 'block' | 'panchayat' | 'district';
  blockName?: string;
  panchayat?: string;
  phone?: string;
  district?: string;
}

interface Profile {
    district?: string;
}

interface Application {
    id: string;
    coordinatorId: string;
    coordinatorName: string;
    name: string; // Farmer's name
    submittedAt: Timestamp;
}

interface AttendanceRecord {
    id: string; // employeeId
    name: string;
    isPresent: boolean;
}

export default function DistrictDashboardPage() {
  const auth = getAuthInstance();
  const db = getDB();
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [blockCoordinators, setBlockCoordinators] = useState<Employee[]>([]);
  const [panchayatCoordinators, setPanchayatCoordinators] = useState<Employee[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const profileQuery = query(collection(db, 'employees'), where('authUid', '==', user.uid), limit(1));
        const profileSnapshot = await getDocs(profileQuery);

        if (!profileSnapshot.empty) {
          const userProfile = profileSnapshot.docs[0].data() as Profile;
          const userDistrict = userProfile.district;
          setProfile(userProfile);

          if (userDistrict) {
            const subordinatesQuery = query(collection(db, 'employees'), where('district', '==', userDistrict));
            const subordinatesSnapshot = await getDocs(subordinatesQuery);
            const allEmployeesInDistrict = subordinatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
            
            const allEmployeeIdsInDistrict = allEmployeesInDistrict.map(e => e.authUid);

            const blockCoords = allEmployeesInDistrict.filter(emp => emp.role === 'block');
            const panchayatCoords = allEmployeesInDistrict.filter(emp => emp.role === 'panchayat');
            setBlockCoordinators(blockCoords);
            setPanchayatCoordinators(panchayatCoords);

            // Fetch applications
            if (allEmployeeIdsInDistrict.length > 0) {
                 const monthStart = startOfMonth(new Date());
                 const appsQuery = query(
                    collection(db, 'kisan-jaivik-card-applications'), 
                    where('coordinatorId', 'in', allEmployeeIdsInDistrict),
                    where('submittedAt', '>=', monthStart)
                );
                const appsSnapshot = await getDocs(appsQuery);
                const appsData = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
                setApplications(appsData);
            }
            
            // Fetch Attendance
            const todayDateString = new Date().toISOString().split('T')[0];
            const attendanceRecords: AttendanceRecord[] = [];
            for (const employee of [...blockCoords, ...panchayatCoords]) {
                const attendanceRef = doc(db, 'employees', employee.authUid, 'attendance', todayDateString);
                const attendanceSnap = await getDoc(attendanceRef);
                attendanceRecords.push({ id: employee.authUid, name: employee.name, isPresent: attendanceSnap.exists() });
            }
            setAttendance(attendanceRecords);
          }
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, db]);

  const cardsThisMonthByTeam = applications.filter(app => app.coordinatorId !== user?.uid).length;
  const cardsThisMonthByMe = applications.filter(app => app.coordinatorId === user?.uid).length;


  const performanceByBlock = useMemo(() => {
    const performanceMap = new Map<string, number>();
    blockCoordinators.forEach(bc => performanceMap.set(bc.name, 0));

    applications.forEach(app => {
        const coordinator = [...blockCoordinators, ...panchayatCoordinators].find(c => c.authUid === app.coordinatorId);
        if (coordinator) {
            const blockName = coordinator.role === 'block' ? coordinator.name : blockCoordinators.find(bc => bc.blockName === coordinator.blockName)?.name;
            if(blockName) {
                performanceMap.set(blockName, (performanceMap.get(blockName) || 0) + 1);
            }
        }
    });
    return Array.from(performanceMap.entries()).map(([name, count]) => ({ name, count }));
  }, [applications, blockCoordinators, panchayatCoordinators]);


  const CoordinatorTable = ({ title, data, addLink }: { title: string; data: Employee[], addLink: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
         <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>View and add coordinators.</CardDescription>
        </div>
        <Link href={addLink}>
            <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.role === 'block' ? c.blockName : c.panchayat}</TableCell>
                  <TableCell>{c.phone || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No coordinators found.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">District Coordinator Dashboard</h1>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Block Coordinators</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{blockCoordinators.length}</div>
                <p className="text-xs text-muted-foreground">Active in your district</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Panchayat Coordinators</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{panchayatCoordinators.length}</div>
                <p className="text-xs text-muted-foreground">Across all blocks in your district</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cards by My Team (This Month)</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cardsThisMonthByTeam}</div>
                <p className="text-xs text-muted-foreground">Total cards created by your teams</p>
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
                <CardTitle>Block Performance (This Month)</CardTitle>
                <CardDescription>Number of Kisan Jaivik Cards created by each block coordinator's team.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <RechartsBarChart data={performanceByBlock} accessibilityLayer>
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip cursor={false} content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
          </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Team Attendance (Today)</CardTitle>
                    <CardDescription>Live attendance status of your subordinate coordinators.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Coordinator Name</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendance.map(att => (
                                <TableRow key={att.id}>
                                    <TableCell>{att.name}</TableCell>
                                    <TableCell>
                                        {att.isPresent ? (
                                            <span className="flex items-center text-green-600"><CheckCircle className="mr-2 h-4 w-4" /> Present</span>
                                        ) : (
                                            <span className="flex items-center text-red-600"><XCircle className="mr-2 h-4 w-4" /> Absent</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          
          <div className="grid md:grid-cols-2 gap-8">
            <CoordinatorTable title="Block Coordinators" data={blockCoordinators} addLink="/employee-registration" />
            <CoordinatorTable title="Panchayat Coordinators" data={panchayatCoordinators} addLink="/employee-registration" />
          </div>

           <Card>
              <CardHeader>
                <CardTitle>Recently Created Cards (All Teams)</CardTitle>
                <CardDescription>A list of all cards created by your teams this month.</CardDescription>
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
        </>
      )}

    </div>
  );
}
