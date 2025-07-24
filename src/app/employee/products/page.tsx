
"use client";

import AdminProductsPage from "@/app/admin/products/page";

// This component simply wraps the AdminProductsPage component
// for employees. Access control is handled by the layout.
export default function EmployeeProductsPage() {
    return <AdminProductsPage />;
}
