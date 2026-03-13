"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, User, Phone, MapPin, Mail } from "lucide-react";
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
import { inventoryApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function SuppliersPage() {
    const { data: session } = useSession();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [form, setForm] = useState({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const data = await inventoryApi.getSuppliers();
            setSuppliers(data);
        } catch (error: any) {
            toast.error("Failed to fetch suppliers");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inventoryApi.createSupplier(form);
            fetchSuppliers();
            setIsAddOpen(false);
            setForm({ name: "", contactPerson: "", email: "", phone: "", address: "" });
            toast.success("Supplier added successfully");
        } catch (error: any) {
            toast.error("Failed to add supplier");
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inventoryApi.updateSupplier(editingSupplier.id, form);
            fetchSuppliers();
            setIsEditOpen(false);
            toast.success("Supplier updated successfully");
        } catch (error: any) {
            toast.error("Failed to update supplier");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await inventoryApi.deleteSupplier(id);
            fetchSuppliers();
            toast.success("Supplier deleted successfully");
        } catch (error: any) {
            toast.error("Failed to delete supplier");
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contactPerson || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-primary">Suppliers</h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Manage your product suppliers and contacts
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Add Supplier
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleAdd}>
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase tracking-tight">Add New Supplier</DialogTitle>
                                <DialogDescription className="text-xs">
                                    Fill in the supplier details below.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest">Company Name</Label>
                                    <Input id="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact" className="text-[10px] font-black uppercase tracking-widest">Contact Person</Label>
                                    <Input id="contact" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest">Phone</Label>
                                        <Input id="phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest">Email</Label>
                                        <Input id="email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest">Address</Label>
                                    <Input id="address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full font-black uppercase tracking-widest text-[10px]">Save Supplier</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search suppliers..."
                    className="pl-10 h-11 bg-muted/50 border-none rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Supplier</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Contact</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Phone / Email</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10 opacity-50 font-medium">Loading...</TableCell></TableRow>
                        ) : filteredSuppliers.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10 opacity-50 font-medium">No suppliers found</TableCell></TableRow>
                        ) : filteredSuppliers.map((s) => (
                            <TableRow key={s.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm tracking-tight">{s.name}</span>
                                            {s.address && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="h-2.5 w-2.5" /> {s.address}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm font-medium text-muted-foreground">{s.contactPerson || "N/A"}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {s.phone && (
                                            <span className="text-[10px] font-bold flex items-center gap-1.5 uppercase">
                                                <Phone className="h-3 w-3 text-primary/60" /> {s.phone}
                                            </span>
                                        )}
                                        {s.email && (
                                            <span className="text-[10px] font-bold flex items-center gap-1.5 lowercase text-muted-foreground">
                                                <Mail className="h-3 w-3 text-primary/60" /> {s.email}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all" onClick={() => {
                                            setEditingSupplier(s);
                                            setForm({
                                                name: s.name,
                                                contactPerson: s.contactPerson || "",
                                                email: s.email || "",
                                                phone: s.phone || "",
                                                address: s.address || "",
                                            });
                                            setIsEditOpen(true);
                                        }}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => handleDelete(s.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleEdit}>
                        <DialogHeader>
                            <DialogTitle className="font-black uppercase tracking-tight">Edit Supplier</DialogTitle>
                            <DialogDescription className="text-xs">
                                Update supplier information.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-widest">Company Name</Label>
                                <Input id="edit-name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-contact" className="text-[10px] font-black uppercase tracking-widest">Contact Person</Label>
                                <Input id="edit-contact" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-phone" className="text-[10px] font-black uppercase tracking-widest">Phone</Label>
                                    <Input id="edit-phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email" className="text-[10px] font-black uppercase tracking-widest">Email</Label>
                                    <Input id="edit-email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-address" className="text-[10px] font-black uppercase tracking-widest">Address</Label>
                                <Input id="edit-address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full font-black uppercase tracking-widest text-[10px]">Update Supplier</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
