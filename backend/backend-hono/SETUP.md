# TripSync API - Hono on Cloudflare Workers

A modern, serverless backend for TripSync built with **Hono** and deployed on **Cloudflare Workers**.

## 🚀 Features

- **Serverless Architecture**: Runs on Cloudflare's global edge network
- **Type-Safe**: Full TypeScript support with Zod validation
- **Fast & Scalable**: Sub-10ms cold starts, auto-scaling
- **Modern Stack**: Hono framework + D1 database + Workers runtime

## 📋 Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Wrangler CLI installed globally: `npm install -g wrangler`

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd backend-hono
npm install
```

### 2. Create D1 Database

```bash
# Create the database
wrangler d1 create tripsync-db

# Copy the database_id from the output and paste it into wrangler.jsonc
```

Update `wrangler.jsonc` with your database ID:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "tripsync-db",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ]
}
```

### 3. Run Database Migrations

```bash
# Apply the schema to your D1 database
wrangler d1 execute tripsync-db --file=./migrations/schema.sql

# Verify tables were created
wrangler d1 execute tripsync-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### 4. Set Environment Secrets

```bash
# Set JWT secret (use a strong random string)
wrangler secret put JWT_SECRET

# Set OLA Maps API key
wrangler secret put OLA_MAPS_API_KEY
```

### 5. Run Development Server

```bash
npm run dev
```

The API will be available at http://localhost:8787

## 📂 Project Structure

```
backend-hono/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── types/
│   │   └── context.ts           # TypeScript type definitions
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT authentication
│   │   └── error.middleware.ts  # Global error handling
│   ├── routes/
│   │   ├── auth.routes.ts       # Authentication endpoints
│   │   ├── health.routes.ts     # Health check endpoints
│   │   ├── pooling.routes.ts    # Ride pooling endpoints
│   │   ├── profile.routes.ts    # User profile endpoints
│   │   └── services.routes.ts   # Service posts endpoints
│   ├── schemas/
│   │   ├── user.schema.ts       # User validation schemas
│   │   ├── pooling.schema.ts    # Pooling validation schemas
│   │   ├── profile.schema.ts    # Profile validation schemas
│   │   └── service.schema.ts    # Service validation schemas
│   ├── services/
│   │   ├── auth.service.ts      # Auth business logic
│   │   ├── pooling.service.ts   # Pooling business logic
│   │   ├── profile.service.ts   # Profile business logic
│   │   └── service.service.ts   # Service posts business logic
│   └── utils/
│       ├── crypto.ts            # Password hashing
│       ├── jwt.ts               # JWT utilities
│       └── distance.ts          # OLA Maps integration
├── migrations/
│   └── schema.sql               # D1 database schema
├── wrangler.jsonc               # Cloudflare configuration
├── package.json
└── tsconfig.json
```

## 🛠️ API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/token` - Login and get JWT token

### Health

- `GET /api/health` - Basic health check
- `GET /api/health/db` - Database health check

### Pooling (Authenticated)

- `POST /api/pool/requests` - Create pooling request and find matches

### Profile (Authenticated)

- `GET /api/profile/me` - Get current user's profile
- `PUT /api/profile/me` - Update current user's profile

### Services

- `GET /api/services` - Get all service posts (public)
- `GET /api/services/:id` - Get single service post (public)
- `POST /api/services` - Create service post (authenticated)
- `DELETE /api/services/:id` - Delete service post (authenticated, owner only)

## 🔐 Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

To get a token:

1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/token` (OAuth2 password flow)
3. Use the `access_token` from the response

## 🌍 Deployment

### Deploy to Cloudflare Workers

```bash
npm run deploy
```

Your API will be deployed to: `https://backend-hono.<your-subdomain>.workers.dev`

### Environment Variables

Set these secrets in production:

```bash
wrangler secret put JWT_SECRET
wrangler secret put OLA_MAPS_API_KEY
```

## 🧪 Testing

### Test Locally

```bash
# Start dev server
npm run dev

# In another terminal, test endpoints
curl http://localhost:8787/api/health
```

### Test Registration

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "college_name": "Test College"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:8787/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"
```

## 📝 Migration from FastAPI

This codebase is a direct migration from the FastAPI backend. Key changes:

| FastAPI | Hono/Cloudflare |
|---------|-----------------|
| Python | TypeScript |
| PostgreSQL | D1 (SQLite) |
| SQLAlchemy | Raw SQL queries |
| Pydantic | Zod |
| `Depends()` | Middleware |
| Uvicorn server | Cloudflare Workers |

## 🐛 Troubleshooting

### Database Errors

If you get database errors, ensure:
1. Database was created: `wrangler d1 list`
2. Migrations were run: `wrangler d1 execute tripsync-db --file=./migrations/schema.sql`
3. Database ID in `wrangler.jsonc` is correct

### Authentication Errors

Ensure JWT_SECRET is set:
```bash
wrangler secret put JWT_SECRET
# Enter a strong random string
```

### CORS Issues

The API allows all origins by default. To restrict:

Edit `src/index.ts`:
```typescript
cors({
  origin: ['https://yourfrontend.com'],
  // ...
})
```

## 📚 Resources

- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Zod Documentation](https://zod.dev/)

## 📄 License

MIT
