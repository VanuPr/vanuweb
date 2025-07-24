
"use client";

import EditProductPage from "@/app/admin/edit-product/[id]/page";

// This component simply wraps the admin EditProductPage component
// for employees. Access control is handled by the layout.
export default function EmployeeEditProductPage() {
    return <EditProductPage />;
}
