
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function EmployeeOrdersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Assigned Orders</h1>
      </div>
       <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
            <CardDescription>View and manage orders assigned to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No orders have been assigned to you yet.</p>
          </CardContent>
        </Card>
    </div>
  );
}

