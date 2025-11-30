import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

export function CartDrawer() {
  const { isOpen, toggleCart, items, removeItem, updateQuantity } = useCart();
  
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={toggleCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-background border-l border-border/40">
        <SheetHeader className="space-y-1 pb-4">
          <SheetTitle className="font-heading text-2xl">Your Collection</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? "Your cart is empty" : `${items.length} item${items.length === 1 ? "" : "s"} selected`}
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">Your cart is currently empty.</p>
              <Button variant="outline" onClick={toggleCart}>Continue Browsing</Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex gap-4"
                  >
                    <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-foreground">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{item.medium}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center border border-input rounded-full h-8">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="px-2 hover:bg-accent rounded-l-full h-full flex items-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 hover:bg-accent rounded-r-full h-full flex items-center"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="font-medium">${item.price * item.quantity}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <div className="pt-6 space-y-4">
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between font-heading text-lg pt-2">
                <span>Total</span>
                <span>${subtotal}</span>
              </div>
            </div>
            <SheetFooter>
              <Button className="w-full h-12 rounded-full text-base" size="lg">
                Proceed to Checkout
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
