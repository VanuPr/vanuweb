
"use client"

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Home } from "lucide-react";
import Link from "next/link";

export default function CoordinatorSelectionPage() {

    const coordinatorLevels = [
        {
            level: "district",
            name: "District Coordinator",
            description: "Oversee operations and lead teams across an entire district.",
            icon: <Building className="h-10 w-10 text-primary mb-4" />
        },
        {
            level: "block",
            name: "Block Coordinator",
            description: "Manage and coordinate activities within a specific block.",
            icon: <Users className="h-10 w-10 text-primary mb-4" />
        },
        {
            level: "panchayat",
            name: "Panchayat Coordinator",
            description: "Engage directly with farmers and communities at the grassroots level.",
            icon: <Home className="h-10 w-10 text-primary mb-4" />
        }
    ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">Become a Coordinator</h1>
            <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">Choose the level you wish to apply for and join our mission to empower farmers.</p>
          </div>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            {coordinatorLevels.map(item => (
                 <Card key={item.level} className="text-center hover:shadow-lg transition-shadow hover:-translate-y-1">
                    <CardHeader>
                        {item.icon}
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href={`/coordinator-application/${item.level}`}>
                            <Button className="w-full">Apply Now</Button>
                        </Link>
                    </CardContent>
                </Card>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
