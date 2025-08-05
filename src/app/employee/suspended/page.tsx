
"use client";

import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ShieldAlert } from 'lucide-react';

export default function SuspendedPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
           <div className="max-w-xl w-full space-y-6 text-center">
                <Card className="border-destructive">
                    <CardHeader className="items-center">
                        <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
                            <ShieldAlert className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-destructive">
                            Account Suspended
                        </CardTitle>
                        <CardDescription>
                            Your access to the employee dashboard has been paused. Please contact the site administrator for more information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <Link href="/customer-support">
                            <Button>Contact Support</Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => auth.signOut()}>
                            <LogOut className="mr-2 h-4 w-4"/> Logout
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
