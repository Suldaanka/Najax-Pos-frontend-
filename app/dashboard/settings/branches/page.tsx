"use client";

import { useState, useEffect } from "react";
import { Plus, Store, MapPin, Phone, CheckCircle2, MoreVertical, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { branchesApi } from "@/lib/api";
import { toast } from "sonner";
import { useBranch } from "@/lib/branch-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BranchesPage() {
  const { branches, refreshBranches } = useBranch();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    phone: "",
    isMain: false,
  });

  const handleAddBranch = async () => {
    if (!newBranch.name) {
      toast.error("Branch name is required");
      return;
    }

    setIsLoading(true);
    try {
      await branchesApi.create(newBranch);
      toast.success("Branch created successfully");
      setIsAddOpen(false);
      setNewBranch({ name: "", address: "", phone: "", isMain: false });
      refreshBranches();
    } catch (error) {
      console.error("Failed to create branch:", error);
      toast.error("Failed to create branch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetMain = async (id: string) => {
    try {
      await branchesApi.setMain(id);
      toast.success("Main branch updated");
      refreshBranches();
    } catch (error) {
      console.error("Failed to set main branch:", error);
      toast.error("Failed to update main branch");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Business Branches</h2>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-60">
            Manage your physical locations and inventory distribution
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="font-black uppercase tracking-widest gap-2 bg-primary text-primary-foreground shadow-xl hover:scale-105 transition-transform">
              <Plus className="h-4 w-4" />
              Add New Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tight">Add New Branch</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Enter details for your new business location
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Branch Name</label>
                <Input
                  placeholder="e.g. Downtown Branch"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Address</label>
                <Input
                  placeholder="Street, City"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Phone</label>
                <Input
                  placeholder="Phone number"
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddBranch} disabled={isLoading} className="w-full font-black uppercase tracking-widest">
                {isLoading ? "Creating..." : "Create Branch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id} className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Store className="h-6 w-6" />
                </div>
                {branch.isMain ? (
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-primary/20">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Main Branch</span>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleSetMain(branch.id)}
                        className="text-[10px] font-black uppercase tracking-widest cursor-pointer"
                      >
                        Set as Main
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest text-destructive cursor-pointer">
                        Delete Branch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <CardTitle className="text-xl font-black uppercase tracking-tight mt-4">{branch.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">{branch.address || "No address provided"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">{branch.phone || "No phone provided"}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-50 text-muted-foreground">Status</span>
                  <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Active</span>
                </div>
                <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest h-8 px-4 border-2">
                  View Stock
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-muted/20 border-2 border-dashed rounded-3xl space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <Building2 className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black uppercase tracking-tight">No Branches Found</h3>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-50 max-w-xs mx-auto">
                Start by adding your first business location to track separate inventory.
              </p>
            </div>
            <Button onClick={() => setIsAddOpen(true)} className="font-black uppercase tracking-widest">
              Add Your First Branch
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
