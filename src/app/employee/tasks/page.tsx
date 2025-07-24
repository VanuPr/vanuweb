
"use client";

import TasksPage from "@/app/admin/tasks/page";

// This component simply wraps the admin TasksPage component
// for employees. Access control is handled by the layout.
export default function EmployeeTasksPage() {
    return <TasksPage />;
}
