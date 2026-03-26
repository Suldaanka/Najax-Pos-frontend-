"use client";

import { useState, useEffect } from "react";
import { Download, Plus, Search, Filter, ReceiptText, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
import { expensesApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { useBranch } from "@/lib/branch-context";

export default function ExpensesPage() {
  const { data: session } = useSession();
  const { currentBranchId, currentBranch } = useBranch();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const businessId = (session?.user as any)?.activeBusinessId;
  const userId = session?.user?.id;

  useEffect(() => {
    if (businessId) {
      fetchExpenses();
    }
  }, [businessId, currentBranchId]);

  const fetchExpenses = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await expensesApi.getAll(businessId, currentBranchId);
      setExpenses(data);
    } catch (error: any) {
      toast.error("Failed to fetch expenses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredExpenses.map(e => ({
      Description: e.description,
      Category: e.category,
      Amount: e.amount,
      Date: new Date(e.date).toLocaleDateString(),
      User: e.user?.name || "System"
    }));
    exportToExcel(exportData, `Expenses_Report_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const exportData = filteredExpenses.map(e => ({
      Description: e.description,
      Category: e.category,
      Amount: e.amount,
      Date: new Date(e.date).toLocaleDateString(),
      User: e.user?.name || "System"
    }));
    exportToPDF(
      exportData, 
      `Expenses_Report_${new Date().toISOString().split('T')[0]}`,
      "Business Expenses Report"
    );
  };

  const filteredExpenses = expenses.filter(e =>
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessId || !userId) {
      toast.error("User or Business context missing");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data = {
      businessId,
      userId,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      amount: parseFloat(formData.get("amount") as string),
      date: new Date().toISOString(),
      branchId: currentBranchId,
    };

    try {
      await expensesApi.create(data);
      fetchExpenses();
      setIsAddOpen(false);
      toast.success("Expense recorded successfully");
    } catch (error: any) {
      toast.error("Failed to record expense: " + error.message);
    }
  };

  const handleEditExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExpense) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      amount: parseFloat(formData.get("amount") as string),
    };

    try {
      await expensesApi.update(editingExpense.id, data);
      fetchExpenses();
      setIsEditOpen(false);
      setEditingExpense(null);
      toast.success("Expense updated successfully");
    } catch (error: any) {
      toast.error("Failed to update expense: " + error.message);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await expensesApi.delete(id);
      fetchExpenses();
      toast.success("Expense record deleted");
    } catch (error: any) {
      toast.error("Failed to delete expense: " + error.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Expenses</h2>
          <p className="text-muted-foreground">
            Track and categorize your business spending.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 px-4 rounded-lg border-primary/20 hover:bg-primary/5">
            <Download className="mr-2 h-4 w-4 text-primary" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-9 px-4 rounded-lg border-primary/20 hover:bg-primary/5">
            <Download className="mr-2 h-4 w-4 text-primary" /> Export PDF
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddExpense}>
                <DialogHeader>
                  <DialogTitle>Record Expense</DialogTitle>
                  <DialogDescription>
                    Enter the details of your business expenditure.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Input id="description" name="description" placeholder="e.g. Rent" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Amount ($)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <div className="col-span-3">
                      <Select name="category" defaultValue="Operations">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Meals">Meals</SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="Salaries">Salaries</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Expense</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleEditExpense}>
                <DialogHeader>
                  <DialogTitle>Edit Expense</DialogTitle>
                  <DialogDescription>
                    Update the details of your business expenditure.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-description" className="text-right">Description</Label>
                    <Input id="edit-description" name="description" defaultValue={editingExpense?.description} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-amount" className="text-right">Amount ($)</Label>
                    <Input id="edit-amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-category" className="text-right">Category</Label>
                    <div className="col-span-3">
                      <Select name="category" defaultValue={editingExpense?.category || "Operations"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Meals">Meals</SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="Salaries">Salaries</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Update Expense</Button>
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
            placeholder="Search expenses..."
            className="pl-8 max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> All Categories
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading expenses...</TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">No expenses found.</TableCell>
              </TableRow>
            ) : filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-muted-foreground" />
                  {expense.description}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{expense.category}</Badge>
                </TableCell>
                <TableCell>${expense.amount}</TableCell>
                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell>{expense.user?.name || "System"}</TableCell>
                <TableCell className="text-right gap-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingExpense(expense);
                      setIsEditOpen(true);
                    }}
                  >
                    Edit
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
    </div>
  );
}
