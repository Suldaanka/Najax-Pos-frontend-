"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, User, Phone, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, } from "lucide-react";
import { customersApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { exportToExcel } from "@/lib/export-utils";

export default function CustomersPage() {
    const { data: session } = useSession();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const businessId = (session?.user as any)?.activeBusinessId || "cm7evm3030000m908qgeks2rj";

    useEffect(() => {
        if (businessId) {
            fetchCustomers();
        }
    }, [businessId]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await customersApi.getAll(businessId);
            setCustomers(data);
        } catch (error: any) {
            toast.error("Failed to fetch customers: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const exportData = filteredCustomers.map(c => ({
            Name: c.name,
            Phone: c.phone || "N/A",
            LoyaltyPoints: c.loyaltyPoints || 0,
            Status: "Active"
        }));
        exportToExcel(exportData, `Customers_List_${new Date().toISOString().split('T')[0]}`);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || "").includes(searchQuery)
    );

    const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            businessId,
            name: formData.get("name") as string,
            phone: formData.get("phone") as string,
        };

        try {
            await customersApi.create(data);
            fetchCustomers();
            setIsAddOpen(false);
            toast.success("Customer added successfully");
        } catch (error: any) {
            toast.error("Failed to add customer: " + error.message);
        }
    };

    const handleEditCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            phone: formData.get("phone") as string,
        };

        try {
            await customersApi.update(editingCustomer.id, data);
            fetchCustomers();
            setIsEditOpen(false);
            toast.success("Customer updated successfully");
        } catch (error: any) {
            toast.error("Failed to update customer: " + error.message);
        }
    };

    const handleDeleteCustomer = async (id: string) => {
        try {
            await customersApi.delete(id);
            fetchCustomers();
            toast.success("Customer deleted successfully");
        } catch (error: any) {
            toast.error("Failed to delete customer: " + error.message);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Customer Management</h2>
                    <p className="text-muted-foreground">
                        Manage your customer base and contact information.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Customer
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleAddCustomer}>
                                <DialogHeader>
                                    <DialogTitle>Add New Customer</DialogTitle>
                                    <DialogDescription>
                                        Enter the details of the new customer here.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">Name</Label>
                                        <Input id="name" name="name" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="phone" className="text-right">Phone</Label>
                                        <Input id="phone" name="phone" className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Save Customer</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search customers..."
                        className="pl-8 max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Customer</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Contact</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Loyalty Points</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                    Loading customers...
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id} className="group transition-colors hover:bg-muted/30">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm tracking-tight">{customer.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-black opacity-40">Retail Customer</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px] font-bold border-muted-foreground/20 text-muted-foreground bg-muted/20">
                                                <Phone className="h-2.5 w-2.5 mr-1" />
                                                {customer.phone || "No Phone"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-sm font-black">{customer.loyaltyPoints || 0}</span>
                                                <span className="text-[9px] font-black uppercase tracking-tighter opacity-80">Pts</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="default" className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase px-2 py-0">
                                            Active
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditingCustomer(customer);
                                                        setIsEditOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit Customer
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDeleteCustomer(customer.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Customer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    {editingCustomer && (
                        <form onSubmit={handleEditCustomer}>
                            <DialogHeader>
                                <DialogTitle>Edit Customer</DialogTitle>
                                <DialogDescription>
                                    Update customer details.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">Name</Label>
                                    <Input id="edit-name" name="name" defaultValue={editingCustomer.name} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-phone" className="text-right">Phone</Label>
                                    <Input id="edit-phone" name="phone" defaultValue={editingCustomer.phone} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Update Customer</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
