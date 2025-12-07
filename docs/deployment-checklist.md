# Production Deployment Checklist - Step by Step

## Overview
This guide will walk you through every step needed to deploy your application to production.
Follow each step in order and check them off as you complete them.

---

## Phase 1: Local Setup & Configuration

### ✅ Step 1: Generate Strong SESSION_SECRET

**What:** A random string used to encrypt session data
**Why:** Security - prevents session hijacking
**Requirement:** Minimum 32 characters, random

**Action:**

**Option A - Using Node.js (Recommended):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option B - Using PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Option C - Using OpenSSL (if installed):**
```bash
openssl rand -base64 32
```

**What to do:**
1. Run ONE of the above commands in your terminal
2. Copy the output (it will look like: `xK8mP+qL9vR3wN7uZ2aF5jH1cT4yB6nE8sG0dV3mA9k=`)
3. Save it temporarily in a text file - you'll need it for Step 5

**Example Output:**
```
aBcD1234EfGh5678IjKl9012MnOp3456QrSt7890UvWx=
```

**Status:** [ ] COMPLETED - SESSION_SECRET generated and saved

---

### ✅ Step 2: Create Production Environment File

**What:** A `.env` file with all your production configuration
**Why:** Keeps secrets separate from code
**Where:** Root of your project

**Action:**

1. Copy the example file:
```bash
cp .env.example .env
```

**If that doesn't work on Windows, use:**
```powershell
Copy-Item .env.example .env
```

2. Open `.env` in your editor
3. Leave it open - we'll fill it in during subsequent steps

**Status:** [ ] COMPLETED - .env file created

---

### ✅ Step 3: Choose Your Deployment Platform

**What:** Where your application will be hosted
**Recommendation:** Railway (easiest for your stack)

**Options:**

| Platform | Best For | Cost | Complexity |
|----------|----------|------|------------|
| **Railway** ⭐ | Fullstack Node.js | $15-25/mo | Easy |
| Render | Free tier available | Free-$25/mo | Easy |
| DigitalOcean | More control | $21+/mo | Medium |
| Fly.io | Edge deployment | $15-30/mo | Medium |

**Decision:** I'm deploying to: ________________

**For this guide, we'll use Railway. If you choose another platform, the steps are similar.**

**Status:** [ ] COMPLETED - Platform chosen

---

## Phase 2: Database Setup

### ✅ Step 4: Set Up PostgreSQL Database

**What:** Your production database
**Why:** Stores products, orders, users, sessions
**Options:** Neon (serverless), Railway (managed), Supabase (with extras)

#### Option A: Railway PostgreSQL (Recommended - Integrated)

**If using Railway for hosting:**

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```
*(This will open a browser window - sign up/login with GitHub)*

3. Initialize project:
```bash
railway init
```
*(Give your project a name: "mystic-canvas" or similar)*

4. Add PostgreSQL:
```bash
railway add postgresql
```

5. Get your database URL:
```bash
railway variables
```

Look for `DATABASE_URL` in the output, copy it.

**Example output:**
```
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

#### Option B: Neon (Serverless PostgreSQL)

**If you prefer separate database:**

1. Go to https://neon.tech
2. Sign up with GitHub
3. Click "Create Project"
4. Name: "mystic-canvas"
5. Region: Choose closest to your users
6. Click "Create Project"
7. Copy the connection string shown (looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb`)

#### Option C: Supabase (PostgreSQL + Extra Features)

1. Go to https://supabase.com
2. Sign up
3. Create new project
4. Copy the connection string from Settings → Database

**Action Required:**
1. Choose one option above
2. Copy your `DATABASE_URL`
3. Update your `.env` file:
```env
DATABASE_URL=postgresql://your_connection_string_here
```

**Status:** [ ] COMPLETED - Database provisioned and DATABASE_URL saved in .env

---

### ✅ Step 5: Complete Environment Configuration

**What:** Fill in all required environment variables
**Why:** Application needs these to run

**Action:**

Open your `.env` file and fill in these values:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
APP_URL=https://your-domain.com  # We'll update this after deployment

# Database (from Step 4)
DATABASE_URL=postgresql://your_connection_string_from_step_4

# Session (from Step 1)
SESSION_SECRET=your_generated_secret_from_step_1

# Stripe (we'll fill these in Step 6)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Shipping Configuration (optional - use defaults or customize)
SHIPPING_FLAT_RATE_CENTS=1500
FREE_SHIPPING_THRESHOLD_CENTS=15000
```

**Status:** [ ] COMPLETED - Basic environment variables configured

---

## Phase 3: Stripe Setup

### ✅ Step 6: Get Stripe API Keys

**What:** Keys to process payments
**Why:** Required for checkout functionality
**Where:** Stripe Dashboard

**Action:**

#### Part A: Create/Login to Stripe Account

1. Go to https://dashboard.stripe.com
2. Sign up or login
3. Complete account verification (required for live payments)

#### Part B: Get Test Keys (for testing first)

1. In Stripe Dashboard, ensure you're in **TEST MODE** (toggle in top right)
2. Go to: **Developers** → **API keys**
3. You'll see:
   - **Publishable key**: Starts with `pk_test_...`
   - **Secret key**: Click "Reveal" - starts with `sk_test_...`

4. Copy both keys and add to your `.env`:
```env
# For Testing
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Part C: Get Live Keys (when ready for production)

1. In Stripe Dashboard, **switch to LIVE MODE** (toggle in top right)
2. Go to: **Developers** → **API keys**
3. Copy the live keys (they start with `pk_live_...` and `sk_live_...`)
4. **KEEP THESE SECRET** - never commit to git

**For now, use TEST keys. We'll switch to LIVE keys after testing.**

**Status:** [ ] COMPLETED - Stripe test keys added to .env

---

### ✅ Step 7: Test Build Locally

**What:** Verify everything compiles and builds correctly
**Why:** Catch errors before deploying

**Action:**

Run this command:
```bash
npm run check
```

**Expected output:** No errors

**If there are errors:** Let me know and I'll help fix them.

Then build:
```bash
npm run build
```

**Expected output:** 
- "building client... ✓ built in Xs"
- "building server... Done in Xms"
- "No DATABASE_URL found, skipping migrations (OK for development)"

**Status:** [ ] COMPLETED - Build successful locally

---

## Phase 4: Deployment

### ✅ Step 8: Deploy to Railway

**What:** Upload and run your application
**Why:** Make it accessible on the internet

**Action:**

#### Step 8a: Deploy the Application

```bash
railway up
```

This will:
- Upload your code
- Install dependencies
- Build your application
- Start the server

**Wait for:** "Build completed" and "Deployment live"

#### Step 8b: Get Your Application URL

```bash
railway domain
```

This will show your Railway URL (like: `mystic-canvas-production.up.railway.app`)

**Copy this URL** - you'll need it for:
1. Updating `APP_URL` in environment variables
2. Stripe webhook configuration

#### Step 8c: Set Environment Variables in Railway

You need to set all your environment variables in Railway:

**Option A - Using CLI:**
```bash
# Set SESSION_SECRET
railway variables set SESSION_SECRET="your_secret_from_step_1"

# Set Stripe keys (test keys for now)
railway variables set STRIPE_SECRET_KEY="sk_test_xxx"
railway variables set STRIPE_PUBLISHABLE_KEY="pk_test_xxx"

# Set APP_URL (use the domain from railway domain command)
railway variables set APP_URL="https://your-app.up.railway.app"
```

**Option B - Using Dashboard:**
1. Go to https://railway.app/dashboard
2. Click your project
3. Click your service
4. Go to "Variables" tab
5. Add each variable:
   - `SESSION_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `APP_URL`
   - `NODE_ENV` = `production`

**Note:** `DATABASE_URL` should already be set automatically by Railway

After setting variables, Railway will automatically redeploy.

**Status:** [ ] COMPLETED - Application deployed and running

---

### ✅ Step 9: Run Database Migrations

**What:** Create all database tables
**Why:** Application needs these to store data

**Action:**

The migration should run automatically via `postbuild` script.

**To verify, check logs:**
```bash
railway logs
```

**Look for:** "Migrations completed successfully" or similar message

**If migrations didn't run automatically:**
```bash
railway run npm run db:push
```

**Status:** [ ] COMPLETED - Database tables created

---

### ✅ Step 10: Create Admin User

**What:** Your admin account to access `/admin` dashboard
**Why:** Manage products, orders, and site content

**Action:**

**Set admin credentials as environment variables:**

```bash
# Using Railway CLI
railway variables set ADMIN_EMAIL="your-email@example.com"
railway variables set ADMIN_PASSWORD="YourSecurePassword123!"
```

**Then create the admin user:**
```bash
railway run npm run seed:admin
```

**Expected output:**
```
✅ Admin user created successfully!
   User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Username: admin
   Email: your-email@example.com
   Role: admin

You can now login with these credentials.
```

**Save your admin credentials:**
- Email: _____________________
- Password: __________________

**Status:** [ ] COMPLETED - Admin user created

---

## Phase 5: Stripe Webhook Setup

### ✅ Step 11: Configure Stripe Webhook

**What:** Allow Stripe to notify your app about payment events
**Why:** Update orders when payments succeed/fail

**Action:**

#### Step 11a: Get Your Webhook URL

Your webhook URL is:
```
https://your-railway-app-url.up.railway.app/api/stripe/webhook
```

Replace `your-railway-app-url.up.railway.app` with your actual Railway domain from Step 8b.

#### Step 11b: Create Webhook in Stripe

1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Click "**Add endpoint**"
3. Endpoint URL: `https://your-app-url/api/stripe/webhook`
4. Description: "MysticCanvas Production Webhook"
5. Events to send: Select these three:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
6. Click "Add endpoint"

#### Step 11c: Get Webhook Signing Secret

After creating the endpoint:
1. Click on the webhook you just created
2. Under "Signing secret", click "Reveal"
3. Copy the secret (starts with `whsec_...`)

#### Step 11d: Add Webhook Secret to Railway

```bash
railway variables set STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxx"
```

**Railway will redeploy automatically**

**Status:** [ ] COMPLETED - Stripe webhook configured

---

## Phase 6: Testing

### ✅ Step 12: Test Your Deployed Application

**What:** Verify everything works in production
**Why:** Catch issues before customers do

**Action - Follow this testing sequence:**

#### Test 1: Access the Site
1. Open your Railway URL in a browser
2. **Expected:** Homepage loads with products

#### Test 2: Register a Customer Account
1. Click "Login" → "Register"
2. Fill in:
   - Username: `testcustomer`
   - Email: `test@example.com`
   - Password: `test123456`
3. Submit
4. **Expected:** Redirected to homepage, logged in

#### Test 3: Browse Products
1. Click "Shop"
2. **Expected:** See products list
3. Click on a product
4. **Expected:** Product detail page loads

#### Test 4: Test Cart
1. Click "Add to Cart" on a product
2. Click cart icon (shopping bag)
3. **Expected:** Cart drawer opens with item

#### Test 5: Test Checkout (Test Mode)
1. In cart, click "Proceed to Checkout"
2. Fill in shipping address (US address)
3. **Expected:** Redirected to Stripe Checkout
4. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
5. Complete payment
6. **Expected:** Redirected back to success page

#### Test 6: Verify Webhook
1. Go to Stripe Dashboard → Webhooks
2. Click your webhook
3. **Expected:** See successful webhook events

#### Test 7: Login as Admin
1. Logout (if logged in as customer)
2. Go to `/login`
3. Login with admin credentials from Step 10
4. Click user icon → "Admin Dashboard"
5. **Expected:** Access to `/admin`

#### Test 8: Test Admin Dashboard
1. Check that you can see:
   - Dashboard with stats
   - Products page
   - Orders page (with your test order)
   - Discounts page
2. Try creating a new product
3. **Expected:** All admin functions work

**Status:** [ ] COMPLETED - All tests passed

---

## Phase 7: Switch to Live Mode (Optional - Do Later)

### ✅ Step 13: Switch to Stripe Live Keys

**When:** After thorough testing, when ready for real customers
**Warning:** Live mode processes real money!

**Action:**

1. Complete Stripe account verification
2. Go to Stripe Dashboard
3. Switch to **LIVE MODE** (toggle in top right)
4. Get live API keys (Developers → API keys)
5. Update Railway variables:
```bash
railway variables set STRIPE_SECRET_KEY="sk_live_xxx"
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
```
6. Create NEW webhook for live mode (repeat Step 11)
7. Update webhook secret:
```bash
railway variables set STRIPE_WEBHOOK_SECRET="whsec_live_xxx"
```

**Status:** [ ] COMPLETED - Live mode activated (or SKIP for now)

---

## Phase 8: Final Steps

### ✅ Step 14: Set Up Monitoring (Optional but Recommended)

**What:** Get notified if your site goes down
**Why:** Quick response to issues

**Action:**

#### Option A: UptimeRobot (Free)
1. Go to https://uptimerobot.com
2. Sign up (free plan: 50 monitors)
3. Add monitor:
   - Type: HTTP(s)
   - URL: Your Railway URL + `/health`
   - Name: "MysticCanvas Health Check"
   - Monitoring interval: 5 minutes
4. Add alert contacts (email/SMS)

#### Option B: Railway Built-in
Railway shows metrics in dashboard:
- CPU usage
- Memory usage
- Response times
- Error rates

**Status:** [ ] COMPLETED - Monitoring set up

---

### ✅ Step 15: Custom Domain (Optional)

**What:** Use your own domain instead of Railway URL
**Why:** Professional appearance, branding

**Action:**

If you have a domain:

1. In Railway dashboard:
   - Go to your service
   - Click "Settings"
   - Scroll to "Domains"
   - Click "Custom Domain"
   - Enter your domain: `mysticcanvas.com`

2. Update DNS:
   - Add CNAME record pointing to Railway's URL
   - Wait for DNS propagation (up to 48 hours)

3. Update environment variable:
```bash
railway variables set APP_URL="https://yourdomain.com"
```

4. Update Stripe webhook URL to use new domain

**Status:** [ ] COMPLETED - Custom domain configured (or SKIP)

---

## ✅ Final Checklist Summary

Check all completed:

- [ ] Generated SESSION_SECRET
- [ ] Created .env file
- [ ] Chose deployment platform
- [ ] Set up PostgreSQL database
- [ ] Configured environment variables
- [ ] Added Stripe test keys
- [ ] Build tested locally
- [ ] Deployed to Railway
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Stripe webhook configured
- [ ] All tests passed
- [ ] Monitoring set up (optional)
- [ ] Custom domain configured (optional)

---

## 🎉 Congratulations!

Your application is now live and ready to accept orders!

### Next Steps:
1. Create your product catalog (as admin)
2. Test with friends/family
3. When ready, switch to Stripe live mode
4. Market your store!

### Support Resources:
- Railway Docs: https://docs.railway.app
- Stripe Docs: https://stripe.com/docs
- Your deployment guide: `docs/deployment.md`

---

## Troubleshooting

### Issue: "Cannot connect to database"
**Solution:** Verify DATABASE_URL is set correctly in Railway variables

### Issue: "Session not persisting"
**Solution:** Ensure SESSION_SECRET is set and database is connected

### Issue: "Stripe webhook failing"
**Solution:** 
1. Check webhook URL is correct
2. Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
3. Check Railway logs for errors

### Issue: "Admin page not accessible"
**Solution:** Ensure you created admin user and are logged in with admin account

### Issue: "Build failing on Railway"
**Solution:** Run `npm run check` locally first to find TypeScript errors

---

**Need Help?** Check Railway logs:
```bash
railway logs
```

