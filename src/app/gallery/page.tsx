
"use client"

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface GalleryItem {
    id: string;
    title: string;
    url: string;
    type: 'image' | 'video';
    createdAt: any;
}

export default function GalleryPage() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
                setItems(itemsData);
            } catch (error) {
                console.error("Error fetching gallery items:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const filteredItems = items.filter(item => filter === 'all' || item.type === filter);

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-12">
                        <Badge variant="outline">Our Moments</Badge>
                        <h1 className="mt-4 text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">Vanu Organic Gallery</h1>
                        <p className="mt-6 max-w-3xl mx-auto text-muted-foreground">
                            A collection of moments from our events, farms, and community interactions.
                        </p>
                    </div>

                    <div className="flex justify-center gap-2 mb-8">
                        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
                        <Button variant={filter === 'image' ? 'default' : 'outline'} onClick={() => setFilter('image')}>Images</Button>
                        <Button variant={filter === 'video' ? 'default' : 'outline'} onClick={() => setFilter('video')}>Videos</Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">No items found in this category.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredItems.map(item => (
                                <Dialog key={item.id}>
                                    <DialogTrigger asChild>
                                        <Card className="group overflow-hidden cursor-pointer">
                                            <CardContent className="relative p-0 aspect-square">
                                                {item.type === 'image' ? (
                                                    <Image
                                                        src={item.url}
                                                        alt={item.title}
                                                        layout="fill"
                                                        objectFit="cover"
                                                        className="transition-transform duration-300 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <video
                                                        src={item.url}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                        muted
                                                        loop
                                                        playsInline
                                                        onMouseOver={e => e.currentTarget.play()}
                                                        onMouseOut={e => e.currentTarget.pause()}
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                                                    <p className="text-white text-center font-semibold">{item.title}</p>
                                                </div>
                                                 <div className="absolute top-2 right-2 bg-background/80 p-1.5 rounded-full">
                                                    {item.type === 'image' ? <ImageIcon className="h-4 w-4"/> : <Video className="h-4 w-4"/>}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </DialogTrigger>
                                    <DialogContent className={cn("p-0 border-0 max-w-4xl", item.type === 'video' && "aspect-video")}>
                                         {item.type === 'image' ? (
                                            <Image src={item.url} alt={item.title} width={1200} height={800} className="w-full h-auto rounded-lg" />
                                         ) : (
                                            <video src={item.url} className="w-full h-full rounded-lg" controls autoPlay/>
                                         )}
                                    </DialogContent>
                                </Dialog>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
