import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";

function detectItemType(category: string | undefined, type?: string) {
  if (type) return type;
  if (!category) return "physical";
  return category.toLowerCase() === "digital" ? "digital" : "physical";
}

export function CartDrawer() {
  const { isOpen, toggleCart, items, removeItem, updateQuantity } = useCart();
  const { toast } = useToast();

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotalLabel = formatCurrency(Math.round(subtotal * 100));
  const hasPhysicalItems = useMemo(
    () => items.some((item) => detectItemType(item.category, item.type) === "physical"),
    [items],
  );
  const hasDigitalItems = useMemo(
    () => items.some((item) => detectItemType(item.category, item.type) === "digital"),
    [items],
  );

  const [form, setForm] = useState({
    email: "",
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange =
    (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  async function handleCheckout() {
    if (items.length === 0) return;

    if (!form.email) {
      toast({ title: "Email required", description: "Please provide your email to receive order updates.", variant: "destructive" });
      return;
    }

    if (hasPhysicalItems) {
      const requiredFields: Array<keyof typeof form> = ["name", "line1", "city", "state", "postalCode"];
      for (const field of requiredFields) {
        if (!form[field]) {
          toast({ title: "Shipping details incomplete", description: "Please fill in all required shipping fields.", variant: "destructive" });
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        items: items.map((item) => ({
          productId: String(item.id),
          quantity: item.quantity,
        })),
        customerEmail: form.email,
      };

      if (hasPhysicalItems) {
        payload.shippingAddress = {
          name: form.name,
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: "US",
        };
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Unable to start checkout. Please try again.");
      }

      const data = await response.json();
      if (data?.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else if (data?.sessionId) {
        // Fallback to Stripe.js redirect (if needed in future)
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      } else {
        throw new Error("Invalid response from checkout.");
      }
    } catch (error: any) {
      console.error("Checkout error", error);
      toast({
        title: "Checkout failed",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
                        {item.type === "physical" ? (
                          <div className="text-xs text-muted-foreground">Original (1 of 1)</div>
                        ) : (
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
                        )}
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
                <span>{subtotalLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between font-heading text-lg pt-2">
                <span>Total</span>
                <span>{subtotalLabel}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="checkout-email" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleInputChange("email")}
                  />
                </div>

                {hasPhysicalItems && (
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="checkout-name" className="text-xs uppercase tracking-wide text-muted-foreground">
                        Full Name
                      </Label>
                      <Input
                        id="checkout-name"
                        placeholder="Full name"
                        value={form.name}
                        onChange={handleInputChange("name")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkout-line1" className="text-xs uppercase tracking-wide text-muted-foreground">
                        Address Line 1
                      </Label>
                      <Input
                        id="checkout-line1"
                        placeholder="Street address"
                        value={form.line1}
                        onChange={handleInputChange("line1")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkout-line2" className="text-xs uppercase tracking-wide text-muted-foreground">
                        Address Line 2 (optional)
                      </Label>
                      <Input
                        id="checkout-line2"
                        placeholder="Apartment, suite, etc."
                        value={form.line2}
                        onChange={handleInputChange("line2")}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="checkout-city" className="text-xs uppercase tracking-wide text-muted-foreground">
                          City
                        </Label>
                        <Input
                          id="checkout-city"
                          placeholder="City"
                          value={form.city}
                          onChange={handleInputChange("city")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="checkout-state" className="text-xs uppercase tracking-wide text-muted-foreground">
                          State
                        </Label>
                        <Input
                          id="checkout-state"
                          placeholder="State"
                          value={form.state}
                          onChange={handleInputChange("state")}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="checkout-postal" className="text-xs uppercase tracking-wide text-muted-foreground">
                        Postal Code
                      </Label>
                      <Input
                        id="checkout-postal"
                        placeholder="ZIP / Postal code"
                        value={form.postalCode}
                        onChange={handleInputChange("postalCode")}
                      />
                    </div>
                  </div>
                )}
              </div>
              <SheetFooter>
                <Button
                  className="w-full h-12 rounded-full text-base"
                  size="lg"
                  disabled={isSubmitting}
                  onClick={handleCheckout}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </span>
                  ) : (
                    "Proceed to Checkout"
                  )}
                </Button>
              </SheetFooter>
              {hasDigitalItems && (
                <p className="text-xs text-muted-foreground text-center">
                  Digital downloads will be available immediately after payment.
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
