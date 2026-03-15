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
    const [performance, setPerformance] = useState<any[]>([]);
    const [view, setView] = useState<"list" | "performance">("list");

    const businessId = (session?.user as any)?.activeBusinessId;

    useEffect(() => {
        if (businessId) {
            fetchData();
        }
    }, [businessId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffData, inviteData, performanceData] = await Promise.all([
                staffApi.getAll(businessId),
                invitationsApi.getAll(businessId),
                staffApi.getPerformance()
            ]);
            setStaff(staffData);
            setInvitations(inviteData.invitations || []);
            setPerformance(performanceData);
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

    const filteredInvitations = invitations.filter(i =>
        i.status === 'PENDING' && (
            (i.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.role || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
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
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Staff Management
                        <Badge variant="outline" className="text-[10px] font-black bg-primary/10 text-primary border-primary/20 animate-pulse">v2.0 ENTERPRISE</Badge>
                    </h2>
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

            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search staff..."
                        className="pl-8 max-w-sm h-9 bg-muted/50 border-none rounded-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-primary/5">
                    <Button 
                        variant={view === "list" ? "secondary" : "ghost"} 
                        size="sm" 
                        className={`text-[10px] font-black uppercase tracking-widest h-8 px-4 ${view === "list" ? "shadow-sm" : ""}`}
                        onClick={() => setView("list")}
                    >
                        Team List
                    </Button>
                    <Button 
                        variant={view === "performance" ? "secondary" : "ghost"} 
                        size="sm" 
                        className={`text-[10px] font-black uppercase tracking-widest h-8 px-4 ${view === "performance" ? "shadow-sm" : ""}`}
                        onClick={() => setView("performance")}
                    >
                        Performance
                    </Button>
                </div>
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                {view === "list" ? (
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Member</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Role</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Joined</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic text-xs">
                                        Synchronizing team records...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {/* Show Active Staff */}
                                    {filteredStaff.map((member) => (
                                        <TableRow key={member.id} className="group transition-colors hover:bg-muted/30">
                                            <TableCell className="flex items-center gap-3 py-4">
                                                <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                                    <AvatarFallback className="bg-primary/5 text-primary font-bold">{member.user?.name?.[0] || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-bold text-sm">{member.user?.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">{member.user?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {member.role === "OWNER" ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none text-[9px] font-black uppercase px-2 py-0">Owner</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0 border-primary/20 text-primary/70">Staff</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-bold uppercase text-emerald-600">Active</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-muted-foreground">{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[180px]">
                                                        <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50 px-2 py-1.5">Staff Options</DropdownMenuLabel>
                                                        <DropdownMenuItem className="text-xs font-bold">
                                                            <Pencil className="mr-2 h-3.5 w-3.5" /> Manage Permissions
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive text-xs font-bold"
                                                            onClick={() => handleDeleteStaff(member.id)}
                                                            disabled={member.role === "OWNER"}
                                                        >
                                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove Staff
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Show Pending Invitations */}
                                    {filteredInvitations.map((invite) => (
                                        <TableRow key={invite.id} className="bg-muted/10 border-l-2 border-l-amber-500/30">
                                            <TableCell className="flex items-center gap-3 py-4">
                                                <Avatar className="h-9 w-9 opacity-40 grayscale">
                                                    <AvatarFallback>?</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col text-left opacity-70">
                                                    <span className="font-bold text-sm flex items-center gap-2 italic text-muted-foreground/80">
                                                        Awaiting Acceptance
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">{invite.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0 border-amber-500/20 text-amber-600/70">{invite.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="animate-pulse bg-amber-500/5 border-amber-500/30 text-amber-600 text-[9px] font-black uppercase px-2 py-0">Pending</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-muted-foreground/60">{new Date(invite.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive text-xs font-bold"
                                                            onClick={() => handleRevokeInvitation(invite.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Revoke Invitation
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {(filteredStaff.length === 0 && filteredInvitations.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic text-xs">
                                                No staff members found matching "{searchQuery}"
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )}
                        </TableBody>
                    </Table>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Personnel</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Total Sales</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Total Revenue</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Rank</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic text-xs">
                                        Calculating productivity metrics...
                                    </TableCell>
                                </TableRow>
                            ) : performance.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic text-xs">
                                        No performance data available.
                                    </TableCell>
                                </TableRow>
                            ) : performance
                                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                                .map((p, idx) => (
                                <TableRow key={p.id} className="group transition-colors hover:bg-muted/30">
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm tracking-tight">{p.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-black opacity-40">{p.role}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden max-w-[100px]">
                                                <div 
                                                    className="h-full bg-blue-500 rounded-full" 
                                                    style={{ width: `${Math.min(100, (p.salesCount / Math.max(...performance.map(x => x.salesCount || 1))) * 100)}%` }} 
                                                />
                                            </div>
                                            <span className="text-sm font-black text-primary">{p.salesCount}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-base font-black text-emerald-600">${p.totalRevenue.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] font-black uppercase ${idx === 0 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : idx === 1 ? 'bg-slate-400/10 text-slate-500 border-slate-400/20' : 'text-muted-foreground opacity-40'}`}>
                                            {idx === 0 ? '👑 Leader' : idx === 1 ? '🥈 Runner Up' : `#${idx + 1}`}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
