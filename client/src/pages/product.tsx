import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Heart, Share2, Loader2, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useProduct } from "@/hooks/use-products";
import NotFound from "./not-found";
import { getProductImage } from "@/lib/product-images";
import { centsToNumber, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id;
  const { data: product, isLoading } = useProduct(productId);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use uploaded images if available, otherwise fall back to placeholder
  const images = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images.map((img) => img.url);
    }
    return [getProductImage(product ?? undefined)];
  }, [product]);

  const currentImage = images[currentImageIndex] || images[0];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const isSold = product?.status === "sold";
  const isPhysical = product?.type === "physical";
  const isDigital = product?.type === "digital";

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-24 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return <NotFound />;
  }

  const priceLabel = formatCurrency(product.priceCents);

  const handleAddToCart = () => {
    if (isSold && isPhysical) return;

    const cartProduct = {
      id: product.id,
      name: product.title,
      description: product.description,
      price: centsToNumber(product.priceCents),
      category: product.category,
      image: images[0], // Use first uploaded image or fallback
      medium: product.medium ?? undefined,
      dimensions: product.dimensions ?? undefined,
      type: product.type,
    };

    for (let i = 0; i < quantity; i++) {
      addItem(cartProduct);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-[3/4] md:aspect-auto md:h-[80vh]">
            <img src={currentImage} alt={product.title} className="w-full h-full object-cover" />
            
            {/* Navigation arrows for multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
          
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors",
                    currentImageIndex === index
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <img src={img} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-secondary">
              <span>{product.category}</span>
              {isDigital && <span className="text-muted-foreground">Digital Download</span>}
              {isPhysical && <span className="text-muted-foreground">Original Artwork</span>}
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-primary">{product.title}</h1>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-medium text-primary">{priceLabel}</p>
              {isSold && isPhysical && (
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-destructive">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          <div className="prose prose-stone max-w-none text-muted-foreground">
            <p>{product.description}</p>
          </div>

          <div className="space-y-4 py-6">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="font-medium text-primary">Medium</span>
              <span className="text-muted-foreground">{product.medium || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="font-medium text-primary">Dimensions</span>
              <span className="text-muted-foreground">{product.dimensions || "—"}</span>
            </div>
          </div>

          <div className="space-y-4">
            {isPhysical && (
              <div className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
                This is a unique original artwork (1 of 1). Only one available.
              </div>
            )}
            <div className="flex gap-4">
              {!isPhysical && (
                <div className="flex items-center border border-input rounded-full h-12 w-32">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex-1 h-full flex items-center justify-center hover:bg-accent rounded-l-full"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-medium w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex-1 h-full flex items-center justify-center hover:bg-accent rounded-r-full"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              <Button
                onClick={handleAddToCart}
                className="flex-1 h-12 rounded-full text-base"
                disabled={isSold && isPhysical}
              >
                {isSold && isPhysical ? "Sold Out" : "Add to Cart"}
              </Button>
            </div>

            {isDigital && (
              <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                <span>Instant digital delivery after payment. Download links remain active for 7 days.</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <Heart className="h-4 w-4" /> Add to Wishlist
            </button>
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
