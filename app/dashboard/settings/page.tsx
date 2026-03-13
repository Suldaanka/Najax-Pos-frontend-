"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { businessApi, inventoryApi, staffApi, invitationsApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { 
    Building2, 
    Palette, 
    Users, 
    Layers, 
    RefreshCcw, 
    Save, 
    Loader2,
    ShieldCheck,
    Mail,
    Trash2,
    Plus
} from "lucide-react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [business, setBusiness] = useState<any>(null);
    const [exchangeRate, setExchangeRate] = useState<any>(null);
    const [staff, setStaff] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);

    const businessId = (session?.user as any)?.activeBusinessId;

    useEffect(() => {
        if (businessId) {
            fetchData();
        }
    }, [businessId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [b, rates, staffData, inviteData] = await Promise.all([
                businessApi.get(),
                inventoryApi.getExchangeRates(),
                staffApi.getAll(businessId),
                invitationsApi.getAll(businessId)
            ]);
            setBusiness(b);
            // Assuming the first rate is the main one for now
            if (rates && rates.length > 0) {
                setExchangeRate(rates[0]);
            }
            setStaff(staffData);
            setInvitations(inviteData.invitations || []);
        } catch (error: any) {
            toast.error("Failed to fetch settings: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            type: formData.get("type") as string,
            address: formData.get("address") as string,
            phone: formData.get("phone") as string,
            primaryColor: formData.get("primaryColor") as string,
            logoUrl: formData.get("logoUrl") as string,
        };

        try {
            await businessApi.update(data);
            toast.success("Business settings updated");
            fetchData();
        } catch (error: any) {
            toast.error("Update failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateExchangeRate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const rate = parseFloat(formData.get("rate") as string);

        try {
            await inventoryApi.updateExchangeRate({
                fromCurrency: "USD",
                toCurrency: "SOS",
                rate: rate
            });
            toast.success("Exchange rate updated");
            fetchData();
        } catch (error: any) {
            toast.error("Update failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!businessId) {
        return <div className="p-8 text-center text-muted-foreground">Please select a business first.</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your business preferences, branding, and team.
                </p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-8">
                    <TabsTrigger value="general" className="gap-2">
                        <Building2 className="h-4 w-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="gap-2">
                        <Palette className="h-4 w-4" /> Branding
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="gap-2">
                        <Users className="h-4 w-4" /> Staff
                    </TabsTrigger>
                    <TabsTrigger value="units" className="gap-2">
                        <Layers className="h-4 w-4" /> Units
                    </TabsTrigger>
                    <TabsTrigger value="exchange" className="gap-2">
                        <RefreshCcw className="h-4 w-4" /> Exchange
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <form onSubmit={handleUpdateBusiness}>
                            <CardHeader>
                                <CardTitle>Business Information</CardTitle>
                                <CardDescription>Update your company details and contact information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Business Name</Label>
                                        <Input id="name" name="name" defaultValue={business?.name} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Business Type</Label>
                                        <Select name="type" defaultValue={business?.type}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SHOP">Shop / General Store</SelectItem>
                                                <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                                                <SelectItem value="COSMETICS">Cosmetics</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" name="phone" defaultValue={business?.phone} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input id="address" name="address" defaultValue={business?.address} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="branding">
                    <Card>
                        <form onSubmit={handleUpdateBusiness}>
                            <CardHeader>
                                <CardTitle>Visual Identity</CardTitle>
                                <CardDescription>Customize the look and feel of your business dashboard.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <Label>Primary Theme Color</Label>
                                    <div className="flex items-center gap-4">
                                        <Input 
                                            type="color" 
                                            name="primaryColor" 
                                            defaultValue={business?.primaryColor || "#3b82f6"} 
                                            className="h-10 w-20 p-1"
                                        />
                                        <span className="text-sm text-muted-foreground italic">This color will be used for buttons, highlights, and icons.</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="logoUrl">Logo URL</Label>
                                    <Input id="logoUrl" name="logoUrl" placeholder="https://example.com/logo.png" defaultValue={business?.logoUrl} />
                                    <p className="text-xs text-muted-foreground">Provide a link to your business logo image.</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Update Branding
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="staff">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Team Management</CardTitle>
                                <CardDescription>Manage your team members and their access roles.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => window.location.href='/dashboard/staff'}>
                                Full Staff Page
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {staff.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {member.user?.name?.[0] || "?"}
                                            </div>
                                            <div>
                                                <p className="font-medium">{member.user?.name}</p>
                                                <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                {member.role === "OWNER" && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                                                {member.role}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="units">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Units</CardTitle>
                            <CardDescription>Configure standard units and conversion factors for your products.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid border rounded-xl overflow-hidden">
                                <div className="grid grid-cols-3 bg-muted/50 p-3 text-xs font-bold uppercase tracking-widest">
                                    <span>Unit Name</span>
                                    <span>Base Symbol</span>
                                    <span>Status</span>
                                </div>
                                {[ 
                                    { name: "Pieces", symbol: "pcs", status: "Active" },
                                    { name: "Cartons", symbol: "ctn", status: "Active" },
                                    { name: "Bags / Sacks", symbol: "bag", status: "Active" },
                                    { name: "Kilograms", symbol: "kg", status: "Active" }
                                ].map((u, i) => (
                                    <div key={i} className="grid grid-cols-3 p-3 border-t items-center text-sm">
                                        <span className="font-medium">{u.name}</span>
                                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{u.symbol}</code>
                                        <span className="text-emerald-500 font-bold text-xs uppercase">{u.status}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                                <Layers className="h-5 w-5 text-amber-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-amber-900 border-b border-amber-500/10 pb-1 mb-1">Advanced Unit Support</p>
                                    <p className="text-xs text-amber-800/80 leading-relaxed">
                                        You can now manage products as **Bags with Pcs** or **Cartons with Pcs**. 
                                        Enable this feature in the individual Product forms to track inventory at both levels.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="exchange">
                    <Card>
                        <form onSubmit={handleUpdateExchangeRate}>
                            <CardHeader>
                                <CardTitle>Currency & Exchange</CardTitle>
                                <CardDescription>Set the manual exchange rate for internal currency calculations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-3 gap-6 items-center">
                                    <div className="bg-muted/50 p-6 rounded-2xl border flex flex-col items-center justify-center gap-2">
                                        <span className="text-2xl font-black">1.00</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 text-center">Base Currency</span>
                                        <span className="font-bold text-xl text-primary">USD</span>
                                    </div>
                                    <div className="flex justify-center">
                                        <RefreshCcw className="h-8 w-8 text-muted-foreground animate-pulse" />
                                    </div>
                                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 flex flex-col items-center justify-center gap-2 relative">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Manual Rate</div>
                                        <Input 
                                            type="number" 
                                            name="rate" 
                                            step="0.01" 
                                            defaultValue={exchangeRate?.rate || 33500} 
                                            className="h-10 text-center text-xl font-black border-none bg-transparent focus-visible:ring-0"
                                        />
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 text-center">Target Currency</span>
                                        <span className="font-bold text-xl text-primary">SOS (Shiling)</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/40 border-l-4 border-primary rounded-r-xl space-y-2">
                                    <p className="text-sm font-bold">System Impact</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        This rate is used to calculate **Paid in SOS** values in the POS and to estimate your total stock value in local currency. Update this whenever the market rate changes significantly.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Apply Global Rate
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
