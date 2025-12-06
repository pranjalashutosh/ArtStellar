import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Percent, DollarSign } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

interface DiscountFormData {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  maxUses: number | null;
  expiresAt: string | null;
}

const defaultFormData: DiscountFormData = {
  code: "",
  type: "percentage",
  value: 10,
  isActive: true,
  maxUses: null,
  expiresAt: null,
};

export default function AdminDiscounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>(defaultFormData);

  const { data: discounts, isLoading } = useQuery<Discount[]>({
    queryKey: ["/api/discounts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: DiscountFormData) => {
      const res = await apiRequest("POST", "/api/discounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discounts"] });
      toast({ title: "Discount created successfully" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating discount", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DiscountFormData> }) => {
      const res = await apiRequest("PUT", `/api/discounts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discounts"] });
      toast({ title: "Discount updated successfully" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating discount", description: error.message, variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingDiscount(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      isActive: discount.isActive,
      maxUses: discount.maxUses,
      expiresAt: discount.expiresAt,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingDiscount(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatValue = (discount: Discount) => {
    if (discount.type === "percentage") {
      return `${discount.value}%`;
    }
    return `$${(discount.value / 100).toFixed(2)}`;
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary">Discounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage promotional codes and discounts
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Discount
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : discounts && discounts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell>
                    <span className="font-mono font-medium">{discount.code}</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs">
                      {discount.type === "percentage" ? (
                        <Percent className="h-3 w-3" />
                      ) : (
                        <DollarSign className="h-3 w-3" />
                      )}
                      {discount.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatValue(discount)}
                  </TableCell>
                  <TableCell>
                    {discount.usedCount}
                    {discount.maxUses && ` / ${discount.maxUses}`}
                  </TableCell>
                  <TableCell>
                    {discount.expiresAt
                      ? new Date(discount.expiresAt).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        discount.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {discount.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(discount)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No discount codes yet. Create your first promotion!
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDiscount ? "Edit Discount" : "Create Discount"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Discount Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g., SUMMER20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  Value {formData.type === "percentage" ? "(%)" : "(cents)"} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses (optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={formData.maxUses || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUses: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires (optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt?.split("T")[0] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiresAt: e.target.value ? `${e.target.value}T23:59:59Z` : null,
                    })
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-input"
              />
              <span className="text-sm">Active</span>
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingDiscount ? "Save Changes" : "Create Discount"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

