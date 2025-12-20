/**
 * Database-backed storage implementation using Drizzle ORM
 */
import { eq } from "drizzle-orm";
import { db } from "./db";
import { hashPassword } from "./auth-utils";
import { randomUUID } from "crypto";
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
  users,
  products,
  orders,
  orderItems,
  discounts,
  productImages,
} from "@shared/schema";
import type { IStorage, DownloadToken } from "./storage";

export class DatabaseStorage implements IStorage {
  // In-memory store for download tokens (could be moved to Redis in production)
  private downloadTokens: Map<string, DownloadToken> = new Map();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not available");
    const hashedPassword = await hashPassword(insertUser.password);
    const id = randomUUID();
    
    const result = await db.insert(users).values({
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: hashedPassword,
      role: insertUser.role ?? "customer",
    }).returning();
    
    return result[0];
  }

  async updateUser(id: string, updates: Partial<Omit<User, "id">>): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    
    // If password is being updated, hash it
    let updateData = { ...updates };
    if (updates.password) {
      updateData.password = await hashPassword(updates.password);
    }
    
    const result = await db.update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }

  // Products
  async listProducts(): Promise<Product[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    if (!db) throw new Error("Database not available");
    const id = randomUUID();
    
    const result = await db.insert(products).values({
      id,
      ...insertProduct,
    }).returning();
    
    return result[0];
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    if (!db) throw new Error("Database not available");
    
    const result = await db.update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.delete(products).where(eq(products.id, id));
  }

  async markProductSold(id: string): Promise<Product | undefined> {
    if (!db) throw new Error("Database not available");
    
    const result = await db.update(products)
      .set({ status: "sold", updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    
    return result[0];
  }

  // Orders
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    if (!db) throw new Error("Database not available");
    const id = randomUUID();
    
    const result = await db.insert(orders).values({
      id,
      ...insertOrder,
    }).returning();
    
    return result[0];
  }

  async getOrder(id: string): Promise<Order | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(orders).where(eq(orders.paymentReference, sessionId)).limit(1);
    return result[0];
  }

  async listOrders(): Promise<Order[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(orders);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    if (!db) throw new Error("Database not available");
    
    const result = await db.update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    
    return result[0];
  }

  async addOrderItem(orderId: string, item: InsertOrderItem): Promise<OrderItem> {
    if (!db) throw new Error("Database not available");
    const id = randomUUID();
    
    // Destructure to exclude orderId from item (we use the parameter instead)
    const { orderId: _itemOrderId, ...itemData } = item as any;
    
    const result = await db.insert(orderItems).values({
      id,
      orderId,
      ...itemData,
    }).returning();
    
    return result[0];
  }

  async listOrderItems(orderId: string): Promise<OrderItem[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Discounts
  async listDiscounts(): Promise<Discount[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(discounts);
  }

  async getDiscountByCode(code: string): Promise<Discount | undefined> {
    if (!db) throw new Error("Database not available");
    // Case-insensitive search
    const allDiscounts = await db.select().from(discounts);
    return allDiscounts.find(d => d.code.toLowerCase() === code.toLowerCase());
  }

  async createDiscount(insertDiscount: InsertDiscount): Promise<Discount> {
    if (!db) throw new Error("Database not available");
    const id = randomUUID();
    
    const result = await db.insert(discounts).values({
      id,
      ...insertDiscount,
    }).returning();
    
    return result[0];
  }

  async updateDiscount(id: string, updates: Partial<InsertDiscount>): Promise<Discount | undefined> {
    if (!db) throw new Error("Database not available");
    
    const result = await db.update(discounts)
      .set(updates)
      .where(eq(discounts.id, id))
      .returning();
    
    return result[0];
  }

  // Product Images
  async listProductImages(productId: string): Promise<ProductImage[]> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(productImages).where(eq(productImages.productId, productId));
    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async addProductImage(insertImage: InsertProductImage): Promise<ProductImage> {
    if (!db) throw new Error("Database not available");
    const id = randomUUID();
    
    const result = await db.insert(productImages).values({
      id,
      productId: insertImage.productId,
      url: insertImage.url,
      alt: insertImage.alt ?? null,
      sortOrder: insertImage.sortOrder ?? 0,
    }).returning();
    
    return result[0];
  }

  async deleteProductImage(id: string): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.delete(productImages).where(eq(productImages.id, id));
  }

  async deleteProductImages(productId: string): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.delete(productImages).where(eq(productImages.productId, productId));
  }

  // Download tokens (kept in memory for now)
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

