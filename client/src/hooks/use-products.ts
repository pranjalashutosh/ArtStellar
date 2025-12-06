import { useQuery } from "@tanstack/react-query";

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface ApiProduct {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
  type: "physical" | "digital";
  status: "active" | "inactive" | "sold";
  medium?: string | null;
  dimensions?: string | null;
  year?: number | null;
  isFeatured: boolean;
  isNew: boolean;
  imageUrl?: string | null;
  heroImageUrl?: string | null;
  images?: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

interface UseProductsParams {
  category?: string;
  status?: string;
  featured?: boolean;
  isNew?: boolean;
  medium?: string;
  sort?: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function useProducts(params?: UseProductsParams) {
  const searchParams = params
    ? Object.entries(params).reduce((acc, [key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !(typeof value === "boolean" && value === false)
        ) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    : {};

  const queryString =
    Object.keys(searchParams).length > 0
      ? `?${new URLSearchParams(searchParams).toString()}`
      : "";

  return useQuery<ApiProduct[]>({
    queryKey: ["products", queryString],
    queryFn: async () => {
      return fetchJson<ApiProduct[]>(`/api/products${queryString}`);
    },
  });
}

export function useProduct(productId?: string) {
  return useQuery<ApiProduct | null>({
    queryKey: ["product", productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      if (!productId) return null;
      const res = await fetch(`/api/products/${productId}`, {
        credentials: "include",
      });

      if (res.status === 404) {
        return null;
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return (await res.json()) as ApiProduct;
    },
  });
}

