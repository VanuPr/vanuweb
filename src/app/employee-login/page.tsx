
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeLoginPage() {
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
        if (user.email === 'dev@akm.com') {
          toast({ title: "Developer Login Successful", description: "Redirecting to dev dashboard..." });
          router.push('/dev');
        } else if (user.email === 'admin@vanu.com') {
          toast({ title: "Admin Login Successful", description: "Redirecting to admin dashboard..." });
          router.push('/admin/dashboard');
        } else if (user.email.endsWith('@vanuemp.in')) {
          toast({ title: "Employee Login Successful", description: "Redirecting to employee dashboard..." });
          router.push('/employee/dashboard');
        } else {
            // Default redirection or error if email doesn't match roles
             toast({
                variant: "destructive",
                title: "Login Failed",
                description: "You do not have permission to access this area.",
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
              <CardTitle className="text-2xl font-headline">Employee/Admin Login</CardTitle>
              <CardDescription>Enter your credentials to access your panel.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@vanuemp.in" 
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
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
