"use client";

import { useState, useEffect } from "react";
import { Download, HandCoins, Search, Filter, ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { exportToExcel } from "@/lib/export-utils";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { useSession } from "@/lib/auth-client";
import { customersApi, loansApi } from "@/lib/api";
import { useBranch } from "@/lib/branch-context";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function LoansPage() {
    const { data: session } = useSession();
    const { currentBranchId, currentBranch } = useBranch();
    const [loans, setLoans] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loanTypeFilter, setLoanTypeFilter] = useState<"ALL" | "PRODUCT" | "CREDIT">("ALL");
    const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
    const [selectedCustomerProducts, setSelectedCustomerProducts] = useState<any[]>([]);
    const [selectedCustomerName, setSelectedCustomerName] = useState("");

    const fetchLoans = async () => {
        try {
            const data = await loansApi.getAll(currentBranchId);
            setLoans(data.map((l: any) => ({
                id: l.id,
                customerId: l.customerId,
                customer: l.customer?.name || "Unknown",
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
            })));
        } catch (error) {
            console.error("Failed to fetch loans:", error);
        }
    };

    useEffect(() => {
        fetchLoans();
        const businessId = (session?.user as any)?.activeBusinessId;
        if (businessId) {
            customersApi.getAll(businessId, currentBranchId)
                .then(setCustomers)
                .catch(err => console.error("Failed to fetch customers:", err));
        }
    }, [currentBranchId, session]);

    const handleIssueCredit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const customerId = formData.get("customer") as string;
        const totalAmount = formData.get("total") as string;
        const due = formData.get("due") as string;

        try {
            await loansApi.create({ 
                customerId, 
                totalAmount, 
                dueDate: due,
                branchId: currentBranchId 
            });
            setIsAddOpen(false);
            fetchLoans();
            toast.success("Credit issued successfully");
        } catch (error) {
            toast.error("Failed to issue credit");
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoan || !paymentAmount) return;

        try {
            await loansApi.recordPayment(selectedLoan.id, {
                amount: parseFloat(paymentAmount),
                nextPaymentDate: (e.target as any).nextPayment?.value || null
            });
            setIsPaymentOpen(false);
            setPaymentAmount("");
            fetchLoans();
            toast.success("Payment recorded");
        } catch (error) {
            toast.error("Failed to record payment");
        }
    };

    const markAsPaid = async (id: string) => {
        try {
            await loansApi.updateStatus(id, 'PAID');
            fetchLoans();
            toast.success("Loan marked as paid");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const groupedLoans = Object.values(loans.reduce((acc, loan) => {
        const cid = loan.customerId;
        if (!acc[cid]) {
            acc[cid] = {
                id: cid,
                customerId: cid,
                customer: loan.customer,
                total: 0,
                paid: 0,
                remaining: 0,
                loansCount: 0,
                activeLoansCount: 0,
                status: "PAID",
                latestDue: loan.due,
                nextPayment: loan.nextPayment,
                hasProductLoans: false,
                hasCreditLoans: false,
                allProducts: []
            };
        }
        const group = acc[cid];
        group.total += Number(loan.total);
        group.paid += Number(loan.paid);
        group.remaining += loan.remaining;
        group.loansCount += 1;

        // Track loan types
        const isProductLoan = loan.products && loan.products.length > 0;
        if (isProductLoan) {
            group.hasProductLoans = true;
            // Aggregate products
            loan.products.forEach((p: any) => {
                const existing = group.allProducts.find((ap: any) => ap.name === p.name);
                if (existing) {
                    existing.quantity += p.quantity;
                } else {
                    group.allProducts.push({ ...p });
                }
            });
        } else {
            group.hasCreditLoans = true;
        }

        if (loan.status !== "PAID" && loan.status !== "Fully Paid") {
            group.activeLoansCount += 1;
            group.status = "PENDING";
        }
        return acc;
    }, {} as Record<string, any>));

    const filteredGroupedLoans = groupedLoans.filter((g: any) => {
        const matchesSearch = g.customer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = loanTypeFilter === "ALL" ||
            (loanTypeFilter === "PRODUCT" && g.hasProductLoans) ||
            (loanTypeFilter === "CREDIT" && g.hasCreditLoans);
        return matchesSearch && matchesType;
    });

    const handleExport = () => {
        const exportData = filteredGroupedLoans.map((g: any) => ({
            Customer: g.customer,
            "Total Debt": g.total,
            "Total Paid": g.paid,
            Remaining: g.remaining,
            "Loans Count": g.loansCount,
            Status: g.status
        }));
        exportToExcel(exportData, `Loans_Report_${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Loans & Credits</h2>
                    <p className="text-muted-foreground">
                        Manage customer loans and credit accounts.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <HandCoins className="mr-2 h-4 w-4" /> Issue New Credit
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleIssueCredit}>
                                <DialogHeader>
                                    <DialogTitle>Issue New Credit</DialogTitle>
                                    <DialogDescription>
                                        Enter the details for the customer credit.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="customer" className="text-right">Customer</Label>
                                        <div className="col-span-3">
                                            <Select name="customer" required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map((c: any) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="total" className="text-right">Amount ($)</Label>
                                        <Input id="total" name="total" type="number" step="0.01" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="due" className="text-right">Due Date</Label>
                                        <Input id="due" name="due" type="date" className="col-span-3" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Issue Credit</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-muted/50 p-4 rounded-xl border">
                    <div className="text-sm font-medium text-muted-foreground">Total Outstanding</div>
                    <div className="text-2xl font-bold">${loans.reduce((acc, l) => acc + (l.status !== 'Fully Paid' && l.status !== 'PAID' ? parseFloat(l.total) - parseFloat(l.paid) : 0), 0).toFixed(2)}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border">
                    <div className="text-sm font-medium text-muted-foreground">Overdue</div>
                    <div className="text-2xl font-bold text-destructive">$3,200.00</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border">
                    <div className="text-sm font-medium text-muted-foreground">Fully Paid Count</div>
                    <div className="text-2xl font-bold text-emerald-500">{loans.filter(l => l.status === 'Fully Paid' || l.status === 'PAID').length}</div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by customer..."
                        className="pl-8 max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
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
                            <TableHead>Customer</TableHead>
                            <TableHead>Total Debt</TableHead>
                            <TableHead>Total Paid</TableHead>
                            <TableHead>Remaining</TableHead>
                            <TableHead>Total Loans</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGroupedLoans.map((group: any) => (
                            <TableRow key={group.customerId}>
                                <TableCell className="font-medium">
                                    <Link href={`/dashboard/loans/${group.customerId}`} className="flex flex-col hover:opacity-70 transition-opacity">
                                        <span className="flex items-center gap-1 font-bold">{group.customer} <ArrowUpRight className="h-3 w-3" /></span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Customer</span>
                                    </Link>
                                </TableCell>
                                <TableCell className="font-bold text-primary">
                                    ${group.total.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-emerald-500 font-medium">
                                    ${group.paid.toFixed(2)}
                                </TableCell>
                                <TableCell className="font-bold text-destructive">
                                    ${group.remaining.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] cursor-pointer hover:bg-muted"
                                            onClick={() => {
                                                setSelectedCustomerProducts(group.allProducts);
                                                setSelectedCustomerName(group.customer);
                                                setIsProductsModalOpen(true);
                                            }}
                                        >
                                            {group.loansCount} Total
                                        </Badge>
                                        {group.activeLoansCount > 0 && (
                                            <Badge variant="destructive" className="text-[10px]">
                                                {group.activeLoansCount} Active
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className="text-[10px] px-1.5 py-0"
                                        variant={group.status === "PAID" ? "default" : "secondary"}
                                    >
                                        {group.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <Link href={`/dashboard/loans/${group.customerId}`}>
                                            View Details
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleRecordPayment}>
                        <DialogHeader>
                            <DialogTitle>Record Payment</DialogTitle>
                            <DialogDescription>
                                Enter the amount paid by {selectedLoan?.customer}.
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
                        <DialogTitle>Loan History - {selectedLoan?.customer}</DialogTitle>
                        <DialogDescription>
                            All transactions (credits and payments) for this loan.
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
                                                <Badge variant={item.type === 'PAYMENT' ? 'secondary' : 'default'}>
                                                    {item.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={item.type === 'PAYMENT' ? 'text-emerald-600' : 'text-destructive'}>
                                                {item.type === 'PAYMENT' ? '-' : '+'}${item.amount}
                                            </TableCell>
                                            <TableCell className="text-xs">{item.note || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4">No history records.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isProductsModalOpen} onOpenChange={setIsProductsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Products Taken - {selectedCustomerName}</DialogTitle>
                        <DialogDescription>
                            Complete list of products this customer has taken on credit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Total Quantity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedCustomerProducts.length > 0 ? (
                                    selectedCustomerProducts.map((p: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell className="text-right">x{p.quantity}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-4 text-muted-foreground italic">
                                            No products found (Credit-only loans).
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsProductsModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
