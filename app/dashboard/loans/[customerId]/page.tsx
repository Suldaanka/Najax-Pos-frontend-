"use client";

import { useState, useEffect } from "react";
import { Download, Search, ArrowLeft, HandCoins, ArrowUpRight, Plus, History } from "lucide-react";
import { exportToExcel } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { customersApi, apiFetch } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CustomerLoansPage() {
    const params = useParams();
    const customerId = params.customerId as string;
    const { data: session } = useSession();
    const [customer, setCustomer] = useState<any>(null);
    const [loans, setLoans] = useState<any[]>([]);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loanTypeFilter, setLoanTypeFilter] = useState<"ALL" | "PRODUCT" | "CREDIT">("ALL");

    const fetchData = async () => {
        if (!customerId || !session) return;
        try {
            const customerData = await customersApi.getOne(customerId);
            setCustomer(customerData);

            const allLoans = await apiFetch("/loans");
            const customerLoans = allLoans
                .filter((l: any) => l.customerId === customerId)
                .map((l: any) => ({
                    id: l.id,
                    total: l.totalAmount,
                    paid: l.paidAmount,
                    remaining: Number(l.totalAmount) - Number(l.paidAmount),
                    progress: Math.floor((Number(l.paidAmount) / Number(l.totalAmount)) * 100),
                    status: l.status,
                    due: l.dueDate ? new Date(l.dueDate).toLocaleDateString() : "No date",
                    nextPayment: l.nextPaymentDate ? new Date(l.nextPaymentDate).toLocaleDateString() : "Not scheduled",
                    items: l.items || [],
                    products: l.sale?.items?.map((item: any) => ({
                        name: item.product?.name,
                        quantity: item.quantity,
                        price: item.price
                    })) || []
                }));
            setLoans(customerLoans);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [customerId, session]);

    const handleExport = () => {
        const exportData = filteredLoans.map(l => ({
            Products: l.products.map((p: any) => `${p.name} (x${p.quantity})`).join(", ") || "Direct Credit",
            Total: l.total,
            Paid: l.paid,
            Remaining: l.remaining,
            Status: l.status,
            "Due Date": l.due,
            "Next Payment": l.nextPayment
        }));
        exportToExcel(exportData, `${customer?.name || "Customer"}_Loans_${new Date().toISOString().split('T')[0]}`);
    };

    const filteredLoans = loans.filter(l => {
        const matchesSearch = l.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.products.some((p: any) => (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()));

        const isProductLoan = l.products && l.products.length > 0;
        const matchesType = loanTypeFilter === "ALL" ||
            (loanTypeFilter === "PRODUCT" && isProductLoan) ||
            (loanTypeFilter === "CREDIT" && !isProductLoan);

        return matchesSearch && matchesType;
    });

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoan || !paymentAmount) return;

        try {
            await apiFetch(`/loans/${selectedLoan.id}/payments`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: parseFloat(paymentAmount),
                    nextPaymentDate: (e.target as any).nextPayment?.value || null
                })
            });
            setIsPaymentOpen(false);
            setPaymentAmount("");
            fetchData();
            toast.success("Payment recorded");
        } catch (error) {
            toast.error("Failed to record payment");
        }
    };

    const totalDebt = loans.reduce((acc, l) => acc + (l.status !== 'PAID' ? l.remaining : 0), 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/loans">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{customer?.name || "Loading..."}</h2>
                        <p className="text-muted-foreground">
                            Detailed loan history and payment tracking.
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-muted/50 p-4 rounded-xl border">
                    <div className="text-sm font-medium text-muted-foreground">Active Debt</div>
                    <div className="text-2xl font-bold text-destructive">${totalDebt.toFixed(2)}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border">
                    <div className="text-sm font-medium text-muted-foreground">Total Loans</div>
                    <div className="text-2xl font-bold">{loans.length}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border">
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div className="text-2xl font-bold text-muted-foreground">{customer?.phone || "N/A"}</div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search loans by product or status..."
                        className="pl-8 max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex bg-muted p-1 rounded-lg gap-1 border">
                    <Button
                        variant={loanTypeFilter === "ALL" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 text-xs font-semibold"
                        onClick={() => setLoanTypeFilter("ALL")}
                    >
                        All
                    </Button>
                    <Button
                        variant={loanTypeFilter === "PRODUCT" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 text-xs font-semibold"
                        onClick={() => setLoanTypeFilter("PRODUCT")}
                    >
                        Product Loans
                    </Button>
                    <Button
                        variant={loanTypeFilter === "CREDIT" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 text-xs font-semibold"
                        onClick={() => setLoanTypeFilter("CREDIT")}
                    >
                        Credit Loans
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Products</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Next Payment</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLoans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                    No loans found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLoans.map((loan) => (
                                <TableRow key={loan.id}>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                                            {loan.products.length > 0 ? (
                                                loan.products.map((p: any, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-[10px] py-0">
                                                        {p.name} (x{p.quantity})
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Direct Credit</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-primary">${Number(loan.total).toFixed(2)}</span>
                                            <span className="text-xs text-destructive font-semibold">Rem: ${loan.remaining.toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-[140px]">
                                        <div className="flex flex-col gap-1">
                                            <Progress value={loan.progress} className="h-1.5" />
                                            <span className="text-[9px] text-muted-foreground text-right font-black uppercase tracking-widest">{loan.progress}% paid</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className="text-[10px] px-1.5 py-0 font-bold"
                                            variant={loan.status === "PAID" ? "default" : "secondary"}
                                        >
                                            {loan.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-bold text-orange-600">{loan.nextPayment}</TableCell>
                                    <TableCell className="text-xs font-medium">{loan.due}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedLoan(loan);
                                                    setIsHistoryOpen(true);
                                                }}
                                            >
                                                History
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedLoan(loan);
                                                    setIsPaymentOpen(true);
                                                }}
                                                disabled={loan.status === "PAID"}
                                            >
                                                Record Payment
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleRecordPayment}>
                        <DialogHeader>
                            <DialogTitle>Record Payment</DialogTitle>
                            <DialogDescription>
                                Recording payment for this specific loan.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">Amount ($)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    className="col-span-3"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nextPayment" className="text-right whitespace-nowrap">Next Pay Date</Label>
                                <Input
                                    id="nextPayment"
                                    name="nextPayment"
                                    type="date"
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Payment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Detailed History</DialogTitle>
                        <DialogDescription>
                            All credits and payments associated with this loan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedLoan?.items?.length > 0 ? (
                                    selectedLoan.items.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.type === 'PAYMENT' ? 'secondary' : 'default'} className="text-[10px] font-bold">
                                                    {item.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={item.type === 'PAYMENT' ? 'text-emerald-600 font-bold' : 'text-destructive font-bold'}>
                                                {item.type === 'PAYMENT' ? '-' : '+'}${item.amount}
                                            </TableCell>
                                            <TableCell className="text-xs italic">{item.note || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4">No records found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
