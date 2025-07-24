
"use client";

import CategoriesPage from "@/app/admin/categories/page";

// This component simply wraps the admin CategoriesPage component
// for employees. Access control is handled by the layout.
export default function EmployeeCategoriesPage() {
    return <CategoriesPage />;
}
