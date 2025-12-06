import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Loader2, Package, Truck, CheckCircle, XCircle } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { apiRequest } from "@/lib/queryClient";

interface Order {
  id: string;
  email: string;
  name: string | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  status: string;
  paymentStatus: string;
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productType: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Package,
  paid: CheckCircle,
  shipped: Truck,
  completed: CheckCircle,
  cancelled: XCircle,
  failed: XCircle,
};

export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Note: This requires a backend endpoint to update order status
      // For now, we'll just show the UI
      toast({ title: "Status update", description: "Backend endpoint needed for status updates" });
    },
  });

  const openOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
    
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrderItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch order items:", error);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedOrder(null);
    setOrderItems([]);
  };

  // Filter orders
  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.email?.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      order.status === filterStatus ||
      order.paymentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary">Orders</h1>
        <p className="text-muted-foreground mt-1">
          View and manage customer orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.paymentStatus] || Package;
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {order.name || "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.totalCents)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          statusColors[order.paymentStatus] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {order.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          statusColors[order.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openOrderDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {search || filterStatus !== "all"
              ? "No orders match your filters."
              : "No orders yet."}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      statusColors[selectedOrder.paymentStatus] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Status</p>
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      statusColors[selectedOrder.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Customer</h3>
                <div className="text-sm space-y-1">
                  <p>{selectedOrder.name || "Guest"}</p>
                  <p className="text-muted-foreground">{selectedOrder.email}</p>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddressLine1 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <div className="text-sm text-muted-foreground">
                    <p>{selectedOrder.shippingAddressLine1}</p>
                    {selectedOrder.shippingAddressLine2 && (
                      <p>{selectedOrder.shippingAddressLine2}</p>
                    )}
                    <p>
                      {selectedOrder.shippingCity}, {selectedOrder.shippingState}{" "}
                      {selectedOrder.shippingPostalCode}
                    </p>
                    <p>{selectedOrder.shippingCountry}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Items</h3>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.productTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.productType} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        {formatCurrency(item.lineTotalCents)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotalCents)}</span>
                </div>
                {selectedOrder.discountCents > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(selectedOrder.shippingCents)}</span>
                </div>
                <div className="flex justify-between font-medium text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.totalCents)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

