
"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndianRupee, ShoppingBag, ListOrdered, Loader2, ArrowRight, PlusCircle, Ship, Trash2, Tag, Check, X, PackageX, PackageCheck, Mail, MessageSquare } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { sendNotificationEmail } from '@/ai/flows/send-email-flow';

interface Order {
  id: string;
  userId: string;
  customerName: string;
  total: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Shipped' | 'Delivered';
  date: Timestamp;
}

interface UserProfile {
    email?: string;
    firstName?: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    createdAt: Timestamp;
}

interface Fee {
    name: string;
    value: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecents, setLoadingRecents] = useState(true);
  
  const [shippingCharge, setShippingCharge] = useState('');
  const [loadingShipping, setLoadingShipping] = useState(false);

  const [fees, setFees] = useState<Fee[]>([]);
  const [loadingFees, setLoadingFees] = useState(true);
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeValue, setNewFeeValue] = useState('');
  const [isAddingFee, setIsAddingFee] = useState(false);
  
  const { toast } = useToast();

    const fetchDashboardData = async () => {
      setLoading(true);
      setLoadingRecents(true);

      try {
        // Fetch stats
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        
        const totalProducts = productsSnapshot.size;
        const totalOrders = ordersSnapshot.size;
        const totalRevenue = ordersSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);

        setStats({
          products: totalProducts,
          orders: totalOrders,
          revenue: totalRevenue,
        });

        // Fetch recent products
        const recentProductsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(5));
        const recentProductsSnapshot = await getDocs(recentProductsQuery);
        setRecentProducts(recentProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

        // Fetch pending orders
        const q = query(collection(db, 'orders'), where('status', '==', 'Pending'), orderBy('date', 'desc'));
        const unsubPendingOrders = onSnapshot(q, (snapshot) => {
            setPendingOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        });

        // Fetch shipping charge
        const shippingDoc = await getDoc(doc(db, 'settings', 'shipping'));
        if (shippingDoc.exists()) {
          setShippingCharge(shippingDoc.data().charge.toString());
        }
        
        // Unsubscribe can be returned from useEffect to cleanup
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch dashboard data.",
        });
      } finally {
        setLoading(false);
        setLoadingRecents(false);
      }
    };


  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'orders'), where('status', '==', 'Pending'), orderBy('date', 'desc')), (snapshot) => {
        setPendingOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    fetchDashboardData();

    // Setup listener for fees
    setLoadingFees(true);
    const feesDocRef = doc(db, 'settings', 'fees');
    const unsubscribeFees = onSnapshot(feesDocRef, (doc) => {
        if(doc.exists()) {
            setFees(doc.data().charges || []);
        } else {
            setFees([]);
        }
        setLoadingFees(false);
    });

    return () => {
        unsub();
        unsubscribeFees();
    }
  }, [toast]);
  
  const handleSaveShipping = async () => {
      setLoadingShipping(true);
      try {
        await setDoc(doc(db, 'settings', 'shipping'), { charge: Number(shippingCharge) });
        toast({ title: 'Success', description: 'Shipping charge updated successfully.' });
      } catch (error) {
        console.error("Error saving shipping charge:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save shipping charge.' });
      } finally {
        setLoadingShipping(false);
      }
  };

  const handleAddFee = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFeeName || !newFeeValue) {
          toast({variant: 'destructive', title: 'Missing fields', description: 'Please provide both a name and a value for the fee.'});
          return;
      }
      setIsAddingFee(true);
      try {
          const feesDocRef = doc(db, 'settings', 'fees');
          const newFee = { name: newFeeName, value: Number(newFeeValue) };
          await updateDoc(feesDocRef, {
              charges: arrayUnion(newFee)
          });
          toast({ title: 'Fee added', description: `${newFeeName} has been added.`});
          setNewFeeName('');
          setNewFeeValue('');
      } catch (error: any) {
          // If doc doesn't exist, create it.
          if(error.code === 'not-found'){
             const feesDocRef = doc(db, 'settings', 'fees');
             const newFee = { name: newFeeName, value: Number(newFeeValue) };
             await setDoc(feesDocRef, { charges: [newFee] });
             toast({ title: 'Fee added', description: `${newFeeName} has been added.`});
             setNewFeeName('');
             setNewFeeValue('');
          } else {
            console.error("Error adding fee:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add the new fee.' });
          }
      } finally {
          setIsAddingFee(false);
      }
  }

  const handleDeleteFee = async (feeToDelete: Fee) => {
      if (!window.confirm(`Are you sure you want to delete the fee: "${feeToDelete.name}"?`)) return;
      try {
           const feesDocRef = doc(db, 'settings', 'fees');
           await updateDoc(feesDocRef, {
               charges: arrayRemove(feeToDelete)
           });
           toast({ title: 'Fee removed', description: `${feeToDelete.name} has been removed.`});
      } catch (error) {
            console.error("Error removing fee:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not remove the fee.' });
      }
  }
  
  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status });
        toast({ title: "Order status updated", description: `Order has been marked as ${status}.`});
        // No need to fetch data, onSnapshot will do it.
    } catch(error) {
        console.error("Error updating status:", error);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the order status."});
    }
  }

  const handleSendConfirmationEmail = async (order: Order) => {
    try {
        const userDocRef = doc(db, 'users', order.userId);
        const userDocSnap = await getDoc(userDocRef);
        if(!userDocSnap.exists()) {
            toast({ variant: 'destructive', title: 'User not found'});
            return;
        }
        const userData = userDocSnap.data() as UserProfile;
        
        if(!userData.email) {
            toast({ variant: 'destructive', title: 'User email not found'});
            return;
        }

        await sendNotificationEmail({
            to: userData.email,
            subject: `Your Vanu Organic Order #${order.id.slice(0, 7)} is Confirmed!`,
            text: `Hi ${userData.firstName || order.customerName},\n\nGreat news! Your order has been confirmed and is now being processed.\n\nThank you for shopping with us!`,
            html: `<p>Hi ${userData.firstName || order.customerName},</p><p>Great news! Your order has been confirmed and is now being processed.</p><p>Thank you for shopping with us!</p>`
        });
        toast({ title: 'Confirmation email sent!' });
    } catch (error) {
         toast({ variant: 'destructive', title: 'Failed to send email' });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
         <div className="flex gap-2">
            <Link href="/admin/add-product" passHref>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
                </Button>
            </Link>
             <Link href="/admin/products" passHref>
                <Button variant="outline">
                    View All Products <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
         </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">From all-time orders</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <div className="text-2xl font-bold">{stats.orders}</div>
                <p className="text-xs text-muted-foreground">Total orders placed</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <div className="text-2xl font-bold">{stats.products}</div>
                <p className="text-xs text-muted-foreground">Products in your store</p>
              </>
            )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Set Shipping Charge</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <Input 
                    type="number" 
                    value={shippingCharge} 
                    onChange={(e) => setShippingCharge(e.target.value)}
                    placeholder="e.g. 50"
                    disabled={loadingShipping}
                />
              </div>
               <p className="text-xs text-muted-foreground mt-1">Set a global shipping fee for all orders.</p>
          </CardContent>
          <CardFooter>
            <Button size="sm" onClick={handleSaveShipping} disabled={loadingShipping}>
                {loadingShipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Save Charge
            </Button>
          </CardFooter>
        </Card>
      </div>

       <div className="mt-8 grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Manage Fees</CardTitle>
                        <CardDescription>Add or remove universal fees like GST, packaging, etc.</CardDescription>
                    </div>
                     <Dialog>
                        <DialogTrigger asChild>
                           <Button><PlusCircle className="mr-2 h-4 w-4"/>Add Fee</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add a New Fee</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddFee}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="fee-name" className="text-right">Name</Label>
                                        <Input id="fee-name" value={newFeeName} onChange={e => setNewFeeName(e.target.value)} className="col-span-3" placeholder="e.g., GST"/>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="fee-value" className="text-right">Value (₹)</Label>
                                        <Input id="fee-value" type="number" value={newFeeValue} onChange={e => setNewFeeValue(e.target.value)} className="col-span-3" placeholder="e.g., 25"/>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="submit" disabled={isAddingFee}>
                                            {isAddingFee && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Save fee
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {loadingFees ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : fees.length === 0 ? (
                        <p className="text-muted-foreground">No additional fees configured.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fee Name</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fees.map(fee => (
                                    <TableRow key={fee.name}>
                                        <TableCell>{fee.name}</TableCell>
                                        <TableCell>₹{fee.value.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteFee(fee)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Products</CardTitle>
                    <CardDescription>A list of the most recently added products.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingRecents ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : recentProducts.length === 0 ? (
                        <p className="text-muted-foreground">No recent products to display.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentProducts.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <Image src={product.image} alt={product.name} width={32} height={32} className="rounded-md object-cover" />
                                        </TableCell>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
            <CardDescription>A list of recent orders that need to be processed.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecents ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : pendingOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending orders.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingOrders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono text-xs">{order.id.slice(0,7)}...</TableCell>
                                <TableCell>{order.customerName}</TableCell>
                                <TableCell>{order.date.toDate().toLocaleDateString()}</TableCell>
                                <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                                <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                                <TableCell className="text-right flex gap-2 justify-end">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                             <Button size="sm"><Check className="mr-2 h-4 w-4"/>Accept</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Confirm Order #{order.id.slice(0,7)}</DialogTitle>
                                                <DialogDescription>
                                                    Confirm the order and choose follow-up actions.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                 <Button className="w-full" onClick={() => handleUpdateStatus(order.id, 'Accepted')}>
                                                    <PackageCheck className="mr-2 h-4 w-4"/> Move to Shipping
                                                 </Button>
                                                <Button variant="outline" className="w-full" onClick={() => handleSendConfirmationEmail(order)}>
                                                    <Mail className="mr-2 h-4 w-4"/> Send Confirmation Email
                                                </Button>
                                                <Button variant="outline" className="w-full" disabled>
                                                    <MessageSquare className="mr-2 h-4 w-4"/> Send to WhatsApp (Coming Soon)
                                                </Button>
                                                 <Button variant="outline" className="w-full" disabled>
                                                    <MessageSquare className="mr-2 h-4 w-4"/> Send SMS (Coming Soon)
                                                </Button>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="ghost">Close</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(order.id, 'Rejected')}>
                                        <X className="mr-2 h-4 w-4"/>Reject
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
