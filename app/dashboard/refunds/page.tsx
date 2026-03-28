"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCcw, Receipt, ArrowLeft, History, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { salesApi, refundsApi, apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBranch } from "@/lib/branch-context";

export default function RefundsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundItems, setRefundItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<"process" | "history">("process");
  const { currentBranchId } = useBranch();

  useEffect(() => {
    if (view === "history") {
      fetchHistory();
    }
  }, [view]);

  const fetchHistory = async () => {
    try {
      const data = await refundsApi.getAll();
      setHistory(data);
    } catch (error) {
      toast.error("Failed to fetch refund history");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setSale(null);
    setRefundItems({});
    try {
      // Find sale by ID (we might need a specific "getSale" endpoint if it doesn't exist)
      const data = await apiFetch(`/sales/${searchQuery}`);
      setSale(data);
      // Initialize refund quantities to 0
      const items: Record<string, number> = {};
      data.items.forEach((item: any) => {
        items[item.productId] = 0;
      });
      setRefundItems(items);
    } catch (error) {
      toast.error("Sale not found or error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateRefundQty = (productId: string, qty: number, max: number) => {
    setRefundItems(prev => ({
      ...prev,
      [productId]: Math.min(Math.max(0, qty), max)
    }));
  };

  const processRefund = async () => {
    const itemsToRefund = Object.entries(refundItems)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, quantity: qty }));

    if (itemsToRefund.length === 0) {
      toast.error("Select at least one item to refund");
      return;
    }

    setRefunding(true);
    try {
      await refundsApi.create({
        saleId: sale.id,
        reason,
        items: itemsToRefund,
        branchId: currentBranchId || undefined
      });
      toast.success("Refund processed successfully");
      setSale(null);
      setSearchQuery("");
      setRefundItems({});
      setReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to process refund");
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Returns & Refunds</h2>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-60">
            Process item returns and reconcile inventory
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          <Button 
            variant={view === "process" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setView("process")}
            className="rounded-lg font-black uppercase tracking-widest text-[10px]"
          >
            Process Return
          </Button>
          <Button 
            variant={view === "history" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setView("history")}
            className="rounded-lg font-black uppercase tracking-widest text-[10px]"
          >
            Refund History
          </Button>
        </div>
      </div>

      {view === "process" ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Search Section */}
          <Card className="lg:col-span-1 border-2 shadow-xl h-fit">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase">Find Transaction</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
                Enter the Sale ID or scan the receipt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="e.g. cm7x..." 
                  className="pl-10 font-mono h-12 uppercase"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="w-full h-12 font-black uppercase tracking-widest shadow-lg">
                {loading ? "Searching..." : "Lookup Sale"}
              </Button>
            </CardContent>
          </Card>

          {/* Refund Logic Section */}
          <div className="lg:col-span-2 space-y-6">
            {!sale && !loading && (
              <div className="flex flex-col items-center justify-center p-20 bg-muted/20 border-2 border-dashed rounded-3xl opacity-40">
                <History className="h-16 w-16 mb-4" />
                <p className="font-black uppercase tracking-widest">No Sale Selected</p>
              </div>
            )}

            {sale && (
              <Card className="border-2 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <CardHeader className="bg-primary/5 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-black uppercase tracking-tight">Sale #{sale?.id?.slice(-6).toUpperCase()}</CardTitle>
                      <CardDescription className="font-bold uppercase tracking-widest text-[10px]">
                        Date: {new Date(sale.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-background font-black uppercase tracking-widest h-6">
                      Total: ${Number(sale.totalAmount).toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-black uppercase text-[10px]">Product</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Sold Qty</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Refund Qty</TableHead>
                        <TableHead className="font-black uppercase text-[10px] text-right">Refund Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-bold">{item.product.name}</TableCell>
                          <TableCell className="font-bold">{item.quantity} {item.product.unit}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg"
                                onClick={() => updateRefundQty(item.productId, refundItems[item.productId] - 1, item.quantity)}
                              >
                                -
                              </Button>
                              <Input 
                                type="number" 
                                className="h-8 w-16 text-center font-bold"
                                value={refundItems[item.productId]}
                                onChange={(e) => updateRefundQty(item.productId, parseInt(e.target.value) || 0, item.quantity)}
                              />
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg"
                                onClick={() => updateRefundQty(item.productId, refundItems[item.productId] + 1, item.quantity)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-black">
                            ${(Number(item.price) * (refundItems[item.productId] || 0)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="p-6 bg-muted/10 space-y-4 border-t">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Refund Reason</label>
                      <Input 
                        placeholder="e.g. Defective item, Wrong size..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="bg-background border-2"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center bg-background p-4 rounded-2xl border-2 border-primary/20 shadow-xl">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block">Refund Total</span>
                        <span className="text-2xl font-black text-primary">
                          $ {Object.entries(refundItems).reduce((sum, [pid, qty]) => {
                            const item = sale.items.find((i: any) => i.productId === pid);
                            return sum + (Number(item?.price || 0) * qty);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                      <Button onClick={processRefund} disabled={refunding} className="px-8 h-12 font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                        {refunding ? <RefreshCcw className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Confirm Refund
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* History View */
        <Card className="border-2 shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="font-black uppercase text-[10px]">Refund ID</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Sale Reference</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Amount</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Date</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Reason</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Branch</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Cashier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell className="font-mono text-[10px]">#{refund?.id?.slice(-6).toUpperCase()}</TableCell>
                  <TableCell className="font-mono text-[10px]">#{refund?.saleId?.slice(-6).toUpperCase()}</TableCell>
                  <TableCell className="font-black text-destructive">-${Number(refund.totalAmount).toFixed(2)}</TableCell>
                  <TableCell className="text-[11px] font-bold uppercase">{new Date(refund.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs italic text-muted-foreground">{refund.reason || "N/A"}</TableCell>
                  <TableCell className="text-xs font-bold uppercase">{refund.branch?.name || "Global"}</TableCell>
                  <TableCell className="text-xs font-bold uppercase">{refund.staff?.name || "System"}</TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 opacity-30">
                    <History className="h-10 w-10 mx-auto mb-2" />
                    <p className="font-black uppercase text-[10px]">No refund history found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
