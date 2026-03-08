"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Repeat, Trash2, Edit } from "lucide-react";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { recurringExpensesApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function RecurringExpensesPage() {
    const { data: session } = useSession();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const businessId = (session?.user as any)?.activeBusinessId;

    useEffect(() => {
        if (businessId) {
            fetchExpenses();
        }
    }, [businessId]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const data = await recurringExpensesApi.getAll();
            setExpenses(data);
        } catch (error: any) {
            toast.error("Failed to fetch recurring expenses: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredExpenses = expenses.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            amount: parseFloat(formData.get("amount") as string),
        };

        try {
            await recurringExpensesApi.create(data);
            fetchExpenses();
            setIsAddOpen(false);
            toast.success("Recurring expense added");
        } catch (error: any) {
            toast.error("Failed to add expense: " + error.message);
        }
    };

    const handleEditExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingExpense) return;

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            amount: parseFloat(formData.get("amount") as string),
        };

        try {
            await recurringExpensesApi.update(editingExpense.id, data);
            fetchExpenses();
            setIsEditOpen(false);
            setEditingExpense(null);
            toast.success("Recurring expense updated");
        } catch (error: any) {
            toast.error("Failed to update expense: " + error.message);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm("Are you sure you want to delete this recurring expense?")) return;
        try {
            await recurringExpensesApi.delete(id);
            fetchExpenses();
            toast.success("Recurring expense deleted");
        } catch (error: any) {
            toast.error("Failed to delete expense: " + error.message);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Recurring Monthly Expenses</h2>
                    <p className="text-muted-foreground">
                        Manage fixed monthly costs like Rent, Electricity, and Salaries.
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Monthly Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleAddExpense}>
                            <DialogHeader>
                                <DialogTitle>Add Recurring Expense</DialogTitle>
                                <DialogDescription>
                                    This expense will be deducted from your monthly revenue automatically.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" name="name" placeholder="e.g. Rent" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="amount" className="text-right">Amount ($)</Label>
                                    <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save Expense</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search recurring expenses..."
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
                            <TableHead>Expense Name</TableHead>
                            <TableHead>Monthly Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">Loading...</TableCell>
                            </TableRow>
                        ) : filteredExpenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">No recurring expenses found.</TableCell>
                            </TableRow>
                        ) : filteredExpenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Repeat className="h-4 w-4 text-muted-foreground" />
                                    {expense.name}
                                </TableCell>
                                <TableCell>${Number(expense.amount).toFixed(2)}</TableCell>
                                <TableCell className="text-right gap-2 flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setEditingExpense(expense);
                                            setIsEditOpen(true);
                                        }}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => handleDeleteExpense(expense.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleEditExpense}>
                        <DialogHeader>
                            <DialogTitle>Edit Recurring Expense</DialogTitle>
                            <DialogDescription>
                                Update your fixed monthly cost details.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">Name</Label>
                                <Input id="edit-name" name="name" defaultValue={editingExpense?.name} className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-amount" className="text-right">Amount ($)</Label>
                                <Input id="edit-amount" name="amount" type="number" step="0.01" defaultValue={Number(editingExpense?.amount).toString()} className="col-span-3" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Update Expense</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
