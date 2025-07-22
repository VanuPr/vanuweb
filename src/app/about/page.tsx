
"use client"

import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, Target, Leaf, TestTube2, Banknote, Users2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export default function AboutPage() {
  const { translations } = useLanguage();
  const t = translations.about;

  const directors = [
    {
      name: "Rishav Kumar",
      title: "Director",
      image: "https://github.com/akm12109/assets_vanu/blob/main/rishav.jpeg?raw=true",
      aiHint: "professional headshot male"
    },
    {
      name: "Heera Kumari",
      title: "Director",
      image: "https://placehold.co/400x400.png",
      aiHint: "professional headshot female"
    },
  ];

  const services = [
    {
      icon: <Leaf className="w-8 h-8 text-primary" />,
      title: "Organic Farming Consultancy",
      description: "Expert guidance on sustainable farming practices, from crop rotation to natural pest control."
    },
    {
      icon: <TestTube2 className="w-8 h-8 text-primary" />,
      title: "Soil Testing & Analysis",
      description: "Comprehensive soil analysis to provide tailored recommendations for improving soil health and fertility."
    },
    {
      icon: <Banknote className="w-8 h-8 text-primary" />,
      title: "Kisan Credit Card Assistance",
      description: "Helping farmers navigate the application process for Kisan Credit Cards to secure necessary funding."
    },
    {
      icon: <Users2 className="w-8 h-8 text-primary" />,
      title: "Community Workshops",
      description: "Organizing educational workshops and training sessions for farmers on the latest organic techniques."
    },
  ];
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section id="about-hero" className="w-full py-20 md:py-32 bg-primary/5">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center">
                    <Badge variant="outline">{t.title}</Badge>
                    <h1 className="mt-4 text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">{t.subtitle}</h1>
                    <p className="mt-6 max-w-3xl mx-auto text-muted-foreground">{t.storyText}</p>
                </div>
            </div>
        </section>

        {/* Mission & Vision Section */}
        <section id="mission-vision" className="w-full py-16 md:py-24">
             <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="w-full h-80 relative rounded-lg overflow-hidden shadow-lg">
                        <Image src="https://i.ytimg.com/vi/SInkZfwsKS0/mqdefault.jpg" alt={t.imageAlt} layout="fill" objectFit="cover" data-ai-hint="farmer training" />
                    </div>
                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold font-headline">{t.missionTitle}</h3>
                                <p className="mt-1 text-muted-foreground">{t.missionText}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Award className="w-6 h-6 text-primary" />
                                 </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold font-headline">{t.visionTitle}</h3>
                                <p className="mt-1 text-muted-foreground">{t.visionText}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Services Section */}
        <section id="services" className="w-full py-16 md:py-24 bg-primary/5">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">{t.coreServicesTitle}</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">{t.coreServicesDesc}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      {service.icon}
                    </div>
                    <h3 className="text-lg font-semibold font-headline">{service.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Directors Section */}
        <section id="directors" className="w-full py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">{t.leadershipTitle}</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">{t.leadershipDesc}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {directors.map((director, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <Avatar className="w-32 h-32 mb-4 border-4 border-primary/10">
                    <AvatarImage src={director.image} alt={director.name} data-ai-hint={director.aiHint} className="object-cover"/>
                    <AvatarFallback>{director.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold">{director.name}</h3>
                  <p className="text-sm text-muted-foreground">{director.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
