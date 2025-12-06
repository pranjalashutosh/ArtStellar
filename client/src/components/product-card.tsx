import { Link } from "wouter";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ApiProduct } from "@/hooks/use-products";
import { getProductImage } from "@/lib/product-images";
import { formatCurrency, centsToNumber } from "@/lib/format";

interface ProductCardProps {
  product: ApiProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  // Use uploaded image if available, otherwise fall back to placeholder
  const image = product.images && product.images.length > 0 
    ? product.images[0].url 
    : getProductImage(product);
  const priceLabel = formatCurrency(product.priceCents);
  const isSold = product.status === "sold";
  const isPhysical = product.type === "physical";
  const itemTypeLabel = product.type === "digital" ? "Digital Download" : "Original Artwork";

  const handleAddToCart = () => {
    if (isSold && isPhysical) return;
    addItem({
      id: product.id,
      name: product.title,
      description: product.description,
      price: centsToNumber(product.priceCents),
      category: product.category,
      image,
      medium: product.medium ?? undefined,
      dimensions: product.dimensions ?? undefined,
      type: product.type,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col gap-3"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted isolate transform-gpu">
        <Link href={`/product/${product.id}`} className="block h-full w-full">
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-white/90 backdrop-blur-sm text-primary hover:bg-white shadow-sm"
            disabled={isSold && isPhysical}
          >
            {isSold && isPhysical ? (
              "Sold Out"
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {product.category} • {itemTypeLabel}
        </p>
        <Link
          href={`/product/${product.id}`}
          className="font-heading text-lg text-primary hover:underline decoration-1 underline-offset-4 block"
        >
          {product.title}
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-sm text-secondary font-medium">{priceLabel}</p>
          {isSold && isPhysical && (
            <span className="text-xs font-medium text-destructive">Sold</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
