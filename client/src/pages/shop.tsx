import { useEffect, useMemo, useState } from "react";
import { categories } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useProducts } from "@/hooks/use-products";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Shop() {
  const [location] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedMedium, setSelectedMedium] = useState("All");
  const [sortOrder, setSortOrder] = useState("recommended");

  const { data: products, isLoading } = useProducts({
    category: activeCategory !== "All" ? activeCategory : undefined,
    medium: selectedMedium !== "All" ? selectedMedium : undefined,
    sort: sortOrder !== "recommended" ? sortOrder : undefined,
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const categoryParam = searchParams.get("category");
    if (categoryParam && categories.includes(categoryParam)) {
      setActiveCategory(categoryParam);
    }

    const mediumParam = searchParams.get("medium");
    if (mediumParam) {
      setSelectedMedium(mediumParam);
    }

    const sortParam = searchParams.get("sort");
    if (sortParam) {
      setSortOrder(sortParam);
    }
  }, [location]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeCategory === "All") return products;
    return products.filter((product) => product.category === activeCategory);
  }, [products, activeCategory]);

  const mediumOptions = useMemo(() => {
    if (!products) return [];
    const set = new Set<string>();
    products.forEach((product) => {
      if (product.medium) {
        set.add(product.medium);
      }
    });
    return Array.from(set).sort();
  }, [products]);

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
              activeCategory === cat
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-accent",
            )}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {filteredProducts.length} item{filteredProducts.length === 1 ? "" : "s"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveCategory("All");
              setSelectedMedium("All");
              setSortOrder("recommended");
            }}
          >
            Reset Filters
          </Button>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <Select value={selectedMedium} onValueChange={setSelectedMedium}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by medium" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All mediums</SelectItem>
              {mediumOptions.map((medium) => (
                <SelectItem key={medium} value={medium}>
                  {medium}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest Arrivals</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
