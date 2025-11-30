import { useRoute } from "wouter";
import { products } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import NotFound from "./not-found";

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const id = params?.id ? parseInt(params.id) : null;
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return <NotFound />;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        {/* Image */}
        <div className="relative bg-muted rounded-lg overflow-hidden aspect-[3/4] md:aspect-auto md:h-[80vh]">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <span className="text-sm uppercase tracking-widest text-secondary">{product.category}</span>
            <h1 className="font-heading text-4xl md:text-5xl text-primary">{product.name}</h1>
            <p className="text-2xl font-medium text-primary">${product.price}</p>
          </div>

          <div className="prose prose-stone max-w-none text-muted-foreground">
            <p>{product.description}</p>
          </div>

          <div className="space-y-4 py-6">
             <div className="flex items-center justify-between py-3 border-b border-border">
               <span className="font-medium text-primary">Medium</span>
               <span className="text-muted-foreground">{product.medium}</span>
             </div>
             <div className="flex items-center justify-between py-3 border-b border-border">
               <span className="font-medium text-primary">Dimensions</span>
               <span className="text-muted-foreground">{product.dimensions}</span>
             </div>
          </div>

          <div className="flex gap-4">
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
            <Button 
              onClick={handleAddToCart}
              className="flex-1 h-12 rounded-full text-base"
            >
              Add to Cart
            </Button>
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
