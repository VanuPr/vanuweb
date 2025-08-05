
"use client"

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DownloadFormsPage() {

    const forms = [
        {
            title: "Panchayat Coordinator Application Form",
            description: "Application form for the Panchayat Coordinator role.",
            url: "https://github.com/VanuPr/vanu-assets/raw/main/panchayatcoordinator.pdf",
            type: "Recruitment"
        },
        {
            title: "Panchayat Stock Point Application Form",
            description: "Application form to establish a Panchayat-level stock point.",
            url: "https://github.com/VanuPr/vanu-assets/raw/main/panchaytstockpoint.pdf",
            type: "Application"
        },
        {
            title: "Block Coordinator Application Form",
            description: "Application form for the Block Coordinator role.",
            url: "https://github.com/VanuPr/vanu-assets/raw/main/blockcoordinator.pdf",
            type: "Recruitment"
        },
        {
            title: "Coordinator Application Form (Legacy)",
            description: "Legacy application form for District, Block, and Panchayat Coordinator positions.",
            url: "https://github.com/akm12109/assets_vanu/raw/main/forms/Coordinator-Application-Form.pdf",
            type: "Recruitment"
        }
    ];

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">Download Center</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                            Access and download all necessary forms and documents here.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-6">
                        {forms.map((form, index) => (
                             <Card key={index}>
                                <CardHeader className="flex flex-row items-center gap-4">
                                     <div className="bg-primary/10 text-primary p-3 rounded-full">
                                        <FileText className="w-6 h-6" />
                                     </div>
                                     <div className="flex-1">
                                        <CardTitle>{form.title}</CardTitle>
                                        <CardDescription>{form.description}</CardDescription>
                                     </div>
                                      <a href={form.url} download target="_blank" rel="noopener noreferrer">
                                        <Button>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </Button>
                                      </a>
                                </CardHeader>
                             </Card>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
