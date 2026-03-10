"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { businessApi } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function CreateBusinessPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "SHOP",
        address: "",
        phone: "",
    });

    // Auto-detect if user was invited and already has a business membership
    useEffect(() => {
        let isMounted = true;
        const checkMemberships = async () => {
            try {
                const businesses = await businessApi.list();
                if (isMounted && businesses.length > 0) {
                    console.log("Found existing memberships, auto-redirecting...");
                    // If they have at least one business, switch to it and go to dashboard
                    await businessApi.switch(businesses[0].id);
                    router.push("/dashboard");
                    toast.success(`Welcome back! Switching to ${businesses[0].name}`);
                }
            } catch (error) {
                console.error("Failed to check memberships:", error);
            }
        };

        checkMemberships();
        return () => { isMounted = false; };
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await businessApi.create(formData);
            toast.success("Business created successfully!");
            router.push("/dashboard");
        } catch (error: any) {
            toast.error("Failed to create business: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Register Your Business</CardTitle>
                    <CardDescription>
                        You need to create a business to start using Najax POS.
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Business Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger className="w-full">
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
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating..." : "Create Business"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
