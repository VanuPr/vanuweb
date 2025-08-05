
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Slide {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
}

export function ServiceSlideshow() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const fetchSlides = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "slideshow"), orderBy("createdAt", "asc"));
                const querySnapshot = await getDocs(q);
                const slidesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slide));
                setSlides(slidesData);
            } catch (error) {
                console.error("Error fetching slides:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSlides();
    }, []);

    useEffect(() => {
        if (!api) return;

        setCurrent(api.selectedScrollSnap());
        const onSelect = () => {
            setCurrent(api.selectedScrollSnap());
        };
        api.on("select", onSelect);
        return () => {
            api.off("select", onSelect);
        };
    }, [api]);

    const scrollTo = useCallback((index: number) => {
        api?.scrollTo(index);
    }, [api]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (slides.length === 0) {
        return null; // Don't render anything if there are no slides
    }

    return (
        <div className="w-full flex flex-col h-full">
            <Carousel setApi={setApi} className="w-full h-full flex-1" opts={{ loop: true }}>
                <CarouselContent className="h-full">
                    {slides.map((slide) => (
                        <CarouselItem key={slide.id} className="h-full">
                            <Card className="overflow-hidden h-full">
                                <CardContent className="p-0 h-full">
                                    <div className="grid md:grid-cols-2 h-full">
                                        <div className="p-8 md:p-12 flex flex-col justify-center">
                                            <h3 className="text-2xl md:text-3xl font-bold font-headline mb-4">{slide.title}</h3>
                                            <p className="text-muted-foreground">{slide.description}</p>
                                        </div>
                                        <div className="relative w-full h-64 md:h-full min-h-[300px]">
                                            <Image
                                                src={slide.imageUrl}
                                                alt={slide.title}
                                                layout="fill"
                                                objectFit="cover"
                                                data-ai-hint="farming service"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            <div className="flex justify-center gap-2 mt-4">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={cn(
                            "h-2 w-2 rounded-full bg-muted-foreground transition-all",
                            current === index ? "w-4 bg-primary" : "hover:bg-primary/80"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
