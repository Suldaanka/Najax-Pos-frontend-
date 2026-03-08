"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  Receipt,
  Repeat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export default function DashboardPage() {
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
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const {
    monthlyRevenue,
    monthlyExpenses,
    recurringExpenses,
    netRevenue,
    pendingLoans,
    outOfStock,
    recentTransactions,
    topProducts,
    chartData
  } = data;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rev.</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatter.format(monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              This month's sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fixed Costs</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatter.format(recurringExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">One-off Exp.</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatter.format(monthlyExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Current month exp.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatter.format(netRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated Net
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Loans</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatter.format(pendingLoans)}</div>
            <p className="text-xs text-muted-foreground">
              Unpaid loans
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStock.length}</div>
            <p className="text-xs text-muted-foreground text-red-500">
              Needs restocking
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
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
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Most sold products based on quantity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {topProducts.map((p, index) => (
                <div key={index} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{p.product?.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      Sold: {p.totalSold} units
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {formatter.format(p.product?.sellingPrice || 0)}
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="text-sm text-muted-foreground">No sales data available.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions & Out of stock tables */}
        <Card className="col-span-7 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
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
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-7 lg:col-span-3">
          <CardHeader>
            <CardTitle>Stock Action Needed</CardTitle>
            <CardDescription>Items out of stock or running low.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {outOfStock.map((item: any, i: number) => (
                <div key={i} className="flex items-center">
                  <Package className="h-9 w-9 text-muted-foreground" />
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {item.stockQuantity} / {item.lowStockThreshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
