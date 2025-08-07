
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { getDB } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, UserPlus, Eye, Trash2, Ban } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuth, deleteUser } from "firebase/auth";

interface User {
  id: string; // Firestore document ID
  uid: string; // Firebase Auth UID
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: any; // Firestore Timestamp
  status: 'Active' | 'Paused' | 'Deleted';
  // Aggregated data
  totalOrders: number;
  totalSpent: number;
}

export default function UsersPage() {
  const db = getDB();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('firstName'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData = await Promise.all(usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userDoc.id));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const totalOrders = ordersSnapshot.size;
        const totalSpent = ordersSnapshot.docs.reduce((acc, order) => acc + order.data().total, 0);

        return { 
          id: userDoc.id,
          uid: userDoc.id, // Assuming Firestore doc ID is the Auth UID
          ...userData,
          status: userData.status || 'Active', // Default status
          totalOrders,
          totalSpent
        } as User;
      }));

      setUsers(usersData);

    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ variant: 'destructive', title: 'Failed to fetch users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = async (userId: string, status: User['status']) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status });
      toast({ title: 'User status updated successfully.' });
      fetchUsers();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update user status.' });
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
      // Note: This is a simplified deletion. In a real-world scenario, you would need a Cloud Function 
      // with admin privileges to delete the Firebase Auth user record. 
      // Deleting from the client is not secure and generally not allowed.
      if (!window.confirm("Are you sure you want to delete this user? This action is irreversible and will delete their data.")) return;
       try {
            await deleteDoc(doc(db, 'users', userId));
            // You would also call your backend function here to delete the auth user.
            toast({ title: "User Deleted", description: "User record removed from Firestore."});
            fetchUsers();
       } catch (error) {
           toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Could not delete user from Firestore.'});
       }
  }

  const getStatusBadgeVariant = (status: User['status']) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Paused': return 'secondary';
      case 'Deleted': return 'destructive';
      default: return 'outline';
    }
  };
  
   const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        if (statusFilter === 'All') return true;
        return user.status === statusFilter;
      })
      .filter(user => 
        (user.firstName.toLowerCase() + ' ' + user.lastName.toLowerCase()).includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm, statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Registered Users</CardTitle>
          <CardDescription>View, manage, and review all customer accounts.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4 mb-4">
                <Input 
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Paused">Paused</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          {loading ? (
             <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                                <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                    </TableCell>
                     <TableCell>{user.totalOrders}</TableCell>
                     <TableCell>₹{user.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>
                        {user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}`}><Eye className="mr-2 h-4 w-4"/> View Profile</Link>
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, user.status === 'Active' ? 'Paused' : 'Active')}>
                                <Ban className="mr-2 h-4 w-4"/> {user.status === 'Active' ? 'Pause Account' : 'Activate Account'}
                           </DropdownMenuItem>
                           <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                                <Trash2 className="mr-2 h-4 w-4"/> Delete User
                           </DropdownMenuItem>
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
    </div>
  );
}
