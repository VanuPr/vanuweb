
"use client";

import UsersPage from "@/app/admin/users/page";

// This component simply wraps the admin UsersPage component
// for employees. Access control is handled by the layout.
export default function EmployeeUsersPage() {
    return <UsersPage />;
}
