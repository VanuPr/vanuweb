
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, User, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuthInstance, getDB } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Employee {
  id: string;
  name: string;
  role: 'block' | 'panchayat' | 'district';
  blockName?: string;
  panchayat?: string;
  phone?: string;
  district?: string;
}

interface Profile {
    district?: string;
    blockName?: string;
    role: 'district' | 'block' | 'panchayat';
}

const CoordinatorTable = ({ data, title }: { data: Employee[]; title: string }) => (
    <>
        <CardTitle className="mb-4">{title}</CardTitle>
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
        <p className="text-muted-foreground text-center py-8">No {title.toLowerCase()} found.</p>
        )}
    </>
);


export default function EmployeeCoordinatorsPage() {
    const auth = getAuthInstance();
    const db = getDB();
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [blockCoordinators, setBlockCoordinators] = useState<Employee[]>([]);
    const [panchayatCoordinators, setPanchayatCoordinators] = useState<Employee[]>([]);

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

                let blockCoords: Employee[] = [];
                let panchayatCoords: Employee[] = [];

                if (userProfile.role === 'district' && userProfile.district) {
                    const blockQuery = query(collection(db, 'employees'), where('district', '==', userProfile.district), where('role', '==', 'block'));
                    const blockSnapshot = await getDocs(blockQuery);
                    blockCoords = blockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
                    
                    const panchayatQuery = query(collection(db, 'employees'), where('district', '==', userProfile.district), where('role', '==', 'panchayat'));
                    const panchayatSnapshot = await getDocs(panchayatQuery);
                    panchayatCoords = panchayatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));

                } else if (userProfile.role === 'block' && userProfile.blockName) {
                     const panchayatQuery = query(collection(db, 'employees'), where('blockName', '==', userProfile.blockName), where('role', '==', 'panchayat'));
                    const panchayatSnapshot = await getDocs(panchayatQuery);
                    panchayatCoords = panchayatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
                }

                setBlockCoordinators(blockCoords);
                setPanchayatCoordinators(panchayatCoords);
            }
        } catch (error) {
            console.error("Error fetching coordinator data: ", error);
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, [user, db]);

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        }

        if (!profile) {
            return <p className="text-center text-muted-foreground py-10">Could not load your profile.</p>;
        }

        if (profile.role === 'panchayat') {
            return <p className="text-center text-muted-foreground py-10">You do not have a team to manage.</p>;
        }
        
        if(profile.role === 'block') {
            return <CoordinatorTable data={panchayatCoordinators} title="My Panchayat Coordinators" />;
        }
        
        if (profile.role === 'district') {
            return (
                <Tabs defaultValue="block">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="block">Block Coordinators ({blockCoordinators.length})</TabsTrigger>
                        <TabsTrigger value="panchayat">Panchayat Coordinators ({panchayatCoordinators.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="block" className="mt-6">
                        <CoordinatorTable data={blockCoordinators} title="Block Coordinators" />
                    </TabsContent>
                    <TabsContent value="panchayat" className="mt-6">
                         <CoordinatorTable data={panchayatCoordinators} title="Panchayat Coordinators" />
                    </TabsContent>
                </Tabs>
            )
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Manage My Team</h1>
                <Link href="/employee-registration">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Coordinator
                    </Button>
                </Link>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>My Coordinators</CardTitle>
                    <CardDescription>View all coordinators working under your supervision.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    )
}
