
"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getDB } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    createdAt: any;
}

export default function CategoriesPage() {
    const db = getDB();
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoriesData);
        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching categories" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const createSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };


    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast({ variant: "destructive", title: "Category name cannot be empty." });
            return;
        }
        setIsSubmitting(true);

        try {
            const slug = createSlug(newCategoryName);
            await addDoc(collection(db, "categories"), {
                name: newCategoryName,
                slug: slug,
                createdAt: serverTimestamp()
            });

            toast({ title: "Category added", description: `"${newCategoryName}" has been added.` });
            setNewCategoryName('');
            fetchCategories(); 
        } catch (error) {
            console.error("Error adding category: ", error);
            toast({ variant: "destructive", title: "Error adding category" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the category "${name}"? This might affect existing products.`)) {
            try {
                await deleteDoc(doc(db, "categories", id));
                toast({ title: "Category deleted" });
                fetchCategories();
            } catch (error) {
                toast({ variant: "destructive", title: "Error deleting category" });
            }
        }
    };

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Category</CardTitle>
                        <CardDescription>Create a new category for your products.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div className="grid gap-2">
                                <label htmlFor="name">Category Name</label>
                                <Input 
                                    id="name" 
                                    value={newCategoryName} 
                                    onChange={(e) => setNewCategoryName(e.target.value)} 
                                    required 
                                    disabled={isSubmitting} 
                                    placeholder="e.g. Organic Foods"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Add Category
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Categories</CardTitle>
                        <CardDescription>Review and delete existing product categories.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
                        ) : categories.length === 0 ? (
                            <p className="text-center text-muted-foreground">No categories yet. Add one to get started.</p>
                        ) : (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                                        <TableCell className="text-right">
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
