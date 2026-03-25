"use client";

import { CreditCard, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const invoices = [
    { id: "INV-2026-003", date: "Feb 01, 2026", amount: "$49.00", status: "Paid" },
    { id: "INV-2026-002", date: "Jan 01, 2026", amount: "$49.00", status: "Paid" },
    { id: "INV-2025-012", date: "Dec 01, 2025", amount: "$49.00", status: "Paid" },
];

export default function BillingPage() {
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRenewing, setIsRenewing] = useState(false);
    const [renewPlan, setRenewPlan] = useState("Pro Monthly");
    const [renewAmount, setRenewAmount] = useState("49");
    const [phone, setPhone] = useState("");
    const [gateway, setGateway] = useState("waafi");
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [pendingSubscriptionId, setPendingSubscriptionId] = useState<string | null>(null);

    const fetchSubscription = async () => {
        try {
            const { data, error } = await authClient.$fetch("/api/subscriptions/status");
            if (error) throw error;
            setBusiness(data);
        } catch (err) {
            console.error("Failed to fetch subscription:", err);
            toast.error("Failed to load subscription data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    const handleInitiatePayment = async () => {
        if (!phone) {
            toast.error("Please enter your phone number");
            return;
        }
        setIsRenewing(true);
        try {
            const { data, error } = await authClient.$fetch("/api/subscriptions/pay", {
                method: "POST",
                body: {
                    plan: renewPlan,
                    amount: renewAmount,
                    phone: phone,
                    gateway: gateway
                }
            }) as any;

            if (error) throw error;

            if (data.status === "PENDING") {
                setPaymentStatus("PENDING");
                setPendingSubscriptionId(data.subscriptionId);
                toast.info("Push notification sent! Please approve on your phone.");
            } else if (data.status === "SUCCESS") {
                toast.success("Subscription updated successfully!");
                fetchSubscription();
                setPaymentStatus(null);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Failed to initiate payment";
            toast.error(msg);
        } finally {
            setIsRenewing(false);
        }
    };

    const checkPaymentStatus = async () => {
        if (!pendingSubscriptionId) return;
        try {
            const { data, error } = await authClient.$fetch(`/api/subscriptions/verify/${pendingSubscriptionId}`) as any;
            if (error) throw error;

            if (data.status === "SUCCESS") {
                toast.success("Payment verified! Subscription active.");
                setPaymentStatus(null);
                setPendingSubscriptionId(null);
                fetchSubscription();
            } else if (data.status === "FAILED") {
                toast.error("Payment failed or rejected.");
                setPaymentStatus(null);
            } else {
                toast.info("Still waiting for approval...");
            }
        } catch (err) {
            toast.error("Failed to verify payment status");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentSub = business?.subscriptions?.[0];

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Billing & Subscriptions</h2>
                <p className="text-muted-foreground">
                    Manage your subscription plan and billing history.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/20 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Current Plan
                            <Badge className={
                                business?.subscriptionStatus === 'ACTIVE' 
                                    ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-500"
                            }>
                                {business?.subscriptionStatus || 'INACTIVE'}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            {currentSub 
                                ? `You are on the ${currentSub.plan} plan.` 
                                : "You don't have an active subscription."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold tracking-tight">
                                ${currentSub?.amount || "0"}
                            </span>
                            <span className="text-muted-foreground text-sm font-medium">/month</span>
                        </div>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited Products</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Multi-branch Support</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Priority 24/7 Support</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t p-4 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                            {business?.subscriptionExpiry 
                                ? `Expires: ${new Date(business.subscriptionExpiry).toLocaleDateString()}`
                                : "No expiry set"}
                        </p>
                        
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="default" size="sm">
                                    {business?.subscriptionStatus === 'ACTIVE' ? "Renew Plan" : "Activate Pro"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Subscription Renewal</DialogTitle>
                                    <DialogDescription>
                                        Upgrade or renew your subscription using SifaloPay.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="plan">Select Plan</Label>
                                        <Select value={renewPlan} onValueChange={(val) => {
                                            setRenewPlan(val);
                                            setRenewAmount(val.includes("Yearly") ? "499" : "49");
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a plan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pro Monthly">Pro Monthly ($49/mo)</SelectItem>
                                                <SelectItem value="Pro Yearly">Pro Yearly ($499/yr)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="gateway">Payment Method (Mobile Wallet)</Label>
                                        <Select value={gateway} onValueChange={setGateway}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gateway" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="waafi">ZAAD / Sahal (Waafi)</SelectItem>
                                                <SelectItem value="edahab">e-Dahab</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input 
                                            id="phone" 
                                            placeholder="e.g. 063xxxxxxx" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                        <p className="text-[10px] text-muted-foreground italic">
                                            A push notification will be sent to this number.
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    {paymentStatus === "PENDING" ? (
                                        <div className="flex flex-col w-full gap-2">
                                            <Button variant="outline" onClick={checkPaymentStatus} className="w-full">
                                                Check Approval Status
                                            </Button>
                                            <p className="text-xs text-center text-amber-600 animate-pulse">
                                                Waiting for your approval on your device...
                                            </p>
                                        </div>
                                    ) : (
                                        <Button 
                                            className="w-full" 
                                            onClick={handleInitiatePayment}
                                            disabled={isRenewing}
                                        >
                                            {isRenewing ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                            ) : (
                                                `Pay $${renewAmount} via SifaloPay`
                                            )}
                                        </Button>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>SifaloPay Integration</CardTitle>
                        <CardDescription>Your integrated mobile payment solution.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/10">
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">Mobile Wallet Enabled</p>
                                <p className="text-xs text-muted-foreground">ZAAD, e-Dahab, Sahal</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-amber-500/10 rounded-lg text-amber-600">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>Subscriptions are instant. Once approved on your phone, your service will be activated immediately.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subscription History</CardTitle>
                    <CardDescription>View your past subscription payments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plan</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Reference</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {business?.subscriptions?.map((sub: any) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.plan}</TableCell>
                                    <TableCell>{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>${sub.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={
                                            sub.paymentStatus === 'SUCCESS'
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : sub.paymentStatus === 'PENDING'
                                                ? "bg-amber-500/10 text-amber-500"
                                                : "bg-red-500/10 text-red-500"
                                        }>
                                            {sub.paymentStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground font-mono">
                                        {sub.id.slice(-8).toUpperCase()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!business?.subscriptions || business.subscriptions.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No subscription history found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
