
"use client";

import AdminShippingPage from "@/app/admin/shipping/page";

// This component simply wraps the AdminShippingPage component
// for employees. Access control is handled by the layout.
export default function EmployeeShippingPage() {
    return <AdminShippingPage />;
}
