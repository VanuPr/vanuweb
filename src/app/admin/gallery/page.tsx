
"use client"

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDB, getStorageInstance } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, PlusCircle, Video, Image as ImageIcon, Upload, Link } from 'lucide-react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface GalleryItem {
    id: string;
    title: string;
    url: string;
    type: 'image' | 'video';
    createdAt: any;
}

export default function GalleryAdminPage() {
    const db = getDB();
    const storage = getStorageInstance();
    const { toast } = useToast();
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State for file upload
    const [uploadTitle, setUploadTitle] = useState('');
    const [mediaFiles, setMediaFiles] = useState<FileList | null>(null);
    const [isSubmittingFiles, setIsSubmittingFiles] = useState(false);

    // State for URL upload
    const [urlList, setUrlList] = useState('');
    const [isSubmittingUrls, setIsSubmittingUrls] = useState(false);


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMediaFiles(e.target.files);
        }
    };

    const handleBulkFileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mediaFiles || mediaFiles.length === 0) {
            toast({ variant: "destructive", title: "No files selected", description: "Please select one or more files to upload." });
            return;
        }
        setIsSubmittingFiles(true);

        const uploadPromises = Array.from(mediaFiles).map(async (file) => {
            const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const mediaUrl = await getDownloadURL(storageRef);
            const fileType = file.type.startsWith('video') ? 'video' : 'image';
            const title = uploadTitle ? `${uploadTitle} - ${file.name}` : file.name;

            return {
                title,
                url: mediaUrl,
                type: fileType,
                createdAt: serverTimestamp()
            };
        });

        try {
            const newItems = await Promise.all(uploadPromises);
            const batch = writeBatch(db);
            newItems.forEach(item => {
                const docRef = doc(collection(db, 'gallery'));
                batch.set(docRef, item);
            });
            await batch.commit();

            toast({ title: "Upload Successful", description: `${newItems.length} item(s) added to the gallery.` });
            setUploadTitle('');
            setMediaFiles(null);
            (document.getElementById('mediaUpload') as HTMLInputElement).value = '';
            fetchGalleryItems(); 
        } catch (error) {
            console.error("Error adding gallery items: ", error);
            toast({ variant: "destructive", title: "Error adding items" });
        } finally {
            setIsSubmittingFiles(false);
        }
    };

    const handleBulkUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const urls = urlList.split('\n').map(url => url.trim()).filter(url => url.length > 0);
        if (urls.length === 0) {
            toast({ variant: 'destructive', title: 'No URLs provided', description: 'Please paste at least one URL.' });
            return;
        }
        setIsSubmittingUrls(true);

        const getVideoExtensions = ['.mp4', '.mov', '.avi', '.webm'];

        try {
            const batch = writeBatch(db);
            urls.forEach(url => {
                const docRef = doc(collection(db, 'gallery'));
                const isVideo = getVideoExtensions.some(ext => url.toLowerCase().includes(ext));
                const title = url.substring(url.lastIndexOf('/') + 1); // Simple title from URL
                
                batch.set(docRef, {
                    title: title,
                    url: url,
                    type: isVideo ? 'video' : 'image',
                    createdAt: serverTimestamp()
                });
            });
            await batch.commit();

            toast({ title: 'URLs Added', description: `${urls.length} items added from URLs.` });
            setUrlList('');
            fetchGalleryItems();
        } catch (error) {
            console.error("Error adding items from URLs:", error);
            toast({ variant: 'destructive', title: 'Failed to add URLs' });
        } finally {
            setIsSubmittingUrls(false);
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
            <div className="md:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Bulk Upload Files</CardTitle>
                        <CardDescription>Upload new photos or videos from your computer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBulkFileSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="uploadTitle">Title Prefix (Optional)</Label>
                                <Input id="uploadTitle" placeholder="e.g., Farm Visit" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} disabled={isSubmittingFiles} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="mediaUpload">Files</Label>
                                <Input id="mediaUpload" type="file" onChange={handleFileChange} required disabled={isSubmittingFiles} accept="image/*,video/*" multiple />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmittingFiles}>
                                {isSubmittingFiles ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                Upload Files
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Bulk Add via URLs</CardTitle>
                        <CardDescription>Add items by pasting image or video links.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBulkUrlSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="urlList">Image/Video URLs</Label>
                                <Textarea 
                                    id="urlList" 
                                    value={urlList}
                                    onChange={(e) => setUrlList(e.target.value)}
                                    placeholder="Paste one URL per line..."
                                    rows={6}
                                    disabled={isSubmittingUrls}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmittingUrls}>
                                {isSubmittingUrls ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Link className="mr-2 h-4 w-4" />}
                                Add from URLs
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
