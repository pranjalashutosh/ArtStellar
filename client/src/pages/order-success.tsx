import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { CheckCircle2, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/format";

interface OrderResponse {
  order: {
    id: string;
    email: string | null;
    name: string | null;
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    totalCents: number;
    status: string;
    paymentStatus: string;
  };
  items: Array<{
    id: string;
    productTitle: string;
    productType: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
}

interface DownloadsResponse {
  downloads: Array<{
    token: string;
    fileName: string;
    expiresAt: string;
    downloadCount: number;
    maxDownloads: number;
    url: string;
  }>;
}

export default function OrderSuccessPage() {
  const { clearCart } = useCart();
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [downloads, setDownloads] = useState<DownloadsResponse["downloads"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !orderId) {
      setError("Missing payment session information.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const [orderRes, downloadsRes] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch(`/api/orders/${orderId}/downloads?session_id=${encodeURIComponent(sessionId!)}`),
        ]);

        if (!orderRes.ok) {
          const err = await orderRes.json().catch(() => ({}));
          throw new Error(err.message || "Unable to load order details.");
        }

        const orderJson = (await orderRes.json()) as OrderResponse;
        const downloadsJson = downloadsRes.ok
          ? ((await downloadsRes.json()) as DownloadsResponse)
          : { downloads: [] };

        if (!isMounted) return;
        setOrderData(orderJson);
        setDownloads(downloadsJson.downloads || []);
        clearCart();
      } catch (err: any) {
        console.error("Order success error:", err);
        if (isMounted) {
          setError(err?.message || "Unable to load order details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [sessionId, orderId, clearCart]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-24 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Verifying your payment...</p>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-24 text-center space-y-6">
        <RefreshCw className="h-10 w-10 mx-auto text-destructive" />
        <div className="space-y-2">
          <h1 className="font-heading text-3xl text-primary">Payment status unknown</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {error ||
              "We couldn't confirm this order. Please check your email for confirmation or contact support."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild variant="default">
            <Link href="/">Return Home</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { order, items } = orderData;

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 space-y-10">
      <div className="text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Order confirmed</p>
          <h1 className="font-heading text-4xl text-primary">Thank you for your purchase</h1>
          <p className="text-muted-foreground">
            A confirmation email has been sent to <span className="font-medium">{order.email || "your inbox"}</span>.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-border rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="font-heading text-xl text-primary">Order Details</h2>
            <p className="text-sm text-muted-foreground">Order #{order.id}</p>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary">{item.productTitle}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.productType === "digital" ? "Digital" : "Original Artwork"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                  <p className="font-heading text-lg">
                    {formatCurrency(item.lineTotalCents)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <SummaryRow label="Subtotal" value={formatCurrency(order.subtotalCents)} />
            {order.discountCents > 0 && (
              <SummaryRow label="Discount" value={`- ${formatCurrency(order.discountCents)}`} muted />
            )}
            <SummaryRow label="Shipping" value={formatCurrency(order.shippingCents)} />
            <SummaryRow label="Total" value={formatCurrency(order.totalCents)} bold />
          </div>
        </section>

        <section className="border border-border rounded-2xl p-6 space-y-6">
          <h2 className="font-heading text-xl text-primary">Next Steps</h2>
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <p className="font-medium text-primary">Shipping</p>
              <p className="text-sm text-muted-foreground">
                Physical artworks ship within 5–7 business days. You will receive tracking details via email when your
                piece is on its way.
              </p>
            </div>

            {downloads.length > 0 && (
              <div className="rounded-xl bg-primary/5 p-4 space-y-2">
                <p className="font-medium text-primary">Digital Downloads</p>
                <p className="text-sm text-muted-foreground">
                  Your files are ready to download. Each link expires in 7 days and allows up to 5 downloads.
                </p>
                <div className="space-y-3">
                  {downloads.map((download) => (
                    <a
                      key={download.token}
                      href={download.url}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm hover:border-primary transition-colors"
                    >
                      <span className="flex flex-col">
                        <span className="font-medium text-primary">{download.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          {download.downloadCount}/{download.maxDownloads} downloads used · Expires{" "}
                          {new Date(download.expiresAt).toLocaleDateString()}
                        </span>
                      </span>
                      <Download className="h-4 w-4 text-primary" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/shop">Continue Exploring</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/contact">Need Help?</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`text-muted-foreground ${muted ? "opacity-70" : ""}`}>{label}</span>
      <span className={bold ? "font-heading text-lg text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}


