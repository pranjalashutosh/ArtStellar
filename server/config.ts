/**
 * Server configuration loaded from environment variables.
 * 
 * Required environment variables:
 * - STRIPE_SECRET_KEY: Stripe API secret key (sk_test_... or sk_live_...)
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret (whsec_...)
 * 
 * Optional environment variables:
 * - PORT: Server port (default: 5000)
 * - APP_URL: Base URL for redirects (default: http://localhost:5000)
 * - STRIPE_PUBLISHABLE_KEY: Stripe publishable key for frontend
 * - SHIPPING_FLAT_RATE_CENTS: Flat rate shipping cost (default: 1500 = $15)
 * - FREE_SHIPPING_THRESHOLD_CENTS: Free shipping threshold (default: 15000 = $150)
 * - DATABASE_URL: PostgreSQL connection string (required for production)
 */

// Helper to get required env var or throw
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Helper to get optional env var with default
function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// Helper to get optional numeric env var with default
function optionalEnvInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Lazy-loaded config to allow server to start before all env vars are set
// (useful during development when not all features are being tested)
export const config = {
  // Server
  get port(): number {
    return optionalEnvInt("PORT", 5000);
  },

  get appUrl(): string {
    return optionalEnv("APP_URL", "http://localhost:5000");
  },

  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },

  // Stripe
  get stripeSecretKey(): string {
    return requireEnv("STRIPE_SECRET_KEY");
  },

  get stripePublishableKey(): string {
    return optionalEnv("STRIPE_PUBLISHABLE_KEY", "");
  },

  get stripeWebhookSecret(): string {
    return requireEnv("STRIPE_WEBHOOK_SECRET");
  },

  // Shipping
  get shippingFlatRateCents(): number {
    return optionalEnvInt("SHIPPING_FLAT_RATE_CENTS", 1500); // $15.00
  },

  get freeShippingThresholdCents(): number {
    return optionalEnvInt("FREE_SHIPPING_THRESHOLD_CENTS", 15000); // $150.00
  },

  // Computed shipping config
  get shipping() {
    return {
      flatRateCents: this.shippingFlatRateCents,
      freeShippingThresholdCents: this.freeShippingThresholdCents,
      estimatedDays: "5-7 business days",
      countryCode: "US",
    };
  },

  // Database
  get databaseUrl(): string | undefined {
    return process.env.DATABASE_URL;
  },
};

// Type for shipping calculation result
export interface ShippingCalculation {
  shippingCents: number;
  isFreeShipping: boolean;
  method: string;
  estimatedDays: string;
}

/**
 * Calculate shipping cost based on order subtotal
 */
export function calculateShipping(subtotalCents: number): ShippingCalculation {
  const { flatRateCents, freeShippingThresholdCents, estimatedDays } = config.shipping;
  
  const isFreeShipping = freeShippingThresholdCents > 0 && subtotalCents >= freeShippingThresholdCents;
  
  return {
    shippingCents: isFreeShipping ? 0 : flatRateCents,
    isFreeShipping,
    method: isFreeShipping ? "Free Standard Shipping" : "Standard Shipping (US)",
    estimatedDays,
  };
}

