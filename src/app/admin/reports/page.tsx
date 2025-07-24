
"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface ProgressReport {
  id: string;
  userName: string;
  text: string;
  submittedAt: Timestamp;
}

export default function DailyReportsPage() {
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'progress-reports'), orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const reportsData = querySnapshot.docs.map(doc => ({ 
            id: doc.id,
            ...doc.data() 
        } as ProgressReport));
        setReports(reportsData);
      } catch (error) {
        console.error("Error fetching reports: ", error);
        toast({ variant: 'destructive', title: 'Failed to fetch reports.' });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Employee Daily Reports</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Submitted Reports</CardTitle>
          <CardDescription>Review daily progress updates from your team. For a detailed view, check the employee's profile.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No progress reports have been submitted yet.</p>
          ) : (
            <div className="space-y-4">
                {reports.map((report) => (
                    <Card key={report.id} className="bg-muted/40">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                     <div className="bg-primary/10 p-2 rounded-full">
                                         <MessageSquare className="h-5 w-5 text-primary" />
                                     </div>
                                     <div>
                                        <CardTitle className="text-lg">{report.userName}</CardTitle>
                                        <CardDescription>
                                            Submitted on {format(report.submittedAt.toDate(), 'PPP p')}
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground whitespace-pre-wrap">{report.text}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    