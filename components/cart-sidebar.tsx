"use client";

import React from "react";
import {
    ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, User,
    CheckCircle2, Laptop, HandCoins, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function CartSidebar() {
    const pathname = usePathname();
    const isPOS = pathname === "/dashboard/pos";
    const {
        cart,
        setCart,
        customers,
        selectedCustomerId,
        setSelectedCustomerId,
        paymentMethod,
        setPaymentMethod,
        discountPercentage,
        setDiscountPercentage,
        exchangeRate,
        paymentCurrency,
        setPaymentCurrency,
        isCheckingOut,
        updateQuantity,
        addToCart,
        removeFromCart,
        handleCheckout,
        isCartOpen,
        setIsCartOpen
    } = useCart();

    if (!isPOS) return null;

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isCartOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsCartOpen(false)}
                />
            )}
            
            <div className={cn(
                "fixed inset-y-0 right-0 z-[50] lg:relative lg:z-0",
                "w-full sm:w-[420px] flex flex-col h-full bg-card border-l border-border p-5 shadow-xl overflow-hidden transition-transform duration-300",
                isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
                !isPOS && "hidden"
            )}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="lg:hidden rounded-full h-8 w-8" 
                            onClick={() => setIsCartOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-black text-primary leading-none uppercase tracking-tight">Checkout Order</h2>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1.5 block">Invoice: #ORD-{Math.floor(Math.random() * 9000) + 1000}</span>
                        </div>
                    </div>
                <Button variant="ghost" size="icon" className="rounded-md hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground" onClick={() => { setCart([]); toast.error("Cart cleared"); }}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Cart Items */}
            <ScrollArea className="flex-1 -mx-2 px-2">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-25 gap-4 py-32 grayscale select-none">
                        <div className="h-20 w-20 rounded-md bg-primary/5 flex items-center justify-center animate-pulse">
                            <ShoppingCart className="h-8 w-8 text-primary/40" />
                        </div>
                        <p className="font-black text-[10px] uppercase tracking-[0.25em] text-primary/40 text-center">Empty Cart</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {cart.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 bg-background p-3 rounded-none border border-border shadow-sm hover:border-primary/20 transition-all group">
                                <div className="h-10 w-10 rounded-md bg-primary/5 flex items-center justify-center shrink-0 border border-transparent group-hover:border-primary/20 transition-colors">
                                    <span className="font-black text-primary/60 text-base group-hover:text-primary">{item.name.charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate leading-none mb-1">{item.name}</p>
                                    <p className="text-[10px] text-primary font-black">${item.price}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-1 bg-primary/5 p-0.5 rounded-md border border-transparent">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                                                className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-background hover:shadow-sm transition-all text-primary/40 hover:text-destructive text-[10px]"
                                                title={item.quantity === 1 ? "Remove from cart" : "Decrease quantity"}
                                            >
                                                <Minus className="h-2.5 w-2.5" />
                                            </button>
                                            <span className="text-[10px] font-black w-7 text-center text-primary">{item.quantity}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                                                className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-background hover:shadow-sm transition-all text-primary/40 hover:text-primary"
                                            >
                                                <Plus className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                            className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                            title="Remove item"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    
                                    {/* Fractional Quantity Presets for KG */}
                                    {item.unit?.toLowerCase() === "kg" && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {[
                                                { label: "1kg", val: 1 },
                                                { label: "1/2", val: 0.5 },
                                                { label: "1/4", val: 0.25 },
                                                { label: "1/8", val: 0.125 }
                                            ].map((preset) => (
                                                <button
                                                    key={preset.label}
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: preset.val } : i));
                                                    }}
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-sm text-[8px] font-black uppercase transition-colors border",
                                                        item.quantity === preset.val 
                                                            ? "bg-primary text-primary-foreground border-primary" 
                                                            : "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10"
                                                    )}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                            <div className="flex items-center gap-1 ml-auto">
                                                <Input 
                                                    type="number" 
                                                    step="0.01" 
                                                    className="h-5 w-12 text-[8px] p-0 font-bold text-center bg-transparent border-primary/20" 
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) {
                                                            setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: val } : i));
                                                        }
                                                    }}
                                                />
                                                <span className="text-[8px] font-bold text-muted-foreground uppercase">kg</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Footer Section */}
            <div className="mt-6 pt-5 border-t border-border">
                <div className="space-y-4">
                    {/* Customer */}
                    <div className="space-y-2">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] block ml-0.5">Customer</Label>
                        <div className="bg-background rounded-none border border-border shadow-sm focus-within:border-primary/30 transition-all overflow-hidden">
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger className="w-full bg-transparent border-none shadow-none h-11 px-4 focus:ring-0 flex items-center gap-3">
                                    <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <SelectValue placeholder="Select Customer" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-none shadow-2xl border-border bg-card w-[var(--radix-select-trigger-width)] max-h-60 overflow-y-auto">
                                    <SelectItem value="cash" className="font-bold text-xs uppercase tracking-tight py-3 focus:bg-primary/5">
                                        Walk-in Customer
                                    </SelectItem>
                                    <div className="h-px bg-border/50 mx-2 my-1" />
                                    {customers.length > 0 ? (
                                        customers.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="text-xs font-semibold py-3 cursor-pointer">
                                                {c.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest opacity-50">
                                            No Customers Found
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Totals & Discount */}
                    <div className="bg-primary/[0.02] p-4 rounded-none border border-primary/5 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span className="text-foreground font-black tracking-normal">$ {cartTotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">Discount (%)</span>
                            <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                className="h-7 w-20 text-[10px] font-black text-right p-1" 
                                value={discountPercentage} 
                                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                            />
                        </div>

                        <div className="flex justify-between items-center gap-4 pt-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">Pay In</span>
                            <div className="flex bg-muted rounded-md p-1 items-center gap-1">
                                <button 
                                    onClick={() => setPaymentCurrency("USD")}
                                    className={cn("px-2 py-0.5 text-[9px] font-black uppercase rounded shadow-sm transition-all", paymentCurrency === "USD" ? "bg-background text-primary" : "text-muted-foreground")}
                                >USD</button>
                                <button 
                                    onClick={() => setPaymentCurrency("SOS")}
                                    className={cn("px-2 py-0.5 text-[9px] font-black uppercase rounded shadow-sm transition-all", paymentCurrency === "SOS" ? "bg-background text-primary" : "text-muted-foreground")}
                                >SOS</button>
                            </div>
                        </div>

                        <Separator className="bg-border/50 my-1" />
                        
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-foreground uppercase tracking-[0.1em]">Payable</span>
                                {paymentCurrency === "SOS" && (
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
                                        Rate: 1 USD = {exchangeRate} SOS
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xl font-black text-primary leading-none">
                                    {paymentCurrency === "USD" 
                                        ? `$ ${(cartTotal * (1 - discountPercentage / 100)).toFixed(2)}`
                                        : `${Math.round((cartTotal * (1 - discountPercentage / 100)) * exchangeRate).toLocaleString()} SOS`
                                    }
                                </span>
                                {paymentCurrency === "SOS" && (
                                    <span className="text-[10px] font-black text-primary/40">
                                        $ {(cartTotal * (1 - discountPercentage / 100)).toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Selection */}
                    {(() => {
                        const isWalkIn = !selectedCustomerId || selectedCustomerId === 'cash';
                        return (
                            <div className="space-y-2">
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                        { id: 'Cash', label: 'Cash', icon: <Banknote className="h-3.5 w-3.5" /> },
                                        { id: 'ZAAD', label: 'ZAAD', icon: <CreditCard className="h-3.5 w-3.5" /> },
                                        { id: 'eDahab', label: 'Edahab', icon: <Laptop className="h-3.5 w-3.5" /> },
                                        { id: 'Loan', label: 'Loan', icon: <HandCoins className="h-3.5 w-3.5" />, requiresCustomer: true },
                                    ].map((p) => {
                                        const isDisabled = p.requiresCustomer && isWalkIn;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                disabled={isDisabled}
                                                title={isDisabled ? 'Select a customer to use Loan/Due' : undefined}
                                                onClick={() => !isDisabled && setPaymentMethod(p.id)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center py-2 rounded-none border transition-all gap-1 relative overflow-hidden group",
                                                    isDisabled
                                                        ? "opacity-30 cursor-not-allowed bg-muted border-border text-muted-foreground"
                                                        : paymentMethod === p.id
                                                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10"
                                                            : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/[0.02]"
                                                )}
                                            >
                                                <div className={cn("p-1 rounded-sm transition-colors", paymentMethod === p.id ? "bg-white/20" : "bg-primary/5 group-hover:bg-primary/10")}>
                                                    {p.icon}
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">{p.label}</span>
                                                {paymentMethod === p.id && <div className="absolute top-0 right-0 p-0.5"><CheckCircle2 className="h-2 w-2" /></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {isWalkIn && (
                                    <p className="text-[9px] text-muted-foreground font-semibold text-center">
                                        Select a customer to enable <span className="text-primary font-black">Loan / Due</span>
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    <Button
                        className="w-full h-12 rounded-none bg-primary text-primary-foreground text-xs font-black shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all disabled:opacity-50 uppercase tracking-[0.2em]"
                        disabled={cart.length === 0 || isCheckingOut}
                        onClick={handleCheckout}
                    >
                        {isCheckingOut ? (
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Wait...</span>
                            </div>
                        ) : (
                            <span>Place Order</span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    </>
);
}
