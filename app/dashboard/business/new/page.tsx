"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { businessApi, invitationsApi } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, CheckCircle2, Building2, Store, Sparkle, ArrowRight } from "lucide-react";

export default function CreateBusinessPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [invitationLoading, setInvitationLoading] = useState<string | null>(null);
    const [myInvitations, setMyInvitations] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        type: "SHOP",
        address: "",
        phone: "",
    });

    // Auto-detect if user was invited and already has a business membership
    useEffect(() => {
        let isMounted = true;
        const checkContext = async () => {
            try {
                // 1. Check for existing business memberships
                const businesses = await businessApi.getAllMyBusinesses();
                if (isMounted && businesses && businesses.length > 0) {
                    console.log("Found existing memberships, auto-redirecting...");
                    await businessApi.switchBusiness(businesses[0].id);
                    toast.success(`Welcome back! Switching to ${businesses[0].name}`);
                    window.location.href = "/dashboard";
                    return;
                }

                // 2. Check for pending invitations
                const invitesResponse = await invitationsApi.getMyInvitations();
                if (isMounted && invitesResponse.invitations) {
                    setMyInvitations(invitesResponse.invitations);
                    if (invitesResponse.invitations.length > 0) {
                        toast.info("You have pending invitations to join existing businesses!");
                    }
                }

            } catch (error) {
                console.error("Failed to check context:", error);
            }
        };

        checkContext();
        return () => { isMounted = false; };
    }, [router]);

    const handleAcceptInvitation = async (id: string, businessName: string) => {
        setInvitationLoading(id);
        try {
            await invitationsApi.accept({ id });
            toast.success(`Succesfully joined ${businessName}!`);
            window.location.href = "/dashboard";
        } catch (error: any) {
            toast.error("Failed to accept invitation: " + error.message);
        } finally {
            setInvitationLoading(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await businessApi.create(formData);
            toast.success("Business created successfully!");
            window.location.href = "/dashboard";
        } catch (error: any) {
            toast.error("Failed to create business: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center p-6 bg-background overflow-hidden flex-col">
            {/* Background elements for premium feel */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.03),transparent_40%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.05),transparent_40%)]" />
            
            <div className="w-full max-w-6xl flex flex-col gap-12 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center text-center space-y-4 mb-4">
                    <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-2 shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.1)] border border-primary/20">
                        <Building2 className="h-9 w-9 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
                            Get Started with Najax
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Choose how you'd like to begin. Join an existing team or launch your own business platform in seconds.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    {/* Left Column: Invitations */}
                    <div className="flex flex-col">
                        <Card className="flex-1 border-primary/10 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group border-t-4 border-t-amber-500/50">
                            <CardHeader className="pb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <Mail className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold italic tracking-tight uppercase">
                                        Join a Team
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-base">
                                    {myInvitations.length > 0 
                                        ? "You have active invitations waiting for your response." 
                                        : "Looking for an invitation? They will appear here once sent to your email."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 min-h-[300px] flex flex-col justify-start">
                                {myInvitations.length > 0 ? (
                                    myInvitations.map((invite) => (
                                        <div key={invite.id} className="group/item flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-white/5 hover:border-amber-500/30 hover:bg-muted/40 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center border border-primary/10 group-hover/item:scale-105 transition-transform shadow-inner">
                                                    <Store className="h-6 w-6 text-amber-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg tracking-tight">{invite.business.name}</span>
                                                    <span className="text-xs font-bold text-muted-foreground/60 tracking-widest uppercase">
                                                        Role: {invite.role}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button 
                                                size="lg" 
                                                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-lg shadow-amber-900/20 active:scale-95 transition-all h-12 px-6"
                                                onClick={() => handleAcceptInvitation(invite.id, invite.business.name)}
                                                disabled={!!invitationLoading}
                                            >
                                                {invitationLoading === invite.id ? (
                                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>Join <CheckCircle2 className="ml-2 h-4 w-4" /></>
                                                )}
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40 border-2 border-dashed border-primary/10 rounded-3xl">
                                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Mail className="h-8 w-8" />
                                        </div>
                                        <p className="font-medium text-lg italic">No invitations currently</p>
                                        <p className="text-sm">Reach out to your administrator to be added to an existing business.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Desktop "OR" indicator */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <div className="bg-background border border-primary/10 rounded-full p-4 shadow-xl flex items-center justify-center font-black text-xs tracking-tighter text-muted-foreground/50 rotate-[-10deg] border-dashed">
                           OR
                        </div>
                    </div>

                    {/* Right Column: Registration */}
                    <div className="flex flex-col">
                        <Card className="flex-1 border-primary/10 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group border-t-4 border-t-primary/50">
                            <CardHeader className="pb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                        <Sparkle className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold italic tracking-tight uppercase">
                                        Create Business
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-base text-balance">
                                    Start your own instance and take full control of your operations today.
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                                <CardContent className="space-y-6 flex-1">
                                    <div className="grid gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Company Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g. Najax Logistics"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="h-14 px-5 rounded-2xl bg-muted/30 border-primary/5 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all text-lg font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="type" className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Business Sector</Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                                            >
                                                <SelectTrigger className="h-14 px-5 rounded-2xl bg-muted/30 border-primary/5 focus:ring-primary text-lg">
                                                    <SelectValue placeholder="Select industry" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-primary/10 shadow-2xl backdrop-blur-lg">
                                                    <SelectItem value="SHOP" className="py-3 focus:bg-primary/10 focus:text-primary rounded-xl mx-1">General Commerce</SelectItem>
                                                    <SelectItem value="PHARMACY" className="py-3 focus:bg-primary/10 focus:text-primary rounded-xl mx-1">Healthcare / Pharmacy</SelectItem>
                                                    <SelectItem value="COSMETICS" className="py-3 focus:bg-primary/10 focus:text-primary rounded-xl mx-1">Beauty & Cosmetics</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="address" className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1">HQ Address</Label>
                                            <Input
                                                id="address"
                                                placeholder="City, Region"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus-visible:ring-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Office Phone</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+252 ..."
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus-visible:ring-primary"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pb-8 pt-4">
                                    <Button 
                                        type="submit" 
                                        className="w-full h-15 rounded-2xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_15px_40px_rgba(var(--primary-rgb),0.25)] hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.35)] transition-all flex items-center justify-center gap-3 text-xl active:scale-[0.97] group" 
                                        disabled={loading || !!invitationLoading}
                                    >
                                        {loading ? (
                                            <span className="w-6 h-6 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Launch Business <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>
                
                <div className="flex flex-col items-center gap-2 opacity-40">
                    <p className="text-center text-[10px] font-black uppercase tracking-widest">
                        Najax Enterprise Solutions &copy; 2024
                    </p>
                </div>
            </div>
        </div>
    );
}
