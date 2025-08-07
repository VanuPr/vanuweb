
"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { getDB } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Truck, PackageCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Order {
  id: string;
  customerName: string;
  total: number;
  status: 'Accepted' | 'Shipped' | 'Delivered';
  date: Timestamp;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  trackingId?: string;
  shippingUrl?: string;
}

export default function AdminShippingPage() {
  const db = getDB();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [shippingUrl, setShippingUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchFulfillableOrders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', 'in', ['Accepted', 'Shipped']),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ variant: "destructive", title: "Error fetching orders" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFulfillableOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = (order: Order) => {
    setCurrentOrder(order);
    setTrackingId(order.trackingId || '');
    setShippingUrl(order.shippingUrl || '');
    setIsDialogOpen(true);
  };

  const handleMarkAsShipped = async () => {
    if (!currentOrder) return;
    setIsUpdating(true);
    try {
      const orderRef = doc(db, 'orders', currentOrder.id);
      await updateDoc(orderRef, {
        status: 'Shipped',
        trackingId: trackingId,
        shippingUrl: shippingUrl,
      });
      toast({ title: "Order marked as shipped!" });
      fetchFulfillableOrders();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: 'Delivered' });
        toast({ title: "Order marked as delivered!" });
        fetchFulfillableOrders(); // Refresh the list
    } catch(error) {
        toast({ variant: "destructive", title: "Update Failed" });
    }
  };
  
   const getStatusBadgeVariant = (status: Order['status']) => {
      switch(status) {
          case 'Accepted': return 'secondary';
          case 'Shipped': return 'default';
          default: return 'outline';
      }
  }


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Shipping Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Ready to Ship</CardTitle>
          <CardDescription>Manage all confirmed orders that are ready for fulfillment.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No orders are currently ready for shipping.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 7)}...</TableCell>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell>{`${order.shippingAddress.address}, ${order.shippingAddress.city}`}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(order)}>
                        <Truck className="mr-2 h-4 w-4" />
                        {order.status === 'Shipped' ? 'Update Tracking' : 'Mark as Shipped'}
                      </Button>
                       {order.status === 'Shipped' && (
                         <Button variant="secondary" size="sm" onClick={() => handleMarkAsDelivered(order.id)}>
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Mark Delivered
                         </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ship Order #{currentOrder?.id.slice(0, 7)}</DialogTitle>
            <DialogDescription>Enter tracking details to mark the order as shipped.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="trackingId">Tracking ID</Label>
              <Input
                id="trackingId"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g. 1Z9999W99999999999"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shippingUrl">Shipping Provider URL</Label>
              <Input
                id="shippingUrl"
                value={shippingUrl}
                onChange={(e) => setShippingUrl(e.target.value)}
                placeholder="e.g. https://www.delhivery.com/track/package/"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isUpdating}>Cancel</Button>
            <Button onClick={handleMarkAsShipped} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Mark as Shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
