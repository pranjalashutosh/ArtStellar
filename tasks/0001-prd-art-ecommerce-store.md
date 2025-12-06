## 1. Introduction / Overview

This document describes the requirements for **MysticCanvas**, an e‑commerce website for selling a curated collection of original artworks created by a single artist. The site should feel like a **calm, soothing online art gallery** where visitors can browse, appreciate, and purchase art with confidence.

The primary goal is to **sell original artworks** (paintings, canvases, sketches, sculptures, abstract drawings) and **digital paintings** directly to customers. All content and administration will be handled by a **single admin user** (the artist), with no multi‑vendor functionality.

The site will initially target **customers in the USA**, using **USD** as the only currency.

## 2. Goals

1. **Enable online purchase of original artworks**
   - Customers can browse available works, view details, and purchase originals (1‑of‑1) or digital pieces.
2. **Provide a calm, gallery‑like browsing experience**
   - The visual design and layout should reinforce a soothing, high‑end art gallery feel, aligned with the current color palette and typography used in the existing codebase.
3. **Allow the artist to manage the catalog and orders without developer help**
   - The admin can add/edit/delete products, manage inventory for originals, and view/manage orders independently.
4. **Support reliable checkout and payment processing**
   - Customers can securely pay using card payments via **Stripe** (and potentially other reliable processors if added later).
5. **Deliver digital works automatically and handle shipping for physical works**
   - Digital artworks are delivered via secure download links after payment.
   - Physical artworks have clear shipping costs and policies for US customers.
6. **Be production‑ready and stable**
   - The site should handle typical small‑store traffic reliably, with a smooth checkout experience and minimal friction.

## 3. User Stories

### 3.1 Customer (Art Buyer)

1. **Browsing gallery**
   - As a **visitor**, I want to **see a curated gallery of artworks on the home page** so that I immediately get a feel for the artist’s style and the kind of works available.
2. **Viewing catalog**
   - As a **customer**, I want to **browse all artworks in a shop/catalog page with filters (by category/medium)** so that I can quickly find works that match my interests (e.g., sketches, sculptures, abstract pieces, digital art).
3. **Viewing product details**
   - As a **customer**, I want to **view a detailed page for each artwork** (large images, description, size, medium, price, availability) so that I can decide if I want to purchase it.
4. **Understanding availability**
   - As a **customer**, I want to **know if an artwork is still available or already sold** so that I don’t waste time trying to purchase unavailable pieces.
5. **Buying an original artwork**
   - As a **customer**, I want to **add a single original artwork to my cart and complete checkout** so that I can securely purchase it before someone else does.
6. **Buying digital art**
   - As a **customer**, I want to **purchase a digital artwork and receive a download link after payment** so that I can access the file immediately.
7. **Checkout flexibility**
   - As a **customer**, I want to **check out with or without creating an account** so that I can choose between speed (guest checkout) and convenience (order history, saved info).
8. **Shipping clarity**
   - As a **customer in the USA**, I want to **see clear shipping costs and estimated delivery times** so that I know the total cost before paying.
9. **Orders and confirmations**
   - As a **customer**, I want to **receive an order confirmation (on‑screen and via email)** so that I know my order went through and have a record of the details.

### 3.2 Admin (Artist / Sole Administrator)

10. **Managing products**
    - As the **admin**, I want to **create, edit, and delete artworks** (with images, descriptions, metadata) so that I can keep the catalog up to date.
11. **Uploading artwork images**
    - As the **admin**, I want to **upload multiple images per artwork** (e.g., different angles, close‑ups) so that customers get a better sense of each piece.
12. **Categorizing artworks**
    - As the **admin**, I want to **assign artworks to categories/collections** (Paintings, Canvases, Sketches, Digital Art, Sculptures, Abstract) so that customers can browse by category on the shop page.
13. **Tracking stock for originals**
    - As the **admin**, I want the system to **treat original physical artworks as 1‑of‑1 items and mark them as sold once purchased** so that they cannot be sold twice.
14. **Managing digital files**
    - As the **admin**, I want to **upload a digital file for digital artworks** and have it **delivered securely only to paying customers** so that my files are protected.
15. **Managing orders**
    - As the **admin**, I want to **view all orders, see payment/fulfillment status, and update order status** (e.g., Pending, Paid, Shipped, Completed, Cancelled) so that I can manage fulfillment.
16. **Managing discounts**
    - As the **admin**, I want to **create simple discount codes** (percentage or fixed amount, optional expiry) so that I can run occasional promotions.
17. **Basic analytics**
    - As the **admin**, I want to **see basic analytics** (total sales, number of orders, top‑selling categories or works over a period) so that I can understand performance.

## 4. Functional Requirements

### 4.1 Catalog & Products

1. **Product Types**
   1.1. The system must support **physical artworks** including (but not limited to): paintings, canvases, sketches, sculptures, and abstract drawings.  
   1.2. The system must support **digital artworks** (digital paintings) as a separate product type with downloadable files.

2. **Product Attributes**
   2.1. Each product must have: title, description, category (e.g., Painting, Sketch, Sculpture, Abstract, Digital), price (in USD), main image, and optional additional images.  
   2.2. Each product should support metadata such as: medium, size/dimensions, materials, year, and a short “story”/artist note (optional).  
   2.3. Each product must have a **type flag** indicating whether it is **physical** or **digital** (or both, if needed in the future).

3. **Inventory & Availability**
   3.1. For all **original physical artworks**, the system must treat stock as **1 unit** by default (1‑of‑1).  
   3.2. When an order is successfully paid for a 1‑of‑1 item, the product must be automatically **marked as “Sold” / out of stock** and must no longer be purchasable.  
   3.3. The product detail page must clearly show availability status (Available / Sold Out).  
   3.4. For **digital artworks**, inventory does **not need stock tracking** (effectively unlimited).

4. **Catalog Browsing**
   4.1. The system must provide a **Shop** page listing all available artworks (with pagination or load‑more as needed).  
   4.2. The Shop page must support **filtering by category/medium** (e.g., Sketches, Sculptures, Abstract, Digital Art).  
   4.3. The Shop page should support **sorting** (e.g., by newest, price low‑to‑high, price high‑to‑low).  
   4.4. Sold‑out items should either:
       - be hidden by default, or  
       - be visibly labelled as **“Sold”**, with an optional filter to hide/show sold works (final behavior to be chosen during implementation, but must be configurable).

5. **Product Detail Page**
   5.1. The system must provide a **product detail page** for each artwork, showing:
       - Large primary image and gallery of additional images.  
       - Title, price, category, size/dimensions, medium, description, and availability.  
       - For physical items: shipping summary (e.g., “Ships within X days within the USA”).  
       - For digital items: a brief explanation of what the buyer receives (file type, resolution, usage notes).  
   5.2. The product detail page must provide an **“Add to Cart”** or **“Buy Now”** button (implementation detail can vary, but must support at least “Add to Cart”).  
   5.3. If the item is sold out, the purchase buttons must be disabled and replaced with a clear **“Sold”** indicator.

### 4.2 Cart & Checkout

6. **Shopping Cart**
   6.1. The system must allow users to **add products to a cart**, view cart contents, update quantities (where applicable), and remove items.  
   6.2. For 1‑of‑1 originals, the cart must **enforce quantity = 1** and prevent multiple additions of the same item.  
   6.3. The cart must show item names, thumbnails, prices, subtotal, any discounts, shipping (if known), and total amount in **USD**.

7. **Checkout Flow**
   7.1. The system must support **guest checkout** (no account required).  
   7.2. The system must allow **optional account creation** during or after checkout for customers who want order history and easier repeat purchases.  
   7.3. Checkout must collect necessary customer information:
       - Name  
       - Email  
       - Shipping address (for physical items)  
       - Billing address, or confirmation that billing address is same as shipping  
   7.4. Checkout must clearly display:
       - Order summary (items, quantities, prices)  
       - Shipping cost and method for US delivery  
       - Final total in USD before payment  
   7.5. After payment, the user must see an **order confirmation page** with order details.

8. **Payments**
   8.1. The system must integrate with **Stripe** for card payments (credit/debit).  
   8.2. Payment must be **processed securely** using Stripe best practices (e.g., hosted payment page or tokenized card details; no raw card data stored in our system).  
   8.3. Orders must only be marked as **“Paid”** after receiving a confirmed successful payment from Stripe (via webhook or server‑side validation).  
   8.4. Failed or cancelled payments must **not** create a Paid order; if an order record is created, it must be clearly marked as **Failed/Cancelled**.

9. **Shipping (USA Only for v1)**
   9.1. The system must support **shipping within the USA only** for physical artworks.  
   9.2. For v1, shipping can be implemented as:
       - A **flat rate** per order for US addresses, and  
       - Optional **free shipping above a configurable order total threshold** (e.g., free shipping for orders over a certain USD amount).  
   9.3. The checkout flow must calculate and display shipping cost before payment.  
   9.4. The admin must be able to configure:
       - Base flat shipping rate, and  
       - Threshold amount for free shipping (or disable free shipping).

10. **Digital Delivery**
   10.1. For **digital products**, after a successful payment:
        - The system must generate or expose a **secure download link** for the purchased file(s).  
        - The link should be shown on the **order confirmation page** and sent via **email**.  
   10.2. Download links must be **protected** (e.g., time‑limited, tied to the order/customer, or accessible only when authenticated) to avoid easy sharing/leaking.  
   10.3. The admin must be able to **upload and attach one or more files** to each digital product.

### 4.3 User Accounts & Authentication (v1)

11. **Customer Accounts (Optional)**
   11.1. Customers should be able to **create an account** with email and password.  
   11.2. Customers with an account should be able to:
        - View **order history**.  
        - View **order details** including download links for digital purchases (if still valid).  
        - Update basic profile information (name, default address).  
   11.3. Login/logout and password reset flows should be provided.

12. **Admin Role**
   12.1. There will be exactly **one admin user** (the artist) for v1.  
   12.2. Admin functionality must be **restricted** to authenticated/admin accounts only.  
   12.3. No **multi‑vendor** or multi‑admin features are required for v1.

### 4.4 Admin Panel / Dashboard

13. **Product Management**
   13.1. The admin must be able to:
        - Create new products with all required fields (title, description, price, category, type (physical/digital), availability, stock, metadata).  
        - Upload **multiple images** per product.  
        - Mark a product as **digital** and upload digital files.  
        - Mark a product as **active/inactive** (inactive products are not visible to customers).  
   13.2. The admin must be able to **edit** and **delete** products.

14. **Category / Collection Management**
   14.1. The system should provide **predefined categories** that match the artist’s work: Paintings, Canvases, Sketches, Digital Art, Sculptures, Abstract.  
   14.2. The admin must be able to **assign products to one or more categories**.  
   14.3. Optionally, the admin may be able to define additional custom categories/collections in the future (nice‑to‑have).

15. **Order Management**
   15.1. The admin must be able to view a **list of all orders** with key information (order ID, date, customer name, total, status, payment status).  
   15.2. The admin must be able to click into an order to see:
        - Line items (products, prices, quantities)  
        - Customer details and shipping address  
        - Payment status and method  
        - Shipping status  
   15.3. The admin must be able to **update order status** (e.g., Pending → Shipped → Completed, or Cancelled).  
   15.4. The admin should be able to **add tracking information** (optional, nice‑to‑have) to an order and see it recorded.

16. **Discounts / Promotions**
   16.1. The admin must be able to create **discount codes** with:
        - Code string (e.g., “WELCOME10”)  
        - Discount type (percentage or fixed amount)  
        - Discount value  
        - Optional expiration date  
   16.2. Discounts must be applied during checkout and reflected in the order total.

17. **Basic Analytics**
   17.1. The admin should see a simple **dashboard** showing at least:
        - Total sales (over configurable time ranges, e.g., last 30 days, all time).  
        - Number of orders.  
        - Top‑selling products or categories.  
   17.2. For v1, analytics can be **basic**, with potential to deepen later.

### 4.5 Content & Pages

18. **Home Page**
   18.1. The home page must present a **visually striking hero section** using real product images to create a calm, spiritual gallery feel (aligned with the existing implementation).  
   18.2. The home page should highlight:
        - Featured works (curated set chosen by the admin).  
        - New arrivals.  
        - Key categories (e.g., Sketches, Sculptures, Abstract).  
   18.3. The home page should include clear **calls to action** (e.g., “Explore Collection”, “Shop All Artworks”).

19. **Shop / Catalog Page**
   19.1. A dedicated **Shop** page must list all active products with filters and sorting (as described in 4.1 and 4.4).

20. **Product Page**
   20.1. See requirements under 4.1.5.

21. **About Page**
   21.1. The site must include an **About the Artist** page describing the artist’s story, philosophy, and approach.  
   21.2. The admin must be able to update the about content (via CMS or simple editable content mechanism).

22. **Contact Page**
   22.1. The site must include a **Contact** page with:
        - A contact form (name, email, message) or clear instructions for contacting via email/socials.  
   22.2. For v1, a simple email‑based form submission is sufficient.

23. **Policy Pages**
   23.1. The site must include pages for:
        - FAQ (common questions about shipping, originals, digital downloads, etc.).  
        - Shipping & Returns policy.  
        - Privacy Policy.  
        - Terms & Conditions.  
   23.2. Content can be static for v1 (editable via files or a simple admin editor later).

24. **Blog / Journal (Nice‑to‑Have, Low Priority)**
   24.1. A simple blog/journal section is **optional** for v1 and can be deferred.  
   24.2. If implemented, it should allow the admin to create posts about process, new releases, etc.

## 5. Non‑Goals (Out of Scope for v1)

1. **Multi‑vendor marketplace features** (multiple artists or shops).  
2. **Complex personalization/commissions flow** (e.g., custom orders, dynamic pricing per client) — may be considered later as a separate feature.  
3. **Advanced multi‑currency or multi‑region pricing** (only USD and USA shipping for v1).  
4. **Advanced shipping calculations** (by weight/dimensions integrated with carriers) — v1 uses simple flat rate + optional free shipping threshold.  
5. **Extensive CMS for all pages** (a full headless CMS is not required; simple update mechanisms are acceptable).  
6. **Product reviews/ratings** (could be added in a future version).  
7. **Wishlist/favorites** (considered a nice‑to‑have future enhancement).  
8. **Multi‑language support** (English‑only for v1).

## 6. Design Considerations

1. **Overall Feel**
   - The site should feel like a **calm, soothing online gallery**, with plenty of whitespace, large imagery, and gentle motion.  
   - The existing **color palette and typography** (e.g., cream/off‑white background, deep green primary, `Libre Baskerville` headings and `Plus Jakarta Sans` body) should be preserved and used consistently to reinforce a premium, tranquil aesthetic.

2. **Layouts**
   - Use **grid‑based layouts** for galleries and products, with large, high‑quality images.  
   - Ensure a consistent card style for artworks (matching the current `ProductCard` design system where possible).  
   - Make heavy use of spacing and subtle dividers to avoid visual clutter.

3. **Responsiveness**
   - The site must be **fully responsive**, working well on mobile, tablet, and desktop.  
   - Product images and layout should adapt gracefully, prioritizing readability and image clarity.

4. **Interactions**
   - Support **hover states** and subtle animations that enhance the gallery feel (e.g., image zoom on hover, soft fades) but avoid overly flashy or distracting effects.  
   - Use consistent button styles (primary/secondary) leveraging the existing UI component library.

5. **Accessibility**
   - Ensure sufficient **color contrast** between text and backgrounds.  
   - Provide **alt text** for all artwork images (auto‑derived from product titles/descriptions where possible).  
   - Support keyboard navigation for major interactive components (menus, modals, cart drawer, etc.).

## 7. Technical Considerations

1. **Existing Stack**
   - The project already uses a **React/TypeScript front‑end** (with Vite) and a **Node/TypeScript back‑end**, plus a shared schema (`shared/schema.ts`) and a modern UI component system.  
   - The implementation of this PRD should **extend and refine the existing codebase** rather than replace it.

2. **Data & Persistence**
   - Product, order, user, and discount data should be persisted in the existing database layer (e.g., using Drizzle or the current ORM).  
   - Inventory updates (especially for 1‑of‑1 items) must be **atomic and safe** to prevent double‑selling.

3. **Payments Integration**
   - Use **Stripe** SDKs (server + client as appropriate) following best practices (e.g., Stripe Checkout or Payment Intents).  
   - Implement **webhooks** or secure callbacks so that payment confirmation is authoritative and tamper‑resistant.

4. **Digital File Handling**
   - Digital files should be stored in a secure storage location (local or cloud) not directly exposed by public URLs, with **secured, time‑limited download URLs** generated per order.  
   - Filenames and links should not reveal internal storage paths.

5. **Email Notifications**
   - Basic transactional emails should be sent for:
     - Order confirmation (with summary and for digital products, access instructions).  
     - Optional shipment notifications when order status changes to Shipped.  
   - A simple, reliable email provider/service should be used (e.g., SMTP, a transactional email API).

6. **Performance & SEO**
   - Use image optimization strategies (appropriate sizes, lazy loading of gallery images) to maintain a smooth experience.  
   - Provide basic SEO metadata (page titles, descriptions, open graph tags) for key pages and artworks.

## 8. Success Metrics

1. **Sales & Engagement**
   - Achieve a **steady flow of completed orders** within the first 3–6 months (exact numeric targets can be refined later).  
   - Increase the number of visitors who reach checkout and complete payment (conversion rate).

2. **Reliability & Performance**
   - Maintain a **stable** site with no major crashes or blocking errors during normal traffic.  
   - Page loads should feel **fast and responsive** on typical home and shop pages.

3. **Admin Usability**
   - The artist should be able to **add new products, update existing ones, and manage orders without developer intervention**.  
   - Common tasks (adding a product, fulfilling an order) should be completable in a few straightforward steps.

4. **Customer Experience**
   - Customers should have **clear visibility of availability, prices, shipping costs, and download access**.  
   - Minimal support issues related to “I can’t find my download” or “I wasn’t sure about shipping”.

## 9. Open Questions

1. **Shipping Details**
   - Exact flat shipping rate for US orders and the threshold amount (if any) for free shipping need to be confirmed.  
2. **Digital File Formats**
   - Preferred file formats and resolutions for digital artworks (e.g., JPG, PNG, TIFF, printable resolutions) should be specified.  
3. **Account Features**
   - Whether to provide any additional account features in v1 (e.g., address book, saved cart) beyond basic order history.  
4. **Blog / Journal**
   - Whether a blog/journal is required for v1, or deferred to a later phase.  
5. **Future Internationalization**
   - Whether future versions should plan for non‑US shipping and additional currencies/languages, which might affect some design/architecture choices now.


