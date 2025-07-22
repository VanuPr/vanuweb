
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Home } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Address } from '@/app/account/page';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddressForm } from '@/components/address-form';
import { Label } from '@/components/ui/label';

interface Fee {
    name: string;
    value: number;
}

export default function CheckoutPage() {
  const { translations } = useLanguage();
  const { cart, clearCart } = useCart();
  const t = translations.checkout;
  const router = useRouter();
  const { toast } = useToast();
  const [user, loadingAuth] = useAuthState(auth);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shipping, setShipping] = useState(0);
  const [additionalFees, setAdditionalFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  useEffect(() => {
    if (!loadingAuth) {
        if (!user) {
            router.push('/customer-login');
            return;
        }

        if (cart.length === 0 && !isSubmitting) {
            router.push('/products');
        }
    }
  }, [user, loadingAuth, cart, isSubmitting, router]);

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const shippingDoc = await getDoc(doc(db, 'settings', 'shipping'));
            if (shippingDoc.exists()) {
                setShipping(shippingDoc.data().charge || 0);
            }

            const feesDoc = await getDoc(doc(db, 'settings', 'fees'));
            if (feesDoc.exists()) {
                setAdditionalFees(feesDoc.data().charges || []);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            setShipping(50); // Fallback
        } finally {
            setLoading(false);
        }
    };
    
    fetchInitialData();
    
    if (user) {
        const unsubAddresses = onSnapshot(collection(db, 'users', user.uid, 'addresses'), (snapshot) => {
            const userAddresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
            setAddresses(userAddresses);
            if (!selectedAddress && userAddresses.length > 0) {
                setSelectedAddress(userAddresses[0]);
            }
        });
        return () => unsubAddresses();
    }
  }, [user, selectedAddress]);

  const getPriceAsNumber = (price: string | number) => {
    if (typeof price === 'number') return price;
    return parseFloat(price.replace(/[^0-9.]/g, ''));
  };

  const subtotal = cart.reduce((sum, item) => sum + (getPriceAsNumber(item.price) * item.quantity), 0);
  const totalFees = additionalFees.reduce((sum, fee) => sum + fee.value, 0);
  const total = subtotal + shipping + totalFees;


  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) {
        toast({ variant: 'destructive', title: 'Please select or add a shipping address.' });
        return;
    }
    if (cart.length === 0) {
        toast({ variant: 'destructive', title: 'Your cart is empty' });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        const orderData = {
            userId: user ? user.uid : 'guest',
            customerName: `${selectedAddress.firstName} ${selectedAddress.lastName}`,
            email: user?.email,
            shippingAddress: selectedAddress,
            items: cart.map(({ imageHover, aiHint, ...item }) => item), // Remove client-side only fields
            subtotal,
            shipping,
            fees: additionalFees,
            total,
            status: 'Pending',
            paymentMethod,
            date: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "orders"), orderData);
        
        // Also update stock
        for (const item of cart) {
            const productRef = doc(db, 'products', item.id);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const currentStock = productSnap.data().stock || 0;
                const newStock = Math.max(0, currentStock - item.quantity);
                await updateDoc(productRef, { stock: newStock });
            }
        }
        
        clearCart();
        toast({ title: 'Order Placed!', description: 'Thank you for your purchase.' });
        router.push(`/order-confirmation?id=${docRef.id}`);

    } catch (error) {
        console.error("Error placing order:", error);
        toast({ variant: 'destructive', title: 'Order Failed', description: 'There was an issue placing your order. Please try again.' });
        setIsSubmitting(false);
    }
  };

   const handleSaveAddress = async (addressData: Omit<Address, 'id'>) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'users', user.uid, 'addresses'), addressData);
            toast({ title: 'Address added' });
            setIsAddressDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to save address' });
        }
    };

  if (loadingAuth || loading || !user) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <form onSubmit={handlePlaceOrder}>
            <div className="container mx-auto px-4 md:px-6">
                <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl mb-8">{t.title}</h1>
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="md:col-span-2">
                        <div className="space-y-8">
                            {/* Shipping Information */}
                            <Card>
                                <CardHeader className="flex flex-row justify-between items-center">
                                    <CardTitle className="font-headline">{t.shippingTitle}</CardTitle>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsAddressDialogOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4"/> {t.addNewAddress}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup value={selectedAddress?.id} onValueChange={(id) => setSelectedAddress(addresses.find(a => a.id === id) || null)}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {addresses.map(address => (
                                                <div key={address.id}>
                                                    <RadioGroupItem value={address.id} id={`addr-${address.id}`} className="peer sr-only"/>
                                                    <Label htmlFor={`addr-${address.id}`} className="flex flex-col rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                                        <span className="font-bold mb-2">{address.firstName} {address.lastName}</span>
                                                        <span className="text-sm">{address.address}</span>
                                                        <span className="text-sm">{address.city}, {address.state} - {address.zip}</span>
                                                        <span className="text-sm mt-1">{address.phone}</span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                    {addresses.length === 0 && (
                                        <div className="text-center text-muted-foreground py-8">
                                            <p>{t.noAddressFound}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment Method */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline">{t.paymentTitle}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-4">
                                        <div>
                                            <RadioGroupItem value="card" id="card" className="peer sr-only" disabled/>
                                            <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary opacity-50 cursor-not-allowed">
                                                {t.creditCard} (Coming Soon)
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
                                            <Label htmlFor="cod" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                {t.cod}
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="md:col-span-1">
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">{t.orderSummaryTitle}</CardTitle>
                                <CardDescription>{t.summaryDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between text-muted-foreground text-sm">
                                        <span>{item.quantity} x {item.name}</span>
                                        <span>₹{(getPriceAsNumber(item.price) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <Separator/>
                                 <div className="flex justify-between">
                                    <span>{t.subtotal}</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t.shipping}</span>
                                    <span>₹{shipping.toFixed(2)}</span>
                                </div>
                                {additionalFees.map(fee => (
                                    <div key={fee.name} className="flex justify-between">
                                        <span>{fee.name}</span>
                                        <span>₹{fee.value.toFixed(2)}</span>
                                    </div>
                                ))}
                                <Separator/>
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{t.total}</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Button type="submit" className="w-full mt-6" disabled={isSubmitting || cart.length === 0 || !selectedAddress}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isSubmitting ? t.placingOrder : t.placeOrderButton}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
         <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Shipping Address</DialogTitle>
                </DialogHeader>
                <AddressForm
                    onSubmit={handleSaveAddress}
                    onCancel={() => setIsAddressDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
