
"use client";

import AddProductPage from "@/app/admin/add-product/page";

// This component simply wraps the admin AddProductPage component
// for employees. Access control is handled by the layout.
export default function EmployeeAddProductPage() {
    return <AddProductPage />;
}
