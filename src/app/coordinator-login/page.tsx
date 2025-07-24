
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { query, where, collection, getDocs } from "firebase/firestore";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Loader2 } from "lucide-react";

export default function CoordinatorLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user && user.email) {
          const q = query(collection(db, 'coordinator-applications'), where('email', '==', user.email), where('status', '==', 'Approved'));
          const coordinatorSnapshot = await getDocs(q);
          
          if (!coordinatorSnapshot.empty) {
            toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
            router.push('/coordinator/dashboard');
          } else {
             toast({
                variant: "destructive",
                title: "Access Denied",
                description: "You are not an approved coordinator.",
            });
            auth.signOut();
          }
      }
      
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 md:py-24">
        <Card className="w-full max-w-sm">
          <form onSubmit={handleSignIn}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Coordinator Login</CardTitle>
              <CardDescription>Enter your credentials to access your coordinator panel.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : null}
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
               <p className="text-center text-sm text-muted-foreground">
                  Want to become a coordinator?{' '}
                  <Link href="/coordinator-application" className="underline font-semibold text-primary">
                    Apply here
                  </Link>
                </p>
            </CardFooter>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
