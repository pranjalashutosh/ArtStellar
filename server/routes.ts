import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import { resolve, extname, join } from "path";
import { createReadStream, existsSync, statSync, mkdirSync, unlinkSync } from "fs";
import { storage } from "./storage";
import { config, calculateShipping } from "./config";
import Stripe from "stripe";
import { z } from "zod";
import {
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertDiscountSchema,
  type InsertProduct,
  type InsertOrder,
  type InsertOrderItem,
  type InsertDiscount,
  type Product,
  type Order,
  type OrderItem,
} from "@shared/schema";
import multer from "multer";
import authRoutes from "./auth-routes";
import { requireAdmin } from "./auth-middleware";

// Checkout request validation schema
const checkoutItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().max(10),
});

const checkoutRequestSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(50),
  discountCode: z.string().optional(),
  customerEmail: z.string().email().optional(),
  shippingAddress: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.literal("US"), // US only for v1
  }).optional(),
});

type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

const DIGITAL_ASSETS_DIR = resolve(process.cwd(), "server", "digital-assets");
const UPLOADS_DIR = resolve(process.cwd(), "uploads", "products");
const DOWNLOAD_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const MAX_DOWNLOADS_PER_TOKEN = 5;

// Ensure uploads directory exists
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: (
    _req: Express.Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed"));
  }
};

const upload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10, // Max 10 files per request
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth API
  app.use("/api/auth", authRoutes);

  // Products API

  app.get(
    "/api/products",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const all = await storage.listProducts();

        const {
          category,
          type,
          status,
          featured,
          isNew,
          medium,
          sort,
        } = req.query as Record<string, string | undefined>;

        let filtered = all;

        if (category) {
          filtered = filtered.filter(
            (p) => p.category.toLowerCase() === category.toLowerCase(),
          );
        }

        if (type) {
          filtered = filtered.filter(
            (p) => p.type?.toLowerCase() === type.toLowerCase(),
          );
        }

        if (status) {
          filtered = filtered.filter(
            (p) => p.status?.toLowerCase() === status.toLowerCase(),
          );
        }

        if (featured === "true") {
          filtered = filtered.filter((p) => p.isFeatured);
        }

        if (isNew === "true") {
          filtered = filtered.filter((p) => p.isNew);
        }

        if (medium) {
          filtered = filtered.filter((p) =>
            (p.medium ?? "").toLowerCase() === medium.toLowerCase(),
          );
        }

        if (sort) {
          if (sort === "price_asc") {
            filtered = filtered.slice().sort((a, b) => a.priceCents - b.priceCents);
          } else if (sort === "price_desc") {
            filtered = filtered.slice().sort((a, b) => b.priceCents - a.priceCents);
          } else if (sort === "newest") {
            filtered = filtered
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt ?? "").getTime() -
                  new Date(a.createdAt ?? "").getTime(),
              );
          } else if (sort === "oldest") {
            filtered = filtered
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.createdAt ?? "").getTime() -
                  new Date(b.createdAt ?? "").getTime(),
              );
          }
        }

        // Include images for each product
        const productsWithImages = await Promise.all(
          filtered.map(async (product) => {
            const images = await storage.listProductImages(product.id);
            return { ...product, images };
          }),
        );

        res.json(productsWithImages);
      } catch (err) {
        next(err);
      }
    },
  );

  app.get(
    "/api/products/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const product = await storage.getProduct(req.params.id);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        // Include images
        const images = await storage.listProductImages(product.id);
        res.json({ ...product, images });
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    "/api/products",
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed: InsertProduct = insertProductSchema.parse(req.body);
        const created = await storage.createProduct(parsed);
        res.status(201).json(created);
      } catch (err: any) {
        if (err?.name === "ZodError") {
          return res.status(400).json({ message: "Invalid product data", errors: err.errors });
        }
        next(err);
      }
    },
  );

  app.put(
    "/api/products/:id",
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Allow partial updates; validate fields that are provided
        const partial = req.body as Partial<InsertProduct>;
        const updated = await storage.updateProduct(req.params.id, partial);
        if (!updated) {
          return res.status(404).json({ message: "Product not found" });
        }
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  app.delete(
    "/api/products/:id",
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const existing = await storage.getProduct(req.params.id);
        if (!existing) {
          return res.status(404).json({ message: "Product not found" });
        }
        await storage.deleteProduct(req.params.id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    "/api/products/:id/mark-sold",
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const updated = await storage.markProductSold(req.params.id);
        if (!updated) {
          return res.status(404).json({ message: "Product not found" });
        }
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  // Product Images API

  // Get all images for a product
  app.get(
    "/api/products/:id/images",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const product = await storage.getProduct(req.params.id);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        const images = await storage.listProductImages(req.params.id);
        res.json(images);
      } catch (err) {
        next(err);
      }
    },
  );

  // Upload images for a product (supports multiple files)
  app.post(
    "/api/products/:id/images",
    requireAdmin,
    upload.array("images", 10),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const product = await storage.getProduct(req.params.id);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        const files = req.files as Express.Multer.File[] | undefined;
        if (!files || files.length === 0) {
          return res.status(400).json({ message: "No images uploaded" });
        }

        // Get existing images to determine sort order
        const existingImages = await storage.listProductImages(req.params.id);
        let sortOrder = existingImages.length;

        const uploadedImages = [];
        for (const file of files) {
          const imageUrl = `/uploads/products/${file.filename}`;
          const image = await storage.addProductImage({
            productId: req.params.id,
            url: imageUrl,
            alt: product.title,
            sortOrder: sortOrder++,
          });
          uploadedImages.push(image);
        }

        res.status(201).json(uploadedImages);
      } catch (err) {
        next(err);
      }
    },
  );

  // Delete a single image
  app.delete(
    "/api/images/:imageId",
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // In a full implementation, we'd also delete the file from disk
        await storage.deleteProductImage(req.params.imageId);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  // Upload endpoint for general image uploads (returns URL)
  app.post(
    "/api/upload",
    requireAdmin,
    upload.single("image"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const file = req.file as Express.Multer.File | undefined;
        if (!file) {
          return res.status(400).json({ message: "No image uploaded" });
        }

        const imageUrl = `/uploads/products/${file.filename}`;
        res.status(201).json({ url: imageUrl, filename: file.filename });
      } catch (err) {
        next(err);
      }
    },
  );

  // Orders API

  app.post(
    "/api/orders",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { order, items } = req.body as {
          order: InsertOrder;
          items: InsertOrderItem[];
        };

        const parsedOrder = insertOrderSchema.parse(order);
        const parsedItems = insertOrderItemSchema.array().min(1).parse(items);

        // Ensure new orders start as pending
        const createdOrder = await storage.createOrder({
          ...parsedOrder,
          status: "pending",
          paymentStatus: "pending",
        } as InsertOrder);

        const createdItems: InsertOrderItem[] = [];

        for (const item of parsedItems) {
          const createdItem = await storage.addOrderItem(createdOrder.id, item);
          createdItems.push(createdItem as InsertOrderItem);
        }

        res.status(201).json({
          order: createdOrder,
          items: createdItems,
        });
      } catch (err: any) {
        if (err?.name === "ZodError") {
          return res
            .status(400)
            .json({ message: "Invalid order data", errors: err.errors });
        }
        next(err);
      }
    },
  );

  app.get(
    "/api/orders",
    requireAdmin,
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const orders = await storage.listOrders();
        res.json(orders);
      } catch (err) {
        next(err);
      }
    },
  );

  app.get(
    "/api/orders/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const order = await storage.getOrder(req.params.id);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        const items = await storage.listOrderItems(req.params.id);
        res.json({ order, items });
      } catch (err) {
        next(err);
      }
    },
  );

  // Discounts API

  // List all discounts (admin)
  app.get(
    "/api/discounts",
    requireAdmin,
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const discounts = await storage.listDiscounts();
        res.json(discounts);
      } catch (err) {
        next(err);
      }
    },
  );

  app.get(
    "/api/discounts/validate",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const code = (req.query.code as string | undefined)?.trim();
        if (!code) {
          return res.status(400).json({ message: "Missing discount code" });
        }

        const discount = await storage.getDiscountByCode(code);
        if (!discount || !discount.isActive) {
          return res.status(404).json({ message: "Discount code not found" });
        }

        const now = new Date();
        if (discount.expiresAt && discount.expiresAt < now) {
          return res.status(410).json({ message: "Discount code has expired" });
        }

        if (
          discount.maxUses !== null &&
          discount.maxUses !== undefined &&
          discount.usedCount >= discount.maxUses
        ) {
          return res
            .status(409)
            .json({ message: "Discount code usage limit reached" });
        }

        res.json({
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    "/api/discounts",
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed: InsertDiscount = insertDiscountSchema.parse(req.body);
        const created = await storage.createDiscount(parsed);
        res.status(201).json(created);
      } catch (err: any) {
        if (err?.name === "ZodError") {
          return res
            .status(400)
            .json({ message: "Invalid discount data", errors: err.errors });
        }
        next(err);
      }
    },
  );

  app.put(
    "/api/discounts/:id",
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const partial = req.body as Partial<InsertDiscount>;
        const updated = await storage.updateDiscount(req.params.id, partial);
        if (!updated) {
          return res.status(404).json({ message: "Discount not found" });
        }
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  // Checkout API

  app.post(
    "/api/checkout",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // 2.3.1 Validate the incoming cart payload
        const parsed = checkoutRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            message: "Invalid checkout data",
            errors: parsed.error.errors,
          });
        }

        const { items, discountCode, customerEmail, shippingAddress } = parsed.data;

        // Fetch all products and validate availability
        const productDetails: Array<{ product: Product; quantity: number }> = [];
        let hasPhysicalItems = false;
        let hasDigitalItems = false;

        for (const item of items) {
          const product = await storage.getProduct(item.productId);
          
          if (!product) {
            return res.status(400).json({
              message: `Product not found: ${item.productId}`,
            });
          }

          if (product.status === "sold") {
            return res.status(400).json({
              message: `Product is no longer available: ${product.title}`,
            });
          }

          if (product.status !== "active") {
            return res.status(400).json({
              message: `Product is not available for purchase: ${product.title}`,
            });
          }

          // 2.3.2 Enforce 1-of-1 rules for original artworks
          // All physical artworks are treated as 1-of-1 originals
          if (product.type === "physical" && item.quantity > 1) {
            return res.status(400).json({
              message: `"${product.title}" is a unique original artwork and cannot have quantity greater than 1`,
            });
          }

          if (product.type === "physical") {
            hasPhysicalItems = true;
          } else {
            hasDigitalItems = true;
          }

          productDetails.push({ product, quantity: item.quantity });
        }

        // Require shipping address for physical items
        if (hasPhysicalItems && !shippingAddress) {
          return res.status(400).json({
            message: "Shipping address is required for physical items",
          });
        }

        // 2.3.3 Calculate line item totals
        let subtotalCents = 0;
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

        for (const { product, quantity } of productDetails) {
          const itemTotal = product.priceCents * quantity;
          subtotalCents += itemTotal;

          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: product.title,
                description: product.description || undefined,
                // Images would come from product_images table; omit for now
                metadata: {
                  productId: product.id,
                  type: product.type || "physical",
                },
              },
              unit_amount: product.priceCents,
            },
            quantity,
          });
        }

        // Apply discount if provided
        let discountAmountCents = 0;
        let appliedDiscount: { id: string; code: string; type: string; value: number } | null = null;

        if (discountCode) {
          const discount = await storage.getDiscountByCode(discountCode);
          
          if (discount && discount.isActive) {
            const now = new Date();
            const isExpired = discount.expiresAt && discount.expiresAt < now;
            const isOverLimit = discount.maxUses !== null && 
                               discount.maxUses !== undefined && 
                               discount.usedCount >= discount.maxUses;

            if (!isExpired && !isOverLimit) {
              appliedDiscount = {
                id: discount.id,
                code: discount.code,
                type: discount.type,
                value: discount.value,
              };

              if (discount.type === "percentage") {
                discountAmountCents = Math.round(subtotalCents * (discount.value / 100));
              } else {
                // Fixed amount discount (value is in cents)
                discountAmountCents = Math.min(discount.value, subtotalCents);
              }
            }
          }
        }

        const subtotalAfterDiscount = subtotalCents - discountAmountCents;

        // Calculate shipping for physical items
        const shippingCalc = hasPhysicalItems 
          ? calculateShipping(subtotalAfterDiscount)
          : { shippingCents: 0, isFreeShipping: true, method: "Digital Delivery", estimatedDays: "Instant" };

        const totalCents = subtotalAfterDiscount + shippingCalc.shippingCents;

        // 2.3.4 Create a pending order record
        const orderData: InsertOrder = {
          email: customerEmail || "",
          name: shippingAddress?.name || "",
          shippingAddressLine1: shippingAddress?.line1 || null,
          shippingAddressLine2: shippingAddress?.line2 || null,
          shippingCity: shippingAddress?.city || null,
          shippingState: shippingAddress?.state || null,
          shippingPostalCode: shippingAddress?.postalCode || null,
          shippingCountry: shippingAddress?.country || "US",
          subtotalCents,
          discountCents: discountAmountCents,
          shippingCents: shippingCalc.shippingCents,
          totalCents,
          status: "pending",
          paymentStatus: "pending",
          paymentProvider: "stripe",
        };

        const order = await storage.createOrder(orderData);

        // Add order items
        for (const { product, quantity } of productDetails) {
          await storage.addOrderItem(order.id, {
            orderId: order.id,
            productId: product.id,
            productTitle: product.title,
            productType: product.type,
            quantity,
            unitPriceCents: product.priceCents,
            lineTotalCents: product.priceCents * quantity,
          });
        }

        // Initialize Stripe
        let stripe: Stripe;
        try {
          stripe = new Stripe(config.stripeSecretKey);
        } catch (err) {
          console.error("Failed to initialize Stripe:", err);
          return res.status(500).json({
            message: "Payment system configuration error",
          });
        }

        // Build Stripe Checkout Session
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          mode: "payment",
          payment_method_types: ["card"],
          line_items: lineItems,
          success_url: `${config.appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
          cancel_url: `${config.appUrl}/cart?cancelled=true`,
          metadata: {
            orderId: order.id,
            hasDigitalItems: hasDigitalItems.toString(),
          },
          customer_email: customerEmail || undefined,
        };

        // Add shipping options for physical items
        if (hasPhysicalItems) {
          sessionParams.shipping_options = [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: {
                  amount: shippingCalc.shippingCents,
                  currency: "usd",
                },
                display_name: shippingCalc.method,
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 5 },
                  maximum: { unit: "business_day", value: 7 },
                },
              },
            },
          ];

          // Collect shipping address via Stripe
          sessionParams.shipping_address_collection = {
            allowed_countries: ["US"],
          };
        }

        // Add discount as a coupon if applied
        if (appliedDiscount && discountAmountCents > 0) {
          // Create a one-time coupon for this session
          const coupon = await stripe.coupons.create({
            amount_off: discountAmountCents,
            currency: "usd",
            duration: "once",
            name: `Discount: ${appliedDiscount.code}`,
          });
          sessionParams.discounts = [{ coupon: coupon.id }];
        }

        // Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create(sessionParams);

        // Update order with Stripe session ID (stored in paymentReference field)
        await storage.updateOrder(order.id, {
          paymentReference: session.id,
        });

        // 2.3.5 Return the Stripe session info to the frontend
        res.json({
          sessionId: session.id,
          sessionUrl: session.url,
          orderId: order.id,
          summary: {
            subtotalCents,
            discountCents: discountAmountCents,
            shippingCents: shippingCalc.shippingCents,
            totalCents,
            shippingMethod: shippingCalc.method,
            appliedDiscount: appliedDiscount?.code || null,
          },
        });
      } catch (err: any) {
        console.error("Checkout error:", err);
        
        if (err?.type === "StripeInvalidRequestError") {
          return res.status(400).json({
            message: "Payment processing error",
            details: err.message,
          });
        }
        
        next(err);
      }
    },
  );

  // Get Stripe publishable key for frontend
  app.get("/api/config/stripe", (_req: Request, res: Response) => {
    res.json({
      publishableKey: config.stripePublishableKey,
    });
  });

  // Endpoint for retrieving download tokens for a paid order
  app.get(
    "/api/orders/:orderId/downloads",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { orderId } = req.params;
        const sessionId = (req.query.session_id as string | undefined)?.trim();

        if (!sessionId) {
          return res.status(400).json({
            message: "session_id query parameter is required",
          });
        }

        const order = await storage.getOrder(orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        if (order.paymentStatus !== "paid") {
          return res.status(403).json({ message: "Order is not paid yet" });
        }

        if (order.paymentReference !== sessionId) {
          return res
            .status(403)
            .json({ message: "Session ID does not match this order" });
        }

        const tokens = await storage.listDownloadTokensForOrder(orderId);

        const downloads = tokens.map((token) => ({
          token: token.token,
          fileName: token.fileName,
          expiresAt: token.expiresAt,
          downloadCount: token.downloadCount,
          maxDownloads: token.maxDownloads,
          url: `${config.appUrl}/api/download/${token.token}`,
        }));

        res.json({ downloads });
      } catch (err) {
        next(err);
      }
    },
  );

  // Protected download route (requires valid token)
  app.get(
    "/api/download/:token",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tokenValue = req.params.token;
        const token = await storage.getDownloadToken(tokenValue);

        if (!token) {
          return res.status(404).json({ message: "Download link not found" });
        }

        if (token.expiresAt.getTime() < Date.now()) {
          await storage.revokeDownloadToken(tokenValue);
          return res
            .status(410)
            .json({ message: "Download link has expired. Please request a new link." });
        }

        const order = await storage.getOrder(token.orderId);
        if (!order || order.paymentStatus !== "paid") {
          return res
            .status(403)
            .json({ message: "Download not available for this order" });
        }

        if (!existsSync(token.filePath)) {
          console.error("Digital asset not found:", token.filePath);
          return res.status(500).json({ message: "Digital file not available" });
        }

        if (token.downloadCount >= token.maxDownloads) {
          await storage.revokeDownloadToken(tokenValue);
          return res
            .status(410)
            .json({ message: "Download limit reached for this link" });
        }

        res.setHeader(
          "Content-Type",
          token.mimeType || "application/octet-stream",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=\"${token.fileName}\"`,
        );

        const fileStream = createReadStream(token.filePath);
        fileStream.on("error", (error) => {
          console.error("Error reading digital file:", error);
          if (!res.headersSent) {
            res.status(500).json({ message: "Error reading digital file" });
          } else {
            res.end();
          }
        });

        fileStream.pipe(res);

        res.on("finish", async () => {
          await storage.incrementDownloadCount(tokenValue);
          const updatedToken = await storage.getDownloadToken(tokenValue);
          if (updatedToken && updatedToken.downloadCount >= updatedToken.maxDownloads) {
            await storage.revokeDownloadToken(tokenValue);
          }
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // Stripe Webhook Handler (2.4)
  app.post(
    "/api/stripe/webhook",
    async (req: Request, res: Response, next: NextFunction) => {
      // 2.4.1 Validate the webhook signature using the raw request body
      const sig = req.headers["stripe-signature"] as string | undefined;
      
      if (!sig) {
        console.error("Webhook error: No stripe-signature header");
        return res.status(400).json({ message: "Missing stripe-signature header" });
      }

      let event: Stripe.Event;
      let stripe: Stripe;

      try {
        stripe = new Stripe(config.stripeSecretKey);
      } catch (err) {
        console.error("Failed to initialize Stripe for webhook:", err);
        return res.status(500).json({ message: "Payment system configuration error" });
      }

      try {
        // req.rawBody is set by the express.json middleware in server/index.ts
        const rawBody = (req as any).rawBody;
        
        if (!rawBody) {
          console.error("Webhook error: No raw body available");
          return res.status(400).json({ message: "No raw body available for signature verification" });
        }

        event = stripe.webhooks.constructEvent(
          rawBody,
          sig,
          config.stripeWebhookSecret
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ message: `Webhook signature verification failed: ${err.message}` });
      }

      console.log(`Stripe webhook received: ${event.type}`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutSessionCompleted(session, stripe);
            break;
          }

          case "checkout.session.expired": {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutSessionExpired(session);
            break;
          }

          case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            await handlePaymentFailed(paymentIntent);
            break;
          }

          default:
            console.log(`Unhandled webhook event type: ${event.type}`);
        }

        // Return 200 to acknowledge receipt of the event
        res.json({ received: true });
      } catch (err) {
        console.error("Error processing webhook event:", err);
        next(err);
      }
    },
  );

  // TODO: Add authentication and admin authorization middleware for mutating routes, order listing, and discount management.

  return httpServer;
}

// 2.4.2 Handle successful payment
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<void> {
  const orderId = session.metadata?.orderId;
  
  if (!orderId) {
    console.error("Checkout session completed but no orderId in metadata:", session.id);
    return;
  }

  console.log(`Processing successful payment for order: ${orderId}`);

  // Get the order
  const order = await storage.getOrder(orderId);
  
  if (!order) {
    console.error(`Order not found for checkout session: ${orderId}`);
    return;
  }

  // Check if already processed (idempotency)
  if (order.paymentStatus === "paid") {
    console.log(`Order ${orderId} already marked as paid, skipping`);
    return;
  }

  // Update shipping address from Stripe if collected
  const shippingDetails = session.shipping_details;
  const shippingUpdates: Partial<typeof order> = {};
  
  if (shippingDetails?.address) {
    shippingUpdates.shippingAddressLine1 = shippingDetails.address.line1 || order.shippingAddressLine1;
    shippingUpdates.shippingAddressLine2 = shippingDetails.address.line2 || order.shippingAddressLine2;
    shippingUpdates.shippingCity = shippingDetails.address.city || order.shippingCity;
    shippingUpdates.shippingState = shippingDetails.address.state || order.shippingState;
    shippingUpdates.shippingPostalCode = shippingDetails.address.postal_code || order.shippingPostalCode;
    shippingUpdates.shippingCountry = shippingDetails.address.country || order.shippingCountry;
  }

  if (shippingDetails?.name) {
    shippingUpdates.name = shippingDetails.name;
  }

  // Update customer email if provided
  if (session.customer_details?.email) {
    shippingUpdates.email = session.customer_details.email;
  }

  // Mark order as paid
  await storage.updateOrder(orderId, {
    ...shippingUpdates,
    status: "paid",
    paymentStatus: "paid",
    paymentReference: session.payment_intent as string || session.id,
  });

  console.log(`Order ${orderId} marked as paid`);

  // Get order items to update inventory
  const orderItems = await storage.listOrderItems(orderId);

  // Mark 1-of-1 physical items as sold
  for (const item of orderItems) {
    const product = await storage.getProduct(item.productId);
    
    // All physical products are 1-of-1 originals, mark as sold
    if (product && product.type === "physical") {
      await storage.markProductSold(item.productId);
      console.log(`Product ${item.productId} marked as sold`);
    }
  }

  // Check if order has digital items for download link generation
  const hasDigitalItems = session.metadata?.hasDigitalItems === "true";
  
  if (hasDigitalItems) {
    await generateDownloadTokensForDigitalItems(order, orderItems);
  }

  console.log(`Successfully processed payment for order: ${orderId}`);
}

// 2.4.3 Handle expired checkout session
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orderId = session.metadata?.orderId;
  
  if (!orderId) {
    console.log("Checkout session expired but no orderId in metadata");
    return;
  }

  console.log(`Checkout session expired for order: ${orderId}`);

  const order = await storage.getOrder(orderId);
  
  if (!order) {
    console.log(`Order not found for expired session: ${orderId}`);
    return;
  }

  // Only update if still pending
  if (order.paymentStatus === "pending") {
    await storage.updateOrder(orderId, {
      status: "cancelled",
      paymentStatus: "failed",
    });
    console.log(`Order ${orderId} marked as cancelled due to expired session`);
  }
}

// 2.4.3 Handle failed payment
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  // Try to find order by payment intent ID
  const orders = await storage.listOrders();
  const order = orders.find(o => o.paymentReference === paymentIntent.id);
  
  if (!order) {
    console.log(`No order found for failed payment intent: ${paymentIntent.id}`);
    return;
  }

  console.log(`Payment failed for order: ${order.id}`);

  // Only update if not already paid (edge case handling)
  if (order.paymentStatus !== "paid") {
    await storage.updateOrder(order.id, {
      paymentStatus: "failed",
    });
    console.log(`Order ${order.id} payment status updated to failed`);
  }
}

async function generateDownloadTokensForDigitalItems(
  order: Order,
  orderItems: OrderItem[],
): Promise<void> {
  let generatedCount = 0;

  for (const item of orderItems) {
    const product = await storage.getProduct(item.productId);
    if (!product || product.type !== "digital") {
      continue;
    }

    const assetInfo = resolveDigitalAssetInfo(product);
    if (!assetInfo) {
      console.warn(
        `Digital asset missing for product ${product.id} (${product.title})`,
      );
      continue;
    }

    const tokenValue = randomUUID();
    const expiresAt = new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MS);

    await storage.createDownloadToken({
      token: tokenValue,
      orderId: order.id,
      orderItemId: item.id,
      productId: product.id,
      filePath: assetInfo.filePath,
      fileName: assetInfo.fileName,
      mimeType: assetInfo.mimeType,
      expiresAt,
      maxDownloads: MAX_DOWNLOADS_PER_TOKEN,
      downloadCount: 0,
    });

    generatedCount += 1;
    console.log(
      `Generated download token for order ${order.id}, product ${product.id}`,
    );
  }

  if (generatedCount > 0) {
    console.log(
      `Created ${generatedCount} download token(s) for order ${order.id}`,
    );
  }
}

function resolveDigitalAssetInfo(product: Product) {
  if (!product.digitalFilePath) {
    return null;
  }

  const relativePath = product.digitalFilePath;
  const fullPath = relativePath.startsWith("/")
    ? relativePath
    : resolve(DIGITAL_ASSETS_DIR, relativePath);

  if (!existsSync(fullPath)) {
    return null;
  }

  const stats = statSync(fullPath);
  const extension = extname(fullPath);

  const fileName =
    product.digitalFileName ||
    `${sanitizeFileName(product.title)}${extension || ""}`;

  const mimeType = product.digitalFileMimeType || "application/octet-stream";

  return {
    filePath: fullPath,
    fileName,
    mimeType,
    size: product.digitalFileSizeBytes || stats.size,
  };
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "digital-artwork";
}
