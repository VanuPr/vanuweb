
"use client"

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { indianStates } from "@/lib/indian-states";

export default function KisanJaivikCardPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        fatherName: '',
        dob: '',
        aadharNo: '',
        panNo: '',
        mobile: '',
        village: '',
        panchayat: '',
        block: '',
        district: '',
        pinCode: '',
        state: '',
    });

    const [files, setFiles] = useState({
        aadharFile: null as File | null,
        panFile: null as File | null,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleSelectChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, files: inputFiles } = e.target;
        if (inputFiles && inputFiles[0]) {
            setFiles(prev => ({...prev, [id]: inputFiles[0]}));
        }
    };
    
    const makePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const requiredFields: (keyof typeof formData)[] = ['name', 'fatherName', 'dob', 'aadharNo', 'panNo', 'mobile', 'village', 'panchayat', 'block', 'district', 'pinCode', 'state'];
        for (const key of requiredFields) {
            if (!formData[key]) {
                 toast({ variant: 'destructive', title: 'Missing fields', description: `Please fill in all required details.` });
                 return;
            }
        }
        if (!files.aadharFile || !files.panFile) {
            toast({ variant: 'destructive', title: 'File Upload Required', description: `Please upload both Aadhar and PAN card.` });
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/razorpay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount: 65 }), // Amount in Rupees
            });

            if (!res.ok) {
                throw new Error('Failed to create Razorpay order');
            }

            const { order } = await res.json();
            
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Vanu Organic Pvt Ltd",
                description: "Kisan Jaivik Card Application Fee",
                image: "/logo.png",
                order_id: order.id,
                handler: async function (response: any) {
                    await saveApplicationToFirestore(response.razorpay_payment_id);
                },
                prefill: {
                    name: formData.name,
                    contact: formData.mobile,
                },
                theme: {
                    color: "#3c6255"
                }
            };
            
            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
             toast({ variant: 'destructive', title: 'Payment Error', description: 'Could not initiate payment. Please try again.' });
        } finally {
             setIsLoading(false);
        }
    };

    const saveApplicationToFirestore = async (paymentId: string) => {
        try {
            // Note: File upload to storage is not implemented here. This only saves form data.
            const docData = {
                ...formData,
                paymentId,
                status: 'Pending',
                submittedAt: serverTimestamp()
            };
            await addDoc(collection(db, "kisan-jaivik-card-applications"), docData);
            toast({ title: 'Application Submitted', description: 'Your application has been received successfully.'});
            // Reset form
            setFormData({
                name: '', fatherName: '', dob: '', aadharNo: '', panNo: '', mobile: '',
                village: '', panchayat: '', block: '', district: '', pinCode: '',
                state: ''
            });
            setFiles({ aadharFile: null, panFile: null });
            const aadharInput = document.getElementById('aadharFile') as HTMLInputElement;
            const panInput = document.getElementById('panFile') as HTMLInputElement;
            if(aadharInput) aadharInput.value = '';
            if(panInput) panInput.value = '';

        } catch (error) {
            console.error("Error submitting application: ", error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'There was an error saving your application after payment.'});
        }
    }


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24 flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Kisaan Jaivik Card Application</CardTitle>
            <CardDescription>Fill out the form below to apply for your card. Grant amount is ₹65.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={makePayment} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Farmer's Name</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fatherName">Father's/Husband's Name</Label>
                        <Input id="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Enter name" required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <Input id="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} placeholder="Enter your mobile number" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="aadharNo">Aadhar No.</Label>
                        <Input id="aadharNo" value={formData.aadharNo} onChange={handleInputChange} placeholder="Enter Aadhar number" required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="panNo">PAN No.</Label>
                        <Input id="panNo" value={formData.panNo} onChange={handleInputChange} placeholder="Enter PAN number" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="aadharFile">Upload Aadhar Card</Label>
                        <Input id="aadharFile" type="file" onChange={handleFileChange} disabled={isLoading} accept="image/*,.pdf" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="panFile">Upload PAN Card</Label>
                        <Input id="panFile" type="file" onChange={handleFileChange} disabled={isLoading} accept="image/*,.pdf" required />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="village">Village Name</Label>
                        <Input id="village" value={formData.village} onChange={handleInputChange} placeholder="Enter your village" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="panchayat">Panchayat</Label>
                        <Input id="panchayat" value={formData.panchayat} onChange={handleInputChange} placeholder="Enter your panchayat" required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="state">State</Label>
                        <Select onValueChange={(v) => handleSelectChange('state', v)} value={formData.state} required disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                            <SelectContent>
                                {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="district">District</Label>
                         <Input id="district" value={formData.district} onChange={handleInputChange} placeholder="Enter your district" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="block">Block</Label>
                        <Input id="block" value={formData.block} onChange={handleInputChange} placeholder="Enter your block" required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="pinCode">PIN Code</Label>
                        <Input id="pinCode" value={formData.pinCode} onChange={handleInputChange} placeholder="Enter PIN code" required disabled={isLoading} />
                    </div>
                </div>
                
                <div className="grid gap-2">
                   <Label>Anudan Rashi (Application Fee)</Label>
                   <Input value="₹65" readOnly disabled className="font-bold text-center bg-muted" />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isLoading ? 'Processing...' : 'Pay & Submit Application'}
                </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
