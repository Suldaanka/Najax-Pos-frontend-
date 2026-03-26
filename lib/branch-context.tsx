"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { branchesApi } from "./api";
import { useSession } from "./auth-client";
import { toast } from "sonner";

interface Branch {
    id: string;
    name: string;
    isMain: boolean;
    address?: string;
    phone?: string;
}

interface BranchContextType {
    branches: Branch[];
    currentBranchId: string | null;
    currentBranch: Branch | null;
    setCurrentBranchId: (id: string) => void;
    refreshBranches: () => Promise<void>;
    isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshBranches = async () => {
        if (!session) return;
        try {
            const data = await branchesApi.getAll();
            setBranches(data);
            
            // Auto-select branch if none selected
            if (data.length > 0 && !currentBranchId) {
                const saved = localStorage.getItem(`najax_branch_${session.user.id}`);
                const exists = data.find((b: Branch) => b.id === saved);
                if (exists) {
                    setCurrentBranchId(saved);
                } else {
                    const main = data.find((b: Branch) => b.isMain) || data[0];
                    setCurrentBranchId(main.id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch branches:", error);
            toast.error("Cloud not load branches");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            refreshBranches();
        } else {
            setBranches([]);
            setCurrentBranchId(null);
            setIsLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (session && currentBranchId) {
            localStorage.setItem(`najax_branch_${session.user.id}`, currentBranchId);
        }
    }, [currentBranchId, session]);

    const currentBranch = branches.find(b => b.id === currentBranchId) || null;

    return (
        <BranchContext.Provider value={{
            branches,
            currentBranchId,
            currentBranch,
            setCurrentBranchId,
            refreshBranches,
            isLoading
        }}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error("useBranch must be used within a BranchProvider");
    }
    return context;
}
