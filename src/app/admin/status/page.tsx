
"use client"

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Wrench, PauseCircle, ServerOff, Loader2, ShieldAlert, Phone, Building, LogOut, FileWarning, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from 'next/link';


interface StatusDetails {
  icon: React.ReactNode;
  title: string;
  message: string;
}

const statusMap: { [key: string]: StatusDetails } = {
  maintenance: {
    icon: <Wrench className="h-8 w-8 text-destructive" />,
    title: 'Page Under Maintenance',
    message: "This specific admin page is currently undergoing scheduled maintenance. Please check back later.",
  },
  not_subscribed: {
    icon: <FileWarning className="h-8 w-8 text-destructive" />,
    title: 'Feature Not Subscribed',
    message: 'Access to this feature is not included in your current plan. Please contact the developer to upgrade.',
  },
  down: {
    icon: <ServerOff className="h-8 w-8 text-destructive" />,
    title: 'Page is Temporarily Down',
    message: 'We are experiencing technical difficulties with this page. It is temporarily unavailable.',
  },
  bugs_found: {
    icon: <Bug className="h-8 w-8 text-destructive" />,
    title: 'Bugs Found',
    message: 'We have identified some issues with this page and have temporarily disabled it while we work on a fix.',
  }
};

function AdminStatusContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [user, loading] = useAuthState(auth);
    const status = searchParams.get('status') || 'down';
    const page = searchParams.get('page') || 'the current page';
    const details = statusMap[status] || statusMap.down;
    
    const handleLogout = () => {
        auth.signOut();
        router.push('/');
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <div className="max-w-4xl w-full space-y-6">
                <Card className="border-destructive max-w-xl mx-auto">
                    <CardHeader className="text-center items-center">
                        <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
                            {details.icon}
                        </div>
                        <CardTitle className="text-2xl font-bold text-destructive">
                           {details.title}
                        </CardTitle>
                        <CardDescription>
                            {details.message}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <p className="text-sm text-muted-foreground">Affected page: <code className="bg-muted px-1 py-0.5 rounded-sm">{page}</code></p>
                        <div className="flex gap-2">
                           <Link href="/admin/dashboard">
                              <Button variant="outline">Go to Dashboard</Button>
                           </Link>
                           {loading ? <Loader2 className="animate-spin" /> : user && (
                              <Button variant="secondary" onClick={handleLogout}>
                                  <LogOut className="mr-2 h-4 w-4"/>
                                  Logout
                              </Button>
                           )}
                        </div>
                    </CardContent>
                </Card>

                 <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Developer</CardTitle>
                            <CardDescription>For urgent technical issues.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-4">
                                <Building className="h-5 w-5 mt-1 text-muted-foreground"/>
                                <div>
                                    <h4 className="font-semibold">AKM*TECH</h4>
                                    <p className="text-sm text-muted-foreground">Satsang Nagar, Godda, Jharkhand 814133</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Phone className="h-5 w-5 mt-1 text-muted-foreground"/>
                                <div>
                                    <h4 className="font-semibold">Phone</h4>
                                    <p className="text-sm text-muted-foreground">062023 26183</p>
                                </div>
                            </div>
                            <a href="tel:06202326183" className="w-full">
                                <Button className="w-full" size="lg">
                                    <Phone className="mr-2 h-5 w-5" />
                                    Call Developer
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Vanu Organic</CardTitle>
                            <CardDescription>For all other inquiries.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-start gap-4">
                                <Building className="h-5 w-5 mt-1 text-muted-foreground"/>
                                <div>
                                    <h4 className="font-semibold">Vanu Organic Pvt Ltd</h4>
                                    <p className="text-sm text-muted-foreground">Nahar Chowk, Godda, Jharkhand 814133</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Phone className="h-5 w-5 mt-1 text-muted-foreground"/>
                                <div>
                                    <h4 className="font-semibold">Phone</h4>
                                    <p className="text-sm text-muted-foreground">+91 94927 57500</p>
                                </div>
                            </div>
                            <a href="tel:+919492757500" className="w-full">
                                <Button className="w-full" variant="outline">
                                    <Phone className="mr-2 h-5 w-5" />
                                    Call Company
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


export default function AdminStatusPage() {
    return (
        <Suspense fallback={
             <div className="flex min-h-screen flex-col items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary"/>
             </div>
        }>
            <AdminStatusContent />
        </Suspense>
    )
}
