"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiFetch, customersApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    customers: any[];
    selectedCustomerId: string;
    setSelectedCustomerId: (id: string) => void;
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
    isCheckingOut: boolean;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    addToCart: (product: any) => void;
    updateQuantity: (id: string, delta: number) => void;
    removeFromCart: (id: string) => void;
    handleCheckout: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cash");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        const activeId = (session?.user as any)?.activeBusinessId;
        const businessId = activeId || "cm7evm3030000m908qgeks2rj";

        if (businessId) {
            console.log("CartContext: Fetching customers for business:", businessId);
            customersApi.getAll(businessId)
                .then(data => {
                    // Logic to handle both direct arrays and object-wrapped responses
                    const list = Array.isArray(data) ? data : (data?.data || data?.customers || []);
                    console.log(`CartContext: Loaded ${list.length} customers`);
                    setCustomers(list);
                })
                .catch(err => {
                    console.error("CartContext: Customer fetch error:", err);
                    setCustomers([]);
                    // Silently fail to avoid interrupting POS flow, unless it's a critical error
                });
        }
    }, [session?.user]); // Depend on session object to re-run when auth completes

    const addToCart = useCallback((product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { id: product.id, name: product.name, price: parseFloat(product.sellingPrice), quantity: 1 }];
        });
        toast.info(`Added ${product.name} to cart`);
    }, []);

    const updateQuantity = useCallback((id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, quantity: item.quantity + delta };
            }
            return item;
        }).filter(item => item.quantity > 0));
    }, []);

    const removeFromCart = useCallback((id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    }, []);

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        if (paymentMethod === "Loan" && selectedCustomerId === "cash") {
            toast.error("Please select a customer for Loan payment");
            return;
        }

        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setIsCheckingOut(true);
        try {
            const saleData = {
                customerId: selectedCustomerId === "cash" ? null : selectedCustomerId,
                totalAmount,
                paymentMethod,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: Number(item.price)
                }))
            };

            await apiFetch("/sales", {
                method: 'POST',
                body: JSON.stringify(saleData)
            });

            setCart([]);
            toast.success("Checkout completed successfully!");
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error("Checkout failed");
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <CartContext.Provider value={{
            cart,
            setCart,
            customers,
            selectedCustomerId,
            setSelectedCustomerId,
            paymentMethod,
            setPaymentMethod,
            isCheckingOut,
            isCartOpen,
            setIsCartOpen,
            addToCart,
            updateQuantity,
            removeFromCart,
            handleCheckout
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
