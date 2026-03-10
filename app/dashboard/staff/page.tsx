"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, MoreHorizontal, ShieldCheck, Mail, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { staffApi, invitationsApi } from "@/lib/api";
import { Download } from "lucide-react";
import { exportToExcel } from "@/lib/export-utils";
import { useSession } from "@/lib/auth-client";

export default function StaffPage() {
    const { data: session } = useSession();
    const [staff, setStaff] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const businessId = (session?.user as any)?.activeBusinessId;

    useEffect(() => {
        if (businessId) {
            fetchData();
        }
    }, [businessId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffData, inviteData] = await Promise.all([
                staffApi.getAll(businessId),
                invitationsApi.getAll(businessId)
            ]);
            setStaff(staffData);
            setInvitations(inviteData.invitations || []);
        } catch (error: any) {
            toast.error("Failed to fetch data: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const exportData = filteredStaff.map(s => ({
            Name: s.user?.name || "N/A",
            Email: s.user?.email || "N/A",
            Role: s.role,
            Status: "Active",
            Joined: new Date(s.createdAt).toLocaleDateString()
        }));
        exportToExcel(exportData, `Staff_List_${new Date().toISOString().split('T')[0]}`);
    };

    const filteredStaff = staff.filter(s =>
        (s.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInviteStaff = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!businessId) {
            toast.error("No active business selected");
            return;
        }

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const role = formData.get("role") as string;

        try {
            await invitationsApi.send({
                email,
                name,
                role,
                businessId
            });
            toast.success("Invitation processed successfully");
            setIsInviteOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error("Failed to send invitation: " + error.message);
        }
    };

    const handleRevokeInvitation = async (id: string) => {
        try {
            await invitationsApi.delete(id);
            fetchData();
            toast.success("Invitation revoked");
        } catch (error: any) {
            toast.error("Failed to revoke invitation: " + error.message);
        }
    };

    const handleDeleteStaff = async (id: string) => {
        try {
            await staffApi.remove(id);
            fetchData();
            toast.success("Staff member removed");
        } catch (error: any) {
            toast.error("Failed to remove staff: " + error.message);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Staff Management</h2>
                    <p className="text-muted-foreground">
                        Manage your team members and their access levels.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" /> Invite Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleInviteStaff}>
                                <DialogHeader>
                                    <DialogTitle>Invite New Member</DialogTitle>
                                    <DialogDescription>
                                        Send an invitation to join your business team.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">Name</Label>
                                        <Input id="name" name="name" placeholder="Staff Name" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="email" className="text-right">Email</Label>
                                        <Input id="email" name="email" type="email" placeholder="staff@example.com" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="role" className="text-right">Role</Label>
                                        <div className="col-span-3">
                                            <Select name="role" defaultValue="STAFF">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="OWNER">Owner</SelectItem>
                                                    <SelectItem value="STAFF">Staff</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Send Invitation</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search staff by name or email..."
                        className="pl-8 max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Show Active Staff */}
                        {staff.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{member.user?.name?.[0] || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium">{member.user?.name}</span>
                                        <span className="text-xs text-muted-foreground">{member.user?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {member.role === "OWNER" && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                                        {member.role}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="default">Active</Badge>
                                </TableCell>
                                <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>
                                                <Pencil className="mr-2 h-4 w-4" /> Manage Permissions
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDeleteStaff(member.id)}
                                                disabled={member.role === "OWNER"}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Remove from Business
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Show Pending Invitations */}
                        {invitations
                            .filter(inv => inv.status === 'PENDING')
                            .map((invite) => (
                                <TableRow key={invite.id} className="bg-muted/30">
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 opacity-50">
                                            <AvatarFallback>?</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col text-left opacity-70">
                                            <span className="font-medium">Invitation Sent</span>
                                            <span className="text-xs text-muted-foreground">{invite.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 opacity-70">
                                            {invite.role}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="animate-pulse">Pending</Badge>
                                    </TableCell>
                                    <TableCell className="opacity-70">{new Date(invite.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleRevokeInvitation(invite.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Revoke Invitation
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}

                        {(staff.length === 0 && invitations.filter(i => i.status === 'PENDING').length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">No staff or pending invitations found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
