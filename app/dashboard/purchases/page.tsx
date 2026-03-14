"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Calendar, ShoppingBag, Package, ChevronDown, ChevronUp } from "lucide-react";
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

// Extended item with unit fields
interface PurchaseItem {
    productId: string;
    itemName: string;       // used when manualMode is true
    manualMode: boolean;    // true = free text, false = pick from products
    costPrice: number;     // unit cost (per ctn / per bag / per pcs)
    // Derived quantity fields — only the relevant ones are used
    quantity: number;       // final quantity sent to backend (total pcs or kg)
    // Carton tracking
    cartons: number;
    piecesPerCarton: number;
    loosePieces: number;
    // Bag tracking
    bags: number;
    piecesPerBag: number;
    loosePiecesBag: number;
    // Kg tracking
    kg: number;
    // Resolved from selected product
    unit: string;
    productPiecesPerCarton: number;
    productPiecesPerBag: number;
}

const defaultItem = (): PurchaseItem => ({
    productId: "",
    itemName: "",
    manualMode: false,
    costPrice: 0,
    quantity: 0,
    cartons: 0,
    piecesPerCarton: 0,
    loosePieces: 0,
    bags: 0,
    piecesPerBag: 0,
    loosePiecesBag: 0,
    kg: 0,
    unit: "pcs",
    productPiecesPerCarton: 0,
    productPiecesPerBag: 0,
});

export default function PurchasesPage() {
    const { data: session } = useSession();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([0]));

    const [form, setForm] = useState({
        supplierId: "",
        reference: "",
        items: [defaultItem()],
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
        } catch {
            toast.error("Failed to fetch purchases");
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const data = await inventoryApi.getSuppliers();
            setSuppliers(data);
        } catch {}
    };

    const fetchProducts = async () => {
        try {
            const data = await productsApi.getAll(businessId);
            setProducts(data);
        } catch {}
    };

    const handleAddItem = () => {
        const newItems = [...form.items, defaultItem()];
        setForm({ ...form, items: newItems });
        setExpandedRows(prev => new Set([...prev, newItems.length - 1]));
    };

    const handleRemoveItem = (index: number) => {
        setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
        setExpandedRows(prev => {
            const next = new Set<number>();
            prev.forEach(r => { if (r < index) next.add(r); else if (r > index) next.add(r - 1); });
            return next;
        });
    };

    const toggleRow = (index: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    };

    const updateItem = (index: number, patch: Partial<PurchaseItem>) => {
        const newItems = form.items.map((item, i) => {
            if (i !== index) return item;
            const updated = { ...item, ...patch };
            // Recalculate quantity based on unit mode
            const isContinuous = updated.unit === 'kg' || updated.unit === 'ltr';
            if (isContinuous) {
                updated.quantity = updated.kg;
            } else if (updated.productPiecesPerCarton > 0 && updated.cartons > 0) {
                updated.quantity = (updated.cartons * updated.piecesPerCarton) + updated.loosePieces;
            } else if (updated.productPiecesPerBag > 0 && updated.bags > 0) {
                updated.quantity = (updated.bags * updated.piecesPerBag) + updated.loosePiecesBag;
            } else {
                updated.quantity = updated.loosePieces || 0;
            }
            return updated;
        });
        setForm({ ...form, items: newItems });
    };

    const handleProductChange = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const piecesPerCarton = product.piecesPerCarton || 0;
        const piecesPerBag = (product.piecesPerBag && product.unit !== 'kg') ? product.piecesPerBag : 0;

        updateItem(index, {
            productId,
            unit: product.unit || "pcs",
            productPiecesPerCarton: piecesPerCarton,
            productPiecesPerBag: piecesPerBag,
            piecesPerCarton,
            piecesPerBag,
            costPrice: Number(product.costPrice) || 0,
            cartons: 0,
            bags: 0,
            loosePieces: 0,
            loosePiecesBag: 0,
            kg: 0,
            quantity: 0,
        });
    };

    // Calculate item total for footer
    const itemTotal = (item: PurchaseItem): number => {
        const isContinuous = item.unit === 'kg' || item.unit === 'ltr';
        if (isContinuous) return (item.kg || 0) * (item.costPrice || 0);
        
        let totalVal = 0;
        if (item.productPiecesPerCarton > 0 && (item.cartons > 0 || item.loosePieces > 0)) {
            const costPerCtn = item.costPrice || 0;
            const piecesPerCtn = item.piecesPerCarton || 1;
            const costPerPiece = costPerCtn / piecesPerCtn;
            totalVal = (item.cartons * costPerCtn) + (item.loosePieces * costPerPiece);
        } else if (item.productPiecesPerBag > 0 && (item.bags > 0 || item.loosePiecesBag > 0)) {
            const costPerBag = item.costPrice || 0;
            const piecesPerBag = item.piecesPerBag || 1;
            const costPerPiece = costPerBag / piecesPerBag;
            totalVal = (item.bags * costPerBag) + (item.loosePiecesBag * costPerPiece);
        } else {
            totalVal = (item.loosePieces || 0) * (item.costPrice || 0);
        }
        return isNaN(totalVal) || !isFinite(totalVal) ? 0 : totalVal;
    };

    const handleAddPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // For backend: send quantity as total pcs/kg and costPrice as per-unit (per-pcs) cost
            const apiItems = form.items.map(item => {
                let qty = item.quantity;
                let cost = item.costPrice;

                const isContinuous = item.unit === 'kg' || item.unit === 'ltr';
                if (isContinuous) {
                    qty = item.kg;
                } else if (item.productPiecesPerCarton > 0 && item.cartons > 0) {
                    qty = (item.cartons * item.piecesPerCarton) + item.loosePieces;
                    // Store per-pcs cost
                    cost = item.piecesPerCarton > 0 ? parseFloat((item.costPrice / item.piecesPerCarton).toFixed(4)) : item.costPrice;
                } else if (item.productPiecesPerBag > 0 && item.bags > 0) {
                    qty = (item.bags * item.piecesPerBag) + item.loosePiecesBag;
                    cost = item.piecesPerBag > 0 ? parseFloat((item.costPrice / item.piecesPerBag).toFixed(4)) : item.costPrice;
                } else {
                    qty = item.loosePieces || 0;
                }

                return { 
                    productId: item.manualMode ? undefined : item.productId, 
                    itemName: item.manualMode ? item.itemName : undefined,
                    quantity: qty, 
                    costPrice: cost 
                };

            });

            const totalAmount = form.items.reduce((sum, item) => sum + itemTotal(item), 0);
            await inventoryApi.createPurchase({ ...form, items: apiItems, totalAmount });
            fetchPurchases();
            setIsAddOpen(false);
            setForm({ supplierId: "", reference: "", items: [defaultItem()] });
            setExpandedRows(new Set([0]));
            toast.success("Purchase recorded and stock updated!");
        } catch {
            toast.error("Failed to record purchase");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will not revert stock levels.")) return;
        try {
            await inventoryApi.deletePurchase(id);
            fetchPurchases();
            toast.success("Purchase record deleted");
        } catch {
            toast.error("Failed to delete purchase");
        }
    };

    const filteredPurchases = purchases.filter(p =>
        !searchQuery ||
        p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleAddPurchase}>
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase tracking-tight">Record Purchase</DialogTitle>
                                <DialogDescription className="text-xs">
                                    Unit fields auto-fill from the selected product. Stock is updated automatically.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                {/* Supplier + Reference */}
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

                                {/* Items */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest">Items List</Label>
                                    </div>

                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                        {form.items.map((item, index) => {
                                        const isExpanded = expandedRows.has(index);
                                        const product = products.find(p => p.id === item.productId);
                                        const isCarton = item.productPiecesPerCarton > 0;
                                        const isBag = item.productPiecesPerBag > 0;
                                        const isKg = item.unit === 'kg';
                                        const total = itemTotal(item);

                                        return (
                                            <div key={index} className="border border-border/60 rounded-xl overflow-hidden bg-muted/20 animate-in slide-in-from-left-2">
                                                {/* Row Header */}
                                                <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border/40">
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest w-5">{index + 1}</span>

                                                    {/* Mode toggle */}
                                                    <div className="flex bg-muted rounded-md p-0.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateItem(index, { manualMode: false, itemName: "" })}
                                                            className={`px-2 py-0.5 text-[8px] font-black uppercase rounded transition-all ${!item.manualMode ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
                                                        >Products</button>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateItem(index, { manualMode: true, productId: "", unit: "pcs", productPiecesPerCarton: 0, productPiecesPerBag: 0 })}
                                                            className={`px-2 py-0.5 text-[8px] font-black uppercase rounded transition-all ${item.manualMode ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
                                                        >Manual</button>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        {item.manualMode ? (
                                                            <Input
                                                                placeholder="Type item name..."
                                                                className="h-8 text-xs border-none bg-transparent shadow-none p-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                                                value={item.itemName}
                                                                onChange={e => updateItem(index, { itemName: e.target.value })}
                                                                required={item.manualMode}
                                                            />
                                                        ) : (
                                                            <Select value={item.productId} onValueChange={(val) => handleProductChange(index, val)} required={!item.manualMode}>
                                                                <SelectTrigger className="h-8 text-xs border-none bg-transparent shadow-none p-0 focus:ring-0">
                                                                    <SelectValue placeholder="Select Product..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {products.map(p => (
                                                                        <SelectItem key={p.id} value={p.id}>
                                                                            <span className="font-semibold">{p.name}</span>
                                                                            <span className="ml-2 text-[9px] text-muted-foreground uppercase">{p.unit}</span>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </div>

                                                    {(item.productId || item.itemName) && (
                                                        <span className="text-[9px] font-black text-primary shrink-0">
                                                            ${total.toFixed(2)}
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleRow(index)}
                                                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                                                    >
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>

                                                {/* Row Detail (expanded) */}
                                                {isExpanded && (item.productId || (item.manualMode && item.itemName)) && (
                                                    <div className="p-3 space-y-3">
                                                        {/* Unit badge + manual unit selector */}
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 bg-primary/5 border-primary/20 text-primary">
                                                                <Package className="h-2.5 w-2.5 mr-1" />
                                                                {isKg ? 'KG Unit' : isCarton ? 'Carton Unit' : isBag ? 'Bag Unit' : 'Piece Unit'}
                                                            </Badge>
                                                            {product && <span className="text-[9px] text-muted-foreground">{product.name}</span>}
                                                            {/* Show unit selector only in manual mode */}
                                                            {item.manualMode && (
                                                                <Select
                                                                    value={item.unit}
                                                                    onValueChange={(val) => updateItem(index, {
                                                                        unit: val,
                                                                        productPiecesPerCarton: val === 'carton' ? (item.piecesPerCarton || 48) : 0,
                                                                        productPiecesPerBag: val === 'bag' ? (item.piecesPerBag || 12) : 0,
                                                                    })}
                                                                >
                                                                    <SelectTrigger className="h-6 text-[9px] w-28 font-black">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="pcs">Pieces</SelectItem>
                                                                        <SelectItem value="kg">Kilograms</SelectItem>
                                                                        <SelectItem value="ltr">Liter</SelectItem>
                                                                        <SelectItem value="carton">Cartons</SelectItem>
                                                                        <SelectItem value="bag">Bags</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </div>

                                                        {/* KG / LTR Mode */}
                                                        {(isKg || item.unit === 'ltr') && (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Total {isKg ? 'Kg' : 'Liter'}</Label>
                                                                    <Input
                                                                        type="number" step="0.01" className="h-8 text-xs"
                                                                        value={item.kg || ""}
                                                                        onChange={e => updateItem(index, { kg: parseFloat(e.target.value) || 0 })}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Cost / {isKg ? 'Kg' : 'Liter'} ($)</Label>
                                                                    <Input
                                                                        type="number" step="0.01" className="h-8 text-xs"
                                                                        value={item.costPrice || ""}
                                                                        onChange={e => updateItem(index, { costPrice: parseFloat(e.target.value) || 0 })}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Carton Mode */}
                                                        {isCarton && !isKg && (
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Cartons</Label>
                                                                        <Input
                                                                            type="number" className="h-8 text-xs"
                                                                            value={item.cartons || ""}
                                                                            onChange={e => updateItem(index, { cartons: parseInt(e.target.value) || 0 })}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Pcs / Ctn</Label>
                                                                        <Input
                                                                            type="number" className="h-8 text-xs"
                                                                            value={item.piecesPerCarton || ""}
                                                                            onChange={e => updateItem(index, { piecesPerCarton: parseInt(e.target.value) || 0 })}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Loose Pcs</Label>
                                                                        <Input
                                                                            type="number" className="h-8 text-xs"
                                                                            value={item.loosePieces || ""}
                                                                            onChange={e => updateItem(index, { loosePieces: parseInt(e.target.value) || 0 })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Cost / Carton ($)</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Input
                                                                            type="number" step="0.01" className="h-8 text-xs flex-1"
                                                                            value={item.costPrice || ""}
                                                                            onChange={e => updateItem(index, { costPrice: parseFloat(e.target.value) || 0 })}
                                                                            required
                                                                        />
                                                                        {item.piecesPerCarton > 0 && item.costPrice > 0 && (
                                                                            <span className="text-[9px] text-primary font-black whitespace-nowrap">
                                                                                = ${(item.costPrice / item.piecesPerCarton).toFixed(4)}/pcs
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {item.cartons > 0 && item.costPrice > 0 && (
                                                                    <div className="bg-primary/5 rounded-lg p-2 text-[9px] text-muted-foreground flex justify-between">
                                                                        <span>{item.cartons} ctns × ${item.costPrice}/ctn = <strong className="text-primary">${(item.cartons * item.costPrice).toFixed(2)}</strong></span>
                                                                        <span>Total pcs: {(item.cartons * item.piecesPerCarton) + item.loosePieces}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Bag Mode */}
                                                        {isBag && !isKg && !isCarton && (
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Bags</Label>
                                                                        <Input
                                                                            type="number" className="h-8 text-xs"
                                                                            value={item.bags || ""}
                                                                            onChange={e => updateItem(index, { bags: parseInt(e.target.value) || 0 })}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Pcs / Bag</Label>
                                                                        <Input
                                                                            type="number" className="h-8 text-xs"
                                                                            value={item.piecesPerBag || ""}
                                                                            onChange={e => updateItem(index, { piecesPerBag: parseInt(e.target.value) || 0 })}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Loose Pcs</Label>
                                                                        <Input
                                                                            type="number" className="h-8 text-xs"
                                                                            value={item.loosePiecesBag || ""}
                                                                            onChange={e => updateItem(index, { loosePiecesBag: parseInt(e.target.value) || 0 })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Cost / Bag ($)</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Input
                                                                            type="number" step="0.01" className="h-8 text-xs flex-1"
                                                                            value={item.costPrice || ""}
                                                                            onChange={e => updateItem(index, { costPrice: parseFloat(e.target.value) || 0 })}
                                                                            required
                                                                        />
                                                                        {item.piecesPerBag > 0 && item.costPrice > 0 && (
                                                                            <span className="text-[9px] text-primary font-black whitespace-nowrap">
                                                                                = ${(item.costPrice / item.piecesPerBag).toFixed(4)}/pcs
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {item.bags > 0 && item.costPrice > 0 && (
                                                                    <div className="bg-primary/5 rounded-lg p-2 text-[9px] text-muted-foreground flex justify-between">
                                                                        <span>{item.bags} bags × ${item.costPrice}/bag = <strong className="text-primary">${(item.bags * item.costPrice).toFixed(2)}</strong></span>
                                                                        <span>Total pcs: {(item.bags * item.piecesPerBag) + item.loosePiecesBag}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Plain Pcs Mode — no carton/bag info on product */}
                                                        {!isKg && !isCarton && !isBag && (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Quantity (pcs)</Label>
                                                                    <Input
                                                                        type="number" className="h-8 text-xs"
                                                                        value={item.loosePieces || ""}
                                                                        onChange={e => updateItem(index, { loosePieces: parseInt(e.target.value) || 0 })}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Cost / Pcs ($)</Label>
                                                                    <Input
                                                                        type="number" step="0.01" className="h-8 text-xs"
                                                                        value={item.costPrice || ""}
                                                                        onChange={e => updateItem(index, { costPrice: parseFloat(e.target.value) || 0 })}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Collapsed summary */}
                                                {!isExpanded && (item.productId || item.itemName) && (
                                                    <div className="px-3 py-1.5 text-[9px] text-muted-foreground flex items-center gap-2">
                                                        <Package className="h-3 w-3" />
                                                        <span>{item.manualMode ? item.itemName : product?.name}</span>
                                                        <span className="ml-auto font-black text-primary">${total.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                </div>
                            </div>

                            <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                                <div className="flex flex-col w-full gap-4">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Amount</span>
                                        <span className="font-black text-lg text-primary">
                                            ${form.items.reduce((sum, item) => sum + itemTotal(item), 0).toFixed(2)}
                                        </span>
                                    </div>

                                    <Button type="button" variant="outline" className="w-full border-dashed border-2 hover:bg-muted/50 font-black uppercase tracking-widest text-[9px] h-9" onClick={handleAddItem}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Another Item
                                    </Button>

                                    <Button type="submit" className="w-full font-black uppercase tracking-widest text-[10px] h-11 shadow-lg shadow-primary/20">Complete Purchase</Button>
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
                        ) : filteredPurchases.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50 font-medium tracking-widest uppercase text-[10px]">No purchase history</TableCell></TableRow>
                        ) : filteredPurchases.map((p) => (
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
