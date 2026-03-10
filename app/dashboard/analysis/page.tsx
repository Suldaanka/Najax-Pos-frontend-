"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, CreditCard, Receipt, Repeat, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { dashboardApi } from "@/lib/api";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface DashboardData {
    revenue: number;
    monthlyRevenue: number;
    expenses: number;
    monthlyExpenses: number;
    recurringExpenses: number;
    netRevenue: number;
    totalSalesCount: number;
    totalCustomersCount: number;
    pendingLoans: number;
    outOfStock: any[];
    recentTransactions: any[];
    topProducts: any[];
    chartData: any[];
}

const chartConfig = {
    uv: {
        label: "Revenue",
        color: "#3b82f6", // tailwind blue-500
    }
} satisfies ChartConfig;

export default function AnalysisPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const rawData = await dashboardApi.getStats();
                setData(rawData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const {
        monthlyRevenue,
        monthlyExpenses,
        recurringExpenses,
        netRevenue,
        totalSalesCount,
        totalCustomersCount,
        recentTransactions,
        chartData
    } = data;

    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Business Analysis</h2>
                <p className="text-muted-foreground">
                    Real-time metrics and performance overview.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Rev.</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatter.format(monthlyRevenue)}</div>
                        <p className="text-xs text-muted-foreground">This month's sales</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fixed Costs</CardTitle>
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatter.format(recurringExpenses)}</div>
                        <p className="text-xs text-muted-foreground">Monthly recurring</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">One-off Exp.</CardTitle>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatter.format(monthlyExpenses)}</div>
                        <p className="text-xs text-muted-foreground">Current month</p>
                    </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatter.format(netRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Monthly Profit</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales Count</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSalesCount}</div>
                        <p className="text-xs text-muted-foreground">Transactions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomersCount}</div>
                        <p className="text-xs text-muted-foreground">Registered</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>View your store\'s revenue over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <BarChart accessibilityLayer data={chartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 3)}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Bar dataKey="uv" fill="var(--color-uv)" radius={8} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>Latest 5 sales in the shop.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentTransactions.map((tx: any, i: number) => (
                                <div key={i} className="flex items-center">
                                    <Receipt className="h-9 w-9 text-muted-foreground" />
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            Sale #{tx.id.slice(-5).toUpperCase()}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {tx.customer?.name || 'Walk-in Customer'} • {format(new Date(tx.createdAt), 'PPP')}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        +{formatter.format(tx.totalAmount)}
                                    </div>
                                </div>
                            ))}
                            {recentTransactions.length === 0 && (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    No recent transactions found.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
