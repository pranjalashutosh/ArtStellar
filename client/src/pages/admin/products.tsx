import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { apiRequest } from "@/lib/queryClient";
import type { ApiProduct } from "@/hooks/use-products";

const categories = ["Sketches", "Abstract", "Sculptures", "Digital", "Paintings"];

interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface ProductFormData {
  title: string;
  description: string;
  priceCents: number;
  category: string;
  type: "physical" | "digital";
  status: "active" | "inactive" | "sold";
  medium: string;
  dimensions: string;
  year: number | null;
  isFeatured: boolean;
  isNew: boolean;
}

const defaultFormData: ProductFormData = {
  title: "",
  description: "",
  priceCents: 0,
  category: "Sketches",
  type: "physical",
  status: "active",
  medium: "",
  dimensions: "",
  year: null,
  isFeatured: false,
  isNew: false,
};

export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [priceInput, setPriceInput] = useState("");
  
  // Image upload state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: products, isLoading } = useQuery<ApiProduct[]>({
    queryKey: ["/api/products"],
  });

  // Fetch images for a product when editing
  const fetchProductImages = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/images`);
      if (res.ok) {
        const images = await res.json();
        setProductImages(images);
      }
    } catch (error) {
      console.error("Failed to fetch product images:", error);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: async (newProduct) => {
      // Upload pending images for the new product
      if (pendingImages.length > 0) {
        await uploadImages(newProduct.id);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created successfully" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating product", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return res.json();
    },
    onSuccess: async () => {
      // Upload any new pending images
      if (editingProduct && pendingImages.length > 0) {
        await uploadImages(editingProduct.id);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated successfully" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating product", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    },
  });

  const uploadImages = async (productId: string) => {
    if (pendingImages.length === 0) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      pendingImages.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(`/api/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload images");
      }

      toast({ title: "Images uploaded successfully" });
    } catch (error) {
      toast({ title: "Error uploading images", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      await fetch(`/api/images/${imageId}`, { method: "DELETE" });
      setProductImages((prev) => prev.filter((img) => img.id !== imageId));
      toast({ title: "Image deleted" });
    } catch (error) {
      toast({ title: "Error deleting image", variant: "destructive" });
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter((file) =>
      ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG, PNG, WebP, and GIF images are allowed",
        variant: "destructive",
      });
    }

    // Create preview URLs
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setPendingImages((prev) => [...prev, ...validFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [toast]);

  const removePendingImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(defaultFormData);
    setPriceInput("");
    setProductImages([]);
    setPendingImages([]);
    setPreviewUrls([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = async (product: ApiProduct) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      priceCents: product.priceCents,
      category: product.category,
      type: product.type,
      status: product.status,
      medium: product.medium || "",
      dimensions: product.dimensions || "",
      year: product.year || null,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
    });
    setPriceInput((product.priceCents / 100).toFixed(2));
    setPendingImages([]);
    setPreviewUrls([]);
    await fetchProductImages(product.id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    // Clean up preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData(defaultFormData);
    setPriceInput("");
    setProductImages([]);
    setPendingImages([]);
    setPreviewUrls([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(priceInput) * 100);
    const data = { ...formData, priceCents };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter products
  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || product.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your artwork inventory
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].url}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        product.type === "digital"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {product.type}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(product.priceCents)}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        product.status === "active"
                          ? "bg-green-100 text-green-700"
                          : product.status === "sold"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/product/${product.id}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {search || filterCategory !== "all" || filterStatus !== "all"
              ? "No products match your filters."
              : "No products yet. Add your first artwork!"}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div className="space-y-3">
              <Label>Product Images</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                {/* Existing Images */}
                {productImages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Current Images</p>
                    <div className="grid grid-cols-4 gap-3">
                      {productImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.alt || "Product image"}
                            className="h-24 w-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => deleteImage(image.id)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Images Preview */}
                {previewUrls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">New Images (will be uploaded on save)</p>
                    <div className="grid grid-cols-4 gap-3">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePendingImage(index)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex flex-col items-center justify-center py-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Images
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPEG, PNG, WebP, or GIF (max 10MB each)
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "physical" | "digital") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "sold") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medium">Medium</Label>
                <Input
                  id="medium"
                  value={formData.medium}
                  onChange={(e) =>
                    setFormData({ ...formData, medium: e.target.value })
                  }
                  placeholder="e.g., Oil on Canvas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) =>
                    setFormData({ ...formData, dimensions: e.target.value })
                  }
                  placeholder="e.g., 24 x 36 inches"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="e.g., 2024"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className="rounded border-input"
                />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNew}
                  onChange={(e) =>
                    setFormData({ ...formData, isNew: e.target.checked })
                  }
                  className="rounded border-input"
                />
                <span className="text-sm">New Arrival</span>
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
