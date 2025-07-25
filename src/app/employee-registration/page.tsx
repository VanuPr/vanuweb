
"use client"

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from "next/navigation";
import locationData from '@/lib/india-locations.json';
import { useAuthState } from "react-firebase-hooks/auth";

interface UplineCoordinator {
    role: 'Admin' | 'district' | 'block' | 'panchayat';
    district?: string;
    blockName?: string;
    name?: string;
}

export default function EmployeeRegistrationPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, loadingAuth] = useAuthState(auth);

    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [uplineCoordinator, setUplineCoordinator] = useState<UplineCoordinator | null>(null);

    useEffect(() => {
        const fetchUplineData = async () => {
            if (user) {
                const q = query(collection(db, 'employees'), where('authUid', '==', user.uid), limit(1));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data() as UplineCoordinator;
                    setUplineCoordinator(data);
                } else if (user.email === 'admin@vanu.com') {
                    setUplineCoordinator({ role: 'Admin', name: 'Vanu Admin' });
                }
            }
        }
        fetchUplineData();
    }, [user]);

    const [formData, setFormData] = useState({
        fullName: '', fatherName: '', motherName: '', dob: '', gender: '', nationality: 'INDIAN', qualification: '',
        mobile: '', whatsappNo: '', email: '',
        village: '', post: '', panchayat: '', policeStation: '', blockName: '', pinCode: '', district: '', state: '',
        aadharNo: '', panNo: '',
        computerKnowledge: '', experience: '', prevJob: '', languages: [] as string[], positionType: '', preferredLocation: '',
        whyJoin: '', declaration1: false, declaration2: false, declaration3: false,
        bankName: '', accountNumber: '', ifscCode: '',
        uplineCoordinatorId: '', uplineCoordinatorName: '',
    });

    const [files, setFiles] = useState({
        photo: null as File | null, aadhar: null as File | null, pan: null as File | null,
        signature: null as File | null, passbook: null as File | null,
    });
    
    useEffect(() => {
        if(uplineCoordinator) {
            let initialPosition = '';
            if (uplineCoordinator.role === 'block') {
                initialPosition = 'panchayat';
            } else if (uplineCoordinator.role === 'district') {
                initialPosition = 'block';
            }


            setFormData(prev => ({
                ...prev,
                state: "Jharkhand", // Pre-select state, can be changed if needed
                district: uplineCoordinator.district || '',
                blockName: uplineCoordinator.blockName || '',
                positionType: initialPosition,
                uplineCoordinatorId: user?.uid || '',
                uplineCoordinatorName: uplineCoordinator.name || user?.email || '',
            }));
        }
    }, [uplineCoordinator, user]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value.toUpperCase() }));
    };

    const handleSelectChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'state') setFormData(prev => ({...prev, district: ''}));
    };
    
    const availableDistricts = useMemo(() => {
        if (!formData.state) return [];
        const selected = locationData.states.find(s => s.state === formData.state);
        return selected ? selected.districts.sort() : [];
    }, [formData.state]);
    
    const handleRadioChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCheckboxChange = (name: keyof typeof formData, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, files: inputFiles } = e.target;
        if (inputFiles && inputFiles[0]) {
            setFiles(prev => ({...prev, [id]: inputFiles[0]}));
        }
    };

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault();
        const form = formRef.current;
        if (form && !form.checkValidity()) {
            form.reportValidity();
            toast({ variant: 'destructive', title: 'Incomplete Form', description: 'Please fill out all required fields.' });
            return;
        }
        if (!formData.declaration1 || !formData.declaration2 || !formData.declaration3) {
            toast({ variant: 'destructive', title: 'Declaration Required', description: 'You must agree to all declarations.' });
            return;
        }
        setIsTermsModalOpen(true);
    };

    const uploadFile = async (file: File | null, applicationId: string, fileType: string): Promise<string | undefined> => {
        if (!file) return undefined;
        const storageRef = ref(storage, `coordinator-applications/${applicationId}/${fileType}-${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        return getDownloadURL(uploadResult.ref);
    };

    const handleFinalSubmit = async () => {
        if (!termsAgreed) {
            toast({ variant: 'destructive', title: 'Agreement Required', description: 'You must agree to the terms and conditions.' });
            return;
        }
        setIsLoading(true);
        
        try {
            const tempApplicationId = `temp-${Date.now()}`;
            const [photoUrl, aadharUrl, panUrl, signatureUrl, passbookUrl] = await Promise.all([
                uploadFile(files.photo, tempApplicationId, 'photo'), uploadFile(files.aadhar, tempApplicationId, 'aadhar'),
                uploadFile(files.pan, tempApplicationId, 'pan'), uploadFile(files.signature, tempApplicationId, 'signature'),
                uploadFile(files.passbook, tempApplicationId, 'passbook'),
            ]);
            
            const docRef = await addDoc(collection(db, "coordinator-applications"), {
                ...formData, photoUrl, aadharUrl, panUrl, signatureUrl, passbookUrl,
                status: 'payment_pending', submittedAt: serverTimestamp()
            });
            const applicationId = docRef.id;

            const res = await fetch('/api/razorpay', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: 2550 }),
            });
            if (!res.ok) throw new Error('Failed to create Razorpay order');
            const { order } = await res.json();
            
            const razorpayForm = document.createElement('form');
            razorpayForm.method = 'POST';
            razorpayForm.action = `https://api.razorpay.com/v1/checkout/embedded`;
            const fields = {
                key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!, order_id: order.id, name: "Vanu Organic Pvt Ltd",
                description: "Coordinator Application Fee", image: "/logo.png", 'prefill[name]': formData.fullName,
                'prefill[email]': formData.email, 'prefill[contact]': formData.mobile,
                'callback_url': `${window.location.origin}/api/razorpay/verify?applicationId=${applicationId}&type=coordinator`,
                'cancel_url': `${window.location.origin}/coordinator-application`
            };
            for (const key in fields) {
                const input = document.createElement('input');
                input.type = 'hidden'; input.name = key; input.value = (fields as any)[key];
                razorpayForm.appendChild(input);
            }
            document.body.appendChild(razorpayForm);
            razorpayForm.submit();
        } catch (error) {
            console.error("Error initiating payment: ", error);
            toast({ variant: "destructive", title: "Payment Failed", description: "Could not initiate payment. Please try again." });
            setIsLoading(false);
        }
    }
    
    const isPositionDisabled = !!uplineCoordinator && uplineCoordinator.role !== 'Admin';
    const isDistrictDisabled = !!uplineCoordinator && (uplineCoordinator.role === 'district' || uplineCoordinator.role === 'block');
    const isBlockDisabled = !!uplineCoordinator && uplineCoordinator.role === 'block';

  return (
    <>
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">Employee Registration</h1>
            <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">Please fill the form in CAPITAL LETTERS only. Application Fee: ₹2550</p>
          </div>
          
          <form ref={formRef} onSubmit={handleContinue} className="max-w-4xl mx-auto space-y-8">
            
            <Card>
                <CardHeader><CardTitle>Position</CardTitle></CardHeader>
                <CardContent>
                     <RadioGroup onValueChange={(v) => handleRadioChange('positionType', v)} value={formData.positionType} className="grid md:grid-cols-3 gap-4" required>
                        <div>
                            <RadioGroupItem value="district" id="district" className="peer sr-only" disabled={isPositionDisabled} />
                            <Label htmlFor="district" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                                District Coordinator
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="block" id="block" className="peer sr-only" disabled={isPositionDisabled}/>
                            <Label htmlFor="block" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                                Block Coordinator
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="panchayat" id="panchayat" className="peer sr-only" />
                            <Label htmlFor="panchayat" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                                Panchayat Coordinator
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label htmlFor="fullName">Name</Label><Input id="fullName" value={formData.fullName} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label>Gender</Label><RadioGroup onValueChange={(v) => handleRadioChange('gender', v)} value={formData.gender} className="flex gap-4 pt-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male">Male</Label><RadioGroupItem value="female" id="female" /><Label htmlFor="female">Female</Label></RadioGroup></div>
                    <div className="grid gap-2"><Label htmlFor="fatherName">Father’s Name</Label><Input id="fatherName" value={formData.fatherName} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="motherName">Mother’s Name</Label><Input id="motherName" value={formData.motherName} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="dob">Date of Birth</Label><Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="nationality">Nationality</Label><Input id="nationality" value={formData.nationality} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="qualification">Qualification</Label><Input id="qualification" value={formData.qualification} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="photo">Passport size photograph</Label><Input id="photo" type="file" onChange={handleFileChange} accept="image/*" required /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Address</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                     <div className="grid gap-2">
                        <Label htmlFor="state">State</Label>
                        <Select onValueChange={(v) => handleSelectChange('state', v)} value={formData.state} required>
                            <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                            <SelectContent>{locationData.states.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="district">District</Label>
                        <Select onValueChange={(v) => handleSelectChange('district', v)} value={formData.district} required disabled={isDistrictDisabled || availableDistricts.length === 0}>
                             <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                             <SelectContent>
                                {availableDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                             </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2"><Label htmlFor="blockName">Block Name</Label><Input id="blockName" value={formData.blockName} onChange={handleInputChange} required disabled={isBlockDisabled} /></div>
                    <div className="grid gap-2"><Label htmlFor="panchayat">Panchayat Name</Label><Input id="panchayat" value={formData.panchayat} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="village">Village</Label><Input id="village" value={formData.village} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="post">Post</Label><Input id="post" value={formData.post} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="policeStation">Police Station</Label><Input id="policeStation" value={formData.policeStation} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="pinCode">PIN Code</Label><Input id="pinCode" value={formData.pinCode} onChange={handleInputChange} required /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Contact & ID</CardTitle></CardHeader>
                 <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label htmlFor="mobile">Mobile No.</Label><Input id="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="whatsappNo">Whatsapp No.</Label><Input id="whatsappNo" type="tel" value={formData.whatsappNo} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2 md:col-span-2"><Label htmlFor="email">E-Mail ID</Label><Input id="email" type="email" value={formData.email} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="panNo">PAN Card No.</Label><Input id="panNo" value={formData.panNo} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2"><Label htmlFor="aadharNo">Aadhaar Card No.</Label><Input id="aadharNo" value={formData.aadharNo} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="pan">Upload PAN Card (PDF/JPG)</Label><Input id="pan" type="file" onChange={handleFileChange} required/></div>
                    <div className="grid gap-2"><Label htmlFor="aadhar">Upload Aadhar Card (PDF/JPG)</Label><Input id="aadhar" type="file" onChange={handleFileChange} required /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label>Bank Name</Label><Input id="bankName" value={formData.bankName} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2"><Label>Account Number</Label><Input id="accountNumber" value={formData.accountNumber} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2"><Label>IFSC Code</Label><Input id="ifscCode" value={formData.ifscCode} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2"><Label>Signature Upload</Label><Input id="signature" type="file" onChange={handleFileChange} accept="image/*" required /></div>
                    <div className="grid gap-2 md:col-span-2"><Label>Passbook Front Page Upload</Label><Input id="passbook" type="file" onChange={handleFileChange} required/></div>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label>Computer Knowledge</Label><RadioGroup onValueChange={(v) => handleRadioChange('computerKnowledge', v)} value={formData.computerKnowledge} className="flex gap-4 pt-2"><RadioGroupItem value="yes" id="ck_yes" /><Label htmlFor="ck_yes">Yes</Label><RadioGroupItem value="no" id="ck_no" /><Label htmlFor="ck_no">No</Label></RadioGroup></div>
                    <div className="grid gap-2"><Label htmlFor="experience">Work Experience (in Years)</Label><Input id="experience" type="number" value={formData.experience} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2"><Label htmlFor="prevJob">Previous Job Role / Designation</Label><Input id="prevJob" value={formData.prevJob} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2 md:col-span-2"><Label>Languages Known</Label><div className="flex gap-4 pt-2"><Checkbox id="lang_hi" onCheckedChange={() => {}} /><Label htmlFor="lang_hi">Hindi</Label><Checkbox id="lang_en" onCheckedChange={() => {}} /><Label htmlFor="lang_en">English</Label><Checkbox id="lang_local" onCheckedChange={() => {}} /><Label htmlFor="lang_local">Local</Label></div></div>
                    <div className="grid gap-2"><Label htmlFor="preferredLocation">Preferred Location</Label><Input id="preferredLocation" value={formData.preferredLocation} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2 md:col-span-2"><Label htmlFor="whyJoin">Why do you want to join us?</Label><Textarea id="whyJoin" value={formData.whyJoin} onChange={handleInputChange} required/></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Declaration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3"><Checkbox id="declaration1" checked={formData.declaration1} onCheckedChange={(c) => handleCheckboxChange('declaration1', !!c)}/><Label htmlFor="declaration1" className="text-sm text-muted-foreground">I confirm that all information provided in this form is true and correct to the best of my knowledge.</Label></div>
                    <div className="flex items-start gap-3"><Checkbox id="declaration2" checked={formData.declaration2} onCheckedChange={(c) => handleCheckboxChange('declaration2', !!c)}/><Label htmlFor="declaration2" className="text-sm text-muted-foreground">I understand that submitting this application does not guarantee selection for the position.</Label></div>
                    <div className="flex items-start gap-3"><Checkbox id="declaration3" checked={formData.declaration3} onCheckedChange={(c) => handleCheckboxChange('declaration3', !!c)}/><Label htmlFor="declaration3" className="text-sm text-muted-foreground">I agree to the terms and conditions of the coordinator program.</Label></div>
                </CardContent>
            </Card>

            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin"/> : null}
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>

    <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Coordinator Terms & Conditions</DialogTitle>
                <DialogDescription>
                    Please review and accept the terms and conditions to complete your application.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-md my-4">
                <ul className="space-y-3 list-disc list-inside text-sm">
                    <li>After the appointment of any coordinator, it will be mandatory to undergo one day training.</li>
                    <li>Your work starts only after passing the training.</li>
                    <li>It is mandatory for the Block Coordinator to make two thousand farmer organic cards every month.</li>
                    <li>The registration fee of Block Coordinator is Rs. 2550, if someone takes more than this fee by offering any inducement then you yourself will be responsible for it.</li>
                    <li>The money you pay for registration will be refunded once you start working.</li>
                    <li>Your registration fee will be refunded once at least ten Panchayats of your block are zoned.</li>
                    <li>In case of any untoward incident during work, the company will provide an insurance of Rs. 1,00,000/- to your family and in case of any accident, Rs. 50,000 will be given for treatment.</li>
                    <li>The Coordinator will get a salary of twenty thousand (20000 + 3000 TA + DA).</li>
                    <li>Your salary starts from the day of your training and joining meeting.</li>
                    <li>On making six thousands cards within three months and opening a stock point in your block, a motor bike Honda SP Shine will be given as a gift by the company.</li>
                    <li>Whose registration and insurance will be done by you yourself, rest of the EMI and down payment will be done by the company.</li>
                    <li>The company gives you the bike to work in your block.</li>
                    <li>After completion of the card processing, along with your Panchayat Coordinator, you will have to explain about the product to the cardholder customers and provide fertilizers (Bio DAP, Bio NPK, Bio Potash) to everyone from your stock point.</li>
                    <li>At present, if any dispute occurs during work, it will be resolved in the court of Godda with the help of Godda Head Branch.</li>
                </ul>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={termsAgreed} onCheckedChange={(c) => setTermsAgreed(!!c)} />
                <Label htmlFor="terms" className="cursor-pointer">I have read, understood, and agree to the terms and conditions.</Label>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsTermsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleFinalSubmit} disabled={!termsAgreed || isLoading}>
                     {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Agree & Submit Application
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
