"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { CartProvider } from "@/lib/cart-context";
import { CartSidebar } from "@/components/cart-sidebar";
import { customersApi } from "@/lib/api";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session, isPending } = useSession()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!isPending && session) {
            const activeBusinessId = (session.user as any)?.activeBusinessId
            const isCreatingBusiness = pathname === "/dashboard/business/new"

            if (!activeBusinessId && !isCreatingBusiness) {
                router.push("/dashboard/business/new")
            }
        }
    }, [session, isPending, router, pathname])

    if (isPending) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!session) {
        router.push("/login")
        return null
    }

    const isPOS = pathname === "/dashboard/pos"

    return (
        <CartProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="flex h-screen overflow-hidden">
                    <div className="flex flex-1 flex-row overflow-hidden min-h-0">
                        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                            {!isPOS && (
                                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                                    <SidebarTrigger className="-ml-1" />
                                    <Separator orientation="vertical" className="mr-2 h-4" />
                                    <div className="flex flex-1 items-center justify-between">
                                        <h1 className="text-lg font-semibold">Dashboard</h1>
                                        <ModeToggle />
                                    </div>
                                </header>
                            )}
                            <main className={cn(
                                "flex flex-1 flex-col min-h-0",
                                isPOS ? "p-0 overflow-hidden" : "p-4 gap-4 overflow-auto"
                            )}>
                                {children}
                            </main>
                        </div>
                        {isPOS && <CartSidebar />}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </CartProvider>
    )
}
