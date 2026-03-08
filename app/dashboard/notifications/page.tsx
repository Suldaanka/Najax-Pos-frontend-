"use client";

import { Bell, CheckCircle2, Box, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";

const initialNotifications = [
    {
        id: "1",
        title: "Low Stock Alert",
        message: "Paracetamol 500mg is running low. Only 2 cartons remaining.",
        time: "10 mins ago",
        read: false,
        icon: Box,
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    },
    {
        id: "2",
        title: "New Staff Joined",
        message: "Ali has accepted your invitation and joined as STAFF.",
        time: "2 hours ago",
        read: false,
        icon: Users,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        id: "3",
        title: "Payment Received",
        message: "Customer Ahmed has paid $150 towards their credit loan.",
        time: "Yesterday",
        read: true,
        icon: Wallet,
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        id: "4",
        title: "System Update",
        message: "Najax POS has been updated to version 1.2 with new features.",
        time: "3 days ago",
        read: true,
        icon: Bell,
        color: "text-primary",
        bg: "bg-primary/10"
    }
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(initialNotifications);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        toast.success("All notifications marked as read.");
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        You have {unreadCount} unread message{unreadCount !== 1 && 's'}.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={markAllAsRead} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Stay updated with what's happening in your business.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {notifications.map((notification) => {
                            const Icon = notification.icon;
                            return (
                                <div
                                    key={notification.id}
                                    className={`flex gap-4 p-4 items-start hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-muted/20' : ''}`}
                                >
                                    <div className={`p-2 rounded-full mt-1 ${notification.bg} ${notification.color}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {notification.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                {notification.time}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
