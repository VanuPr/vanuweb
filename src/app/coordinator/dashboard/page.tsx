
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function CoordinatorDashboardPage() {
  const [user] = useAuthState(auth);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Coordinator Dashboard</h1>
      </div>
       <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.displayName || 'Coordinator'}!</CardTitle>
            <CardDescription>This is your personal dashboard. More features will be added here soon.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your assigned tasks and information will appear here.</p>
          </CardContent>
        </Card>
    </div>
  );
}
