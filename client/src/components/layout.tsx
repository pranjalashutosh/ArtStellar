import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, X, Search, Facebook, Instagram, Twitter } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "./cart-drawer";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { toggleCart, items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      {/* Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
          isScrolled ? "bg-background/95 backdrop-blur-sm py-4 border-border/40 shadow-sm" : "bg-transparent py-6"
        )}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-primary">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-background border-r border-border/40">
              <SheetHeader className="mb-8 text-left">
                <SheetTitle className="font-heading text-2xl">Prana</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "text-lg font-medium transition-colors hover:text-primary/70",
                      location === link.href ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link 
            href="/"
            className="font-heading text-2xl md:text-3xl tracking-tight text-primary cursor-pointer"
          >
            Prana<span className="text-secondary">.</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "text-sm font-medium tracking-wide transition-all hover:text-primary/70 uppercase",
                  location === link.href ? "text-primary border-b border-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden sm:flex text-primary hover:bg-accent">
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              className="relative text-primary hover:bg-accent"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 md:pt-32 relative z-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground pt-16 pb-8 relative z-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="font-heading text-2xl">Prana.</h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
                A sanctuary for spiritual art, capturing the essence of yoga, devotion, and stillness through varied mediums.
              </p>
            </div>
            
            <div>
              <h4 className="font-heading text-lg mb-6">Explore</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/70 flex flex-col">
                <Link href="/shop" className="hover:text-white transition-colors">All Artwork</Link>
                <Link href="/shop?category=Sketches" className="hover:text-white transition-colors">Sketches</Link>
                <Link href="/shop?category=Sculptures" className="hover:text-white transition-colors">Sculptures</Link>
                <Link href="/about" className="hover:text-white transition-colors">About the Artist</Link>
              </ul>
            </div>

            <div>
              <h4 className="font-heading text-lg mb-6">Support</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/70 flex flex-col">
                <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Shipping & Returns</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Commission Work</Link>
                <Link href="/contact" className="hover:text-white transition-colors">FAQ</Link>
              </ul>
            </div>

            <div>
              <h4 className="font-heading text-lg mb-6">Stay Connected</h4>
              <div className="flex gap-4 mb-6">
                <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
              <p className="text-xs text-primary-foreground/50">
                Subscribe to our newsletter for new collection alerts.
              </p>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary-foreground/40">
            <p>&copy; {new Date().getFullYear()} Prana Art Gallery. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
