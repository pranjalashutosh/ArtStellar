# Deployment Guide

This guide covers deploying the MysticCanvas art e-commerce platform to production.

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database provisioned (PostgreSQL)
- [ ] Stripe account set up with live keys
- [ ] Admin user created
- [ ] Domain name configured (optional)
- [ ] SSL certificate configured (automatic with Railway/Render)

## Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

### Required Variables

```bash
# Database (Required for production)
DATABASE_URL=postgresql://user:password@host:5432/database

# Session Security (Required)
SESSION_SECRET=your-super-secret-random-string-min-32-chars

# Stripe (Required)
STRIPE_SECRET_KEY=sk_live_... # Use live key for production
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... # Get from Stripe Dashboard after creating webhook

# Server
NODE_ENV=production
APP_URL=https://yourdomain.com # Your production URL
```

### Optional Variables

```bash
# Shipping (defaults shown)
SHIPPING_FLAT_RATE_CENTS=1500
FREE_SHIPPING_THRESHOLD_CENTS=15000

# Port (Railway sets this automatically)
PORT=5000
```

## Deployment Options

### Option A: Railway (Recommended)

Railway provides automatic deployment, PostgreSQL database, and persistent volumes.

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login and Initialize

```bash
railway login
railway init
```

#### 3. Add PostgreSQL Database

```bash
railway add postgresql
```

#### 4. Set Environment Variables

```bash
# Set required variables
railway variables set SESSION_SECRET="your-random-secret-here"
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."
railway variables set APP_URL="https://your-app.railway.app"

# Optional: Set custom shipping rates
railway variables set SHIPPING_FLAT_RATE_CENTS=1500
railway variables set FREE_SHIPPING_THRESHOLD_CENTS=15000
```

#### 5. Deploy

```bash
# Deploy from current directory
railway up

# Or connect to GitHub and auto-deploy
railway link
```

#### 6. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.railway.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the signing secret
5. Set it in Railway:
   ```bash
   railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

#### 7. Create Admin User

```bash
railway run tsx script/seed-admin.ts
# Or set env vars in Railway dashboard and restart
```

#### 8. Add Volume for Uploads (Optional)

1. Go to Railway Dashboard
2. Select your service
3. Go to Volumes tab
4. Add volume with mount path: `/app/uploads`

### Option B: Render

Similar to Railway but with different CLI commands.

#### 1. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository

#### 2. Configure Build Settings

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment:** Node

#### 3. Add PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Connect to your web service

#### 4. Set Environment Variables

Add in Render Dashboard → Environment:
- `SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (after configuring webhook)
- `APP_URL` (your Render URL)

#### 5. Deploy

Render auto-deploys on push to main branch.

### Option C: DigitalOcean App Platform

1. Create new app from GitHub
2. Add PostgreSQL managed database
3. Configure environment variables
4. Deploy

### Option D: Self-Hosted (VPS/Dedicated Server)

For advanced users who want full control.

#### Requirements

- Ubuntu 22.04 LTS or similar
- Node.js 18+ installed
- PostgreSQL 14+ installed
- Nginx for reverse proxy
- SSL certificate (Let's Encrypt)

#### Steps

1. Clone repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Set up PostgreSQL database
5. Configure environment variables in `.env`
6. Run migrations: `npm run db:push`
7. Create systemd service
8. Configure Nginx reverse proxy
9. Set up SSL with Certbot
10. Start service

## Post-Deployment Steps

### 1. Run Database Migrations

```bash
# Railway
railway run npm run db:push

# Render (automatic on deploy)

# Manual
npm run db:push
```

### 2. Create Admin User

```bash
# Railway
railway run -- bash -c 'ADMIN_EMAIL="admin@yourdomain.com" ADMIN_PASSWORD="your-password" tsx script/seed-admin.ts'

# Or set environment variables in dashboard:
# ADMIN_EMAIL=admin@yourdomain.com
# ADMIN_PASSWORD=your-secure-password
# Then restart the service
```

### 3. Test the Application

1. Visit your production URL
2. Test registration/login
3. Login as admin
4. Access admin dashboard at `/admin`
5. Create a test product
6. Test checkout flow with Stripe test card
7. Verify webhooks are working

### 4. Configure Custom Domain (Optional)

#### Railway

```bash
railway domain
```

Or in dashboard: Settings → Domains → Add Custom Domain

#### Render

1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed

### 5. Set Up Monitoring

- **Railway:** Built-in monitoring in dashboard
- **Sentry:** For error tracking
- **UptimeRobot:** For uptime monitoring (free)

## Troubleshooting

### Sessions Not Persisting

- Verify `DATABASE_URL` is set
- Check that `user_sessions` table was created
- Ensure `SESSION_SECRET` is set and consistent

### Stripe Webhooks Not Working

- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- View webhook logs in Stripe dashboard
- Check application logs for errors

### File Uploads Failing

- Verify uploads directory exists and is writable
- Check volume is mounted correctly (Railway)
- Consider moving to S3/Cloudflare R2 for scale

### Database Connection Issues

- Verify `DATABASE_URL` format is correct
- Check database is running and accessible
- Look for connection pool errors in logs

### Build Failures

- Ensure all dependencies are in `dependencies` not `devDependencies`
- Check TypeScript compilation errors
- Verify Node.js version compatibility

## Scaling Considerations

### When to Scale

- Response times > 1 second
- CPU usage consistently > 80%
- Memory usage > 80%
- Database connection pool exhausted

### Scaling Strategies

1. **Vertical Scaling:** Increase server resources (easier)
2. **Horizontal Scaling:** Multiple instances (requires session store in database)
3. **Database Optimization:** Indexes, query optimization
4. **CDN:** Cloudflare for static assets
5. **Caching:** Redis for session and data caching
6. **File Storage:** Move to S3/R2 for uploads

## Backup Strategy

### Database Backups

- **Railway:** Automatic daily backups included
- **Render:** Automatic backups on paid plans
- **Manual:** Use `pg_dump` for regular backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240101.sql
```

### File Backups

- Regularly backup uploads directory
- Consider versioning for digital assets
- Use S3 with versioning enabled for production

## Security Best Practices

- ✅ Use strong `SESSION_SECRET` (32+ characters)
- ✅ Enable HTTPS (automatic with Railway/Render)
- ✅ Keep dependencies updated: `npm audit`
- ✅ Use environment variables for secrets
- ✅ Enable rate limiting (already configured)
- ✅ Monitor for suspicious activity
- ✅ Regular security audits
- ✅ Keep PostgreSQL updated
- ✅ Use Stripe webhook signature verification (implemented)

## Cost Estimates

### Railway (Recommended)
- PostgreSQL: $5/month
- Web Service: $10-20/month (usage-based)
- **Total: $15-25/month**

### Render
- PostgreSQL: $7/month
- Web Service: $7/month (starter) or $25/month (standard)
- **Total: $14-32/month**

### DigitalOcean
- Basic Droplet: $6/month
- Managed PostgreSQL: $15/month
- **Total: $21/month** (requires more management)

## Support

For issues or questions:
1. Check application logs
2. Review this documentation
3. Check provider's documentation (Railway/Render)
4. Review Stripe documentation for payment issues

