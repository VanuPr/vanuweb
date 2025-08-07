
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
import { Loader2, CreditCard, QrCode, Banknote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getDB, getStorageInstance, getAuthInstance } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, limit, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from "next/navigation";
import locationData from '@/lib/india-locations.json';
import { useAuthState } from "react-firebase-hooks/auth";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface UplineCoordinator {
    role: 'Admin' | 'district' | 'block' | 'panchayat';
    state?: string;
    district?: string;
    blockName?: string;
    name?: string;
}

const terms = {
    district: {
        en: [
            "Your registration fee is ₹2550.",
            "Upon submission of the registration fee, you will be given an ID card and an offer letter.",
            "It is mandatory to appoint one Block Coordinator in every block of the district you are working in.",
            "The appointment period for all Block Coordinators in your district will be twenty days. Within these twenty days, it is mandatory to conduct a joining meeting for the Block Coordinators.",
            "On the day of the Block joining meeting, the date and time of your office opening will be given.",
            "Your basic salary of 30000 + 5000 TA+DA will start from your joining day.",
            "After the appointment of all Block Coordinators in your district, it is mandatory to provide them with one day of training.",
            "After the office opens, it is mandatory to complete 100 Kisan Card joinings and enrollment of 40 children daily.",
            "After the office opens, your salary will be given only upon having 40 to 60 joinings per month, otherwise, only five hundred will be given per joining for less than 40.",
            "Upon completing 60 joinings in your district, a basic salary + five hundred rupees per joining will be given.",
            "From all panchayats in your district, five rupees per Kisan Card will be given to the District Coordinator and ten rupees per child registration.",
            "Whatever daily collection comes in your district, it is mandatory to deposit it in the company on the same day.",
            "If you withhold any collection, action will be taken against you and you will be stopped from working in your district.",
            "It is mandatory to keep all employees of your district in discipline.",
            "It is mandatory to get stock points opened in all panchayats of your district.",
            "If you leave the work for any reason, your registration fee will not be refunded. And after leaving the work, it is mandatory to hand over all the accounts of your district to the company and take your NOC.",
            "In the current situation, if any dispute arises, it will be resolved in the Godda court with the cooperation of the Godda Head Branch.",
            "In case of any mishap during work, your family will be insured for two lakh rupees by the company. And in case of any accident, fifty thousand rupees will be given for treatment expenses."
        ],
        hi: [
            "आपका रजिस्ट्रेशन शुल्क 2550/- रुपया है.",
            "रजिस्ट्रेशन शुल्क जमा करने पर आपको आय डी कार्ड तथा ऑफर लेटर दिया जायेगा.",
            "आप जिस जिले में काम कर रहे उस जिले के सभी ब्लॉक में एक एक ब्लॉक कॉर्डिनेटर कि नियुक्ति करना अनिवार्य होगा.",
            "अपने जिले के सभी ब्लॉक कि नियुक्ति का समय बीस दिन होगा, इस बीस दिन अन्दर ब्लॉक कोर्डिनेटर कि जोइनिंग मीटिंग कराना अनिवार्य होगा.",
            "ब्लॉक कि जोइनिंग मीटिंग के दिन ही आपका ऑफिस खुलने कि तारीख और समय दे दिया जायेगा.",
            "आपकी बेसिक तनख्या 30000+5000 TA+DA आपके जोइनिंग दिन से ही शुरू कर दिया जाता है.",
            "आपके जिले में सभी ब्लॉक कॉर्डिनेटर कि नियुक्ति के बाद उसे एक दिन का ट्रेनिंग देना अनिवार्य होगा.",
            "ऑफिस खुलने के बाद प्रतिदिन वो जोइनिंग सौ किसान कार्ड, चालीस बच्चा का नामांकन करना अनिवार्य होगा.",
            "ऑफिस खुलने के बाद प्रति महिना (चालीश से साठ) ज्योनिंग होने पर ही आपकी सैलरी दी जाएगी अन्यथा चालीश से कम होने पर प्रति ज्योनिंग पांच सौ ही दिया जायेगा.",
            "आपके जिले का साठ जोइनिंग कम्पलीट होने पर बेसिक तनख्वा + सभी जोइनिंग से पांच सौ रुपया दिया जायेगा.",
            "आपके जिले का सभी पंचायत से प्रति किसान कार्ड पांच रुपया जिला कोर्डिनेटर को दिया जायेगा प्रति बच्चा रजिस्ट्रेशन दस रुपया दिया जायेगा.",
            "अपने जिले में जो भी रोजाना का कलेक्शन आता है उसे उसी दिन कंपनी में लगाना अनिवार्य है.",
            "कोई भी कलेक्शन अगर आप रोकते हैं तो आपके ऊपर कार्यवाही कि जाएगी तथा आपको अपने जिले में कार्य करने से रोक दिया जायेगा.",
            "अपने जिले के सभी एम्पलॉय को अपने अनुशासन में रखना अनिवार्य होगा.",
            "अपने जिले के सभी पंचायत में स्टॉक पॉइंट खुलवाना अनिवार्य होगा.",
            "किसी कारण वश आप कार्य को छोड़ते है तो आपका रजिस्ट्रेशन फीस वापस नहीं किया जाता है. और आप कार्य को छोड़ने के बाद अपने जिले का सारा हिसाब कंपनी को देकर अपना एन को सी लेना अनिवार्य होगा.",
            "बर्तमान अवस्था में कोई भी विबाद होने पर उसका निराकरण गोड्डा के हेड ब्रांच के सहयोग के साथ गोड्डा न्यायलय में किया जायेगा.",
            "कार्य करने के दौरान कोई भी अनहोनी होने पर कंपनी द्वारा आपके परिवार को दो लाख का बीमा की जाएगी. और कोई भी दुर्घटना होने पर पचास हजार तक का इलाज हेतु बर्ष दिया जायेगा."
        ]
    },
    block: {
        en: [
            "Your registration fee is ₹2550.",
            "Upon submitting the registration fee, you will be given an ID card and an offer letter.",
            "It is mandatory to appoint one Panchayat Coordinator in every panchayat of the block you are working in and to conduct a joining meeting for all Panchayat Coordinators.",
            "The time period for this will be twenty days.",
            "A Block Coordinator will be given a maximum of ten panchayats.",
            "After appointing Panchayat Coordinators in your block, it is mandatory to provide them with one day of training.",
            "After the appointment of all Panchayat Coordinators in your block, your registration fee will be refunded.",
            "It is mandatory to create two thousand Kisan Jaivik Cards per month from the entire block; only then will the company give you twenty thousand and three thousand (TA+DA).",
            "If less than two thousand cards are made, the Block Coordinator will be given ten rupees per card.",
            "Upon making six thousand cards in three months and having a stock point in your block, your salary will be made permanent at 20,000 + 3,000 by the company.",
            "Upon completing your target in three months, you will be given a bike as a gift by the company, for which you have to pay the registration and insurance, while the company will handle the down payment and EMI.",
            "No company gift will be given more than once.",
            "The company provides you with a bike to work in your block.",
            "It is mandatory to have a stock point in all panchayats of your block, and the minimum amount for each panchayat stock will be fifty thousand.",
            "If you leave the job for any reason, the company will take back the bike after returning your registration and insurance amount, otherwise, you will have to pay the EMI.",
            "In the current situation, any dispute will be resolved in the court of Godda.",
            "In case of any mishap during work, your family will be given an insurance of one lakh by the company, and in case of an accident, up to twenty-five thousand will be given by the company for treatment expenses."
        ],
        hi: [
            "आपका रजिस्ट्रेशन शुल्क 2550/- रुपया है.",
            "रजिस्ट्रेशन शुल्क जमा करने पर आपको आय डी कार्ड तथा ऑफर लेटर दिया जायेगा.",
            "आप जिस ब्लॉक में काम कर रहे उस ब्लॉक के सभी पंचायत में एक एक पंचायत कॉर्डिनेटर कि नियुक्ति करना तथा सभी पंचायत कोर्डिनेटर का ज्योर्निंग मीटिंग कराना अनिवार्य होगा.",
            "जिसका समय अवधि बीस दिन होगी.",
            "एक ब्लॉक कोर्डिनेटर को अधिकतम दस पंचायत ही दिया जायेगा.",
            "आपके ब्लॉक में पंचायत कॉर्डिनेटर कि नियुक्ति के बाद उसे एक दिन का ट्रेनिंग देना अनिवार्य होगा.",
            "आपके ब्लॉक के सभी पंचायत कॉर्डिनेटर कि नियुक्ति के बाद आपका रजिस्ट्रेशन फीस वापस कर दिया जाता है.",
            "पुरे ब्लॉक से महीने का दो हजार किसान जैविक कार्ड बनवाना अनिवार्य होगा, तो ही कंपनी आपको बीस हजार और तीन हजार (ta+da) देगी.",
            "दो हजार कार्ड से कम बनने पर ब्लॉक कोर्डिनेटर को प्रति कार्ड दस रुपया दिया जायेगा.",
            "तीन महीने में छः हजार कार्ड बनाने तथा आपके ब्लॉक में एक स्टॉक पॉइंट होने पर ही कंपनी के द्वारा आपकी सैलरी 20000+3000 परमानेंट कर दी जाती है.",
            "तीन माह में अपना टारगेट पूरा होने पर कंपनी द्वारा आपको बाइक उपहार के रूप में दिया जाता है जिसका रजिस्ट्रेशन और इन्सौरेंस आपको देना होता है कंपनी डाउन पेमेंट और EMI देती है.",
            "कंपनी का कोई भी उपहार एक बार ही दिया जायेगा.",
            "कंपनी आपको बाईक अपने ब्लॉक में काम करने के लिए देती है.",
            "अपने ब्लॉक के सभी पंचायत में एक स्टॉक पॉइंट होना अनिवार्य होगा तथा सभी पंचायत स्टॉक का न्यूनतम राशि पचास हजार का होगा.",
            "किसी कारण बश आप कार्य को छोड़ते है तो आपका रजिस्ट्रेशन और इन्सौरेंस का रकम वापस लेकर कंपनी बाइक वापस ले लेगी अन्यथा EMI आपको जमा करा पड़ेगा.",
            "बर्तमान अवस्था में कोई भी बिबाद होने पर उसका निराकरण गोड्डा के न्यायलय में किया जायेगा.",
            "कार्य करने के दौरान कोई भी अनहोनी होने पर कंपनी आपके परिवार को एक लाख का बीमा दिया जाता है. या दुर्घटना होने पर इलाज हेतु खर्च पच्चीस हजार तक कंपनी द्वारा दिया जाता है."
        ]
    },
    panchayat: {
        en: [
            "Your registration fee is ₹2550.",
            "Upon submission of the registration fee, you will be given an ID card and an offer letter.",
            "The work of a Panchayat Coordinator: It is mandatory to appoint one Ward Teacher in every ward of the panchayat you are working in.",
            "Your registration fee will be returned after the appointment of all Ward Teachers in your panchayat or after one hundred organic farmer cards are made.",
            "Upon completing four hundred cards from the entire panchayat in a month, your salary will be ten thousand; if less, twenty-five rupees per card will be given.",
            "Upon completing the target of organic cards in three months, your salary will be made permanent at ten thousand.",
            "On making twelve hundred cards in three months and having a stock point in your panchayat, a Hero HF Deluxe bike will be gifted by the company.",
            "You have to pay for its registration and insurance.",
            "The company gives you the bike to work in your panchayat.",
            "It is mandatory to have a stock point in your panchayat.",
            "In case of any mishap during work, fifty thousand rupees will be given to your family by the company, and in case of any accident, fifteen thousand rupees will be given for treatment.",
            "In the current situation, if any dispute arises, it will be resolved in the court of Godda with the cooperation of the Godda Head Branch.",
            "It is mandatory to get a stock point opened in your panchayat with a minimum of one lakh."
        ],
        hi: [
            "आपका रजिस्ट्रेशन शुल्क 2550/- रुपया है.",
            "रजिस्ट्रेशन शुल्क जमा करने पर आपको आय डी कार्ड तथा ऑफर लेटर दिया जायेगा.",
            "पंचायत कॉर्डिनेटर का कार्य, आप जिस पंचायत में काम कर रहे उस पंचायत के सभी वार्ड में में एक एक वार्ड शिक्षिका कि नियुक्ति करना अनिवार्य होगा.",
            "आपके पंचायत के सभी वार्ड शिक्षिका कि नियुक्ति या सौ जैविक किसान कार्ड बनने के बाद आपका रजिस्ट्रेशन फीस वापस कर दिया जाता है.",
            "पुरे पंचायत से महीने का चार सौ कार्ड पूरा करने पर आपकी सेलेरी दस हजार होगी उससे कम होने पर पच्चीस रुपया प्रति कार्ड दिया जायेगा.",
            "तीन महीने जैविक कार्ड का टारगेट पूरा करने पर आपकी सैलरी दस हजार परमानेंट कर दी जाएगी.",
            "तीन महीने में बारह सौ कार्ड बनाने तथा आपके पंचायत में एक स्टॉक पॉइंट होने पर ही कंपनी के द्वारा हीरो HF डीलक्स बाईक गिफ्ट की जाती है.",
            "जिसका रजिस्ट्रेशन और इन्सौरेंस का पैसा आपको देना होता है.",
            "कंपनी आपको बाईक अपने पंचायत में काम करने के लिए देती है.",
            "अपने पंचायत में एक स्टॉक पॉइंट होना अनिवार्य होगा.",
            "कार्य के दौरान कोई भी अनहोनी होने पर कंपनी द्वारा आपके परिवार को पचास हजार दिया जाता है तथा कोई दुर्घटना होने पर पंद्रह हजार इलाज के लिया दिया जाता है.",
            "बर्तमान अवस्था में कोई भी बात बिवाद होने पर गोड्डा हेड ब्रांच के सहयोग से उसका निराकरण गोड्डा के नयायालय में किया जायेगा.",
            "अपने पंचायत में न्यूनतम एक लाख का एक स्टॉक पॉइंट खुलवाना अनिवार्य होगा."
        ]
    }
};

export default function EmployeeRegistrationPage() {
    const { toast } = useToast();
    const router = useRouter();
    const auth = getAuthInstance();
    const db = getDB();
    const storage = getStorageInstance();
    const [user, loadingAuth] = useAuthState(auth);

    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [uplineCoordinator, setUplineCoordinator] = useState<UplineCoordinator | null>(null);

    // For QR Dialog
    const [timer, setTimer] = useState(180); // 3 minutes in seconds
    const [isConfirmButtonEnabled, setIsConfirmButtonEnabled] = useState(false);
    const [utr, setUtr] = useState('');


    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isQrDialogOpen && timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isQrDialogOpen, timer]);
    
    useEffect(() => {
        if(isQrDialogOpen) {
            setTimer(180);
            setUtr('');
            const timeout = setTimeout(() => setIsConfirmButtonEnabled(true), 20000); // 20 seconds
            return () => clearTimeout(timeout);
        } else {
             setIsConfirmButtonEnabled(false);
        }
    }, [isQrDialogOpen])

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
    }, [user, db]);

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
            // Suggest the next level down
            if (uplineCoordinator.role === 'block') {
                initialPosition = 'panchayat';
            } else if (uplineCoordinator.role === 'district') {
                initialPosition = 'block';
            }

            setFormData(prev => ({
                ...prev,
                state: uplineCoordinator.state || '',
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
    
    const handleLocationSelectChange = (name: 'state' | 'district' | 'blockName' | 'panchayat' | 'preferredLocation', value: string) => {
        let updatedForm = { ...formData, [name]: value };
        if (name === 'state') {
            updatedForm.district = '';
            updatedForm.blockName = '';
            updatedForm.panchayat = '';
        }
        if (name === 'district') {
             updatedForm.blockName = '';
             updatedForm.panchayat = '';
        }
         if (name === 'blockName') {
             updatedForm.panchayat = '';
        }
        setFormData(updatedForm);
    };
    
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
        if (!formData.positionType) {
            toast({ variant: 'destructive', title: 'Position Required', description: 'Please select a position to apply for.' });
            return;
        }
        if (!formData.declaration1 || !formData.declaration2 || !formData.declaration3) {
            toast({ variant: 'destructive', title: 'Declaration Required', description: 'You must agree to all declarations.' });
            return;
        }
        setIsTermsModalOpen(true);
    };

    const uploadFile = async (file: File | null, applicationId: string, fileType: string): Promise<string | null> => {
        if (!file) return null;
        const storageRef = ref(storage, `coordinator-applications/${applicationId}/${fileType}-${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        return getDownloadURL(uploadResult.ref);
    };

    const checkLocationAvailability = async (): Promise<boolean> => {
        if (!formData.positionType || !formData.preferredLocation) {
            toast({ variant: 'destructive', title: 'Position Required', description: 'Please select a position and preferred location.'});
            return false;
        }

        const q = query(
            collection(db, 'coordinator-applications'),
            where('positionType', '==', formData.positionType),
            where('preferredLocation', '==', formData.preferredLocation),
            where('status', 'in', ['Received', 'Approved'])
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            toast({
                variant: 'destructive',
                title: 'Position Filled',
                description: `A coordinator for ${formData.preferredLocation} (${formData.positionType}) already exists.`
            });
            return false;
        }
        return true;
    };

    const processApplication = async (paymentDetails: any = {}) => {
        setIsLoading(true);
        try {
            const isAvailable = await checkLocationAvailability();
            if (!isAvailable) {
                setIsLoading(false);
                return;
            }

            const tempDocRef = doc(collection(db, "coordinator-applications"));
            const applicationId = tempDocRef.id;

            const [photoUrl, aadharUrl, panUrl, signatureUrl, passbookUrl] = await Promise.all([
                uploadFile(files.photo, applicationId, 'photo'), uploadFile(files.aadhar, applicationId, 'aadhar'),
                uploadFile(files.pan, applicationId, 'pan'), uploadFile(files.signature, applicationId, 'signature'),
                uploadFile(files.passbook, applicationId, 'passbook'),
            ]);
            
            await setDoc(tempDocRef, {
                ...formData, 
                photoUrl, aadharUrl, panUrl: panUrl || null, signatureUrl, passbookUrl,
                status: 'Received', 
                submittedAt: serverTimestamp(), 
                ...paymentDetails
            });

            toast({ title: 'Application Submitted', description: 'Your application has been received.' });
            router.push(`/application-confirmation?id=${applicationId}`);
        } catch (error) {
            console.error("Error processing application:", error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'There was an error saving the application.' });
        } finally {
            setIsLoading(false);
            setIsQrDialogOpen(false);
            setIsPaymentModalOpen(false);
        }
    };
    
    const handleAgreeAndProceed = async () => {
        if (!termsAgreed) {
            toast({ variant: 'destructive', title: 'Agreement Required', description: 'You must agree to the terms and conditions.' });
            return;
        }
        setIsLoading(true);
        const isAvailable = await checkLocationAvailability();
        setIsLoading(false);
        if (!isAvailable) {
            return;
        }
        setIsTermsModalOpen(false);
        setIsPaymentModalOpen(true);
    }
    
    const handlePaymentSelection = async (method: 'razorpay' | 'qr' | 'cash') => {
        setIsPaymentModalOpen(false); // Close the payment selection modal

        if (method === 'cash') {
            await processApplication({ paymentId: 'Paid by Cash', paymentMethod: 'Cash' });
        } else if (method === 'qr') {
            setIsQrDialogOpen(true);
        } else if (method === 'razorpay') {
           // This section is now disabled as per the new request.
           // The button calling this is also disabled.
        }
    }
    
    // Logic for disabling form fields based on upline coordinator's role
    const disableDistrictPosition = uplineCoordinator?.role === 'district' || uplineCoordinator?.role === 'block' || uplineCoordinator?.role === 'panchayat';
    const disableBlockPosition = uplineCoordinator?.role === 'block' || uplineCoordinator?.role === 'panchayat';
    const isStateDisabled = uplineCoordinator?.role === 'district' || uplineCoordinator?.role === 'block' || uplineCoordinator?.role === 'panchayat';
    const isDistrictDisabled = uplineCoordinator?.role === 'district' || uplineCoordinator?.role === 'block' || uplineCoordinator?.role === 'panchayat';
    const isBlockDisabled = uplineCoordinator?.role === 'block' || uplineCoordinator?.role === 'panchayat';

    const availableDistricts = useMemo(() => {
        if (!formData.state) return [];
        const selected = locationData.states.find(s => s.state === formData.state);
        return selected ? selected.districts.sort() : [];
    }, [formData.state]);
    
    useEffect(() => {
        let location = '';
        if (formData.positionType === 'panchayat') {
            location = formData.panchayat;
        } else if (formData.positionType === 'block') {
            location = formData.blockName;
        } else if (formData.positionType === 'district') {
            location = formData.district;
        }
        setFormData(prev => ({ ...prev, preferredLocation: location }));
    }, [formData.panchayat, formData.blockName, formData.district, formData.positionType]);

    const currentTerms = terms[formData.positionType as keyof typeof terms] || terms.panchayat;


  return (
    <>
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">Employee Registration</h1>
            <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">Please fill the form in CAPITAL LETTERS only. Fields marked with <span className="text-destructive">*</span> are required. Application Fee: ₹2550</p>
          </div>
          
          <form ref={formRef} onSubmit={handleContinue} className="max-w-4xl mx-auto space-y-8">
            <Card>
                <CardHeader><CardTitle>Position Applied For<span className="text-destructive">*</span></CardTitle></CardHeader>
                <CardContent>
                     <RadioGroup onValueChange={(v) => handleRadioChange('positionType', v)} value={formData.positionType} className="grid md:grid-cols-3 gap-4" required>
                        <div>
                            <RadioGroupItem value="district" id="pos_district" className="peer sr-only" disabled={disableDistrictPosition} />
                            <Label htmlFor="pos_district" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">District Coordinator</Label>
                        </div>
                         <div>
                            <RadioGroupItem value="block" id="pos_block" className="peer sr-only" disabled={disableBlockPosition}/>
                            <Label htmlFor="pos_block" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">Block Coordinator</Label>
                        </div>
                         <div>
                            <RadioGroupItem value="panchayat" id="pos_panchayat" className="peer sr-only" />
                            <Label htmlFor="pos_panchayat" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">Panchayat Coordinator</Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label htmlFor="fullName">Name<span className="text-destructive">*</span></Label><Input id="fullName" value={formData.fullName} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label>Gender<span className="text-destructive">*</span></Label><RadioGroup onValueChange={(v) => handleRadioChange('gender', v)} value={formData.gender} className="flex gap-4 pt-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male">Male</Label><RadioGroupItem value="female" id="female" /><Label htmlFor="female">Female</Label></RadioGroup></div>
                    <div className="grid gap-2"><Label htmlFor="fatherName">Father’s Name<span className="text-destructive">*</span></Label><Input id="fatherName" value={formData.fatherName} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="motherName">Mother’s Name <span className="text-muted-foreground ml-1 text-xs">(Optional)</span></Label><Input id="motherName" value={formData.motherName} onChange={handleInputChange} /></div>
                    <div className="grid gap-2"><Label htmlFor="dob">Date of Birth<span className="text-destructive">*</span></Label><Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="nationality">Nationality<span className="text-destructive">*</span></Label><Input id="nationality" value={formData.nationality} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="qualification">Qualification<span className="text-destructive">*</span></Label><Input id="qualification" value={formData.qualification} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="photo">Passport size photograph<span className="text-destructive">*</span></Label><Input id="photo" type="file" onChange={handleFileChange} accept="image/*" required /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Choose Your Location<span className="text-destructive">*</span></CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid md:grid-cols-2 gap-6">
                         <div className="grid gap-2">
                             <Label htmlFor="state">State</Label>
                             <Select onValueChange={(v) => handleLocationSelectChange('state', v)} value={formData.state} required disabled={isStateDisabled}>
                                 <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                                 <SelectContent>{locationData.states.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}</SelectContent>
                             </Select>
                         </div>
                         {(formData.positionType === 'district' || formData.positionType === 'block' || formData.positionType === 'panchayat') && (
                             <div className="grid gap-2">
                                <Label htmlFor="district">District</Label>
                                <Select onValueChange={(v) => handleLocationSelectChange('district', v)} value={formData.district} required disabled={availableDistricts.length === 0 || isDistrictDisabled}>
                                    <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                                    <SelectContent>{availableDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                         )}
                         {(formData.positionType === 'block' || formData.positionType === 'panchayat') && (
                              <div className="grid gap-2">
                                <Label htmlFor="blockName">Block</Label>
                                <Input id="blockName" value={formData.blockName} onChange={(e) => handleLocationSelectChange('blockName', e.target.value)} placeholder="Enter Block Name" disabled={isBlockDisabled}/>
                            </div>
                         )}
                         {formData.positionType === 'panchayat' && (
                             <div className="grid gap-2">
                                <Label htmlFor="panchayat">Panchayat</Label>
                                <Input id="panchayat" value={formData.panchayat} onChange={(e) => handleLocationSelectChange('panchayat', e.target.value)} placeholder="Enter Panchayat Name"/>
                            </div>
                         )}
                     </div>
                     <div className="grid gap-2">
                         <Label htmlFor="preferredLocation">Preferred Location for Work</Label>
                         <Input id="preferredLocation" value={formData.preferredLocation} readOnly disabled className="bg-muted"/>
                     </div>
                </CardContent>
            </Card>


            <Card>
                <CardHeader><CardTitle>Address & Contact</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label htmlFor="village">Village<span className="text-destructive">*</span></Label><Input id="village" value={formData.village} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="post">Post<span className="text-destructive">*</span></Label><Input id="post" value={formData.post} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="policeStation">Police Station<span className="text-destructive">*</span></Label><Input id="policeStation" value={formData.policeStation} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="pinCode">PIN Code<span className="text-destructive">*</span></Label><Input id="pinCode" value={formData.pinCode} onChange={handleInputChange} required /></div>
                     <div className="grid gap-2"><Label htmlFor="mobile">Mobile No.<span className="text-destructive">*</span></Label><Input id="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="whatsappNo">Whatsapp No. <span className="text-muted-foreground text-xs">(Optional)</span></Label><Input id="whatsappNo" type="tel" value={formData.whatsappNo} onChange={handleInputChange} /></div>
                    <div className="grid gap-2"><Label htmlFor="email">E-Mail ID <span className="text-muted-foreground text-xs">(Optional)</span></Label><Input id="email" type="email" value={formData.email} onChange={handleInputChange} /></div>
                    <div className="grid gap-2"><Label htmlFor="panNo">PAN Card No. <span className="text-muted-foreground text-xs">(Optional)</span></Label><Input id="panNo" value={formData.panNo} onChange={handleInputChange} /></div>
                    <div className="grid gap-2"><Label htmlFor="aadharNo">Aadhaar Card No.<span className="text-destructive">*</span></Label><Input id="aadharNo" value={formData.aadharNo} onChange={handleInputChange} required /></div>
                    <div className="grid gap-2"><Label htmlFor="pan">Upload PAN Card (PDF/JPG) <span className="text-muted-foreground text-xs">(Optional)</span></Label><Input id="pan" type="file" onChange={handleFileChange} /></div>
                    <div className="grid gap-2"><Label htmlFor="aadhar">Upload Aadhar Card (PDF/JPG)<span className="text-destructive">*</span></Label><Input id="aadhar" type="file" onChange={handleFileChange} required /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label>Bank Name<span className="text-destructive">*</span></Label><Input id="bankName" value={formData.bankName} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2"><Label>Account Number<span className="text-destructive">*</span></Label><Input id="accountNumber" value={formData.accountNumber} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2"><Label>IFSC Code<span className="text-destructive">*</span></Label><Input id="ifscCode" value={formData.ifscCode} onChange={handleInputChange} required/></div>
                    <div className="grid gap-2"><Label>Signature Upload<span className="text-destructive">*</span></Label><Input id="signature" type="file" onChange={handleFileChange} accept="image/*" required /></div>
                    <div className="grid gap-2 md:col-span-2"><Label>Passbook Front Page Upload<span className="text-destructive">*</span></Label><Input id="passbook" type="file" onChange={handleFileChange} required/></div>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label>Computer Knowledge <span className="text-muted-foreground ml-1 text-xs">(Optional)</span></Label><RadioGroup onValueChange={(v) => handleRadioChange('computerKnowledge', v)} value={formData.computerKnowledge} className="flex gap-4 pt-2"><RadioGroupItem value="yes" id="ck_yes" /><Label htmlFor="ck_yes">Yes</Label><RadioGroupItem value="no" id="ck_no" /><Label htmlFor="ck_no">No</Label></RadioGroup></div>
                    <div className="grid gap-2"><Label htmlFor="experience">Work Experience (in Years) <span className="text-muted-foreground ml-1 text-xs">(Optional)</span></Label><Input id="experience" type="number" value={formData.experience} onChange={handleInputChange} /></div>
                    <div className="grid gap-2"><Label htmlFor="prevJob">Previous Job Role / Designation <span className="text-muted-foreground ml-1 text-xs">(Optional)</span></Label><Input id="prevJob" value={formData.prevJob} onChange={handleInputChange}/></div>
                    <div className="grid gap-2 md:col-span-2"><Label>Languages Known <span className="text-muted-foreground ml-1 text-xs">(Optional)</span></Label><div className="flex gap-4 pt-2"><Checkbox id="lang_hi" onCheckedChange={() => {}} /><Label htmlFor="lang_hi">Hindi</Label><Checkbox id="lang_en" onCheckedChange={() => {}} /><Label htmlFor="lang_en">English</Label><Checkbox id="lang_local" onCheckedChange={() => {}} /><Label htmlFor="lang_local">Local</Label></div></div>
                    <div className="grid gap-2"><Label htmlFor="whyJoin">Why do you want to join us? <span className="text-muted-foreground ml-1 text-xs">(Optional)</span></Label><Textarea id="whyJoin" value={formData.whyJoin} onChange={handleInputChange}/></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Declaration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3"><Checkbox id="declaration1" checked={formData.declaration1} onCheckedChange={(c) => handleCheckboxChange('declaration1', !!c)}/><Label htmlFor="declaration1" className="text-sm text-muted-foreground">I confirm that all information provided in this form is true and correct to the best of my knowledge.<span className="text-destructive">*</span></Label></div>
                    <div className="flex items-start gap-3"><Checkbox id="declaration2" checked={formData.declaration2} onCheckedChange={(c) => handleCheckboxChange('declaration2', !!c)}/><Label htmlFor="declaration2" className="text-sm text-muted-foreground">I understand that submitting this application does not guarantee selection for the position.<span className="text-destructive">*</span></Label></div>
                    <div className="flex items-start gap-3"><Checkbox id="declaration3" checked={formData.declaration3} onCheckedChange={(c) => handleCheckboxChange('declaration3', !!c)}/><Label htmlFor="declaration3" className="text-sm text-muted-foreground">I agree to the terms and conditions of the coordinator program.<span className="text-destructive">*</span></Label></div>
                </CardContent>
            </Card>

            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin"/> : null}
                {isLoading ? 'Processing...' : 'Proceed'}
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
                    Please review and accept the terms and conditions to complete your application for the <strong>{formData.positionType} coordinator</strong> role.
                </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="hi">Hindi (हिन्दी)</TabsTrigger>
                </TabsList>
                <TabsContent value="en">
                    <div className="max-h-[50vh] overflow-y-auto p-4 border rounded-md my-4">
                        <ul className="space-y-3 list-disc list-inside text-sm">
                            {currentTerms.en.map((term, index) => <li key={`en-${index}`}>{term}</li>)}
                        </ul>
                    </div>
                </TabsContent>
                <TabsContent value="hi">
                     <div className="max-h-[50vh] overflow-y-auto p-4 border rounded-md my-4">
                        <ul className="space-y-3 list-disc list-inside text-sm font-hindi">
                            {currentTerms.hi.map((term, index) => <li key={`hi-${index}`}>{term}</li>)}
                        </ul>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={termsAgreed} onCheckedChange={(c) => setTermsAgreed(!!c)} />
                <Label htmlFor="terms" className="cursor-pointer">I have read, understood, and agree to the terms and conditions.</Label>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsTermsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAgreeAndProceed} disabled={!termsAgreed || isLoading}>
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Agree & Proceed
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
     <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Select Payment Method</DialogTitle>
                <DialogDescription>
                    Please choose how you would like to pay the ₹2550 application fee.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Button onClick={() => handlePaymentSelection('razorpay')} size="lg" disabled>
                    <CreditCard className="mr-2" /> Pay Online (Coming Soon)
                </Button>
                <Button onClick={() => handlePaymentSelection('qr')} size="lg" variant="outline">
                    <QrCode className="mr-2" /> Pay with QR Code
                </Button>
                 <Button onClick={() => handlePaymentSelection('cash')} size="lg" variant="outline">
                    <Banknote className="mr-2" /> Paid via Cash
                </Button>
            </div>
        </DialogContent>
    </Dialog>

     <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Scan QR Code to Pay</DialogTitle>
                <DialogDescription>
                    Please scan the QR code to pay the ₹2550 fee. Once paid, confirm the transaction.
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4">
                <Image src="https://github.com/VanuPr/vanu-assets/blob/main/Qr%20Code.png?raw=true" alt="Payment QR Code" width={300} height={300} data-ai-hint="payment qr" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="utr">Enter UTR / Transaction ID<span className="text-destructive">*</span></Label>
                <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Enter the transaction reference number" />
            </div>
            <DialogFooter className="sm:justify-between items-center">
                 <div className="text-sm text-muted-foreground">Time left: {Math.floor(timer/60)}:{('0' + timer % 60).slice(-2)}</div>
                 <Button onClick={() => processApplication({ paymentId: `Paid by QR: ${utr}`, paymentMethod: 'QR Code' })} disabled={!isConfirmButtonEnabled || !utr || isLoading || timer === 0}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Payment & Submit
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
