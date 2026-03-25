"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { businessApi } from "@/lib/api";

interface RoleContextType {
    role: "OWNER" | "STAFF" | null;
    isLoadingRole: boolean;
}

const RoleContext = createContext<RoleContextType>({
    role: null,
    isLoadingRole: true,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    const [role, setRole] = useState<"OWNER" | "STAFF" | null>(null);
    const [isLoadingRole, setIsLoadingRole] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchRole = async () => {
            if (isPending) return;
            
            if (!session) {
                if (isMounted) setIsLoadingRole(false);
                return;
            }

            try {
                const activeBusinessId = (session.user as any)?.activeBusinessId;
                if (!activeBusinessId) {
                    if (isMounted) setIsLoadingRole(false);
                    return;
                }

                // Fetch all businesses the user is part of to find their role
                const businesses = await businessApi.getAllMyBusinesses();
                const activeBusiness = businesses.find((b: any) => b.id === activeBusinessId);
                
                if (isMounted && activeBusiness) {
                    setRole(activeBusiness.role as "OWNER" | "STAFF");
                }
            } catch (error) {
                console.error("Failed to fetch user role:", error);
            } finally {
                if (isMounted) {
                    setIsLoadingRole(false);
                }
            }
        };

        fetchRole();

        return () => {
            isMounted = false;
        };
    }, [session, isPending]);

    return (
        <RoleContext.Provider value={{ role, isLoadingRole }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return useContext(RoleContext);
}
