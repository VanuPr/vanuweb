"use client"

import React, { useState, useMemo, useRef } from "react";
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
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from "next/navigation";
import locationData from '@/lib/india-locations.json';


declare global {
    interface Window {
        Razorpay: any;
    }
}


export default function CoordinatorApplicationFormPage() {
    const { toast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);

    const [formData, setFormData] = useState({
        // Personal
        fullName: '',
        fatherName: '',
        motherName: '',
        dob: '',
        gender: '',
        nationality: 'INDIAN',
        qualification: '',
        
        // Contact
        mobile: '',
        whatsappNo: '',
        email: '',

        // Address
        village: '',
        post: '',
        panchayat: '',
        policeStation: '',
        blockName: '',
        pinCode: '',
        district: '',
        state: '',

        // ID
        aadharNo: '',
        panNo: '',
        
        // Other
        computerKnowledge: '',
        experience: '',
        prevJob: '',
        languages: [] as string[],
        positionType: '',
        preferredLocation: '',
        whyJoin: '',
        declaration1: false,
        declaration2: false,
        declaration3: false,
        bankName: '',
        accountNumber: '',
        ifscCode: '',
    });
    const [files, setFiles] = useState({
        photo: null as File | null,
        aadhar: null as File | null,
        pan: null as File | null,
        signature: null as File | null,
        passbook: null as File | null,
    });


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value.toUpperCase() }));
    };

    const handleSelectChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'state') {
            setFormData(prev => ({...prev, district: ''}));
        }
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

    const handleLanguageCheckbox = (lang: string) => {
        setFormData(prev => {
            const newLangs = prev.languages.includes(lang) 
                ? prev.languages.filter(l => l !== lang)
                : [...prev.languages, lang];
            return { ...prev, languages: newLangs };
        });
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
            toast({ variant: 'destructive', title: 'Incomplete Form', description: 'Please fill out all required fields before continuing.' });
            return;
        }

        if (!formData.declaration1 || !formData.declaration2 || !formData.declaration3) {
            toast({ variant: 'destructive', title: 'Declaration Required', description: 'You must agree to all initial declarations to proceed.' });
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
        
        // Create a pending application document first to get an ID
        let applicationDocRef;
        try {
            applicationDocRef = await addDoc(collection(db, "coordinator-applications"), {
                ...formData,
                status: 'payment_pending',
                submittedAt: serverTimestamp()
            });

            // Step 1: Upload all files concurrently
            const [photoUrl, aadharUrl, panUrl, signatureUrl, passbookUrl] = await Promise.all([
                uploadFile(files.photo, applicationDocRef.id, 'photo'),
                uploadFile(files.aadhar, applicationDocRef.id, 'aadhar'),
                uploadFile(files.pan, applicationDocRef.id, 'pan'),
                uploadFile(files.signature, applicationDocRef.id, 'signature'),
                uploadFile(files.passbook, applicationDocRef.id, 'passbook'),
            ]);
            
            // Step 2: Update the document with file URLs
            await updateDoc(applicationDocRef, {
                photoUrl,
                aadharUrl,
                panUrl,
                signatureUrl,
                passbookUrl,
            });

            // Step 3: Create Razorpay order
            const res = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: 2550 }),
            });
            if (!res.ok) throw new Error('Failed to create Razorpay order');

            const { order: razorpayOrder } = await res.json();
            
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount: razorpayOrder.amount,
                currency: "INR",
                name: "Vanu Organic Pvt Ltd",
                description: "Coordinator Application Fee",
                image: "/logo.png",
                order_id: razorpayOrder.id,
                handler: async function (response: any) {
                    const data = {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                    };
                    
                    const verifyUrl = `/api/razorpay/verify?applicationId=${applicationDocRef!.id}&type=coordinator`;

                    const result = await fetch(verifyUrl, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });
                    
                    if(result.ok && result.url) {
                        router.push(result.url);
                    } else {
                         const errorResult = await result.json();
                         toast({ variant: 'destructive', title: 'Payment Verification Failed', description: errorResult.error || 'Please contact support.'});
                         setIsLoading(false);
                    }
                },
                prefill: {
                    name: formData.fullName,
                    email: formData.email,
                    contact: formData.mobile,
                },
                theme: {
                    color: "#336633"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                 toast({
                    variant: "destructive",
                    title: "Payment Failed",
                    description: response.error.description,
                });
                updateDoc(doc(db, "coordinator-applications", applicationDocRef!.id), { status: 'payment_failed' });
                setIsLoading(false);
            });
            rzp1.open();


        } catch (error) {
            console.error("Error initiating payment: ", error);
            toast({ variant: "destructive", title: "Payment Failed", description: "Could not initiate payment. Please try again." });
            setIsLoading(false);
        }
    }

  return (
    <>
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">Coordinator Application</h1>
            <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">Please fill the form in CAPITAL LETTERS only. Application Fee: ₹2550</p>
          </div>
          
          <form ref={formRef} onSubmit={handleContinue} className="max-w-4xl mx-auto space-y-8">
            
             <Card>
                <CardHeader><CardTitle>Position</CardTitle></CardHeader>
                <CardContent>
                     <RadioGroup onValueChange={(v) => handleRadioChange('positionType', v)} value={formData.positionType} className="grid md:grid-cols-3 gap-4" required>
                        <div>
                            <RadioGroupItem value="district" id="district" className="peer sr-only" />
                            <Label htmlFor="district" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                District Coordinator
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="block" id="block" className="peer sr-only" />
                            <Label htmlFor="block" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Block Coordinator
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="panchayat" id="panchayat" className="peer sr-only" />
                            <Label htmlFor="panchayat" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
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
                <CardHeader><CardTitle>स्थायी पता का विवरण (Permanent Address)</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label htmlFor="village">Village</Label><Input id="village" value={formData.village} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="post">Post</Label><Input id="post" value={formData.post} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="policeStation">Police Station</Label><Input id="policeStation" value={formData.policeStation} onChange={handleInputChange} required /></div>
                     <div className="grid gap-2">
                        <Label htmlFor="state">State</Label>
                        <Select onValueChange={(v) => handleSelectChange('state', v)} value={formData.state} required>
                            <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                            <SelectContent>{locationData.states.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="district">District</Label>
                        <Select onValueChange={(v) => handleSelectChange('district', v)} value={formData.district} required disabled={availableDistricts.length === 0}>
                             <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                             <SelectContent>
                                {availableDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                             </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2"><Label htmlFor="blockName">Block Name</Label><Input id="blockName" value={formData.blockName} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="panchayat">Panchayat Name</Label><Input id="panchayat" value={formData.panchayat} onChange={handleInputChange} required /></div>
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
                <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label>Computer Knowledge</Label><RadioGroup onValueChange={(v) => handleRadioChange('computerKnowledge', v)} value={formData.computerKnowledge} className="flex gap-4 pt-2"><RadioGroupItem value="yes" id="ck_yes" /><Label htmlFor="ck_yes">Yes</Label><RadioGroupItem value="no" id="ck_no" /><Label htmlFor="ck_no">No</Label></RadioGroup></div>
                    <div className="grid gap-2"><Label htmlFor="experience">Work Experience (in Years)</Label><Input id="experience" type="number" value={formData.experience} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2"><Label htmlFor="prevJob">Previous Job Role / Designation</Label><Input id="prevJob" value={formData.prevJob} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2 md:col-span-2"><Label>Languages Known</Label><div className="flex gap-4 pt-2"><Checkbox id="lang_hi" onCheckedChange={() => handleLanguageCheckbox('Hindi')} /><Label htmlFor="lang_hi">Hindi</Label><Checkbox id="lang_en" onCheckedChange={() => handleLanguageCheckbox('English')} /><Label htmlFor="lang_en">English</Label><Checkbox id="lang_local" onCheckedChange={() => handleLanguageCheckbox('Local')} /><Label htmlFor="lang_local">Local</Label></div></div>
                    <div className="grid gap-2"><Label htmlFor="preferredLocation">Preferred Location</Label><Input id="preferredLocation" value={formData.preferredLocation} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2 md:col-span-2"><Label htmlFor="whyJoin">Why do you want to join us?</Label><Textarea id="whyJoin" value={formData.whyJoin} onChange={handleInputChange} required/></div>
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
