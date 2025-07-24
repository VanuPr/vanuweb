
"use client"

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, PlusCircle, Video, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GalleryItem {
    id: string;
    title: string;
    url: string;
    type: 'image' | 'video';
    createdAt: any;
}

export default function GalleryAdminPage() {
    const { toast } = useToast();
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [newItem, setNewItem] = useState({ title: '', type: 'image' as 'image' | 'video' });
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchGalleryItems = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
            setGalleryItems(itemsData);
        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching gallery items" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGalleryItems();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setMediaFile(e.target.files[0]);
        }
    };

    const handleAddGalleryItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.title || !mediaFile) {
            toast({ variant: "destructive", title: "Missing fields", description: "Please provide a title and select a file to upload." });
            return;
        }
        setIsSubmitting(true);

        try {
            const storageRef = ref(storage, `gallery/${Date.now()}_${mediaFile.name}`);
            const uploadResult = await uploadBytes(storageRef, mediaFile);
            const mediaUrl = await getDownloadURL(uploadResult.ref);

            await addDoc(collection(db, "gallery"), {
                ...newItem,
                url: mediaUrl,
                createdAt: serverTimestamp()
            });

            toast({ title: "Item added", description: "The new item has been added to the gallery." });
            setNewItem({ title: '', type: 'image' });
            setMediaFile(null);
            (document.getElementById('mediaUpload') as HTMLInputElement).value = '';
            fetchGalleryItems(); 
        } catch (error) {
            console.error("Error adding gallery item: ", error);
            toast({ variant: "destructive", title: "Error adding item" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGalleryItem = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this gallery item?")) {
            try {
                await deleteDoc(doc(db, "gallery", id));
                toast({ title: "Item deleted" });
                fetchGalleryItems();
            } catch (error) {
                toast({ variant: "destructive", title: "Error deleting item" });
            }
        }
    };

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Add to Gallery</CardTitle>
                        <CardDescription>Upload new photos or videos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddGalleryItem} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} required disabled={isSubmitting} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Type</Label>
                                <Select value={newItem.type} onValueChange={(value: 'image' | 'video') => setNewItem({ ...newItem, type: value })} disabled={isSubmitting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="mediaUpload">File</Label>
                                <Input id="mediaUpload" type="file" onChange={handleFileChange} required disabled={isSubmitting} accept="image/*,video/*" />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Add to Gallery
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Gallery</CardTitle>
                        <CardDescription>Review and delete existing gallery items.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
                        ) : galleryItems.length === 0 ? (
                            <p className="text-center text-muted-foreground">The gallery is empty. Add an item to get started.</p>
                        ) : (
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                                {galleryItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 p-2 border rounded-md">
                                        {item.type === 'image' ? (
                                            <Image src={item.url} alt={item.title} width={80} height={60} className="rounded-md object-cover" />
                                        ) : (
                                            <video src={item.url} width={80} height={60} className="rounded-md object-cover bg-black" />
                                        )}
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{item.title}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {item.type === 'image' ? <ImageIcon className="h-4 w-4"/> : <Video className="h-4 w-4"/>}
                                                <span className="capitalize">{item.type}</span>
                                            </div>
                                        </div>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteGalleryItem(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
