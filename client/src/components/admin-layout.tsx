import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return location === "/admin";
    return location.startsWith(href);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-heading text-xl text-primary">Prana</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            isActive={isActive(item.href)}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Store
        </Link>
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-background border-r border-border">
        {sidebar}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-heading text-xl text-primary">Prana</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            {sidebar}
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

