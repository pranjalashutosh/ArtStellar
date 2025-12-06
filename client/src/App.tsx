import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AdminLayout } from "@/components/admin-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

import Home from "@/pages/home";
import Shop from "@/pages/shop";
import ProductPage from "@/pages/product";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";
import OrderSuccess from "@/pages/order-success";
import Login from "@/pages/login";
import Register from "@/pages/register";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminDiscounts from "@/pages/admin/discounts";
import AdminSettings from "@/pages/admin/settings";

function AdminRouter() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminLayout>
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/products" component={AdminProducts} />
          <Route path="/admin/orders" component={AdminOrders} />
          <Route path="/admin/discounts" component={AdminDiscounts} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route component={NotFound} />
        </Switch>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function StoreRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/product/:id" component={ProductPage} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/order/success" component={OrderSuccess} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  if (isAdminRoute) {
    return <AdminRouter />;
  }

  return <StoreRouter />;
}

function App() {
  const { fetchCurrentUser } = useAuth();

  // Fetch current user on app mount
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
