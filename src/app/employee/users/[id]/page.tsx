
"use client";

import UserProfilePage from "@/app/admin/users/[id]/page";

// This component simply wraps the admin UserProfilePage component
// for employees. Access control is handled by the layout.
export default function EmployeeUserProfilePage() {
    return <UserProfilePage />;
}
