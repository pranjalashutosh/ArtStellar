import type { ApiProduct } from "@/hooks/use-products";
import ganeshaImg from "@assets/generated_images/pencil_sketch_of_lord_ganesha.png";
import yogaAbstractImg from "@assets/generated_images/abstract_yoga_painting.png";
import yogaSketchImg from "@assets/generated_images/charcoal_yoga_sketch.png";
import lotusImg from "@assets/generated_images/digital_lotus_painting.png";
import krishnaImg from "@assets/generated_images/krishna_sculpture.png";

const CATEGORY_FALLBACKS: Record<string, string> = {
  sketches: yogaSketchImg,
  abstract: yogaAbstractImg,
  digital: lotusImg,
  sculptures: krishnaImg,
};

const DEFAULT_IMAGE = ganeshaImg;

export function getProductImage(product?: ApiProduct | null): string {
  if (!product) return DEFAULT_IMAGE;
  
  // Use uploaded images first
  if (product.images && product.images.length > 0) {
    return product.images[0].url;
  }
  
  // Fallback to legacy fields if they exist
  if (product.imageUrl) return product.imageUrl;
  if (product.heroImageUrl) return product.heroImageUrl;

  // Finally, fall back to category-based image
  return getCategoryImage(product.category);
}

export function getCategoryImage(category?: string): string {
  if (!category) return DEFAULT_IMAGE;
  const key = category.toLowerCase();
  return CATEGORY_FALLBACKS[key] ?? DEFAULT_IMAGE;
}

