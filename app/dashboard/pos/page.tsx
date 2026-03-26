"use client";

import { useState, useEffect } from "react";
import { Search, Plus, LayoutGrid, Tags, ShoppingCart, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { productsApi, categoriesApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { useBranch } from "@/lib/branch-context";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import BarcodeScanner from "@/components/barcode-scanner";

export default function POSPage() {
    const { data: session } = useSession();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const { isCartOpen, setIsCartOpen, addToCart, cart } = useCart();
    const { currentBranchId, currentBranch } = useBranch();

    // Shared beep sound for every item added (click or scan)
    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.12);
        } catch { /* silence audio errors */ }
    };

    const businessId = (session?.user as any)?.activeBusinessId;

    useEffect(() => {
        if (businessId) {
            fetchProducts();
            fetchCategories();
        }
    }, [businessId, currentBranchId]);

    const fetchCategories = async () => {
        try {
            const data = await categoriesApi.getAll(businessId);
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await productsApi.getAll(businessId, currentBranchId);
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.barcode && p.barcode.includes(searchQuery));

        const matchesCategory =
            selectedCategory === "All" || p.category?.name === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Barcode Scanning Logic
    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();

        const playBeep = () => {
            try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.1);
            } catch (e) {
                console.warn("Audio feedback failed:", e);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input field (except if it's the specific barcode scanner)
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const currentTime = Date.now();
            
            // If the time between keypresses is too long, it's likely manual typing, not a scanner
            if (currentTime - lastKeyTime > 50) {
                buffer = "";
            }
            
            lastKeyTime = currentTime;

            if (e.key === "Enter") {
                if (buffer.length > 2) {
                    const product = products.find(p => p.barcode === buffer);
                    if (product) {
                        const il = currentBranchId 
                            ? product.inventoryLevels?.find((il: any) => il.branchId === currentBranchId)
                            : null;
                        const stock = Number(il ? il.stockQuantity : (product.stockQuantity || 0));
                        
                        if (stock > 0) {
                            addToCart(product);
                            playBeep();
                        } else {
                            toast.error(`${product.name} is out of stock`);
                        }
                    } else {
                        toast.error(`No product found with barcode: ${buffer}`);
                    }
                }
                buffer = "";
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [products, addToCart]);

    return (
        <div className="flex flex-col h-full min-h-0 bg-background animate-in fade-in duration-500">

            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex flex-1 items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black uppercase tracking-tight">POS Terminal</h1>
                        {currentBranch && (
                            <div className="flex items-center gap-1.5 -mt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                    {currentBranch.name} 
                                    {currentBranch.isMain && <span className="ml-1 text-[8px] bg-primary/10 text-primary px-1 rounded">Main</span>}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="lg:hidden relative"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </Button>
                        <ModeToggle />
                    </div>
                </div>
            </header>

            {/* Content Wrapper */}
            <div className="flex flex-col flex-1 min-h-0">

                {/* Search + Categories */}
                <div className="px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 space-y-4 shrink-0">

                    {/* Search */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products by name, category or barcode..."
                                className="pl-10 h-11 bg-muted/50 border-none rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className={cn("h-11 w-11 rounded-xl transition-colors", isCameraOpen && "bg-primary text-primary-foreground")}
                            onClick={() => setIsCameraOpen(!isCameraOpen)}
                        >
                            <Camera className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Camera Scanner Modal */}
                    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                        <DialogContent className="sm:max-w-md border-none bg-background/80 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
                            <DialogHeader className="p-6 pb-2">
                                <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
                                    <Camera className="h-5 w-5" />
                                    Scan Product
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                    Point camera at product barcode
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="p-6">
                                <BarcodeScanner 
                                    onScanSuccess={(text: string) => {
                                        // Simple throttling to prevent rapid duplicate scans
                                        const now = Date.now();
                                        if ((window as any)._lastScanTime && now - (window as any)._lastScanTime < 2000) {
                                            return;
                                        }
                                        (window as any)._lastScanTime = now;

                                        const product = products.find(p => p.barcode === text);
                                        if (product) {
                                            const il = currentBranchId 
                                                ? product.inventoryLevels?.find((il: any) => il.branchId === currentBranchId)
                                                : null;
                                            const stock = Number(il ? il.stockQuantity : (product.stockQuantity || 0));

                                            if (stock > 0) {
                                                addToCart(product);
                                                playBeep();
                                                toast.success(`Scanned: ${product.name}`, {
                                                    description: "Added to cart successfully",
                                                    position: "bottom-center",
                                                });
                                                // Continuous scanning: We stay open!
                                            } else {
                                                toast.error(`${product.name} is out of stock`);
                                            }
                                        } else {
                                            toast.error(`Unrecognized barcode: ${text}`);
                                        }
                                    }}
                                />
                            </div>
                            <div className="p-4 bg-muted/30 border-t border-border flex justify-center">
                                <Button variant="ghost" onClick={() => setIsCameraOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-8">
                                    Cancel Scanning
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Categories */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory("All")}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[80px] h-[80px] rounded-xl transition-all gap-1.5 border shrink-0",
                                selectedCategory === "All"
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg"
                                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                            )}
                        >
                            <LayoutGrid className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                                All Items
                            </span>
                        </button>

                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[80px] h-[80px] rounded-xl transition-all gap-1.5 border shrink-0",
                                    selectedCategory === cat.name
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg"
                                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                                )}
                            >
                                <Tags className="h-5 w-5" />
                                <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[70px]">
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Scroll Section */}
                <ScrollArea className="flex-1 min-h-0 px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-4 pb-6">
                        {filteredProducts.map((product) => {
                            const il = currentBranchId 
                                ? product.inventoryLevels?.find((il: any) => il.branchId === currentBranchId)
                                : null;
                            const stock = Number(il ? il.stockQuantity : (product.stockQuantity || 0));

                            return (
                            <div
                                key={product.id}
                                onClick={() => {
                                    if (stock > 0) {
                                        addToCart(product);
                                        playBeep();
                                    }
                                }}
                                className={cn(
                                    "group relative flex flex-col bg-card hover:bg-accent/50 transition-all rounded-2xl cursor-pointer shadow-sm hover:shadow-xl border border-border/50 hover:border-primary/20 active:scale-[0.98] duration-300",
                                    stock === 0 &&
                                    "opacity-60 cursor-not-allowed grayscale"
                                )}
                            >
                                <div className="aspect-[4/3] relative flex items-center justify-center bg-muted/30">
                                    <span className="text-6xl font-black text-muted-foreground/10 uppercase select-none">
                                        {product.name.charAt(0)}
                                    </span>

                                    {/* Stock Badges */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                                        {stock < 10 &&
                                            stock > 0 && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[8px] font-black uppercase"
                                                >
                                                    Only {stock} Ready
                                                </Badge>
                                            )}

                                        {stock === 0 && (
                                            <Badge
                                                variant="destructive"
                                                className="text-[8px] font-black uppercase"
                                            >
                                                Sold Out
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Hover Icon */}
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg">
                                            <Plus className="h-6 w-6 stroke-[3]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col gap-1">
                                    <span className="text-[9px] text-primary/60 font-black uppercase tracking-[0.1em]">
                                        {product.category?.name || "General"}
                                    </span>

                                    <h3 className="font-bold text-sm line-clamp-1">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xl font-black">
                                            ${product.sellingPrice}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground">
                                            Stock: {stock}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                </ScrollArea>
            </div>

            {/* Mobile FAB Camera Button - Moved to bottom-right fixed */}
            <div className="fixed bottom-10 right-6 z-50 lg:hidden pointer-events-none">
                <Button
                    size="icon"
                    className="h-16 w-16 rounded-full shadow-2xl pointer-events-auto bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-background"
                    onClick={() => setIsCameraOpen(true)}
                >
                    <Camera className="h-8 w-8" />
                </Button>
            </div>
        </div>
    );
}