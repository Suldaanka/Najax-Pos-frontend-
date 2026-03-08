"use client";

import { User, Mail, Shield, Smartphone, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
    const { data: session } = useSession();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "");
            setEmail(session.user.email || "");
        }
    }, [session]);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate an API call
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Profile updated successfully!");
        }, 800);
    };
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Your Profile</h2>
                <p className="text-muted-foreground">
                    Manage your personal information and account settings.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader className="flex flex-col items-center text-center pb-2">
                        <Avatar className="h-32 w-32 mb-4 mt-4">
                            <AvatarImage src={session?.user?.image || "/avatars/user.jpg"} alt="User Avatar" />
                            <AvatarFallback className="text-4xl">{name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-xl">{name || "User Account"}</CardTitle>
                        <CardDescription>Owner of Najax Business</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6 pb-6 pt-2">
                        <Button variant="outline" className="w-full text-foreground/80 hover:text-foreground">Upload New Photo</Button>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your name and email address.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full-name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="full-name"
                                            placeholder="John Doe"
                                            className="pl-9"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            className="pl-9"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Smartphone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="phone" placeholder="+252 63..." className="pl-9" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t p-4 bg-muted/20">
                            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Manage your password and security settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-emerald-500" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Password</span>
                                        <span className="text-xs text-muted-foreground">Last changed 2 months ago</span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">Change Password</Button>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-destructive/5">
                                <div className="flex items-center gap-3">
                                    <LogOut className="h-5 w-5 text-destructive" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Logout Sessions</span>
                                        <span className="text-xs text-muted-foreground">Sign out from all other devices</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-destructive">Sign Out All</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
