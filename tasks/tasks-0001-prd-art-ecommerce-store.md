## Relevant Files

- `shared/schema.ts` - Database schema; will be expanded from simple `users` table to include products, orders, customers, and discounts.
- `server/routes.ts` - API route registration; will host REST/JSON endpoints for products, cart/checkout, orders, and admin operations.
- `server/index.ts` - Express app bootstrap; integrates routes, error handling, and (later) Stripe webhooks.
- `server/storage.ts` - Abstraction over persistence; will be extended to read/write products, orders, and users via Drizzle.
- `server/auth-utils.ts` - Password hashing and verification utilities using bcrypt.
- `server/auth-routes.ts` - Authentication API endpoints for register, login, logout, and getting current user.
- `server/passport-config.ts` - Passport.js configuration with local strategy for username/password authentication.
- `server/auth-middleware.ts` - Authentication and authorization middleware for protecting routes.
- `server/types.d.ts` - TypeScript type declarations for extending Express with User type.
- `client/src/lib/data.ts` - Current static product catalog; will either be replaced by API-backed data or adapted as seed data.
- `client/src/lib/cart.ts` - Client-side cart state; will be aligned with checkout, stock rules (1-of-1 originals), and order creation.
- `client/src/lib/auth.ts` - Client-side authentication state management using Zustand with login, register, logout, and current user functionality.
- `client/src/App.tsx` - Frontend routing; may be updated for new pages (account, admin, policies).
- `client/src/components/layout.tsx` - Global layout, header, and footer; will be refined for navigation, account access, and policy links.
- `client/src/components/protected-route.tsx` - Route protection component for admin and authenticated routes.
- `client/src/pages/login.tsx` - Login page with username/password authentication form.
- `client/src/pages/register.tsx` - Registration page for new user account creation.
- `client/src/components/product-card.tsx` - Product summary UI; will surface availability state (e.g., Sold) and pricing.
- `client/src/components/cart-drawer.tsx` - Cart UI; will be wired into checkout flow and totals (including shipping/discounts).
- `client/src/pages/home.tsx` - Landing page; will be wired to featured/new products from the backend.
- `client/src/pages/shop.tsx` - Catalog page; will be enhanced with filtering, sorting, and API data.
- `client/src/pages/product.tsx` - Product detail page; will be integrated with stock status, digital vs physical info, and “Add to Cart” rules.
- `client/src/pages/about.tsx` - About page; will host the artist’s story and possibly simple CMS-like editing.
- `client/src/pages/contact.tsx` - Contact page; will be wired to an email/send-message backend endpoint.
- `client/src/components/admin-layout.tsx` - Admin panel layout with sidebar navigation.
- `client/src/pages/admin/dashboard.tsx` - Admin dashboard with key metrics and recent orders.
- `client/src/pages/admin/products.tsx` - Admin products CRUD page with search/filter.
- `client/src/pages/admin/orders.tsx` - Admin orders list and detail view page.
- `client/src/pages/admin/discounts.tsx` - Admin discounts management page.
- `client/src/pages/admin/settings.tsx` - Admin settings placeholder page.
- `drizzle.config.ts` - Drizzle ORM configuration for database migrations and schema management.
- `server/static.ts` - Static file serving; may be involved in serving digital downloads via secured endpoints.
- `server/config.ts` - Server configuration module; loads Stripe keys, shipping settings, and other env vars.
- `docs/stripe-integration.md` - Documentation for Stripe Checkout integration approach and setup.

### Notes

- Unit tests (if added) should typically live next to the code they test (e.g., `product-card.test.tsx` next to `product-card.tsx`).
- API and business logic tests can live alongside their modules or in a dedicated `__tests__` directory, following the project’s conventions.

## Tasks

- [x] 1.0 Design and implement backend domain models, database schema, and API surface for products, customers, orders, and discounts.
  - [x] 1.1 Extend the Drizzle schema in `shared/schema.ts` to add tables for `products`, `product_images`, `customers` (or reuse `users` where appropriate), `orders`, `order_items`, and `discounts` following the PRD fields (including product type flag, metadata, status fields).
  - [x] 1.2 Configure and run Drizzle migrations (via `drizzle.config.ts` and any scripts) to create/update the database tables in the target environment.
  - [x] 1.3 Implement storage helpers in `server/storage.ts` for CRUD operations on products (list, get by id, create, update, delete, mark as sold) and for reading/writing orders, order items, and discounts.
  - [x] 1.4 Design and implement `/api/products` endpoints in `server/routes.ts` for listing products (with optional filters/sorting), fetching single products, and (admin-only) creating/updating/deleting products.
  - [x] 1.5 Design and implement `/api/orders` endpoints for creating an order record (draft/pending), listing orders (admin-only), and fetching a single order with its items and status.
  - [x] 1.6 Design and implement `/api/discounts` endpoints for validating a discount code at checkout and (admin-only) creating/updating discounts.
  - [x] 1.7 Define consistent API response types and error handling conventions (e.g., success envelopes, error shapes) and update `server/index.ts` error middleware if needed.
  - [ ] 1.8 ~~Add basic backend tests~~ (SKIPPED - deferred to later; prioritizing checkout flow for MVP)

- [ ] 2.0 Implement a secure checkout flow with Stripe integration, US-only shipping rules, and digital download delivery.
  - [x] 2.1 Choose and document the Stripe integration approach (Stripe Checkout vs. custom Payment Intents) based on simplicity and PRD needs, and install required Stripe SDKs on the server/client.
  - [x] 2.2 Add environment configuration for Stripe keys and webhook secrets, and update the server startup/config docs (or README) accordingly.
  - [x] 2.3 Implement a `/api/checkout` endpoint that:
    - [x] 2.3.1 Validates the incoming cart payload (product IDs, quantities, optional discount code).
    - [x] 2.3.2 Enforces 1-of-1 rules for original artworks (cannot exceed quantity 1; ensure not already sold).
    - [x] 2.3.3 Calculates line item totals, applies any valid discount, and computes shipping for US-only orders (flat rate + optional free-shipping threshold from config).
    - [x] 2.3.4 Creates a pending order record and initiates a Stripe payment (Checkout Session or Payment Intent) with appropriate metadata.
    - [x] 2.3.5 Returns the Stripe session/client info to the frontend for redirect/confirmation.
  - [x] 2.4 Implement a Stripe webhook handler route (e.g., `/api/stripe/webhook`) that:
    - [x] 2.4.1 Validates the webhook signature using the raw request body.
    - [x] 2.4.2 On successful payment, marks the corresponding order as Paid, decrements inventory for 1-of-1 items, and marks them as Sold.
    - [x] 2.4.3 On failed/cancelled payments, marks the order appropriately without reducing stock.
  - [x] 2.5 For digital products, implement secure file storage and download:
    - [x] 2.5.1 Decide storage location (local or external) and structure for digital files attached to products.
    - [x] 2.5.2 Add a protected download route that verifies the order/session token and serves a time-limited download for the purchased digital file.
    - [x] 2.5.3 Ensure digital download URLs are never directly exposed as static file paths; generate signed or time-scoped tokens instead.
  - [x] 2.6 Wire the frontend checkout UX:
    - [x] 2.6.1 Update `client/src/components/cart-drawer.tsx` to call the new `/api/checkout` endpoint when “Proceed to Checkout” is clicked and handle redirect to Stripe (or embedded payment).
    - [x] 2.6.2 Create a simple checkout/confirmation page (new route) that shows order summary and status after returning from Stripe.
  - [ ] 2.7 ~~Add minimal automated tests or integration checks for the `/api/checkout` endpoint and webhook flow~~ (SKIPPED - defer until after storefront is API-driven).

- [x] 3.0 Evolve the customer-facing storefront (home, shop, product pages, cart) into a fully data-driven, stock-aware gallery experience.
  - [x] 3.1 Replace or complement the static `products` array in `client/src/lib/data.ts` with API-driven data from `/api/products`, keeping the static file as optional seed/demo data if useful.
  - [x] 3.2 Implement a lightweight client-side data hook or React Query integration for fetching products and single-product details, updating `Shop` and `Product` pages to use the API.
  - [x] 3.3 Update `client/src/pages/shop.tsx` to support server-backed filtering (by category/medium) and sorting options, falling back gracefully to client-side filtering if necessary.
  - [x] 3.4 Update `client/src/pages/product.tsx` to:
    - [x] 3.4.1 Fetch product details from the backend by ID, including availability and type (physical/digital).
    - [x] 3.4.2 Display availability state (Available vs Sold Out) and hide/disable purchase controls for sold items.
    - [ ] 3.4.3 Optionally display additional metadata (year, story, etc.) if available.
  - [x] 3.5 Enhance `client/src/components/product-card.tsx` to visually indicate sold-out pieces (badge/overlay) and prevent adding sold items to the cart.
  - [x] 3.6 Adjust the cart logic in `client/src/lib/cart.ts` to enforce a maximum quantity of 1 for 1-of-1 originals and to handle any new fields needed (e.g., product type).
  - [x] 3.7 Refine the home page (`client/src/pages/home.tsx`) to pull featured products and new arrivals from the backend (via flags or date fields) instead of hard-coding indices.
  - [x] 3.8 Ensure responsive design and gallery feel are maintained or improved as data becomes dynamic (verify layouts on mobile/tablet/desktop).

- [x] 4.0 Build an admin dashboard for the artist to manage products, categories, inventory, digital assets, and orders.
  - [x] 4.1 Decide on admin access pattern (e.g., separate `/admin` route with a simple layout) and add corresponding routes in `client/src/App.tsx`.
  - [ ] 4.2 Implement an admin login page (or reuse global auth, see Task 5.0) and guard admin routes on the client via auth state. (DEFERRED to Task 5.0)
  - [x] 4.3 Build an Admin Products page that:
    - [x] 4.3.1 Lists products with search/filter by category, type, and status.
    - [x] 4.3.2 Supports creating/editing products (form for title, price, category, type, metadata, and stock flags).
    - [x] 4.3.3 Allows uploading and managing multiple images per product (integrated with the backend product/images API).
    - [x] 4.3.4 Exposes a toggle for marking products active/inactive and for marking digital vs physical type.
  - [x] 4.4 Build an Admin Orders page that:
    - [x] 4.4.1 Lists orders with basic info (ID, date, customer, total, payment/shipping status).
    - [x] 4.4.2 Allows viewing an individual order's details (items, shipping address, digital items, internal notes).
    - [ ] 4.4.3 Supports updating order status (Pending, Paid, Shipped, Completed, Cancelled) and optionally capturing tracking info. (DEFERRED - requires backend endpoint)
  - [x] 4.5 Build an Admin Discounts page for creating and managing discount codes (code, type, value, expiry), wired to the `/api/discounts` endpoints.
  - [x] 4.6 Implement a simple Admin Dashboard overview that aggregates key metrics (total sales, total orders, best-selling categories/products) using existing API endpoints.
  - [x] 4.7 Add basic styling and navigation for the admin area that matches the brand but is visually distinct from the customer-facing site for clarity.

- [ ] 5.0 Implement supporting systems: authentication/authorization, email notifications, basic analytics, and production readiness (performance, SEO, error handling).
  - [x] 5.1 Implement a minimal authentication system:
    - [x] 5.1.1 Extend `shared/schema.ts` and `server/storage.ts` to support customers and an admin user with secure password hashing.
    - [x] 5.1.2 Implement `/api/auth` endpoints for register (if needed), login, logout, and fetching the current user.
    - [x] 5.1.3 Add middleware to protect admin routes on the server, checking admin role before allowing access to admin CRUD endpoints.
    - [x] 5.1.4 Add client-side auth state management and hooks (e.g., current user) and wire login/logout UI.
  - [ ] 5.2 Add basic customer account pages (optional for v1, but aligned with PRD):
    - [ ] 5.2.1 Implement a “My Orders” or “Account” page where logged-in customers can see past orders and access any active digital downloads.
    - [ ] 5.2.2 Provide basic profile management (name, default address) if time allows.
  - [ ] 5.3 Integrate email notifications:
    - [ ] 5.3.1 Choose an email provider (SMTP or simple transactional API) and add configuration to the server.
    - [ ] 5.3.2 Implement utility functions to send order confirmation emails (with order summary and digital download instructions where applicable).
    - [ ] 5.3.3 Optionally implement shipment notification emails when order status changes to Shipped.
  - [ ] 5.4 Improve analytics and logging:
    - [ ] 5.4.1 Ensure server logs capture key events (order created, payment success/failure, download access) in a structured way.
    - [ ] 5.4.2 Optionally integrate a client-side analytics tool (e.g., simple pageview tracking) if acceptable.
  - [ ] 5.5 Enhance performance, SEO, and robustness:
    - [ ] 5.5.1 Audit image usage and apply lazy-loading where appropriate for galleries and product pages.
    - [ ] 5.5.2 Add or refine meta tags and Open Graph data for key pages and product detail pages.
    - [ ] 5.5.3 Review error boundaries and user-facing error messages on the frontend, ensuring graceful handling of API failures.
    - [ ] 5.5.4 Confirm production build configuration (Vite, Express static serving) and document deployment steps, including environment variables needed for Stripe, DB, and email.


