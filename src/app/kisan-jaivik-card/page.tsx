
"use client"

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function PageNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 md:py-24">
         <Card className="w-full max-w-lg text-center">
            <CardHeader className="items-center">
                <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
                <CardTitle className="text-3xl font-headline">Page Not Found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <CardDescription>The page you are looking for does not exist or has been moved.</CardDescription>
                <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
