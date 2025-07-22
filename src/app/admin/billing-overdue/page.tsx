
import { CreditCard, ShieldAlert, Phone, Building, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function BillingOverduePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
       <div className="max-w-xl w-full space-y-6">
            <Card className="border-destructive">
                <CardHeader className="text-center items-center">
                    <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
                        <ShieldAlert className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-destructive">
                        Access Restricted
                    </CardTitle>
                    <CardDescription>
                        Your access to the admin panel has been suspended due to a pending payment. Please contact the developer to resolve this issue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button className="w-full max-w-xs" size="lg" disabled>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay Now (Not Implemented)
                    </Button>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Developer</CardTitle>
                        <CardDescription>For billing and technical issues.</CardDescription>
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
                        <CardDescription>For business inquiries.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                            <Mail className="h-5 w-5 mt-1 text-muted-foreground"/>
                            <div>
                                <h4 className="font-semibold">Email</h4>
                                <p className="text-sm text-muted-foreground">vanuorganic@gmail.com</p>
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
