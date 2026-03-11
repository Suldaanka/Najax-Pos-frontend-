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

    const handleAcceptInvitation = async (token: string, businessName: string) => {
        setInvitationLoading(token);
        try {
            await invitationsApi.accept(token);
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
        <div className="relative flex min-h-screen items-center justify-center p-6 bg-background overflow-hidden">
            {/* Background elements for premium feel */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.03),transparent_40%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.05),transparent_40%)]" />
            
            <div className="w-full max-w-lg flex flex-col gap-8 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center text-center space-y-2 mb-2">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-inner">
                        <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                        Welcome to Najax
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-[320px]">
                        Set up your workspace to start managing your business efficiently.
                    </p>
                </div>

                {myInvitations.length > 0 && (
                    <div className="animate-in slide-in-from-bottom duration-500 stagger-1 translate-y-[-10px]">
                        <Card className="border-primary/10 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]" />
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xl flex items-center gap-2.5 font-bold">
                                    <Mail className="h-5 w-5 text-amber-500" /> 
                                    <span>Pending Invitations</span>
                                </CardTitle>
                                <CardDescription className="text-sm font-medium">
                                    You've been invited to collaborate with others.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {myInvitations.map((invite) => (
                                    <div key={invite.id} className="group/item flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-primary/5 hover:border-amber-500/20 hover:bg-muted/50 transition-all cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-primary/10 group-hover/item:scale-110 transition-transform">
                                                <Store className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm tracking-tight">{invite.business.name}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest bg-muted rounded px-1.5 py-0.5 border border-primary/5">
                                                        {invite.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="secondary"
                                            className="h-9 px-5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all scale-100 active:scale-95"
                                            onClick={() => handleAcceptInvitation(invite.token, invite.business.name)}
                                            disabled={!!invitationLoading}
                                        >
                                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                            {invitationLoading === invite.token ? "Joining..." : "Accept"}
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        
                        <div className="relative flex items-center gap-4 my-8">
                            <Separator className="flex-1 opacity-20" />
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] px-3 py-1 border rounded-full bg-background relative z-10 shadow-sm">
                                Or create new
                            </span>
                            <Separator className="flex-1 opacity-20" />
                        </div>
                    </div>
                )}

                <Card className="shadow-2xl border-primary/10 bg-card/60 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                        <Sparkle className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Register Your Business
                        </CardTitle>
                        <CardDescription className="text-base">
                            Start your enterprise journey with a professional profile.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 pt-2">
                            <div className="grid gap-4">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-sm font-semibold ml-1">Business Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter business legal name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="h-12 px-4 rounded-xl bg-muted/40 border-primary/10 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all text-base"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="type" className="text-sm font-semibold ml-1">Business Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-primary/10 focus:ring-primary focus:ring-offset-2 text-base">
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                                            <SelectItem value="SHOP" className="py-3 focus:bg-primary/5 focus:text-primary">General Shop</SelectItem>
                                            <SelectItem value="PHARMACY" className="py-3 focus:bg-primary/5 focus:text-primary">Pharmacy</SelectItem>
                                            <SelectItem value="COSMETICS" className="py-3 focus:bg-primary/5 focus:text-primary">Cosmetics</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <Separator className="opacity-10" />
                            
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-3">
                                    <Label htmlFor="address" className="text-sm font-semibold ml-1">Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="Street, City"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="h-11 rounded-xl bg-muted/40 border-primary/10 focus-visible:ring-primary"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="phone" className="text-sm font-semibold ml-1">Contact Phone</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+252 ..."
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="h-11 rounded-xl bg-muted/40 border-primary/10 focus-visible:ring-primary"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pb-8">
                            <Button 
                                type="submit" 
                                className="w-full h-14 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_10px_30px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_15px_40px_rgba(var(--primary-rgb),0.3)] transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]" 
                                disabled={loading || !!invitationLoading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        <span>Proccessing...</span>
                                    </div>
                                ) : (
                                    <>
                                        Get Started <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                    <div className="absolute bottom-0 left-0 w-full h-1 px-8">
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    </div>
                </Card>
                
                <p className="text-center text-xs text-muted-foreground/60 italic">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
