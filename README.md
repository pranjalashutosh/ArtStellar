# MysticCanvas - Art E-Commerce Platform

A full-stack art gallery and e-commerce platform built with React, Express, PostgreSQL, and Stripe.

## Features

- 🎨 **Art Gallery**: Browse and purchase original artwork and prints
- 🛒 **Shopping Cart**: Add items and proceed to secure checkout
- 💳 **Stripe Integration**: Secure payment processing
- 📦 **Order Management**: Track orders and fulfillment
- 🔐 **Authentication**: Secure user registration and login
- 👤 **Admin Dashboard**: Manage products, orders, and discounts
- 🖼️ **Digital Downloads**: Secure delivery of digital artwork
- 💰 **Discount Codes**: Create and manage promotional codes
- 📱 **Responsive Design**: Mobile-friendly interface

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Radix UI for components
- Zustand for state management
- React Query for data fetching
- Wouter for routing

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with Drizzle ORM
- Passport.js for authentication
- Stripe for payments
- Multer for file uploads
- Helmet for security
- Express Rate Limit

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL 14+ (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd MysticCanvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   - Database connection string
   - Session secret
   - Stripe API keys
   - Other configuration options

4. **Run database migrations** (if using PostgreSQL)
   ```bash
   npm run db:push
   ```

5. **Create an admin user**
   ```bash
   ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="admin123" npm run seed:admin
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:5000
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate migration files
- `npm run seed:admin` - Create an admin user

### Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and hooks
│   │   └── App.tsx      # Root component
├── server/              # Backend Express application
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data access layer
│   ├── auth-*.ts        # Authentication modules
│   ├── config.ts        # Configuration
│   └── index.ts         # Server entry point
├── shared/              # Shared code between client/server
│   └── schema.ts        # Database schema and types
├── docs/                # Documentation
├── script/              # Build and utility scripts
└── uploads/             # Uploaded files (gitignored)
```

## Deployment

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

### Quick Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Add PostgreSQL
railway add postgresql

# Set environment variables
railway variables set SESSION_SECRET="your-secret"
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Deploy
railway up
```

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption (32+ characters)
- `STRIPE_SECRET_KEY` - Stripe secret API key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `APP_URL` - Your production URL

Optional:
- `PORT` - Server port (default: 5000)
- `SHIPPING_FLAT_RATE_CENTS` - Flat rate shipping cost (default: 1500)
- `FREE_SHIPPING_THRESHOLD_CENTS` - Free shipping threshold (default: 15000)

## Testing Authentication

1. **Register a customer account**
   - Go to `/register`
   - Fill in the form
   - Submit to create account

2. **Login as admin**
   - Go to `/login`
   - Use credentials from seed script
   - Access admin dashboard at `/admin`

3. **Test checkout flow**
   - Add products to cart
   - Proceed to checkout
   - Use Stripe test card: `4242 4242 4242 4242`

## Security

- ✅ Secure password hashing with bcrypt
- ✅ Session management with PostgreSQL store
- ✅ HTTPS enforcement in production
- ✅ Rate limiting on auth endpoints
- ✅ Helmet.js security headers
- ✅ Input validation with Zod
- ✅ SQL injection protection via Drizzle ORM
- ✅ Stripe webhook signature verification

## API Documentation

### Public Endpoints

- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `GET /api/discounts/validate?code=...` - Validate discount code
- `POST /api/checkout` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Admin Endpoints (Requires Authentication)

- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `GET /api/discounts` - List all discounts
- `POST /api/discounts` - Create discount
- `PUT /api/discounts/:id` - Update discount

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

