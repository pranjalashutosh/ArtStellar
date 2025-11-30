import { Link } from "wouter";
import { motion } from "framer-motion";
import { Product, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col gap-3"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        <Link href={`/product/${product.id}`} className="block h-full w-full">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Button 
            onClick={() => addItem(product)}
            className="w-full bg-white/90 backdrop-blur-sm text-primary hover:bg-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</p>
        <Link 
          href={`/product/${product.id}`}
          className="font-heading text-lg text-primary hover:underline decoration-1 underline-offset-4 block"
        >
          {product.name}
        </Link>
        <p className="text-sm text-secondary font-medium">${product.price}</p>
      </div>
    </motion.div>
  );
}
