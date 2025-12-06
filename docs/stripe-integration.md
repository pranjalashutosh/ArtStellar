# Stripe Integration for MysticCanvas

## Approach: Stripe Checkout (Hosted Payment Page)

We use **Stripe Checkout** instead of custom Payment Intents for the following reasons:

### Why Stripe Checkout?

1. **Simplicity**: Stripe hosts the entire payment form - no need to build/style payment inputs
2. **PCI Compliance**: Stripe handles all sensitive card data; we never touch it
3. **Mobile-optimized**: Stripe's hosted page works great on all devices
4. **Built-in features**: Apple Pay, Google Pay, saved cards, address collection
5. **Faster to implement**: Just create a session and redirect - perfect for MVP

### Flow Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Customer  │────▶│  Our Server │────▶│   Stripe    │────▶│  Webhook    │
│  clicks     │     │  creates    │     │  Checkout   │     │  confirms   │
│  checkout   │     │  session    │     │  page       │     │  payment    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  Cart items          Session ID          Payment form       Order marked
  sent to API         returned            hosted by          as Paid,
                      + redirect          Stripe             stock updated
```

### Implementation Details

#### 1. Checkout Session Creation (`POST /api/checkout`)

- Receives cart items (product IDs, quantities) and optional discount code
- Validates stock availability (1-of-1 items not already sold)
- Creates a pending order in our database
- Creates a Stripe Checkout Session with:
  - Line items (product names, prices, quantities)
  - Shipping options (flat rate for US)
  - Success/cancel URLs
  - Order ID in metadata for webhook correlation
- Returns session URL for frontend redirect

#### 2. Webhook Handler (`POST /api/stripe/webhook`)

- Receives `checkout.session.completed` event from Stripe
- Validates webhook signature using `STRIPE_WEBHOOK_SECRET`
- Extracts order ID from session metadata
- Marks order as Paid
- For 1-of-1 physical items: marks products as Sold
- For digital items: generates secure download tokens

#### 3. Success/Cancel Pages

- **Success**: Shows order confirmation with details and download links (for digital)
- **Cancel**: Returns user to cart with items preserved

### Environment Variables Required

Create a `.env` file in the project root with these variables:

```env
# Stripe API Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...        # Server-side only (REQUIRED)
STRIPE_PUBLISHABLE_KEY=pk_test_...   # Can be exposed to client (optional)

# Webhook Secret (get from Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...      # For validating webhook signatures (REQUIRED)

# App URLs (for Stripe redirects)
APP_URL=http://localhost:5000        # Base URL for success/cancel redirects

# Shipping (optional - defaults provided)
SHIPPING_FLAT_RATE_CENTS=1500        # $15.00 flat rate
FREE_SHIPPING_THRESHOLD_CENTS=15000  # Free shipping over $150
```

### Getting Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy the **Secret key** (starts with `sk_test_`) → `STRIPE_SECRET_KEY`
3. Copy the **Publishable key** (starts with `pk_test_`) → `STRIPE_PUBLISHABLE_KEY`

### Setting Up Webhooks

#### For Local Development (using Stripe CLI)

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/stripe/webhook
   ```
4. Copy the webhook signing secret displayed → `STRIPE_WEBHOOK_SECRET`

#### For Production

1. Go to [Stripe Webhooks Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events: `checkout.session.completed`, `checkout.session.expired`
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Shipping Configuration

For v1, we use simple flat-rate shipping for US-only:

```typescript
const SHIPPING_CONFIG = {
  flatRateCents: 1500,           // $15.00 flat rate
  freeShippingThresholdCents: 15000,  // Free shipping over $150
  estimatedDays: "5-7 business days",
};
```

### Digital Asset Storage & Download Tokens

1. Place your digital art files inside `server/digital-assets/` (create subfolders if needed).
2. In each digital product record (seed data or admin UI), set:
   - `digitalFilePath`: relative path inside `server/digital-assets/` (e.g., `lotus/eternal-lotus-highres.png`)
   - `digitalFileName` (optional): customer-facing filename
   - `digitalFileMimeType` (optional): e.g., `image/png`
   - `digitalFileSizeBytes` (optional): used for display; auto-detected if omitted
3. After `checkout.session.completed`, the webhook automatically:
   - Creates time-limited download tokens per digital order item
   - Tokens expire after **7 days** and allow **5 downloads** by default
4. Customers can fetch their download links via:
   ```
   GET /api/orders/{orderId}/downloads?session_id={CHECKOUT_SESSION_ID}
   ```
5. Actual file delivery happens through the protected endpoint:
   ```
   GET /api/download/{token}
   ```
   The server validates the token, verifies the order is paid, checks expiration/usage limits, and streams the file from disk.

### Security Considerations

1. **Webhook Signature Verification**: Always verify `stripe-signature` header
2. **Raw Body Access**: Webhook needs raw request body (already configured in `server/index.ts`)
3. **Idempotency**: Handle duplicate webhook events gracefully
4. **No Card Data**: We never see or store card details - Stripe handles everything

### Testing

Use Stripe test mode with test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Future Enhancements

- [ ] Add PayPal as alternative payment method
- [ ] Support international shipping (multi-currency)
- [ ] Implement subscription/membership options
- [ ] Add invoice generation for orders

