"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Calendar, ShoppingBag, ArrowRight, Package } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { inventoryApi, productsApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";

export default function PurchasesPage() {
    const { data: session } = useSession();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [form, setForm] = useState({
        supplierId: "",
        reference: "",
        items: [{ productId: "", quantity: 1, costPrice: 0 }]
    });

    const businessId = (session?.user as any)?.activeBusinessId;

    useEffect(() => {
        if (businessId) {
            fetchPurchases();
            fetchSuppliers();
            fetchProducts();
        }
    }, [businessId]);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const data = await inventoryApi.getPurchases();
            setPurchases(data);
        } catch (error: any) {
            toast.error("Failed to fetch purchases");
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const data = await inventoryApi.getSuppliers();
            setSuppliers(data);
        } catch (error) {}
    };

    const fetchProducts = async () => {
        try {
            const data = await productsApi.getAll(businessId);
            setProducts(data);
        } catch (error) {}
    };

    const handleAddItem = () => {
        setForm({ ...form, items: [...form.items, { productId: "", quantity: 1, costPrice: 0 }] });
    };

    const handleRemoveItem = (index: number) => {
        setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...form.items];
        (newItems[index] as any)[field] = value;
        setForm({ ...form, items: newItems });
    };

    const handleAddPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const totalAmount = form.items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
            await inventoryApi.createPurchase({ ...form, totalAmount });
            fetchPurchases();
            setIsAddOpen(false);
            setForm({ supplierId: "", reference: "", items: [{ productId: "", quantity: 1, costPrice: 0 }] });
            toast.success("Purchase recorded and stock updated!");
        } catch (error: any) {
            toast.error("Failed to record purchase");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will not revert stock levels.")) return;
        try {
            await inventoryApi.deletePurchase(id);
            fetchPurchases();
            toast.success("Purchase record deleted");
        } catch (error: any) {
            toast.error("Failed to delete purchase");
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-primary">Purchases</h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Record inventory intake from suppliers
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> New Purchase
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                        <form onSubmit={handleAddPurchase}>
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase tracking-tight">Record Purchase</DialogTitle>
                                <DialogDescription className="text-xs">
                                    Adding a purchase will automatically increase product stock levels.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest">Supplier</Label>
                                        <Select onValueChange={(val) => setForm({ ...form, supplierId: val })} required>
                                            <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest">Reference / Invoice #</Label>
                                        <Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest">Items</Label>
                                        <Button type="button" variant="outline" size="sm" className="h-7 text-[9px] uppercase font-bold" onClick={handleAddItem}>
                                            <Plus className="mr-1 h-3 w-3" /> Add Row
                                        </Button>
                                    </div>
                                    {form.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-end bg-muted/30 p-2 rounded-lg group animate-in slide-in-from-left-2">
                                            <div className="col-span-6 space-y-1">
                                                <Label className="text-[9px] font-bold uppercase text-muted-foreground">Product</Label>
                                                <Select onValueChange={(val) => handleItemChange(index, 'productId', val)} required>
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Product" /></SelectTrigger>
                                                    <SelectContent>
                                                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-[9px] font-bold uppercase text-muted-foreground">Qty</Label>
                                                <Input type="number" className="h-9 text-xs" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} required />
                                            </div>
                                            <div className="col-span-3 space-y-1">
                                                <Label className="text-[9px] font-bold uppercase text-muted-foreground">Cost ($)</Label>
                                                <Input type="number" step="0.01" className="h-9 text-xs" value={item.costPrice} onChange={e => handleItemChange(index, 'costPrice', parseFloat(e.target.value))} required />
                                            </div>
                                            <div className="col-span-1 flex justify-center pb-0.5">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveItem(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                                <div className="flex flex-col w-full gap-4">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Amount</span>
                                        <span className="font-black text-lg text-primary">${form.items.reduce((sum, i) => sum + (i.quantity * i.costPrice), 0).toFixed(2)}</span>
                                    </div>
                                    <Button type="submit" className="w-full font-black uppercase tracking-widest text-[10px] h-11">Complete Purchase</Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search purchases..." className="pl-10 h-11 bg-muted/50 border-none rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 w-[150px]">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Invoice / Supplier</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Items</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Amount</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50 font-medium tracking-widest uppercase text-[10px]">Loading Purchases...</TableCell></TableRow>
                        ) : purchases.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50 font-medium tracking-widest uppercase text-[10px]">No purchase history</TableCell></TableRow>
                        ) : purchases.map((p) => (
                            <TableRow key={p.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                                <TableCell className="text-xs font-bold text-muted-foreground uppercase flex gap-2 items-center">
                                    <Calendar className="h-3 w-3 text-primary/60" /> {new Date(p.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{p.reference || "NO-REF"}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter flex items-center gap-1">
                                            <ShoppingBag className="h-2.5 w-2.5" /> {p.supplier?.name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        <Badge variant="outline" className="text-[9px] font-black py-0 h-5 px-2 bg-primary/5 border-primary/20 text-primary">
                                            {p.items?.length || 0} PRODUCTS
                                        </Badge>
                                        <p className="text-[9px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                                            {p.items?.map((i: any) => `${i.quantity}x ${i.product?.name}`).join(", ")}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell className="font-black text-sm text-primary">
                                    ${Number(p.totalAmount).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => handleDelete(p.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
