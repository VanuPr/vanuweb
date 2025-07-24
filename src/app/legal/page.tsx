
"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldCheck, PictureInPicture } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function LegalPage() {
    
    const certificates = [
        {
            name: "Important Notice",
            imageUrl: "https://github.com/VanuPr/vanu-assets/blob/main/important%20notice.jpeg?raw=true",
            aiHint: "notice document"
        },
        {
            name: "Udyan Certificate",
            imageUrl: "https://github.com/VanuPr/vanu-assets/blob/main/UDYAN.jpg?raw=true",
            aiHint: "certificate award"
        },
    ];

    const documents = [
        {
            name: "Allotment of Director Identification Number (DIN)",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/ALLOTMENT%20OF%20DIRECTOR%20IDENTIFICATION%20NUMBER%20(DIN).PDF?raw=true"
        },
        {
            name: "Block Work Final",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/BLOCK%20WORK%20FINAL.pdf?raw=true"
        },
        {
            name: "Certificate of Incorporation",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/CERTIFICATE%20OF%20INCORPORATION%20(1)%20(1).PDF?raw=true"
        },
        {
            name: "District Work Final",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/DISTRICT%20work%20final%20.pdf?raw=true"
        },
        {
            name: "Fertilizer License",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/FERTILIZER.pdf?raw=true"
        },
        {
            name: "Grocery License",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/GROSERY.pdf?raw=true"
        },
        {
            name: "Human Rights Certificate",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/HUMAN%20RIGHTS%20CERTIFICATE.pdf?raw=true"
        },
        {
            name: "NOC Vanu Organic",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/NOC_Vanu_oraganic.pdf?raw=true"
        },
        {
            name: "Panchayat Work Final",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/PANCHAYAT%20work%20final.pdf?raw=true"
        },
        {
            name: "Udyam Registration Certificate",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/Print%20_%20Udyam%20Registration%20Certificate.pdf?raw=true"
        },
        {
            name: "SPICe Memorandum of Association",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/SPICeMoA_INC0001039494%20VIJAY%20pdf.pdf?raw=true"
        },
        {
            name: "Mother Earth Pledge Certificate",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/Save%20and%20Restore%20Our%20Beloved%20Mother%20Earth%20Pledge%20CERTIFICATE.pdf?raw=true"
        },
        {
            name: "Vijay Document",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/Vijay.pdf?raw=true"
        },
        {
            name: "Private Limited Account Details",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/pvt%20ltd%20acount.pdf?raw=true"
        },
        {
            name: "ISO Draft",
            url: "https://github.com/VanuPr/vanu-assets/blob/main/vanu%20draft%20iso.pdf?raw=true"
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-12">
                         <Badge variant="outline">Legal & Compliance</Badge>
                        <h1 className="mt-4 text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">Legal Documents & Certificates</h1>
                        <p className="mt-6 max-w-3xl mx-auto text-muted-foreground">
                            Transparency and trust are at the core of our values. Here you can view our company's legal documents and certifications.
                        </p>
                    </div>

                    {/* Certificates Section */}
                    <section id="certificates" className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                            <PictureInPicture className="w-8 h-8 text-primary"/>
                            <h2 className="text-3xl font-headline font-bold">Our Certificates</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {certificates.map((cert, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle>{cert.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div 
                                            className="relative w-full aspect-[8/11] rounded-md overflow-hidden border"
                                            onContextMenu={(e) => e.preventDefault()} // Disables right-click
                                        >
                                            <Image 
                                                src={cert.imageUrl} 
                                                alt={cert.name}
                                                layout="fill"
                                                objectFit="contain"
                                                className="pointer-events-none p-4" // Prevents drag-and-drop saving
                                                data-ai-hint={cert.aiHint}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                         <p className="text-xs text-center mt-4 text-muted-foreground">Note: For security, direct download of images is disabled.</p>
                    </section>
                    
                    {/* PDF Documents Section */}
                    <section id="documents" className="mb-16">
                         <div className="flex items-center gap-4 mb-8">
                            <FileText className="w-8 h-8 text-primary"/>
                            <h2 className="text-3xl font-headline font-bold">Official Documents</h2>
                        </div>
                         <div className="space-y-8">
                            {documents.map((doc, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle>{doc.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="w-full h-[80vh] rounded-md overflow-hidden border">
                                            <iframe src={`https://docs.google.com/gview?url=${doc.url}&embedded=true`} className="w-full h-full" frameBorder="0">
                                                <p>Your browser does not support iframes. Please <a href={doc.url} target="_blank" rel="noopener noreferrer">download the PDF</a> to view it.</p>
                                            </iframe>
                                        </div>
                                         <a href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                                            <Button variant="outline">Download PDF</Button>
                                        </a>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Terms and Conditions Section */}
                    <section id="terms">
                        <div className="flex items-center gap-4 mb-8">
                             <ShieldCheck className="w-8 h-8 text-primary"/>
                            <h2 className="text-3xl font-headline font-bold">Terms and Conditions</h2>
                        </div>
                        <Card>
                            <CardContent className="p-6 space-y-4 text-muted-foreground">
                                <p>1. All content on this website, including text, graphics, logos, images, and documents, is the property of Vanu Organic Pvt Ltd and is protected by copyright laws.</p>
                                <p>2. The information provided on this page is for informational purposes only. While we strive for accuracy, we make no guarantees about the completeness or timeliness of the information.</p>
                                <p>3. Unauthorized reproduction, distribution, or use of any material on this site without express written permission from Vanu Organic Pvt Ltd is strictly prohibited.</p>
                                <p>4. Our liability is limited to the maximum extent permitted by law. We are not responsible for any decisions made based on the information provided herein.</p>
                                <p>5. These terms are governed by the laws of India. Any disputes will be resolved in the jurisdiction of Godda, Jharkhand.</p>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );

    