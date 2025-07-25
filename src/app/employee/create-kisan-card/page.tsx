
"use client"

import { useState } from "react";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, QrCode } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { indianStates } from "@/lib/indian-states";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CoordinatorKisanCardPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [isLoading, setIsLoading] = useState(false);
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        fatherName: '',
        dob: '',
        idType: 'aadhar',
        idNumber: '',
        mobile: '',
        village: '',
        panchayat: '',
        block: '',
        district: '',
        pinCode: '',
        state: '',
        paymentMethod: 'cash'
    });

    const [files, setFiles] = useState({
        photo: null as File | null,
        signature: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, files: inputFiles } = e.target;
        if (inputFiles && inputFiles[0]) {
            setFiles(prev => ({ ...prev, [id]: inputFiles[0] }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleSelectChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleRadioChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    const uploadFile = async (file: File | null, applicationId: string, fileType: string): Promise<string | undefined> => {
        if (!file) return undefined;
        const storageRef = ref(storage, `kisan-jaivik-card-applications/${applicationId}/${fileType}-${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        return getDownloadURL(uploadResult.ref);
    };

    const processApplication = async (paymentDetails: any = {}) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
            return;
        }

        setIsLoading(true);
        try {
            // First create doc to get an ID
            const tempDocRef = doc(collection(db, "kisan-jaivik-card-applications"));
            const applicationId = tempDocRef.id;

            // Upload files with the new ID
            const [photoUrl, signatureUrl] = await Promise.all([
                uploadFile(files.photo, applicationId, 'photo'),
                uploadFile(files.signature, applicationId, 'signature'),
            ]);

            // Now set the data in the doc
            await setDoc(tempDocRef, {
                ...formData,
                photoUrl,
                signatureUrl,
                status: 'Received',
                submittedAt: serverTimestamp(),
                coordinatorId: user.uid,
                coordinatorName: user.displayName || user.email,
                ...paymentDetails
            });

            toast({ title: 'Application Submitted', description: 'The Kisan Jaivik Card application has been received.' });
            router.push('/employee/kisan-jaivik-card'); // Redirect after success
        } catch(error) {
             toast({ variant: 'destructive', title: 'Submission Failed', description: 'There was an error saving the application.' });
        } finally {
            setIsLoading(false);
            setIsQrDialogOpen(false);
        }
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const requiredFields: (keyof typeof formData)[] = ['name', 'fatherName', 'dob', 'idNumber', 'mobile', 'village', 'panchayat', 'block', 'district', 'pinCode', 'state'];
        for (const key of requiredFields) {
            if (!formData[key]) {
                 toast({ variant: 'destructive', title: 'Missing fields', description: `Please fill in all required details.` });
                 return;
            }
        }
        if (!files.photo || !files.signature) {
             toast({ variant: 'destructive', title: 'Missing uploads', description: `Please upload both photo and signature.` });
             return;
        }
        
        if (formData.paymentMethod === 'cash') {
            processApplication({ paymentId: 'Collected in Cash' });
        } else if (formData.paymentMethod === 'online_razorpay') {
            // Handle Razorpay
            setIsLoading(true);
            try {
                const res = await fetch('/api/razorpay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: 65 }),
                });

                if (!res.ok) throw new Error('Failed to create Razorpay order');
                const { order: razorpayOrder } = await res.json();
                
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                    amount: razorpayOrder.amount,
                    currency: "INR",
                    name: "Vanu Organic Pvt Ltd",
                    description: "Kisan Jaivik Card Fee",
                    order_id: razorpayOrder.id,
                    handler: function (response: any) {
                        processApplication({
                            paymentId: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                    },
                    prefill: { name: formData.name, contact: formData.mobile },
                    theme: { color: "#336633" }
                };
                
                const rzp1 = new window.Razorpay(options);
                 rzp1.on('payment.failed', function (response: any) {
                    toast({ variant: "destructive", title: "Payment Failed", description: response.error.description });
                    setIsLoading(false);
                });
                rzp1.open();

            } catch(error: any) {
                 toast({ variant: 'destructive', title: 'Payment Error', description: error.message || 'Could not initiate payment.' });
                 setIsLoading(false);
            }
        } else if (formData.paymentMethod === 'online_qr') {
            setIsQrDialogOpen(true);
        }
    };

  return (
    <>
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-16 md:py-24 flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Create Kisaan Jaivik Card</CardTitle>
            <CardDescription>Fill out the form below to apply for your card. Grant amount is ₹65.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                        <Label>ID Type</Label>
                        <RadioGroup onValueChange={(v) => handleRadioChange('idType', v)} value={formData.idType} className="flex gap-4 pt-2">
                            <RadioGroupItem value="aadhar" id="aadhar" /><Label htmlFor="aadhar">Aadhar Card</Label>
                            <RadioGroupItem value="pan" id="pan" /><Label htmlFor="pan">PAN Card</Label>
                        </RadioGroup>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="idNumber">{formData.idType === 'aadhar' ? 'Aadhar Number' : 'PAN Number'}</Label>
                        <Input id="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder={`Enter ${formData.idType.toUpperCase()} number`} required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="photo">Passport Size Photo</Label>
                        <Input id="photo" type="file" onChange={handleFileChange} accept="image/*" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="signature">Signature</Label>
                        <Input id="signature" type="file" onChange={handleFileChange} accept="image/*" required disabled={isLoading} />
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
                    <Label>Payment Method</Label>
                    <RadioGroup onValueChange={(v) => handleRadioChange('paymentMethod', v)} value={formData.paymentMethod} className="grid grid-cols-2 gap-4">
                        <Label htmlFor="cash" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                            Cash
                        </Label>
                        <Label htmlFor="online" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                           <RadioGroupItem value="online" id="online" className="peer sr-only" />
                            Online
                        </Label>
                    </RadioGroup>

                    {formData.paymentMethod === 'online' && (
                        <RadioGroup onValueChange={(v) => setFormData({...formData, paymentMethod: v})} className="grid grid-cols-2 gap-4 mt-4">
                            <Label htmlFor="online_razorpay" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                <RadioGroupItem value="online_razorpay" id="online_razorpay" className="peer sr-only" />
                                Pay with Razorpay
                            </Label>
                            <Label htmlFor="online_qr" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                <RadioGroupItem value="online_qr" id="online_qr" className="peer sr-only" />
                                Pay by QR Code
                            </Label>
                        </RadioGroup>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isLoading ? 'Processing...' : 'Submit Application'}
                </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
    <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Scan QR Code to Pay</DialogTitle>
                <DialogDescription>
                    Please have the farmer scan the QR code below to pay the ₹65 fee. Once paid, confirm the transaction.
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4">
                <Image src="https://github.com/akm12109/assets_vanu/blob/main/paymentqr.png?raw=true" alt="Payment QR Code" width={300} height={300} data-ai-hint="payment qr" />
            </div>
            <DialogFooter>
                 <Button variant="ghost" onClick={() => setIsQrDialogOpen(false)}>Cancel</Button>
                 <Button onClick={() => processApplication({ paymentId: 'Paid by QR (manual confirmation)' })} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Payment & Submit
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
