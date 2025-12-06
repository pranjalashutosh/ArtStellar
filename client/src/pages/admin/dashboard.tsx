import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  soldProducts: number;
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenue: number;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: products } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  // Calculate stats
  const stats: DashboardStats = {
    totalProducts: products?.length ?? 0,
    activeProducts: products?.filter((p) => p.status === "active").length ?? 0,
    soldProducts: products?.filter((p) => p.status === "sold").length ?? 0,
    totalOrders: orders?.length ?? 0,
    pendingOrders: orders?.filter((o) => o.paymentStatus === "pending").length ?? 0,
    paidOrders: orders?.filter((o) => o.paymentStatus === "paid").length ?? 0,
    totalRevenue:
      orders
        ?.filter((o) => o.paymentStatus === "paid")
        .reduce((sum, o) => sum + (o.totalCents || 0), 0) ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle={`${stats.activeProducts} active, ${stats.soldProducts} sold`}
          icon={Package}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle={`${stats.pendingOrders} pending, ${stats.paidOrders} paid`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="From paid orders"
          icon={DollarSign}
        />
        <StatCard
          title="Conversion"
          value={
            stats.totalProducts > 0
              ? `${Math.round((stats.soldProducts / stats.totalProducts) * 100)}%`
              : "0%"
          }
          subtitle="Products sold"
          icon={TrendingUp}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {order.email || "Guest"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(order.totalCents)}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          order.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : order.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/admin/products"
              className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <p className="font-medium text-sm">Add New Product</p>
              <p className="text-xs text-muted-foreground">
                Create a new artwork listing
              </p>
            </a>
            <a
              href="/admin/orders"
              className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <p className="font-medium text-sm">View All Orders</p>
              <p className="text-xs text-muted-foreground">
                Manage customer orders
              </p>
            </a>
            <a
              href="/admin/discounts"
              className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <p className="font-medium text-sm">Create Discount</p>
              <p className="text-xs text-muted-foreground">
                Set up promotional codes
              </p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

