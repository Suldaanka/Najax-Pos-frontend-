"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, BookOpen, ArrowUpRight, ArrowDownLeft, RotateCcw } from "lucide-react";
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
import { inventoryApi } from "@/lib/api";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export default function InventoryLogsPage() {
    const { data: session } = useSession();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("ALL");

    const user = session?.user as any;
    const businessId = user?.activeBusinessId;

    useEffect(() => {
        if (businessId) {
            fetchLogs();
        }
    }, [businessId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await inventoryApi.getStockLogs();
            setLogs(data);
        } catch (error: any) {
            toast.error("Failed to fetch logs: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            (log.product?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.note || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.reference || "").toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter = filter === "ALL" || log.type === filter;
        
        return matchesSearch && matchesFilter;
    });

    const handleExportExcel = () => {
        const exportData = filteredLogs.map(log => ({
            Date: new Date(log.createdAt).toLocaleString(),
            Product: log.product?.name || "Unknown",
            Type: log.type,
            Quantity: log.quantity,
            "Old Stock": log.oldStock,
            "New Stock": log.newStock,
            Reference: log.reference || "N/A",
            Note: log.note || ""
        }));
        exportToExcel(exportData, `Inventory_Logs_${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportPDF = () => {
        const exportData = filteredLogs.map(log => ({
            Date: new Date(log.createdAt).toLocaleString(),
            Product: log.product?.name || "Unknown",
            Type: log.type,
            Qty: log.quantity,
            Old: log.oldStock,
            New: log.newStock,
            Ref: log.reference || "N/A"
        }));
        exportToPDF(
            exportData, 
            `Inventory_Logs_${new Date().toISOString().split('T')[0]}`,
            "Inventory Movement History"
        );
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'SALE':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1"><ArrowUpRight className="w-3 h-3" /> Sale</Badge>;
            case 'PURCHASE':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1"><ArrowDownLeft className="w-3 h-3" /> Purchase</Badge>;
            case 'ADJUSTMENT':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><RotateCcw className="w-3 h-3" /> Adjustment</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Inventory Logs
                        <Badge variant="outline" className="text-[10px] font-black bg-primary/10 text-primary border-primary/20 animate-pulse">v2.0 ENTERPRISE</Badge>
                    </h2>
                    <p className="text-muted-foreground">
                        Track all stock movements and audit history.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 px-4 rounded-lg border-primary/20 hover:bg-primary/5">
                        <Download className="mr-2 h-4 w-4 text-primary" /> Export Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-9 px-4 rounded-lg border-primary/20 hover:bg-primary/5">
                        <Download className="mr-2 h-4 w-4 text-primary" /> Export PDF
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search logs by product, reference, or note..."
                        className="pl-8 max-w-sm h-9 bg-muted/50 border-none rounded-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-primary/5">
                    {["ALL", "SALE", "PURCHASE", "ADJUSTMENT"].map((t) => (
                        <Button 
                            key={t}
                            variant={filter === t ? "secondary" : "ghost"} 
                            size="sm" 
                            className={`text-[10px] font-black uppercase tracking-widest h-8 px-4 ${filter === t ? "shadow-sm" : ""}`}
                            onClick={() => setFilter(t)}
                        >
                            {t}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Product</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Qty</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Old Stock</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">New Stock</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Reference</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Note</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <span>Loading logs...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No movement logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-primary">{log.product?.name || "Deleted Product"}</span>
                                            <span className="text-[10px] text-muted-foreground">{log.product?.barcode || "N/A"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getTypeBadge(log.type)}</TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {log.type === 'SALE' ? '-' : '+'}{log.quantity}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground font-mono">{log.oldStock}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary">{log.newStock}</TableCell>
                                    <TableCell className="text-[10px] font-mono">{log.reference || "N/A"}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{log.note}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
