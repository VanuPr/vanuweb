
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Mail, Phone, Home, ShoppingCart, IndianRupee, Calendar, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: Timestamp;
  status: 'Active' | 'Paused' | 'Deleted';
}

interface Address {
    id: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
}

interface Order {
  id: string;
  total: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Shipped' | 'Delivered';
  date: Timestamp;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch User
        const userRef = doc(db, 'users', id as string);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser({ id: userSnap.id, ...userSnap.data() } as UserProfile);
        } else {
          router.push('/admin/users');
          return;
        }

        // Fetch Addresses
        const addressesQuery = query(collection(db, 'users', id as string, 'addresses'));
        const addressesSnapshot = await getDocs(addressesQuery);
        setAddresses(addressesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address)));

        // Fetch Orders
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', id as string), orderBy('date', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);
        setOrders(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));

      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, router]);
  
  const totalSpent = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="flex h-screen w-full items-center justify-center"><p>User not found.</p></div>;
  }
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Pending': return 'default';
      case 'Accepted': return 'secondary';
      case 'Shipped': return 'default';
      case 'Delivered': return 'default';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="text-3xl">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
              <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><IndianRupee/> Total Spent</span> <span className="font-bold">₹{totalSpent.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><ShoppingCart/> Total Orders</span> <span className="font-bold">{orders.length}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Calendar/> Joined Date</span> <span className="font-bold">{user.createdAt?.toDate().toLocaleDateString() ?? 'N/A'}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><UserCheck/> Status</span> <Badge>{user.status}</Badge></div>
              </CardContent>
          </Card>
           <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center gap-4"><Mail className="text-muted-foreground"/> <span>{user.email}</span></div>
                  <div className="flex items-center gap-4"><Phone className="text-muted-foreground"/> <span>{user.phone || 'Not provided'}</span></div>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Saved Addresses</CardTitle></CardHeader>
        <CardContent>
          {addresses.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div key={addr.id} className="p-4 border rounded-md text-sm">
                  <p className="font-semibold">{addr.firstName} {addr.lastName}</p>
                  <p className="text-muted-foreground">{addr.phone}</p>
                  <p className="text-muted-foreground mt-2">{addr.address}, {addr.city}, {addr.state} - {addr.zip}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No saved addresses found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
        <CardContent>
           {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 7)}...</TableCell>
                    <TableCell>{order.date.toDate().toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                    <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">This user has not placed any orders yet.</p>
          )}
        </CardContent>
      </Card>

        <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
                 <p className="text-muted-foreground">Activity log feature coming soon.</p>
                 {/* 
                 This would be implemented with a timeline component. 
                 Example: 
                 <div class="space-y-4">
                    <div>
                        <p class="font-medium">Placed an order (#A4B1C2)</p>
                        <p class="text-xs text-muted-foreground">May 20, 2024, 10:30 AM</p>
                    </div>
                     <div>
                        <p class="font-medium">Updated shipping address</p>
                        <p class="text-xs text-muted-foreground">May 19, 2024, 02:15 PM</p>
                    </div>
                 </div>
                 */}
            </CardContent>
        </Card>

    </div>
  );
}

    