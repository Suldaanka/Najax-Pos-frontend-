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
import { Mail, CheckCircle2 } from "lucide-react";

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
                    // If they have at least one business, switch to it and go to dashboard
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
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40 flex-col gap-6">
            {myInvitations.length > 0 && (
                <div className="w-full max-w-md animate-in slide-in-from-top duration-500">
                    <Card className="border-amber-200 bg-amber-50/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                                <Mail className="h-5 w-5" /> Pending Invitations
                            </CardTitle>
                            <CardDescription className="text-amber-700/80">
                                You’ve been invited to join the following businesses:
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {myInvitations.map((invite) => (
                                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-100">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{invite.business.name}</span>
                                        <span className="text-xs text-muted-foreground">Invited as {invite.role}</span>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleAcceptInvitation(invite.token, invite.business.name)}
                                        disabled={!!invitationLoading}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        {invitationLoading === invite.token ? "Joining..." : "Join"}
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <div className="flex items-center gap-4 my-2">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground uppercase font-bold">Or</span>
                        <Separator className="flex-1" />
                    </div>
                </div>
            )}

            <Card className="w-full max-w-md shadow-lg border-primary/10">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Register Your Business
                    </CardTitle>
                    <CardDescription>
                        Create your own business instance to start using Najax POS.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Business Name</Label>
                            <Input
                                id="name"
                                placeholder="Najax Store"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Business Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger className="w-full focus:ring-primary">
                                    <SelectValue placeholder="Select business type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SHOP">General Shop</SelectItem>
                                    <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                                    <SelectItem value="COSMETICS">Cosmetics</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="123 Main St, Hargeisa"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                placeholder="+252 63..."
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full font-bold shadow-md hover:shadow-lg transition-all" disabled={loading || !!invitationLoading}>
                            {loading ? "Creating..." : "Create Business"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
