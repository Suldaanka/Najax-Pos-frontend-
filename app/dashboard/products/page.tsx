"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, PackagePlus, Pencil, Trash2, Download, ArrowRightLeft } from "lucide-react";
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
    DropdownMenuSeparator,
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
import { productsApi, categoriesApi, inventoryApi, branchesApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useBranch } from "@/lib/branch-context";
import BarcodeScanner from "@/components/barcode-scanner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export default function ProductsPage() {
    const { data: session } = useSession();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const { currentBranchId, branches } = useBranch();
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [transferForm, setTransferForm] = useState({
        productId: "",
        fromBranchId: "",
        toBranchId: "",
        quantity: 0,
        note: ""
    });

    const [addForm, setAddForm] = useState({
        name: "",
        categoryId: "",
        price: 0,
        barcode: "",
        costPrice: 0,
        costPerCarton: 0,
        trackCartons: false,
        cartons: 0,
        piecesPerCarton: 0,
        loosePieces: 0,
        stock: 0,
        unit: "pcs",
        useBulkCalc: false,
        numBags: 0,
        kgPerBag: 50,
        costPerBag: 0,
        trackBags: false,
        bags: 0,
        piecesPerBag: 0,
        wholesalePrice: 0,
        minWholesaleQty: 0,
    });

    const [editForm, setEditForm] = useState({
        name: "",
        categoryId: "",
        price: 0,
        barcode: "",
        costPrice: 0,
        costPerCarton: 0,
        trackCartons: false,
        cartons: 0,
        piecesPerCarton: 0,
        loosePieces: 0,
        stock: 0,
        unit: "pcs",
        useBulkCalc: false,
        numBags: 0,
        kgPerBag: 50,
        costPerBag: 0,
        trackBags: false,
        bags: 0,
        piecesPerBag: 0,
        wholesalePrice: 0,
        minWholesaleQty: 0,
    });

    const businessId = (session?.user as any)?.activeBusinessId;

    useEffect(() => {
        if (businessId) {
            fetchProducts();
            fetchCategories();
        }
    }, [businessId]);

    // Bulk calculation for Add Form
    useEffect(() => {
        if (addForm.useBulkCalc && (addForm.unit === 'kg' || addForm.unit === 'ltr')) {
            const totalStock = (addForm.numBags || 0) * (addForm.piecesPerBag || 0);
            const unitCost = addForm.piecesPerBag > 0 ? (addForm.costPerBag || 0) / addForm.piecesPerBag : 0;
            const roundedCost = parseFloat(unitCost.toFixed(2));
            
            // Suggest selling price with 20% margin if price is currently 0 or near suggested
            const suggestedPrice = parseFloat((roundedCost * 1.2).toFixed(2));
            
            setAddForm(prev => ({
                ...prev,
                stock: totalStock,
                costPrice: roundedCost,
                price: prev.price === 0 ? suggestedPrice : prev.price
            }));
        }
    }, [addForm.useBulkCalc, addForm.numBags, addForm.piecesPerBag, addForm.costPerBag, addForm.unit]);

    // Bulk calculation for Edit Form
    useEffect(() => {
        if (editForm.useBulkCalc && (editForm.unit === 'kg' || editForm.unit === 'ltr')) {
            const totalStock = (editForm.numBags || 0) * (editForm.piecesPerBag || 0);
            const unitCost = editForm.piecesPerBag > 0 ? (editForm.costPerBag || 0) / editForm.piecesPerBag : 0;
            const roundedCost = parseFloat(unitCost.toFixed(2));
            
            setEditForm(prev => ({
                ...prev,
                stock: totalStock,
                costPrice: roundedCost
            }));
        }
    }, [editForm.useBulkCalc, editForm.numBags, editForm.piecesPerBag, editForm.costPerBag, editForm.unit]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await productsApi.getAll(businessId);
            setProducts(data);
        } catch (error: any) {
            toast.error("Failed to fetch products: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        const exportData = filteredProducts.map(p => ({
            Name: p.name,
            Category: p.category?.name || "Uncategorized",
            Price: p.sellingPrice,
            Stock: p.stockQuantity,
            Status: p.stockQuantity > 10 ? "In Stock" : p.stockQuantity > 0 ? "Low Stock" : "Out of Stock"
        }));
        exportToExcel(exportData, `Products_Inventory_${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportPDF = () => {
        const exportData = filteredProducts.map(p => ({
            Name: p.name,
            Category: p.category?.name || "Uncategorized",
            Price: p.sellingPrice,
            Stock: p.stockQuantity,
            Status: p.stockQuantity > 10 ? "OK" : p.stockQuantity > 0 ? "LOW" : "OUT"
        }));
        exportToPDF(
            exportData, 
            `Products_Inventory_${new Date().toISOString().split('T')[0]}`,
            "Product Inventory Report"
        );
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchCategories = async () => {
        try {
            const data = await categoriesApi.getAll(businessId);
            setCategories(data);
        } catch (error: any) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const isKg = addForm.unit === 'kg';
        const trackCartons = isKg ? false : addForm.trackCartons;
        const trackBags = isKg ? false : addForm.trackBags;
        
        let totalStock = addForm.stock;
        if (trackCartons) {
            totalStock = (addForm.cartons * addForm.piecesPerCarton) + addForm.loosePieces;
        } else if (trackBags) {
            totalStock = (addForm.bags * addForm.piecesPerBag) + addForm.loosePieces;
        }

        const data = {
            businessId,
            name: addForm.name,
            categoryId: addForm.categoryId,
            barcode: addForm.barcode,
            costPrice: addForm.costPrice,
            sellingPrice: addForm.price,
            stockQuantity: totalStock,
            unit: addForm.unit,
            piecesPerCarton: trackCartons ? addForm.piecesPerCarton : null,
            piecesPerBag: trackBags ? addForm.piecesPerBag : (isKg && addForm.useBulkCalc) ? addForm.kgPerBag : null,
            wholesalePrice: addForm.wholesalePrice || null,
            minWholesaleQty: addForm.minWholesaleQty || null,
        };

        try {
            await productsApi.create(data);
            fetchProducts();
            setIsAddOpen(false);
            setAddForm({ 
                name: "", 
                categoryId: "", 
                price: 0, 
                barcode: "", 
                costPrice: 0, 
                costPerCarton: 0,
                trackCartons: false, 
                cartons: 0, 
                piecesPerCarton: 0, 
                loosePieces: 0, 
                stock: 0, 
                unit: "pcs",
                useBulkCalc: false,
                numBags: 0,
                kgPerBag: 50,
                costPerBag: 0,
                trackBags: false,
                bags: 0,
                piecesPerBag: 0,
                wholesalePrice: 0,
                minWholesaleQty: 0,
            }); // reset
            toast.success("Product added successfully");
        } catch (error: any) {
            toast.error("Failed to add product: " + error.message);
        }
    };

    const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const isKg = editForm.unit === 'kg';
        const trackCartons = isKg ? false : editForm.trackCartons;
        const trackBags = isKg ? false : editForm.trackBags;

        let totalStock = editForm.stock;
        if (trackCartons) {
            totalStock = (editForm.cartons * editForm.piecesPerCarton) + editForm.loosePieces;
        } else if (trackBags) {
            totalStock = (editForm.bags * editForm.piecesPerBag) + editForm.loosePieces;
        }

        const data = {
            name: editForm.name,
            categoryId: editForm.categoryId,
            barcode: editForm.barcode,
            costPrice: editForm.costPrice,
            sellingPrice: editForm.price,
            stockQuantity: totalStock,
            unit: editForm.unit,
            piecesPerCarton: trackCartons ? editForm.piecesPerCarton : null,
            piecesPerBag: trackBags ? editForm.piecesPerBag : 
                         (isKg && editForm.useBulkCalc) ? editForm.kgPerBag : 
                         (isKg && editingProduct?.piecesPerBag) ? editingProduct.piecesPerBag : null,
            wholesalePrice: editForm.wholesalePrice || null,
            minWholesaleQty: editForm.minWholesaleQty || null,
        };

        try {
            await productsApi.update(editingProduct.id, data);
            fetchProducts();
            setIsEditOpen(false);
            setEditForm({ 
                name: "", 
                categoryId: "", 
                price: 0, 
                barcode: "", 
                costPrice: 0, 
                costPerCarton: 0,
                trackCartons: false, 
                cartons: 0, 
                piecesPerCarton: 0, 
                loosePieces: 0, 
                stock: 0, 
                unit: "pcs",
                useBulkCalc: false,
                numBags: 0,
                kgPerBag: 50,
                costPerBag: 0,
                trackBags: false,
                bags: 0,
                piecesPerBag: 0,
                wholesalePrice: 0,
                minWholesaleQty: 0,
            }); // reset
            toast.success("Product updated successfully");
        } catch (error: any) {
            toast.error("Failed to update product: " + error.message);
        }
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustingProduct) return;
        const formData = new FormData(e.target as HTMLFormElement);
        const adjustment = parseFloat(formData.get("adjustment") as string);
        
        try {
            await productsApi.adjustStock(adjustingProduct.id, { 
                stockQuantity: adjustment,
                branchId: currentBranchId || undefined
            });
            toast.success("Stock adjusted successfully");
            setIsAdjustOpen(false);
            fetchProducts();
        } catch (error: any) {
            toast.error("Failed to adjust stock: " + error.message);
        }
    };

    const handleTransferStock = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await branchesApi.transfer(transferForm);
            toast.success("Stock transferred successfully");
            setIsTransferOpen(false);
            setTransferForm({
                productId: "",
                fromBranchId: "",
                toBranchId: "",
                quantity: 0,
                note: ""
            });
            fetchProducts();
        } catch (error: any) {
            toast.error("Transfer failed: " + error.message);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        try {
            await productsApi.delete(id);
            fetchProducts();
            toast.success("Product deleted successfully");
        } catch (error: any) {
            toast.error("Failed to delete product: " + error.message);
        }
    };

    const fetchStockLogs = async (productId: string) => {
        setLoadingLogs(true);
        try {
            const data = await inventoryApi.getStockLogs(productId);
            setStockLogs(data);
        } catch (error: any) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Products
                        <Badge variant="outline" className="text-[10px] font-black bg-primary/10 text-primary border-primary/20 animate-pulse">v2.0 ENTERPRISE</Badge>
                    </h2>
                    <p className="text-muted-foreground">
                        Manage your inventory and product listings.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 px-4 rounded-lg border-primary/20 hover:bg-primary/5">
                        <Download className="mr-2 h-4 w-4 text-primary" /> Export Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-9 px-4 rounded-lg border-primary/20 hover:bg-primary/5">
                        <Download className="mr-2 h-4 w-4 text-primary" /> Export PDF
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsCameraOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                            <form onSubmit={handleAddProduct} className="flex flex-col max-h-[90vh]">
                                <DialogHeader className="p-6 pb-2">
                                    <DialogTitle>Add New Product</DialogTitle>
                                    <DialogDescription>
                                        Enter the details of the new product here.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto p-6 py-2">
                                    <div className="grid gap-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="barcode" className="text-right">Barcode</Label>
                                        <div className="col-span-3 space-y-2">
                                            <div className="flex gap-2">
                                                <Input 
                                                    id="barcode" 
                                                    name="barcode" 
                                                    placeholder="Scan or type barcode"
                                                    className="flex-1" 
                                                    value={addForm.barcode}
                                                    onChange={(e) => setAddForm({ ...addForm, barcode: e.target.value })}
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="icon"
                                                    onClick={() => setIsCameraOpen(!isCameraOpen)}
                                                    className={isCameraOpen ? "bg-primary text-primary-foreground" : ""}
                                                >
                                                    <Plus className={isCameraOpen ? "rotate-45 transition-transform" : "transition-transform"} />
                                                </Button>
                                            </div>
                                            {isCameraOpen && (
                                                <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                                                    <BarcodeScanner 
                                                        onScanSuccess={(text: string) => {
                                                            setAddForm({ ...addForm, barcode: text });
                                                            setIsCameraOpen(false);
                                                            toast.success("Barcode scanned successfully!");
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">Name</Label>
                                        <Input 
                                            id="name" 
                                            name="name" 
                                            className="col-span-3" 
                                            required 
                                            value={addForm.name}
                                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="categoryId" className="text-right">Category</Label>
                                        <div className="col-span-3">
                                            <Select 
                                                name="categoryId" 
                                                value={addForm.categoryId}
                                                onValueChange={(val) => setAddForm({ ...addForm, categoryId: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="unit" className="text-right">Unit</Label>
                                        <div className="col-span-3">
                                            <Select 
                                                name="unit" 
                                                value={addForm.unit}
                                                onValueChange={(val) => setAddForm({ ...addForm, unit: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pcs">Pcs (Pieces)</SelectItem>
                                                    <SelectItem value="kg">Kg (Kilograms)</SelectItem>
                                                    <SelectItem value="ltr">Ltr (Liter)</SelectItem>
                                                    <SelectItem value="ctn">Ctn (Carton)</SelectItem>
                                                    <SelectItem value="box">Box</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {(addForm.unit === 'kg' || addForm.unit === 'ltr') && (
                                        <div className="grid grid-cols-4 items-center gap-4 bg-muted/40 p-4 rounded-xl border-2 border-primary/10 transition-all duration-300">
                                            <div className="col-span-4 flex items-center gap-3 mb-2">
                                                <input 
                                                    type="checkbox" 
                                                    id="useBulkCalc"
                                                    checked={addForm.useBulkCalc}
                                                    onChange={(e) => setAddForm({ ...addForm, useBulkCalc: e.target.checked })}
                                                    className="w-5 h-5 rounded border-primary accent-primary cursor-pointer"
                                                />
                                                <Label htmlFor="useBulkCalc" className="font-black text-primary cursor-pointer select-none">
                                                    {addForm.unit === 'kg' ? 'BAG / BULK CALCULATOR' : 'TANK / CAN CALCULATOR'}
                                                </Label>
                                            </div>
                                            
                                            {addForm.useBulkCalc && (
                                                <>
                                                    <div className="col-span-4 grid grid-cols-3 gap-3">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                                                                {addForm.unit === 'kg' ? 'Num Bags' : 'Num Tanks/Cans'}
                                                            </Label>
                                                            <Input 
                                                                type="number" 
                                                                placeholder={addForm.unit === 'kg' ? "e.g. 50" : "e.g. 10"}
                                                                className="h-9 focus-visible:ring-primary"
                                                                value={addForm.numBags || ""}
                                                                onChange={(e) => setAddForm({ ...addForm, numBags: parseInt(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                                                                {addForm.unit === 'kg' ? 'Weight / Bag' : 'Liter / Tank'}
                                                            </Label>
                                                            <Input 
                                                                type="number" 
                                                                placeholder={addForm.unit === 'kg' ? "e.g. 25" : "e.g. 20"}
                                                                className="h-9 focus-visible:ring-primary"
                                                                value={addForm.piecesPerBag || ""}
                                                                onChange={(e) => setAddForm({ ...addForm, piecesPerBag: parseInt(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Cost / Bag ($)</Label>
                                                            <Input 
                                                                type="number" 
                                                                step="0.01"
                                                                placeholder="e.g. 45"
                                                                className="h-9 focus-visible:ring-primary"
                                                                value={addForm.costPerBag || ""}
                                                                onChange={(e) => setAddForm({ ...addForm, costPerBag: parseFloat(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="col-span-4 text-[10px] text-primary/60 italic font-medium mt-1 bg-primary/5 p-2 rounded-md border border-primary/10">
                                                        Calculated: <strong>{(addForm.numBags * addForm.piecesPerBag).toFixed(2)} {addForm.unit === 'kg' ? 'Kg' : 'Litre'}</strong> total at <strong>${((addForm.costPerBag || 0) / (addForm.piecesPerBag || 1)).toFixed(2)}</strong> per {addForm.unit === 'kg' ? 'Kg' : 'Litre'}.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {/* Cost entry — smart: per-carton when tracking cartons, else per-piece */}
                                    {addForm.trackCartons && addForm.unit !== 'kg' ? (
                                        <>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="costPerCarton" className="text-right">Cost / Ctn ($)</Label>
                                                <div className="col-span-3 space-y-0.5">
                                                    <Input
                                                        id="costPerCarton"
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="e.g. 24"
                                                        value={addForm.costPerCarton || ""}
                                                        onChange={(e) => {
                                                            const cpc = parseFloat(e.target.value) || 0;
                                                            const cpp = addForm.piecesPerCarton > 0 ? cpc / addForm.piecesPerCarton : 0;
                                                            setAddForm({ ...addForm, costPerCarton: cpc, costPrice: parseFloat(cpp.toFixed(4)) });
                                                        }}
                                                    />
                                                    {addForm.piecesPerCarton > 0 && addForm.costPerCarton > 0 && (
                                                        <p className="text-[10px] text-primary font-black">
                                                            Cost/Pcs: ${(addForm.costPerCarton / addForm.piecesPerCarton).toFixed(4)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right text-xs text-muted-foreground uppercase font-bold">Total Val</Label>
                                                <div className="col-span-3 text-sm font-black text-primary">
                                                    ${(addForm.cartons * addForm.costPerCarton).toFixed(2)}
                                                    <span className="text-[10px] font-normal text-muted-foreground ml-1">
                                                        ({addForm.cartons} ctns × ${addForm.costPerCarton}/ctn)
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="costPrice" className="text-right">Unit Cost ($)</Label>
                                                <Input
                                                    id="costPrice"
                                                    name="costPrice"
                                                    type="number"
                                                    step="0.01"
                                                    className="col-span-3"
                                                    required
                                                    value={addForm.costPrice || ""}
                                                    onChange={(e) => setAddForm({ ...addForm, costPrice: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right text-xs text-muted-foreground uppercase font-bold">Total Val</Label>
                                                <div className="col-span-3 text-sm font-black text-primary">
                                                    {(() => {
                                                        const totalStock = addForm.trackBags && addForm.unit !== 'kg'
                                                            ? (addForm.bags * addForm.piecesPerBag) + addForm.loosePieces
                                                            : addForm.stock;
                                                        return `$${(totalStock * addForm.costPrice).toFixed(2)}`;
                                                    })()}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {addForm.unit !== 'kg' && (
                                        <>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Track Cartons?</Label>
                                                <div className="col-span-3 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300"
                                                        checked={addForm.trackCartons}
                                                        onChange={(e) => setAddForm({ ...addForm, trackCartons: e.target.checked, trackBags: false })}
                                                    />
                                                    <span className="text-sm text-muted-foreground">Yes, track by cartons</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Track Bags?</Label>
                                                <div className="col-span-3 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300"
                                                        checked={addForm.trackBags}
                                                        onChange={(e) => setAddForm({ ...addForm, trackBags: e.target.checked, trackCartons: false })}
                                                    />
                                                    <span className="text-sm text-muted-foreground">Yes, track by bags (e.g. Bag to Pcs)</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {addForm.trackCartons && addForm.unit !== 'kg' ? (
                                        <>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="piecesPerCarton" className="text-right">Pcs / Carton</Label>
                                                <Input
                                                    id="piecesPerCarton"
                                                    type="number"
                                                    className="col-span-3"
                                                    required={addForm.trackCartons}
                                                    value={addForm.piecesPerCarton || ""}
                                                    onChange={(e) => setAddForm({ ...addForm, piecesPerCarton: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="cartons" className="text-right">Cartons</Label>
                                                <Input
                                                    id="cartons"
                                                    type="number"
                                                    className="col-span-3"
                                                    required={addForm.trackCartons}
                                                    value={addForm.cartons || ""}
                                                    onChange={(e) => setAddForm({ ...addForm, cartons: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="loosePieces" className="text-right">Loose Pcs</Label>
                                                <Input
                                                    id="loosePieces"
                                                    type="number"
                                                    className="col-span-3"
                                                    value={addForm.loosePieces || ""}
                                                    onChange={(e) => setAddForm({ ...addForm, loosePieces: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </>
                                    ) : addForm.trackBags && addForm.unit !== 'kg' ? (
                                        <>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="piecesPerBag" className="text-right">Pcs / Bag</Label>
                                                <Input
                                                    id="piecesPerBag"
                                                    type="number"
                                                    className="col-span-3"
                                                    required={addForm.trackBags}
                                                    value={addForm.piecesPerBag || ""}
                                                    onChange={(e) => setAddForm({ ...addForm, piecesPerBag: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="bags" className="text-right">Bags</Label>
                                                <Input
                                                    id="bags"
                                                    type="number"
                                                    className="col-span-3"
                                                    required={addForm.trackBags}
                                                    value={addForm.bags || ""}
                                                    onChange={(e) => setAddForm({ ...addForm, bags: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="loosePieces" className="text-right">Loose Pcs</Label>
                                                <Input
                                                    id="loosePieces"
                                                    type="number"
                                                    className="col-span-3"
                                                    value={addForm.loosePieces || ""}
                                                    onChange={(e) => setAddForm({ ...addForm, loosePieces: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="stock" className="text-right">Total {addForm.unit === 'kg' ? 'Kg' : 'Pcs'}</Label>
                                            <Input
                                                id="stock"
                                                name="stock"
                                                type="number"
                                                step={addForm.unit === 'kg' ? "0.01" : "1"}
                                                className="col-span-3"
                                                required={(!addForm.trackCartons && !addForm.trackBags) || addForm.unit === 'kg'}
                                                value={addForm.stock || ""}
                                                onChange={(e) => setAddForm({ ...addForm, stock: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="price" className="text-right">Selling Price ($)</Label>
                                        <div className="col-span-3 space-y-1">
                                            <Input 
                                                id="price" 
                                                name="price" 
                                                type="number" 
                                                step="0.01" 
                                                required 
                                                value={addForm.price || ""}
                                                onChange={(e) => setAddForm({ ...addForm, price: parseFloat(e.target.value) || 0 })}
                                            />
                                        {addForm.costPrice > 0 && (
                                            <div className="space-y-1.5 pt-0.5">
                                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Suggested prices — click to apply:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {[10, 20, 30, 50].map(margin => {
                                                        const suggested = parseFloat((addForm.costPrice * (1 + margin / 100)).toFixed(2));
                                                        const isSelected = addForm.price === suggested;
                                                        return (
                                                            <button
                                                                key={margin}
                                                                type="button"
                                                                onClick={() => setAddForm({ ...addForm, price: suggested })}
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-black border transition-all ${
                                                                    isSelected
                                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                                        : 'border-primary/40 text-primary hover:bg-primary/10'
                                                                }`}
                                                            >
                                                                +{margin}% = ${suggested}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">Cost/pcs: <span className="font-bold">${addForm.costPrice.toFixed(4)}</span></p>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4 border-t pt-4">
                                        <div className="col-span-1">
                                            <Label className="text-right flex flex-col">
                                                <span>Wholesale</span>
                                                <span className="text-[10px] text-muted-foreground">(Optional)</span>
                                            </Label>
                                        </div>
                                        <div className="col-span-3 grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="wholesalePrice" className="text-[10px] uppercase font-bold">Wholesale Price</Label>
                                                <Input 
                                                    id="wholesalePrice" 
                                                    type="number" 
                                                    step="0.01" 
                                                    placeholder="0.00"
                                                    value={addForm.wholesalePrice || ""}
                                                    onChange={(e) => setAddForm({ ...addForm, wholesalePrice: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="minWholesaleQty" className="text-[10px] uppercase font-bold">Min Qty</Label>
                                                <Input 
                                                    id="minWholesaleQty" 
                                                    type="number" 
                                                    step="1" 
                                                    placeholder="e.g. 10"
                                                    value={addForm.minWholesaleQty || ""}
                                                    onChange={(e) => setAddForm({ ...addForm, minWholesaleQty: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="p-6 pt-2">
                                    <Button type="submit" className="w-full sm:w-auto">Save Product</Button>
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
                        placeholder="Search products..."
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">Loading products...</TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">No products found.</TableCell>
                            </TableRow>
                        ) : filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium text-sm">
                                    <button 
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            fetchStockLogs(product.id);
                                            setIsDetailOpen(true);
                                        }}
                                        className="hover:underline text-left font-bold text-primary transition-all active:scale-95"
                                    >
                                        {product.name}
                                    </button>
                                </TableCell>
                                <TableCell className="text-sm">{product.category?.name || "Uncategorized"}</TableCell>
                                <TableCell className="text-sm">${product.sellingPrice}</TableCell>
                                <TableCell className="text-xs uppercase font-bold text-muted-foreground">{product.unit || "pcs"}</TableCell>
                                <TableCell className="text-sm">
                                    {(() => {
                                        const stock = currentBranchId 
                                            ? product.inventoryLevels?.find((il: any) => il.branchId === currentBranchId)?.stockQuantity || 0
                                            : product.stockQuantity;
                                        
                                        if (product.unit === 'kg') {
                                            return (
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{stock} Kg</span>
                                                    {product.piecesPerBag && product.piecesPerBag > 0 && (
                                                        <span className="text-[10px] text-primary font-black uppercase tracking-tighter">
                                                            {Math.floor(stock / product.piecesPerBag)} Bags, {(stock % product.piecesPerBag).toFixed(2)} Kg
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        } else if (product.piecesPerCarton) {
                                            return (
                                                <div className="flex flex-col">
                                                    <span>{Math.floor(stock / product.piecesPerCarton)} Ctns</span>
                                                    <span className="text-[10px] text-muted-foreground">{stock % product.piecesPerCarton} Pcs loose</span>
                                                </div>
                                            );
                                        } else if (product.piecesPerBag) {
                                            return (
                                                <div className="flex flex-col">
                                                    <span>{Math.floor(stock / product.piecesPerBag)} Bags</span>
                                                    <span className="text-[10px] text-muted-foreground">{stock % product.piecesPerBag} Pcs loose</span>
                                                </div>
                                            );
                                        }
                                        return <span>{stock} {product.unit || "Pcs"}</span>;
                                    })()}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className="text-[10px] py-0 px-2 uppercase tracking-wide"
                                        variant={
                                            (currentBranchId 
                                                ? product.inventoryLevels?.find((il: any) => il.branchId === currentBranchId)?.stockQuantity || 0
                                                : product.stockQuantity) > 10
                                                ? "default"
                                                : (currentBranchId 
                                                    ? product.inventoryLevels?.find((il: any) => il.branchId === currentBranchId)?.stockQuantity || 0
                                                    : product.stockQuantity) > 0
                                                    ? "secondary"
                                                    : "destructive"
                                        }
                                    >
                                        {(currentBranchId 
                                            ? product.inventoryLevels?.find((il: any) => il.branchId === currentBranchId)?.stockQuantity || 0
                                            : product.stockQuantity) > 10 ? "In Stock" : (currentBranchId 
                                            ? product.inventoryLevels?.find((il: any) => il.branchId === currentBranchId)?.stockQuantity || 0
                                            : product.stockQuantity) > 0 ? "Low Stock" : "Out of Stock"}
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
                                            <DropdownMenuItem onClick={() => {
                                                setEditingProduct(product);
                                                setEditForm({
                                                    name: product.name,
                                                    categoryId: product.categoryId || "",
                                                    price: Number(product.sellingPrice) || 0,
                                                    barcode: product.barcode || "",
                                                    costPrice: Number(product.costPrice) || 0,
                                                    costPerCarton: product.piecesPerCarton ? Number(product.costPrice) * product.piecesPerCarton : 0,
                                                    trackCartons: !!product.piecesPerCarton,
                                                    cartons: product.piecesPerCarton ? Math.floor(product.stockQuantity / product.piecesPerCarton) : 0,
                                                    piecesPerCarton: product.piecesPerCarton || 0,
                                                    trackBags: !!product.piecesPerBag && product.unit !== 'kg',
                                                    bags: (product.piecesPerBag && product.unit !== 'kg') ? Math.floor(product.stockQuantity / product.piecesPerBag) : 0,
                                                    piecesPerBag: product.piecesPerBag || 0,
                                                    loosePieces: (product.piecesPerCarton || (product.piecesPerBag && product.unit !== 'kg')) ? (product.stockQuantity % (product.piecesPerCarton || product.piecesPerBag)) : product.stockQuantity,
                                                    stock: product.stockQuantity || 0,
                                                    unit: product.unit || "pcs",
                                                    useBulkCalc: (product.unit === 'kg' || product.unit === 'ltr') && !!product.piecesPerBag,
                                                    numBags: ((product.unit === 'kg' || product.unit === 'ltr') && product.piecesPerBag) ? Math.floor(product.stockQuantity / product.piecesPerBag) : 0,
                                                    kgPerBag: (product.unit === 'kg' && product.piecesPerBag) ? product.piecesPerBag : 50, // This will be replaced by piecesPerBag for ltr
                                                    costPerBag: 0,
                                                    wholesalePrice: product.wholesalePrice || 0,
                                                    minWholesaleQty: product.minWholesaleQty || 0,
                                                });
                                                setIsEditOpen(true);
                                            }}>
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Product
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setAdjustingProduct(product);
                                                setIsAdjustOpen(true);
                                            }}>
                                                <PackagePlus className="mr-2 h-4 w-4" /> Adjust Stock
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setTransferForm({
                                                    productId: product.id,
                                                    fromBranchId: currentBranchId || "",
                                                    toBranchId: "",
                                                    quantity: 0,
                                                    note: ""
                                                });
                                                setIsTransferOpen(true);
                                            }}>
                                                <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Stock
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDeleteProduct(product.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                    {editingProduct && (
                        <form onSubmit={handleEditProduct} className="flex flex-col max-h-[90vh]">
                            <DialogHeader className="p-6 pb-2">
                                <DialogTitle>Edit Product</DialogTitle>
                                <DialogDescription>
                                    Update the details of your product.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto p-6 py-2">
                                <div className="grid gap-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-barcode" className="text-right">Barcode</Label>
                                    <Input 
                                        id="edit-barcode" 
                                        name="barcode" 
                                        value={editForm.barcode} 
                                        onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                                        className="col-span-3" 
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">Name</Label>
                                    <Input 
                                        id="edit-name" 
                                        name="name" 
                                        value={editForm.name} 
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="col-span-3" 
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-categoryId" className="text-right">Category</Label>
                                    <div className="col-span-3">
                                        <Select 
                                            name="categoryId" 
                                            value={editForm.categoryId}
                                            onValueChange={(val) => setEditForm({ ...editForm, categoryId: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-unit" className="text-right">Unit</Label>
                                    <div className="col-span-3">
                                        <Select 
                                            name="unit" 
                                            value={editForm.unit}
                                            onValueChange={(val) => setEditForm({ ...editForm, unit: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pcs">Pcs (Pieces)</SelectItem>
                                                <SelectItem value="kg">Kg (Kilograms)</SelectItem>
                                                <SelectItem value="ltr">Ltr (Liter)</SelectItem>
                                                <SelectItem value="ctn">Ctn (Carton)</SelectItem>
                                                <SelectItem value="box">Box</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {(editForm.unit === 'kg' || editForm.unit === 'ltr') && (
                                    <div className="grid grid-cols-4 items-center gap-4 bg-muted/40 p-4 rounded-xl border-2 border-primary/10 transition-all duration-300">
                                        <div className="col-span-4 flex items-center gap-3 mb-2">
                                            <input 
                                                type="checkbox" 
                                                id="edit-useBulkCalc"
                                                checked={editForm.useBulkCalc}
                                                onChange={(e) => setEditForm({ ...editForm, useBulkCalc: e.target.checked })}
                                                className="w-5 h-5 rounded border-primary accent-primary cursor-pointer"
                                            />
                                            <Label htmlFor="edit-useBulkCalc" className="font-black text-primary cursor-pointer select-none">
                                                {editForm.unit === 'kg' ? 'BAG / BULK CALCULATOR' : 'TANK / CAN CALCULATOR'}
                                            </Label>
                                        </div>
                                        
                                        {editForm.useBulkCalc && (
                                            <>
                                                <div className="col-span-4 grid grid-cols-3 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                                                            {editForm.unit === 'kg' ? 'Num Bags' : 'Num Tanks/Cans'}
                                                        </Label>
                                                        <Input 
                                                            type="number" 
                                                            placeholder={editForm.unit === 'kg' ? "e.g. 50" : "e.g. 10"}
                                                            className="h-9 focus-visible:ring-primary"
                                                            value={editForm.numBags || ""}
                                                            onChange={(e) => setEditForm({ ...editForm, numBags: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">
                                                            {editForm.unit === 'kg' ? 'Weight / Bag' : 'Liter / Tank'}
                                                        </Label>
                                                        <Input 
                                                            type="number" 
                                                            placeholder={editForm.unit === 'kg' ? "e.g. 25" : "e.g. 20"}
                                                            className="h-9 focus-visible:ring-primary"
                                                            value={editForm.piecesPerBag || ""}
                                                            onChange={(e) => setEditForm({ ...editForm, piecesPerBag: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Cost / Bag ($)</Label>
                                                        <Input 
                                                            type="number" 
                                                            step="0.01"
                                                            placeholder="e.g. 45"
                                                            className="h-9 focus-visible:ring-primary"
                                                            value={editForm.costPerBag || ""}
                                                            onChange={(e) => setEditForm({ ...editForm, costPerBag: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="col-span-4 text-[10px] text-primary/60 italic font-medium mt-1 bg-primary/5 p-2 rounded-md border border-primary/10">
                                                    Calculated: <strong>{(editForm.numBags * editForm.kgPerBag).toFixed(2)} Kg</strong> total at <strong>${((editForm.costPerBag || 0) / (editForm.kgPerBag || 1)).toFixed(2)}</strong> per Kg.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                                {/* Cost entry — smart: per-carton when tracking cartons, else per-piece */}
                                {editForm.trackCartons && editForm.unit !== 'kg' ? (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-costPerCarton" className="text-right">Cost / Ctn ($)</Label>
                                            <div className="col-span-3 space-y-0.5">
                                                <Input
                                                    id="edit-costPerCarton"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="e.g. 24"
                                                    value={editForm.costPerCarton || ""}
                                                    onChange={(e) => {
                                                        const cpc = parseFloat(e.target.value) || 0;
                                                        const cpp = editForm.piecesPerCarton > 0 ? cpc / editForm.piecesPerCarton : 0;
                                                        setEditForm({ ...editForm, costPerCarton: cpc, costPrice: parseFloat(cpp.toFixed(4)) });
                                                    }}
                                                />
                                                {editForm.piecesPerCarton > 0 && editForm.costPerCarton > 0 && (
                                                    <p className="text-[10px] text-primary font-black">
                                                        Cost/Pcs: ${(editForm.costPerCarton / editForm.piecesPerCarton).toFixed(4)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right text-xs text-muted-foreground uppercase font-bold">Total Val</Label>
                                            <div className="col-span-3 text-sm font-black text-primary">
                                                ${(editForm.cartons * editForm.costPerCarton).toFixed(2)}
                                                <span className="text-[10px] font-normal text-muted-foreground ml-1">
                                                    ({editForm.cartons} ctns × ${editForm.costPerCarton}/ctn)
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-costPrice" className="text-right">Unit Cost ($)</Label>
                                            <Input
                                                id="edit-costPrice"
                                                name="costPrice"
                                                type="number"
                                                step="0.01"
                                                className="col-span-3"
                                                required
                                                value={editForm.costPrice || ""}
                                                onChange={(e) => setEditForm({ ...editForm, costPrice: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right text-xs text-muted-foreground uppercase font-bold">Total Val</Label>
                                            <div className="col-span-3 text-sm font-black text-primary">
                                                {(() => {
                                                    const totalStock = editForm.trackBags && editForm.unit !== 'kg'
                                                        ? (editForm.bags * editForm.piecesPerBag) + editForm.loosePieces
                                                        : editForm.stock;
                                                    return `$${(totalStock * editForm.costPrice).toFixed(2)}`;
                                                })()}
                                            </div>
                                        </div>
                                    </>
                                )}

                                    {editForm.unit !== 'kg' && (
                                        <>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Track Cartons?</Label>
                                                <div className="col-span-3 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300"
                                                        checked={editForm.trackCartons}
                                                        onChange={(e) => setEditForm({ ...editForm, trackCartons: e.target.checked, trackBags: false })}
                                                    />
                                                    <span className="text-sm text-muted-foreground">Yes, track by cartons</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Track Bags?</Label>
                                                <div className="col-span-3 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300"
                                                        checked={editForm.trackBags}
                                                        onChange={(e) => setEditForm({ ...editForm, trackBags: e.target.checked, trackCartons: false })}
                                                    />
                                                    <span className="text-sm text-muted-foreground">Yes, track by bags (e.g. Bag to Pcs)</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {editForm.trackCartons && editForm.unit !== 'kg' ? (
                                        <>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="edit-piecesPerCarton" className="text-right">Pcs / Carton</Label>
                                                <Input
                                                    id="edit-piecesPerCarton"
                                                    type="number"
                                                    className="col-span-3"
                                                    required={editForm.trackCartons}
                                                    value={editForm.piecesPerCarton || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, piecesPerCarton: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="edit-cartons" className="text-right">Cartons</Label>
                                                <Input
                                                    id="edit-cartons"
                                                    type="number"
                                                    className="col-span-3"
                                                    required={editForm.trackCartons}
                                                    value={editForm.cartons || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, cartons: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="edit-loosePieces" className="text-right">Loose Pcs</Label>
                                                <Input
                                                    id="edit-loosePieces"
                                                    type="number"
                                                    className="col-span-3"
                                                    value={editForm.loosePieces || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, loosePieces: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </>
                                    ) : editForm.trackBags && editForm.unit !== 'kg' ? (
                                        <>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="edit-piecesPerBag" className="text-right">Pcs / Bag</Label>
                                                <Input
                                                    id="edit-piecesPerBag"
                                                    type="number"
                                                    className="col-span-3"
                                                    required={editForm.trackBags}
                                                    value={editForm.piecesPerBag || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, piecesPerBag: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="edit-bags" className="text-right">Bags</Label>
                                                <Input
                                                    id="edit-bags"
                                                    type="number"
                                                    className="col-span-3"
                                                    required={editForm.trackBags}
                                                    value={editForm.bags || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, bags: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="edit-loosePieces" className="text-right">Loose Pcs</Label>
                                                <Input
                                                    id="edit-loosePieces"
                                                    type="number"
                                                    className="col-span-3"
                                                    value={editForm.loosePieces || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, loosePieces: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="edit-stock" className="text-right">Total {editForm.unit === 'kg' ? 'Kg' : 'Pcs'}</Label>
                                            <Input
                                                id="edit-stock"
                                                name="stock"
                                                type="number"
                                                step={editForm.unit === 'kg' ? "0.01" : "1"}
                                                className="col-span-3"
                                                required={(!editForm.trackCartons && !editForm.trackBags) || editForm.unit === 'kg'}
                                                value={editForm.stock || ""}
                                                onChange={(e) => setEditForm({ ...editForm, stock: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-price" className="text-right">Selling Price ($)</Label>
                                    <div className="col-span-3 space-y-1">
                                        <Input
                                            id="edit-price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            value={editForm.price || ""}
                                            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                        {editForm.costPrice > 0 && (
                                            <div className="space-y-1.5 pt-0.5">
                                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Suggested prices — click to apply:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {[10, 20, 30, 50].map(margin => {
                                                        const suggested = parseFloat((editForm.costPrice * (1 + margin / 100)).toFixed(2));
                                                        const isSelected = editForm.price === suggested;
                                                        return (
                                                            <button
                                                                key={margin}
                                                                type="button"
                                                                onClick={() => setEditForm({ ...editForm, price: suggested })}
                                                                className={`px-2 py-0.5 rounded-full text-[10px] font-black border transition-all ${
                                                                    isSelected
                                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                                        : 'border-primary/40 text-primary hover:bg-primary/10'
                                                                }`}
                                                            >
                                                                +{margin}% = ${suggested}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">Cost/pcs: <span className="font-bold">${editForm.costPrice.toFixed(4)}</span></p>
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4 border-t pt-4">
                                        <div className="col-span-1">
                                            <Label className="text-right flex flex-col">
                                                <span>Wholesale</span>
                                                <span className="text-[10px] text-muted-foreground">(Optional)</span>
                                            </Label>
                                        </div>
                                        <div className="col-span-3 grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="edit-wholesalePrice" className="text-[10px] uppercase font-bold">Wholesale Price</Label>
                                                <Input 
                                                    id="edit-wholesalePrice" 
                                                    type="number" 
                                                    step="0.01" 
                                                    placeholder="0.00"
                                                    value={editForm.wholesalePrice || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, wholesalePrice: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="edit-minWholesaleQty" className="text-[10px] uppercase font-bold">Min Qty</Label>
                                                <Input 
                                                    id="edit-minWholesaleQty" 
                                                    type="number" 
                                                    step="1" 
                                                    placeholder="e.g. 10"
                                                    value={editForm.minWholesaleQty || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, minWholesaleQty: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="p-6 pt-2">
                                <Button type="submit" className="w-full sm:w-auto">Update Product</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    {adjustingProduct && (
                        <form onSubmit={handleAdjustStock}>
                            <DialogHeader>
                                <DialogTitle>Adjust Stock</DialogTitle>
                                <DialogDescription>
                                    Adjust stock level for <strong>{adjustingProduct.name}</strong>.
                                    Current stock (Active Branch): {currentBranchId 
                                        ? adjustingProduct.inventoryLevels?.find((il: any) => il.branchId === currentBranchId)?.stockQuantity || 0
                                        : adjustingProduct.stockQuantity} {adjustingProduct.unit || 'pcs'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-6">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="adjustment" className="text-right">Change</Label>
                                    <Input
                                        id="adjustment"
                                        name="adjustment"
                                        type="number"
                                        placeholder="e.g. 10 or -5"
                                        className="col-span-3"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center italic">
                                    Enter a positive number to add stock, or negative to reduce it.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Complete Adjustment</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleTransferStock}>
                        <DialogHeader>
                            <DialogTitle>Transfer Stock</DialogTitle>
                            <DialogDescription>
                                Move inventory between branches.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <div className="space-y-2">
                                <Label>From Branch</Label>
                                <Select 
                                    value={transferForm.fromBranchId}
                                    onValueChange={(val) => setTransferForm({ ...transferForm, fromBranchId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select origin branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>To Branch</Label>
                                <Select 
                                    value={transferForm.toBranchId}
                                    onValueChange={(val) => setTransferForm({ ...transferForm, toBranchId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select destination branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id} disabled={b.id === transferForm.fromBranchId}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input 
                                    type="number" 
                                    required 
                                    value={transferForm.quantity || ""}
                                    onChange={(e) => setTransferForm({ ...transferForm, quantity: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Note (Optional)</Label>
                                <Input 
                                    placeholder="Reason for transfer"
                                    value={transferForm.note}
                                    onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Confirm Transfer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                    {selectedProduct && (
                        <div className="flex flex-col max-h-[90vh]">
                            <DialogHeader className="p-6 pb-2">
                                <DialogTitle className="flex items-center justify-between">
                                    <span>{selectedProduct.name}</span>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold px-2 py-0 border-primary/30 text-primary">{selectedProduct.unit || 'pcs'}</Badge>
                                </DialogTitle>
                                <DialogDescription>Product details and stock movement history.</DialogDescription>
                            </DialogHeader>
                            
                            <div className="flex-1 overflow-y-auto p-6 pt-2">
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-1 bg-muted/30 p-3 rounded-lg border border-primary/5">
                                        <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-wider">Total Global Stock</p>
                                        <p className="text-2xl font-black text-primary">{selectedProduct.stockQuantity} <span className="text-sm font-normal text-muted-foreground">{selectedProduct.unit || 'pcs'}</span></p>
                                    </div>
                                    <div className="space-y-1 bg-muted/30 p-3 rounded-lg border border-primary/5">
                                        <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-wider">Selling Price</p>
                                        <p className="text-2xl font-black text-primary">${selectedProduct.sellingPrice}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between border-b pb-1">
                                        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            Branch Stock Breakdown
                                        </h3>
                                    </div>
                                    <div className="rounded-xl border bg-card overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="h-8 text-[10px] font-black uppercase">Branch</TableHead>
                                                    <TableHead className="h-8 text-[10px] font-black uppercase">Stock Level</TableHead>
                                                    <TableHead className="h-8 text-[10px] font-black uppercase">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedProduct.inventoryLevels?.map((il: any) => (
                                                    <TableRow key={il.id}>
                                                        <TableCell className="py-2 text-xs font-bold">{il.branch?.name}</TableCell>
                                                        <TableCell className="py-2 text-xs font-black text-primary">{il.stockQuantity} {selectedProduct.unit}</TableCell>
                                                        <TableCell className="py-2">
                                                            <Badge variant={il.stockQuantity > 10 ? "default" : il.stockQuantity > 0 ? "outline" : "destructive"} className="text-[8px] py-0 px-1 font-black uppercase">
                                                                {il.stockQuantity > 10 ? "Good" : il.stockQuantity > 0 ? "Low" : "Out"}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!selectedProduct.inventoryLevels || selectedProduct.inventoryLevels.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center py-4 text-xs text-muted-foreground italic">No branch inventory recorded.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-1">
                                        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            Stock History Log
                                        </h3>
                                        <span className="text-[10px] text-muted-foreground italic">Last 50 movements</span>
                                    </div>

                                    <div className="rounded-xl border bg-card overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="h-8 text-[10px] font-black uppercase">Date</TableHead>
                                                    <TableHead className="h-8 text-[10px] font-black uppercase">Type</TableHead>
                                                    <TableHead className="h-8 text-[10px] font-black uppercase">Qty</TableHead>
                                                    <TableHead className="h-8 text-[10px] font-black uppercase">Balance</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {loadingLogs ? (
                                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">Loading history...</TableCell></TableRow>
                                                ) : stockLogs.length === 0 ? (
                                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground italic">No stock movements recorded yet.</TableCell></TableRow>
                                                ) : stockLogs.map((log) => (
                                                    <TableRow key={log.id} className="group transition-colors hover:bg-muted/30">
                                                        <TableCell className="py-2 text-[10px] font-medium text-muted-foreground">
                                                            {new Date(log.createdAt).toLocaleDateString()}
                                                            <br />
                                                            <span className="opacity-40">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <Badge 
                                                                variant="outline" 
                                                                className={`text-[9px] px-1 py-0 h-4 font-black border-none uppercase ${
                                                                    log.type === 'SALE' ? 'text-blue-500 bg-blue-500/5' : 
                                                                    log.type === 'PURCHASE' ? 'text-green-500 bg-green-500/5' : 
                                                                    'text-orange-500 bg-orange-500/5'
                                                                }`}
                                                            >
                                                                {log.type}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className={`py-2 text-xs font-black ${log.type === 'SALE' ? 'text-red-500' : 'text-green-600'}`}>
                                                            {log.type === 'SALE' || (log.type === 'ADJUSTMENT' && log.quantity < 0) ? '-' : '+'}{Math.abs(log.quantity)}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-[11px] font-bold text-primary/80">
                                                            {log.newStock}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                            
                            <DialogFooter className="p-4 border-t bg-muted/20">
                                <Button variant="secondary" size="sm" className="w-full text-xs font-bold" onClick={() => setIsDetailOpen(false)}>Close Activity Log</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
