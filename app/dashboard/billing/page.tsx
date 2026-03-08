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

const invoices = [
    { id: "INV-2026-003", date: "Feb 01, 2026", amount: "$49.00", status: "Paid" },
    { id: "INV-2026-002", date: "Jan 01, 2026", amount: "$49.00", status: "Paid" },
    { id: "INV-2025-012", date: "Dec 01, 2025", amount: "$49.00", status: "Paid" },
];

export default function BillingPage() {
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
                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Active</Badge>
                        </CardTitle>
                        <CardDescription>You are currently on the Najax Pro plan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold tracking-tight">$49</span>
                            <span className="text-muted-foreground text-sm font-medium">/month</span>
                        </div>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited Products</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Multi-branch Support</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Priority 24/7 Support</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t p-4 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">Next billing date: <strong>Mar 01, 2026</strong></p>
                        <Button variant="default" size="sm">Manage Subscription</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>Your active payment method for subscriptions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/10">
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">Visa ending in 4242</p>
                                <p className="text-xs text-muted-foreground">Expires 12/28</p>
                            </div>
                            <Button variant="outline" size="sm">Edit</Button>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-amber-500/10 rounded-lg text-amber-600">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>To avoid service interruption, please make sure your card is active before the next billing cycle.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>View and download your past invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Receipt</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell>{invoice.date}</TableCell>
                                    <TableCell>{invoice.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none">
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
