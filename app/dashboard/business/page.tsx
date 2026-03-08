"use client";

import { useState, useEffect } from "react";
import { Building2, Save, MapPin, Phone, Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { businessApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function BusinessPage() {
    const { data: session } = useSession();
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchBusiness = async () => {
            try {
                const data = await businessApi.get();
                setBusiness(data);
            } catch (error) {
                console.error("Failed to fetch business:", error);
                toast.error("Failed to load business details");
            } finally {
                setLoading(false);
            }
        };
        fetchBusiness();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            address: formData.get("address") as string,
            phone: formData.get("phone") as string,
            type: formData.get("type") as string,
        };

        try {
            await businessApi.update(data);
            toast.success("Business updated successfully");
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update business");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]">Loading business details...</div>;
    }

    if (!business) {
        return <div className="text-center py-10">No business found. Please create one.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Business Settings</h2>
                <p className="text-muted-foreground">
                    Manage your business profile and information.
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" /> Business Profile
                        </CardTitle>
                        <CardDescription>
                            Main information about your business.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Business Name</Label>
                                <Input id="name" name="name" defaultValue={business.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Business Type</Label>
                                <Input id="type" name="type" defaultValue={business.type} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="address" name="address" className="pl-9" defaultValue={business.address} />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="phone" name="phone" className="pl-9" defaultValue={business.phone} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Business Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="email" className="pl-9 bg-muted" value={session?.user?.email} disabled />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Actions that cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Deleting this business will remove all associated data including sales, inventory, and staff records.
                    </p>
                    <Button variant="destructive">Delete Business</Button>
                </CardContent>
            </Card>
        </div>
    );
}
