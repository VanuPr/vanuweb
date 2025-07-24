
"use client";

import AdminOrdersPage from '@/app/admin/orders/page';

// This component simply wraps the AdminOrdersPage component,
// as the functionality is identical. Access control is handled
// by the layout.
export default function EmployeeOrdersPage() {
  return <AdminOrdersPage />;
}
