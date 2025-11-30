import { useState, useEffect } from "react";
import { products, categories } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Shop() {
  const [location] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Simple query param parsing
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const categoryParam = searchParams.get("category");
    if (categoryParam && categories.includes(categoryParam)) {
      setActiveCategory(categoryParam);
    }
  }, [location]);

  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="text-center space-y-4 mb-12">
        <h1 className="font-heading text-4xl md:text-5xl text-primary">The Collection</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Browse our curated selection of spiritual artwork, from detailed sketches to evocative sculptures.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full px-6",
              activeCategory === cat ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-24">
          <p className="text-muted-foreground">No products found in this category.</p>
          <Button 
            variant="link" 
            onClick={() => setActiveCategory("All")}
            className="mt-2"
          >
            View all products
          </Button>
        </div>
      )}
    </div>
  );
}
