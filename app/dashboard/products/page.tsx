"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, PackagePlus, Pencil, Trash2, Download } from "lucide-react";
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
import { productsApi, categoriesApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import BarcodeScanner from "@/components/barcode-scanner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { exportToExcel } from "@/lib/export-utils";

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

    const [addForm, setAddForm] = useState({
        name: "",
        categoryId: "",
        price: 0,
        barcode: "",
        costPrice: 0,
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
    });

    const [editForm, setEditForm] = useState({
        name: "",
        categoryId: "",
        price: 0,
        barcode: "",
        costPrice: 0,
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
        if (addForm.useBulkCalc && addForm.unit === 'kg') {
            const totalStock = (addForm.numBags || 0) * (addForm.kgPerBag || 0);
            const unitCost = addForm.kgPerBag > 0 ? (addForm.costPerBag || 0) / addForm.kgPerBag : 0;
            setAddForm(prev => ({
                ...prev,
                stock: totalStock,
                costPrice: parseFloat(unitCost.toFixed(2))
            }));
        }
    }, [addForm.useBulkCalc, addForm.numBags, addForm.kgPerBag, addForm.costPerBag, addForm.unit]);

    // Bulk calculation for Edit Form
    useEffect(() => {
        if (editForm.useBulkCalc && editForm.unit === 'kg') {
            const totalStock = (editForm.numBags || 0) * (editForm.kgPerBag || 0);
            const unitCost = editForm.kgPerBag > 0 ? (editForm.costPerBag || 0) / editForm.kgPerBag : 0;
            setEditForm(prev => ({
                ...prev,
                stock: totalStock,
                costPrice: parseFloat(unitCost.toFixed(2))
            }));
        }
    }, [editForm.useBulkCalc, editForm.numBags, editForm.kgPerBag, editForm.costPerBag, editForm.unit]);

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

    const handleExport = () => {
        const exportData = filteredProducts.map(p => ({
            Name: p.name,
            Category: p.category?.name || "Uncategorized",
            Price: p.sellingPrice,
            Stock: p.stockQuantity,
            Status: p.stockQuantity > 10 ? "In Stock" : p.stockQuantity > 0 ? "Low Stock" : "Out of Stock"
        }));
        exportToExcel(exportData, `Products_Inventory_${new Date().toISOString().split('T')[0]}`);
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
        const totalStock = trackCartons
            ? (addForm.cartons * addForm.piecesPerCarton) + addForm.loosePieces
            : addForm.stock;

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
                trackCartons: false, 
                cartons: 0, 
                piecesPerCarton: 0, 
                loosePieces: 0, 
                stock: 0, 
                unit: "pcs",
                useBulkCalc: false,
                numBags: 0,
                kgPerBag: 50,
                costPerBag: 0
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
        const totalStock = trackCartons
            ? (editForm.cartons * editForm.piecesPerCarton) + editForm.loosePieces
            : editForm.stock;

        const data = {
            name: editForm.name,
            categoryId: editForm.categoryId,
            barcode: editForm.barcode,
            costPrice: editForm.costPrice,
            sellingPrice: editForm.price,
            stockQuantity: totalStock,
            unit: editForm.unit,
            piecesPerCarton: trackCartons ? editForm.piecesPerCarton : null,
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
                trackCartons: false, 
                cartons: 0, 
                piecesPerCarton: 0, 
                loosePieces: 0, 
                stock: 0, 
                unit: "pcs",
                useBulkCalc: false,
                numBags: 0,
                kgPerBag: 50,
                costPerBag: 0
            }); // reset
            toast.success("Product updated successfully");
        } catch (error: any) {
            toast.error("Failed to update product: " + error.message);
        }
    };

    const handleAdjustStock = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const adjustment = parseInt(formData.get("adjustment") as string);
        const newStock = (adjustingProduct?.stockQuantity || 0) + adjustment;

        try {
            await productsApi.adjustStock(adjustingProduct.id, { stockQuantity: newStock });
            fetchProducts();
            setIsAdjustOpen(false);
            toast.success("Stock adjusted successfully");
        } catch (error: any) {
            toast.error("Failed to adjust stock: " + error.message);
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">
                        Manage your inventory and product listings.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsCameraOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleAddProduct}>
                                <DialogHeader>
                                    <DialogTitle>Add New Product</DialogTitle>
                                    <DialogDescription>
                                        Enter the details of the new product here. Click save when you're done.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
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
                                                    <SelectItem value="ctn">Ctn (Carton)</SelectItem>
                                                    <SelectItem value="box">Box</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {addForm.unit === 'kg' && (
                                        <div className="grid grid-cols-4 items-center gap-4 bg-muted/40 p-4 rounded-xl border-2 border-primary/10 transition-all duration-300">
                                            <div className="col-span-4 flex items-center gap-3 mb-2">
                                                <input 
                                                    type="checkbox" 
                                                    id="useBulkCalc"
                                                    checked={addForm.useBulkCalc}
                                                    onChange={(e) => setAddForm({ ...addForm, useBulkCalc: e.target.checked })}
                                                    className="w-5 h-5 rounded border-primary accent-primary cursor-pointer"
                                                />
                                                <Label htmlFor="useBulkCalc" className="font-black text-primary cursor-pointer select-none">BAG / BULK CALCULATOR</Label>
                                            </div>
                                            
                                            {addForm.useBulkCalc && (
                                                <>
                                                    <div className="col-span-4 grid grid-cols-3 gap-3">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Num Bags</Label>
                                                            <Input 
                                                                type="number" 
                                                                placeholder="e.g. 50"
                                                                className="h-9 focus-visible:ring-primary"
                                                                value={addForm.numBags || ""}
                                                                onChange={(e) => setAddForm({ ...addForm, numBags: parseInt(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Kg / Bag</Label>
                                                            <Input 
                                                                type="number" 
                                                                placeholder="e.g. 50"
                                                                className="h-9 focus-visible:ring-primary"
                                                                value={addForm.kgPerBag || ""}
                                                                onChange={(e) => setAddForm({ ...addForm, kgPerBag: parseInt(e.target.value) || 0 })}
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
                                                        Calculated: <strong>{(addForm.numBags * addForm.kgPerBag).toFixed(2)} Kg</strong> total at <strong>${((addForm.costPerBag || 0) / (addForm.kgPerBag || 1)).toFixed(2)}</strong> per Kg.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}
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
                                                const totalStock = addForm.trackCartons && addForm.unit !== 'kg'
                                                    ? (addForm.cartons * addForm.piecesPerCarton) + addForm.loosePieces
                                                    : addForm.stock;
                                                return `$${(totalStock * addForm.costPrice).toFixed(2)}`;
                                            })()}
                                        </div>
                                    </div>
                                    {addForm.unit !== 'kg' && (
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Track Cartons?</Label>
                                            <div className="col-span-3 flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300"
                                                    checked={addForm.trackCartons}
                                                    onChange={(e) => setAddForm({ ...addForm, trackCartons: e.target.checked })}
                                                />
                                                <span className="text-sm text-muted-foreground">Yes, track by cartons</span>
                                            </div>
                                        </div>
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
                                    ) : (
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="stock" className="text-right">Total {addForm.unit === 'kg' ? 'Kg' : 'Pcs'}</Label>
                                            <Input
                                                id="stock"
                                                name="stock"
                                                type="number"
                                                step={addForm.unit === 'kg' ? "0.01" : "1"}
                                                className="col-span-3"
                                                required={!addForm.trackCartons || addForm.unit === 'kg'}
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
                                            {(() => {
                                                const totalStock = addForm.trackCartons && addForm.unit !== 'kg'
                                                    ? (addForm.cartons * addForm.piecesPerCarton) + addForm.loosePieces
                                                    : addForm.stock;
                                                if (totalStock > 0 && addForm.costPrice > 0) {
                                                    const unitCost = addForm.costPrice; // It's already per unit now
                                                    const minPrice = unitCost * 1.2;
                                                    return (
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Unit Cost: ${unitCost.toFixed(2)} | Suggested Min Price (20% margin): <span className="text-primary font-bold">${minPrice.toFixed(2)}</span>
                                                        </p>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Save Product</Button>
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
                                <TableCell className="font-medium text-sm">{product.name}</TableCell>
                                <TableCell className="text-sm">{product.category?.name || "Uncategorized"}</TableCell>
                                <TableCell className="text-sm">${product.sellingPrice}</TableCell>
                                <TableCell className="text-xs uppercase font-bold text-muted-foreground">{product.unit || "pcs"}</TableCell>
                                <TableCell className="text-sm">
                                    {product.piecesPerCarton ? (
                                        <span>{Math.floor(product.stockQuantity / product.piecesPerCarton)} Ctns, {product.stockQuantity % product.piecesPerCarton} Pcs</span>
                                    ) : (
                                        <span>{product.stockQuantity} Pcs</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className="text-[10px] py-0 px-2 uppercase tracking-wide"
                                        variant={
                                            product.stockQuantity > 10
                                                ? "default"
                                                : product.stockQuantity > 0
                                                    ? "secondary"
                                                    : "destructive"
                                        }
                                    >
                                        {product.stockQuantity > 10 ? "In Stock" : product.stockQuantity > 0 ? "Low Stock" : "Out of Stock"}
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
                                                    trackCartons: !!product.piecesPerCarton,
                                                    cartons: product.piecesPerCarton ? Math.floor(product.stockQuantity / product.piecesPerCarton) : 0,
                                                    piecesPerCarton: product.piecesPerCarton || 0,
                                                    loosePieces: product.piecesPerCarton ? product.stockQuantity % product.piecesPerCarton : 0,
                                                    stock: product.stockQuantity || 0,
                                                    unit: product.unit || "pcs",
                                                    useBulkCalc: false,
                                                    numBags: 0,
                                                    kgPerBag: 50,
                                                    costPerBag: 0,
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
                <DialogContent className="sm:max-w-[425px]">
                    {editingProduct && (
                        <form onSubmit={handleEditProduct}>
                            <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                                <DialogDescription>
                                    Update the details of your product.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
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
                                                <SelectItem value="ctn">Ctn (Carton)</SelectItem>
                                                <SelectItem value="box">Box</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {editForm.unit === 'kg' && (
                                    <div className="grid grid-cols-4 items-center gap-4 bg-muted/40 p-4 rounded-xl border-2 border-primary/10 transition-all duration-300">
                                        <div className="col-span-4 flex items-center gap-3 mb-2">
                                            <input 
                                                type="checkbox" 
                                                id="edit-useBulkCalc"
                                                checked={editForm.useBulkCalc}
                                                onChange={(e) => setEditForm({ ...editForm, useBulkCalc: e.target.checked })}
                                                className="w-5 h-5 rounded border-primary accent-primary cursor-pointer"
                                            />
                                            <Label htmlFor="edit-useBulkCalc" className="font-black text-primary cursor-pointer select-none">BAG / BULK CALCULATOR</Label>
                                        </div>
                                        
                                        {editForm.useBulkCalc && (
                                            <>
                                                <div className="col-span-4 grid grid-cols-3 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Num Bags</Label>
                                                        <Input 
                                                            type="number" 
                                                            placeholder="e.g. 50"
                                                            className="h-9 focus-visible:ring-primary"
                                                            value={editForm.numBags || ""}
                                                            onChange={(e) => setEditForm({ ...editForm, numBags: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black uppercase text-muted-foreground px-1">Kg / Bag</Label>
                                                        <Input 
                                                            type="number" 
                                                            placeholder="e.g. 50"
                                                            className="h-9 focus-visible:ring-primary"
                                                            value={editForm.kgPerBag || ""}
                                                            onChange={(e) => setEditForm({ ...editForm, kgPerBag: parseInt(e.target.value) || 0 })}
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
                                            const totalStock = editForm.trackCartons && editForm.unit !== 'kg'
                                                ? (editForm.cartons * editForm.piecesPerCarton) + editForm.loosePieces
                                                : editForm.stock;
                                            return `$${(totalStock * editForm.costPrice).toFixed(2)}`;
                                        })()}
                                    </div>
                                </div>
                                {editForm.unit !== 'kg' && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Track Cartons?</Label>
                                        <div className="col-span-3 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300"
                                                checked={editForm.trackCartons}
                                                onChange={(e) => setEditForm({ ...editForm, trackCartons: e.target.checked })}
                                            />
                                            <span className="text-sm text-muted-foreground">Yes, track by cartons</span>
                                        </div>
                                    </div>
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
                                ) : (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="edit-stock" className="text-right">Total {editForm.unit === 'kg' ? 'Kg' : 'Pcs'}</Label>
                                        <Input
                                            id="edit-stock"
                                            name="stock"
                                            type="number"
                                            step={editForm.unit === 'kg' ? "0.01" : "1"}
                                            className="col-span-3"
                                            required={!editForm.trackCartons || editForm.unit === 'kg'}
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
                                        {(() => {
                                            const totalStock = editForm.trackCartons && editForm.unit !== 'kg'
                                                ? (editForm.cartons * editForm.piecesPerCarton) + editForm.loosePieces
                                                : editForm.stock;
                                            if (totalStock > 0 && editForm.costPrice > 0) {
                                                const unitCost = editForm.costPrice; // Per unit
                                                const minPrice = unitCost * 1.2;
                                                return (
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Unit Cost: ${unitCost.toFixed(2)} | Suggested Min Price (20% margin): <span className="text-primary font-bold">${minPrice.toFixed(2)}</span>
                                                    </p>
                                                );
                                            }
                                            return null;
                                        })()}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                                <Button type="submit">Update Product</Button>
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
                                    Current stock: {adjustingProduct.stockQuantity}
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
        </div>
    );
}
