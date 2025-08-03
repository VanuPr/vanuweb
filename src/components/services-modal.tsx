
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, UserPlus, ShoppingBag, LogIn, Phone, FileText, ShieldCheck } from "lucide-react"
import Link from "next/link"

interface ServicesModalProps {
  isOpen: boolean
  onClose: () => void
}

const services = [
  { name: "Join as Coordinator", icon: Briefcase, href: "/coordinator-application" },
  { name: "Download Forms", icon: FileText, href: "/downloads" },
  { name: "Browse Products", icon: ShoppingBag, href: "/products" },
  { name: "Employee/Admin Login", icon: ShieldCheck, href: "/employee-login" },
  { name: "Contact Us", icon: Phone, href: "/customer-support" },
]

export function ServicesModal({ isOpen, onClose }: ServicesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl w-full h-full sm:h-auto max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-headline">All Services</DialogTitle>
          <DialogDescription>
            Quickly access all our services from one place.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {services.map((service) => (
              <Link href={service.href} key={service.name} onClick={onClose}>
                <Card className="text-center hover:bg-accent hover:shadow-lg transition-all h-full flex flex-col justify-center items-center p-4">
                  <CardContent className="p-0">
                    <service.icon className="w-10 h-10 text-primary mb-3 mx-auto" />
                    <p className="font-semibold text-sm">{service.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        <div className="p-6 pt-2">
            <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
