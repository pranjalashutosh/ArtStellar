import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { getProductImage, getCategoryImage } from "@/lib/product-images";

export default function Home() {
  const { data: products, isLoading } = useProducts();

  const featuredProducts =
    (products?.filter((product) => product.isFeatured) ?? products ?? []).slice(0, 3);
  const newArrivals =
    (products?.filter((product) => product.isNew) ?? products ?? []).slice(0, 4);

  const heroImage = getProductImage(featuredProducts[0] ?? products?.[0]);

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
          <img
            src={heroImage}
            alt="Hero background"
            className="w-full h-full object-cover object-center opacity-90"
          />
        </div>
        
        <div className="container relative z-10 px-4 text-center max-w-4xl mx-auto space-y-8">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block text-primary-foreground font-medium tracking-[0.2em] uppercase text-sm"
          >
            Spiritual Art & Sculptures
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-heading text-5xl md:text-7xl lg:text-8xl text-white leading-tight"
          >
            Art that breathes <br/> stillness.
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-4"
          >
            <Link href="/shop">
              <Button size="lg" className="rounded-full h-14 px-8 text-base bg-white text-primary hover:bg-white/90 border-none">
                Explore Collection
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="space-y-2">
            <h2 className="font-heading text-3xl md:text-4xl text-primary">Featured Works</h2>
            <p className="text-muted-foreground max-w-md">Handpicked pieces that embody the essence of devotion and mindfulness.</p>
          </div>
          <Link 
            href="/shop"
            className="group flex items-center text-primary font-medium hover:text-primary/70 transition-colors"
          >
            View All Works <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {featuredProducts.length === 0 && (
              <p className="text-muted-foreground">No featured pieces yet. Check back soon.</p>
            )}
          </div>
        )}
      </section>

      {/* Quote Section */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl leading-relaxed italic">
            "Art is not just what you see, but what you make others feel. It is a bridge between the seen and the unseen."
          </h2>
          <div className="mt-8 w-16 h-px bg-primary-foreground/30 mx-auto" />
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <span className="text-sm uppercase tracking-widest text-secondary mb-2 block">Fresh from the Studio</span>
          <h2 className="font-heading text-3xl md:text-4xl text-primary">New Additions</h2>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {newArrivals.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center">
                New artworks are coming soon. Join our newsletter to be the first to know.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 md:px-6 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/shop?category=Sketches">
            <div className="group relative h-[300px] md:h-[600px] overflow-hidden rounded-lg cursor-pointer">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <img src={getCategoryImage("Sketches")} alt="Sketches" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="font-heading text-4xl text-white">Sketches</h3>
              </div>
            </div>
          </Link>
          <div className="grid grid-rows-2 gap-4">
             <Link href="/shop?category=Sculptures">
              <div className="group relative h-[300px] md:h-[296px] overflow-hidden rounded-lg cursor-pointer">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <img src={getCategoryImage("Sculptures")} alt="Sculptures" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="font-heading text-3xl text-white">Sculptures</h3>
                </div>
              </div>
            </Link>
             <Link href="/shop?category=Abstract">
              <div className="group relative h-[300px] md:h-[296px] overflow-hidden rounded-lg cursor-pointer">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <img src={getCategoryImage("Abstract")} alt="Abstract" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="font-heading text-3xl text-white">Abstract</h3>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
