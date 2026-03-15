"use client";

import { useState, useEffect } from "react";
import { Download, Search, Filter, MoreHorizontal, Calendar, Plus, ShoppingCart, Trash2, Eye, Printer } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { customersApi, salesApi } from "@/lib/api";
import { exportToExcel } from "@/lib/export-utils";

export default function SalesPage() {
    const { data: session } = useSession();
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const businessId = (session?.user as any)?.activeBusinessId;

    useEffect(() => {
        if (businessId) {
            fetchSales();
            customersApi.getAll(businessId)
                .then(setCustomers)
                .catch(err => console.error("Failed to fetch customers:", err));
        }
    }, [businessId]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const data = await salesApi.getAll();
            setSales(data);
        } catch (error: any) {
            toast.error("Failed to fetch sales: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const exportData = filteredSales.map(sale => ({
            Invoice: sale.id.slice(-6).toUpperCase(),
            Customer: sale.customer?.name || "Cash Customer",
            Date: new Date(sale.createdAt).toLocaleDateString(),
            Method: sale.paymentMethod || "CASH",
            Total: Number(sale.totalAmount).toFixed(2),
            Status: sale.type === "CASH" ? "Paid" : "Loan",
            Items: sale.items?.map((item: any) => `${item.product?.name} (x${item.quantity})`).join(", ")
        }));
        exportToExcel(exportData, `Sales_Report_${new Date().toISOString().split('T')[0]}`);
    };

    const handlePrintReceipt = (sale: any) => {
        const printWindow = window.open('', '_blank', 'width=600,height=600');
        if (!printWindow) return;

        const receiptHtml = `
            <html>
                <head>
                    <title>Receipt - #${sale.id.slice(-6).toUpperCase()}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; }
                        h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
                        p { font-size: 12px; margin: 2px 0; }
                        .separator { border-top: 1px dashed #000; margin: 10px 0; }
                        .total { font-weight: bold; font-size: 14px; text-align: right; }
                        table { width: 100%; font-size: 12px; border-collapse: collapse; }
                        th { text-align: left; border-bottom: 1px solid #000; }
                        td { padding: 5px 0; }
                        .center { text-align: center; }
                    </style>
                </head>
                <body>
                    <h1>${(session?.user as any)?.activeBusinessName || "NAJAX POS"}</h1>
                    <p class="center">Receipt #${sale.id.slice(-6).toUpperCase()}</p>
                    <p class="center">${new Date(sale.createdAt).toLocaleString()}</p>
                    <div class="separator"></div>
                    <p>Customer: ${sale.customer?.name || "Cash Customer"}</p>
                    <div class="separator"></div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items?.map((item: any) => `
                                <tr>
                                    <td>${item.product?.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${Number(item.price).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="separator"></div>
                    <p class="total">Total: $${Number(sale.totalAmount).toFixed(2)}</p>
                    <p>Payment: ${sale.paymentMethod || "CASH"} (${sale.type === 'CASH' ? 'PAID' : 'LOAN'})</p>
                    <div class="separator"></div>
                    <p class="center">THANK YOU FOR YOUR BUSINESS!</p>
                    <script>window.print(); window.close();</script>
                </body>
            </html>
        `;

        printWindow.document.write(receiptHtml);
        printWindow.document.close();
    };

    const filteredSales = sales.filter(sale =>
        sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sale.customer?.name || "Cash Customer").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNewSale = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Redirect to POS or show a toast that POS should be used
        toast.info("Please use the POS page to create new sales.");
        setIsAddOpen(false);
    };

    const handleDeleteSale = async (id: string) => {
        try {
            await salesApi.delete(id);
            fetchSales();
            toast.success("Sale record deleted");
        } catch (error: any) {
            toast.error("Failed to delete sale: " + error.message);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sales Transactions</h2>
                    <p className="text-muted-foreground">
                        View and manage your recent sales.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Sale
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleNewSale}>
                                <DialogHeader>
                                    <DialogTitle>Record New Sale</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details for the new transaction.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="customer" className="text-right">Customer</Label>
                                        <div className="col-span-3">
                                            <Select name="customer" defaultValue="cash">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash">Cash Customer</SelectItem>
                                                    {customers.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="total" className="text-right">Total ($)</Label>
                                        <Input id="total" name="total" type="number" step="0.01" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="method" className="text-right">Method</Label>
                                        <div className="col-span-3">
                                            <Select name="method" defaultValue="Cash">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="ZAAD">ZAAD</SelectItem>
                                                    <SelectItem value="e-Dahab">e-Dahab</SelectItem>
                                                    <SelectItem value="Loan">Loan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="status" className="text-right">Status</Label>
                                        <div className="col-span-3">
                                            <Select name="status" defaultValue="Paid">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Paid">Paid</SelectItem>
                                                    <SelectItem value="Partial">Partial</SelectItem>
                                                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Create Invoice</Button>
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
                        placeholder="Search by invoice or customer..."
                        className="pl-8 max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
                <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" /> Last 7 Days
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Invoice</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10">Loading sales...</TableCell>
                            </TableRow>
                        ) : filteredSales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10">No sales found.</TableCell>
                            </TableRow>
                        ) : filteredSales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell className="font-medium text-[10px] uppercase tracking-tighter">#{sale.id.slice(-6)}</TableCell>
                                <TableCell className="font-semibold">{sale.customer?.name || "Cash Customer"}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {sale.items?.map((item: any) => (
                                            <Badge key={item.id} variant="secondary" className="text-[9px] py-0 px-1 font-medium bg-muted/50">
                                                {item.product?.name} (x{item.quantity})
                                            </Badge>
                                        )) || <span className="text-[10px] text-muted-foreground italic">No items</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-[11px] whitespace-nowrap">{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-[11px] font-medium">{sale.paymentMethod || "CASH"}</TableCell>
                                <TableCell className="font-bold text-primary">${Number(sale.totalAmount).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge
                                        className="text-[10px] py-0 px-1.5 h-5 font-black uppercase tracking-widest"
                                        variant={
                                            sale.type === "CASH"
                                                ? "default"
                                                : "destructive"
                                        }
                                    >
                                        {sale.type === "CASH" ? "Paid" : "Loan"}
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
                                            <DropdownMenuItem onClick={() => { setSelectedSale(sale); setIsDetailsOpen(true); }}>
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handlePrintReceipt(sale)}>
                                                <Printer className="mr-2 h-4 w-4" /> Print Receipt
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDeleteSale(sale.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Sale Details - #{selectedSale?.id.slice(-6).toUpperCase()}</DialogTitle>
                        <DialogDescription>
                            Full breakdown of the transaction.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSale && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Customer</span>
                                    <span className="font-bold">{selectedSale.customer?.name || "Cash Customer"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Date</span>
                                    <span className="font-bold">{new Date(selectedSale.createdAt).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Payment Method</span>
                                    <span className="font-bold">{selectedSale.paymentMethod}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Type</span>
                                    <Badge variant={selectedSale.type === 'CASH' ? 'default' : 'destructive'}>
                                        {selectedSale.type}
                                    </Badge>
                                </div>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedSale.items?.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium text-xs">{item.product?.name}</TableCell>
                                                <TableCell className="text-xs">{item.quantity}</TableCell>
                                                <TableCell className="text-right text-xs font-bold">${Number(item.price).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                                <span>Total Amount</span>
                                <span className="text-primary">${Number(selectedSale.totalAmount).toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handlePrintReceipt(selectedSale)}>
                            <Printer className="mr-2 h-4 w-4" /> Print Receipt
                        </Button>
                        <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
