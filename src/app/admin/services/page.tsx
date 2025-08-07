
"use client"

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDB, getStorageInstance } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, PlusCircle, Edit, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Service {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    aiHint: string;
    link: string;
    createdAt: any;
}

export default function ServicesAdminPage() {
    const db = getDB();
    const storage = getStorageInstance();
    const { toast } = useToast();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const servicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
            setServices(servicesData);
        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching services" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenDialog = (service: Partial<Service> | null = null) => {
        setCurrentService(service ? { ...service } : { name: '', description: '', imageUrl: '', aiHint: '', link: '' });
        setImageFile(null);
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setCurrentService(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!currentService) return;
        const { id, value } = e.target;
        setCurrentService(prev => ({ ...prev, [id]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentService || !currentService.name || !currentService.description) {
            toast({ variant: "destructive", title: "Missing fields" });
            return;
        }
        if (!currentService.id && !imageFile) {
            toast({ variant: "destructive", title: "Image required for new service" });
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = currentService.imageUrl || '';
            if (imageFile) {
                const storageRef = ref(storage, `services/${Date.now()}_${imageFile.name}`);
                const uploadResult = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(uploadResult.ref);
            }

            const serviceData = { ...currentService, imageUrl };

            if (currentService.id) {
                const serviceRef = doc(db, 'services', currentService.id);
                await updateDoc(serviceRef, serviceData);
                toast({ title: 'Service Updated' });
            } else {
                await addDoc(collection(db, 'services'), { ...serviceData, createdAt: serverTimestamp() });
                toast({ title: 'Service Added' });
            }
            fetchServices();
            handleDialogClose();
        } catch (error) {
            console.error("Error saving service:", error);
            toast({ variant: 'destructive', title: 'Operation Failed' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteService = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;
        try {
            await deleteDoc(doc(db, 'services', id));
            toast({ title: 'Service Deleted' });
            fetchServices();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Deletion Failed' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Manage Services</h1>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2" /> Add Service
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Service List</CardTitle>
                    <CardDescription>Add, edit, or remove services displayed on your site.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8"/></div>
                    ) : services.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No services found. Add one to get started.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.map(service => (
                                <Card key={service.id} className="flex flex-col">
                                    <CardHeader className="p-0">
                                        <Image src={service.imageUrl} alt={service.name} width={400} height={300} className="w-full h-48 object-cover rounded-t-lg" data-ai-hint={service.aiHint} />
                                    </CardHeader>
                                    <CardContent className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-semibold">{service.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 flex-1">{service.description}</p>
                                        <p className="text-xs text-muted-foreground mt-2">Link: {service.link}</p>
                                    </CardContent>
                                    <div className="p-4 pt-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full">
                                                    <MoreHorizontal className="mr-2" /> Actions
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenDialog(service)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteService(service.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{currentService?.id ? 'Edit Service' : 'Add Service'}</DialogTitle>
                            <DialogDescription>Fill in the service details below.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Service Name</Label>
                                <Input id="name" value={currentService?.name || ''} onChange={handleInputChange} required disabled={isSubmitting} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={currentService?.description || ''} onChange={handleInputChange} required disabled={isSubmitting} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="link">Page Link</Label>
                                <Input id="link" value={currentService?.link || ''} onChange={handleInputChange} placeholder="/your-service-page" required disabled={isSubmitting} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="aiHint">AI Image Hint</Label>
                                <Input id="aiHint" value={currentService?.aiHint || ''} onChange={handleInputChange} placeholder="e.g. soil testing" required disabled={isSubmitting} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="imageUpload">Image</Label>
                                <Input id="imageUpload" type="file" onChange={handleImageChange} accept="image/*" disabled={isSubmitting} />
                                {currentService?.imageUrl && <p className="text-xs text-muted-foreground">Current image is set. Upload a new one to replace it.</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 animate-spin"/>}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
