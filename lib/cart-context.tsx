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
    unit: string;
}

interface CartContextType {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    customers: any[];
    selectedCustomerId: string;
    setSelectedCustomerId: (id: string) => void;
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
    discountPercentage: number;
    setDiscountPercentage: (discount: number) => void;
    exchangeRate: number;
    setExchangeRate: (rate: number) => void;
    paymentCurrency: "USD" | "SOS";
    setPaymentCurrency: (currency: "USD" | "SOS") => void;
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
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [exchangeRate, setExchangeRate] = useState(26000); // Default, will fetch
    const [paymentCurrency, setPaymentCurrency] = useState<"USD" | "SOS">("USD");
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        const activeId = (session?.user as any)?.activeBusinessId;
        const businessId = activeId || "cm7evm3030000m908qgeks2rj";

        if (businessId) {
            console.log("CartContext: Fetching customers for business:", businessId);
            customersApi.getAll(businessId)
                .then(data => {
                    const list = Array.isArray(data) ? data : (data?.data || data?.customers || []);
                    setCustomers(list);
                })
                .catch(err => {
                    console.error("CartContext: Customer fetch error:", err);
                    setCustomers([]);
                });

            // Fetch current exchange rate
            apiFetch('/inventory/exchange-rates')
                .then((rates: any) => {
                    const rate = rates.find((r: any) => r.fromCurrency === "USD" && r.toCurrency === "SOS");
                    if (rate) setExchangeRate(Number(rate.rate));
                })
                .catch(err => console.error("Failed to fetch exchange rate:", err));
        }
    }, [session?.user]);

    const addToCart = useCallback((product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                const newQty = existing.quantity + 1;
                const price = (product.wholesalePrice && newQty >= (product.minWholesaleQty || 0)) 
                    ? parseFloat(product.wholesalePrice) 
                    : parseFloat(product.sellingPrice);
                
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: newQty, price } : item
                );
            }
            
            const initialPrice = (product.wholesalePrice && 1 >= (product.minWholesaleQty || 0))
                ? parseFloat(product.wholesalePrice)
                : parseFloat(product.sellingPrice);

            return [...prev, { 
                id: product.id, 
                name: product.name, 
                price: initialPrice, 
                quantity: 1, 
                unit: product.unit || "pcs",
                // Store product info for future price re-calculation
                wholesalePrice: product.wholesalePrice,
                minWholesaleQty: product.minWholesaleQty,
                sellingPrice: product.sellingPrice
            } as any];
        });
        toast.info(`Added ${product.name} to cart`);
    }, []);

    const updateQuantity = useCallback((id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return item; // filter handle later

                // Re-calculate price based on new quantity
                const cartItem = item as any;
                let price = cartItem.price;
                if (cartItem.wholesalePrice) {
                    price = newQty >= (cartItem.minWholesaleQty || 0)
                        ? parseFloat(cartItem.wholesalePrice)
                        : parseFloat(cartItem.sellingPrice);
                }

                return { ...item, quantity: newQty, price };
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
            const discAmount = totalAmount * (discountPercentage / 100);
            const finalAmount = totalAmount - discAmount;

            const saleData = {
                customerId: selectedCustomerId === "cash" ? null : selectedCustomerId,
                totalAmount: finalAmount,
                paymentMethod,
                discountPercentage,
                paymentCurrency,
                exchangeRate: paymentCurrency === "SOS" ? exchangeRate : null,
                paidAmountShiling: paymentCurrency === "SOS" ? finalAmount * exchangeRate : null,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: Number(item.quantity),
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
            discountPercentage,
            setDiscountPercentage,
            exchangeRate,
            setExchangeRate,
            paymentCurrency,
            setPaymentCurrency,
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
