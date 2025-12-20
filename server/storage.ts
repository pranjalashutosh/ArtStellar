import {
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Discount,
  type InsertDiscount,
  type ProductImage,
  type InsertProductImage,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { hashPassword } from "./auth-utils";

// modify the interface with any CRUD methods
// you might need

export interface DownloadToken {
  token: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  expiresAt: Date;
  maxDownloads: number;
  downloadCount: number;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<Omit<User, "id">>): Promise<User | undefined>;

  // Products
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    updates: Partial<InsertProduct>,
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  markProductSold(id: string): Promise<Product | undefined>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined>;
  listOrders(): Promise<Order[]>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  addOrderItem(orderId: string, item: InsertOrderItem): Promise<OrderItem>;
  listOrderItems(orderId: string): Promise<OrderItem[]>;

  // Discounts
  listDiscounts(): Promise<Discount[]>;
  getDiscountByCode(code: string): Promise<Discount | undefined>;
  createDiscount(discount: InsertDiscount): Promise<Discount>;
  updateDiscount(
    id: string,
    updates: Partial<InsertDiscount>,
  ): Promise<Discount | undefined>;

  // Product Images
  listProductImages(productId: string): Promise<ProductImage[]>;
  addProductImage(image: InsertProductImage): Promise<ProductImage>;
  deleteProductImage(id: string): Promise<void>;
  deleteProductImages(productId: string): Promise<void>;

  // Digital downloads
  createDownloadToken(token: DownloadToken): Promise<DownloadToken>;
  getDownloadToken(token: string): Promise<DownloadToken | undefined>;
  listDownloadTokensForOrder(orderId: string): Promise<DownloadToken[]>;
  incrementDownloadCount(token: string): Promise<void>;
  revokeDownloadToken(token: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private productImages: Map<string, ProductImage>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private discounts: Map<string, Discount>;
  private downloadTokens: Map<string, DownloadToken>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.productImages = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.discounts = new Map();
    this.downloadTokens = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    // Hash password before storing
    const hashedPassword = await hashPassword(insertUser.password);
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: hashedPassword,
      role: insertUser.role ?? "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<Omit<User, "id">>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    // If password is being updated, hash it
    let hashedPassword = existing.password;
    if (updates.password) {
      hashedPassword = await hashPassword(updates.password);
    }

    const updated: User = {
      ...existing,
      ...updates,
      password: hashedPassword,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  // Products

  async listProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    // In a real DB-backed implementation, defaults (createdAt, etc.) would be handled by the DB.
    const product: Product = {
      id,
      ...(insertProduct as any),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    const updated: Product = {
      ...existing,
      ...(updates as any),
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async markProductSold(id: string): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    const updated: Product = {
      ...existing,
      status: "sold",
    };
    this.products.set(id, updated);
    return updated;
  }

  // Orders

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      id,
      ...(insertOrder as any),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.paymentReference === sessionId,
    );
  }

  async listOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;

    const updated: Order = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.orders.set(id, updated);
    return updated;
  }

  async addOrderItem(
    orderId: string,
    insertItem: InsertOrderItem,
  ): Promise<OrderItem> {
    const id = randomUUID();
    const item: OrderItem = {
      id,
      orderId,
      ...(insertItem as any),
    };
    this.orderItems.set(id, item);
    return item;
  }

  async listOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId,
    );
  }

  // Discounts

  async listDiscounts(): Promise<Discount[]> {
    return Array.from(this.discounts.values());
  }

  async getDiscountByCode(code: string): Promise<Discount | undefined> {
    return Array.from(this.discounts.values()).find(
      (discount) => discount.code.toLowerCase() === code.toLowerCase(),
    );
  }

  async createDiscount(insertDiscount: InsertDiscount): Promise<Discount> {
    const id = randomUUID();
    const discount: Discount = {
      id,
      ...(insertDiscount as any),
    };
    this.discounts.set(id, discount);
    return discount;
  }

  async updateDiscount(
    id: string,
    updates: Partial<InsertDiscount>,
  ): Promise<Discount | undefined> {
    const existing = this.discounts.get(id);
    if (!existing) return undefined;

    const updated: Discount = {
      ...existing,
      ...(updates as any),
    };
    this.discounts.set(id, updated);
    return updated;
  }

  // Product Images

  async listProductImages(productId: string): Promise<ProductImage[]> {
    return Array.from(this.productImages.values())
      .filter((img) => img.productId === productId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async addProductImage(insertImage: InsertProductImage): Promise<ProductImage> {
    const id = randomUUID();
    const image: ProductImage = {
      id,
      productId: insertImage.productId,
      url: insertImage.url,
      alt: insertImage.alt ?? null,
      sortOrder: insertImage.sortOrder ?? 0,
      createdAt: new Date(),
    };
    this.productImages.set(id, image);
    return image;
  }

  async deleteProductImage(id: string): Promise<void> {
    this.productImages.delete(id);
  }

  async deleteProductImages(productId: string): Promise<void> {
    const entries = Array.from(this.productImages.entries());
    for (const [id, img] of entries) {
      if (img.productId === productId) {
        this.productImages.delete(id);
      }
    }
  }

  // Digital download tokens

  async createDownloadToken(token: DownloadToken): Promise<DownloadToken> {
    this.downloadTokens.set(token.token, token);
    return token;
  }

  async getDownloadToken(token: string): Promise<DownloadToken | undefined> {
    return this.downloadTokens.get(token);
  }

  async listDownloadTokensForOrder(orderId: string): Promise<DownloadToken[]> {
    return Array.from(this.downloadTokens.values()).filter(
      (tkn) => tkn.orderId === orderId,
    );
  }

  async incrementDownloadCount(token: string): Promise<void> {
    const existing = this.downloadTokens.get(token);
    if (!existing) return;
    existing.downloadCount += 1;
    this.downloadTokens.set(token, existing);
  }

  async revokeDownloadToken(token: string): Promise<void> {
    this.downloadTokens.delete(token);
  }
}

import { isDatabaseAvailable } from "./db";
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage when DATABASE_URL is available, otherwise use MemStorage
function createStorage(): IStorage {
  if (isDatabaseAvailable()) {
    console.log("Using DatabaseStorage (PostgreSQL)");
    return new DatabaseStorage();
  } else {
    console.log("Using MemStorage (in-memory - data will not persist!)");
    return new MemStorage();
  }
}

export const storage = createStorage();
