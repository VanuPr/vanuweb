
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { getDB } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, PackageCheck, PackageX, Eye, IndianRupee, ShoppingCart, CalendarDays, BarChart, PieChart, LineChart, Check, X, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { startOfDay, startOfMonth, getMonth, subDays } from 'date-fns';

// --- Interfaces ---
interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}
interface ShippingInfo {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
}
interface Fee {
    name: string;
    value: number;
}
interface Order {
  id: string;
  customerName: string;
  email?: string;
  total: number;
  subtotal: number;
  shipping: number;
  fees: Fee[];
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Shipped' | 'Delivered';
  date: Timestamp;
  items: CartItem[];
  shippingAddress: ShippingInfo;
  paymentMethod: string;
}

// --- Helper Functions ---
const getStartOfFinancialYear = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    // Financial year starts in April (month 3)
    const financialYearStartYear = month >= 3 ? year : year - 1;
    return new Date(financialYearStartYear, 3, 1);
};


// --- Main Component ---
export default function AdminOrdersPage() {
  const db = getDB();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
      setLoading(true);
      try {
        const ordersQuery = query(collection(db, 'orders'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(ordersQuery);
        const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({ variant: "destructive", title: "Error fetching orders", description: "Could not fetch and sort orders from the database." });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
      try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, { status });
          toast({ title: "Order status updated", description: `Order has been marked as ${status}.`});
          fetchOrders(); // Refresh the list
      } catch(error) {
          console.error("Error updating status:", error);
          toast({ variant: "destructive", title: "Update Failed", description: "Could not update the order status."});
      }
  }

  const getStatusBadgeVariant = (status: Order['status']) => {
      switch(status) {
          case 'Pending': return 'default';
          case 'Accepted': return 'secondary';
          case 'Shipped': return 'default';
          case 'Delivered': return 'default';
          case 'Rejected': return 'destructive';
          default: return 'outline';
      }
  }

  // --- Analytics Data Processing ---
  const analyticsData = useMemo(() => {
    if (loading) return null;

    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const fyStart = getStartOfFinancialYear(now);
    const last30DaysStart = subDays(now, 30);
    
    // Stats Cards
    const todaysOrders = orders.filter(o => o.date.toDate() >= todayStart);
    const thisMonthsOrders = orders.filter(o => o.date.toDate() >= monthStart);
    const thisFyOrders = orders.filter(o => o.date.toDate() >= fyStart);

    const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
    const thisMonthsRevenue = thisMonthsOrders.reduce((sum, o) => sum + o.total, 0);
    const thisFyRevenue = thisFyOrders.reduce((sum, o) => sum + o.total, 0);

    // Charts
    const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const monthlyRevenue = Array(12).fill(0).map((_, i) => ({ name: new Date(0, i).toLocaleString('default', { month: 'short' }), revenue: 0 }));
    thisFyOrders.forEach(o => {
        const month = getMonth(o.date.toDate());
        monthlyRevenue[month].revenue += o.total;
    });

    const dailyOrders = new Map<string, number>();
    const ordersLast30Days = orders.filter(o => o.date.toDate() >= last30DaysStart);
    ordersLast30Days.forEach(o => {
        const dateStr = o.date.toDate().toLocaleDateString();
        dailyOrders.set(dateStr, (dailyOrders.get(dateStr) || 0) + 1);
    });

    const dailyOrdersTrend = Array.from(dailyOrders.entries())
        .map(([date, count]) => ({ date, orders: count }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return {
        todaysOrdersCount: todaysOrders.length,
        todaysRevenue,
        thisMonthsOrdersCount: thisMonthsOrders.length,
        thisMonthsRevenue,
        thisFyOrdersCount: thisFyOrders.length,
        thisFyRevenue,
        ordersByStatus: Object.entries(ordersByStatus).map(([name, value]) => ({ name, value })),
        monthlyRevenue,
        dailyOrdersTrend
    };
  }, [orders, loading]);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];


  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Orders Dashboard</h1>
      
      {/* --- Orders Table --- */}
       <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>View and manage all customer orders, sorted by most recent.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {orders.map((order) => (
                    <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(0, 7)}...</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.date.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{order.paymentMethod}</TableCell>
                    <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                       <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Order Details</DialogTitle>
                                    <DialogDescription>
                                        Order ID: {order.id}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid md:grid-cols-2 gap-6 py-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Customer & Shipping</h3>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p><span className="font-medium text-foreground">Name:</span> {order.customerName}</p>
                                            <p><span className="font-medium text-foreground">Email:</span> {order.email || 'N/A'}</p>
                                            <p><span className="font-medium text-foreground">Phone:</span> {order.shippingAddress.phone}</p>
                                            <p><span className="font-medium text-foreground">Address:</span> {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}</p>
                                        </div>
                                    </div>
                                     <div>
                                        <h3 className="font-semibold mb-2">Order Summary</h3>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p><span className="font-medium text-foreground">Date:</span> {order.date.toDate().toLocaleString()}</p>
                                            <div className="flex items-center gap-2"><span className="font-medium text-foreground">Status:</span> <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <h3 className="font-semibold mb-2">Items Ordered</h3>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Quantity</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {order.items.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{item.name}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="md:col-span-2">
                                        <h3 className="font-semibold mb-2">Price Breakdown</h3>
                                        <div className="space-y-2 text-sm border p-4 rounded-md">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span>₹{order.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Shipping</span>
                                                <span>₹{order.shipping.toFixed(2)}</span>
                                            </div>
                                            {order.fees && order.fees.map(fee => (
                                                <div key={fee.name} className="flex justify-between">
                                                    <span className="text-muted-foreground">{fee.name}</span>
                                                    <span>₹{fee.value.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <Separator />
                                            <div className="flex justify-between font-bold text-base">
                                                <span className="text-foreground">Grand Total</span>
                                                <span>₹{order.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Have Questions?</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-2">
                                                <Button asChild>
                                                    <a href="tel:+916422357207">
                                                        <Phone className="mr-2 h-4 w-4" /> Call Us
                                                    </a>
                                                </Button>
                                                <Button asChild variant="outline">
                                                    <a href="mailto:info@vanuorganic.com">
                                                        <Mail className="mr-2 h-4 w-4" /> Mail Us
                                                    </a>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Return & Refund Policy</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                                                    <li>Returns are accepted within 3 days of delivery.</li>
                                                    <li>Opened or used packages will not be eligible for return.</li>
                                                    <li>To initiate a return, please contact customer support with your order ID.</li>
                                                    <li>Refunds will be processed to the original payment method upon receipt and inspection of the returned item.</li>
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                                <DialogFooter className="sm:justify-between mt-4">
                                    {order.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <DialogClose asChild>
                                                <Button type="button" onClick={() => handleUpdateStatus(order.id, 'Accepted')}>
                                                    <Check className="mr-2 h-4 w-4" /> Accept
                                                </Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button type="button" variant="destructive" onClick={() => handleUpdateStatus(order.id, 'Rejected')}>
                                                     <X className="mr-2 h-4 w-4" /> Reject
                                                </Button>
                                            </DialogClose>
                                        </div>
                                    )}
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">
                                            Close
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>

      {/* --- Summary Cards --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.todaysOrdersCount}</div>
            <p className="text-xs text-muted-foreground">₹{analyticsData?.todaysRevenue.toFixed(2)} today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Orders</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.thisMonthsOrdersCount}</div>
            <p className="text-xs text-muted-foreground">₹{analyticsData?.thisMonthsRevenue.toFixed(2)} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (FY)</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analyticsData?.thisFyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{analyticsData?.thisFyOrdersCount} orders this financial year</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Analytics Section --- */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
              <CardHeader>
                  <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                   <ChartContainer config={{}} className="mx-auto aspect-square h-[300px]">
                      <RechartsPieChart>
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analyticsData?.ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                           {analyticsData?.ordersByStatus.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                           ))}
                        </Pie>
                         <Legend/>
                      </RechartsPieChart>
                  </ChartContainer>
              </CardContent>
          </Card>
          <Card className="lg:col-span-2">
              <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                  <CardDescription>Revenue for the current financial year.</CardDescription>
              </CardHeader>
               <CardContent>
                    <ChartContainer config={{ revenue: { label: 'Revenue', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
                      <RechartsBarChart data={analyticsData?.monthlyRevenue} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${value / 1000}k`} />
                        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                      </RechartsBarChart>
                    </ChartContainer>
               </CardContent>
          </Card>
           <Card className="lg:col-span-3">
               <CardHeader>
                  <CardTitle>Order Volume Trend (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                    <ChartContainer config={{ orders: { label: 'Orders', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
                       <RechartsLineChart data={analyticsData?.dailyOrdersTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short'})} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                      </RechartsLineChart>
                    </ChartContainer>
              </CardContent>
           </Card>
      </div>

    </div>
  );
}
