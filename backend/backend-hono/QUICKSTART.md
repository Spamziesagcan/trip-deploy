# 🎯 Quick Start Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend-hono
npm install
```

This will install:
- `hono` - Web framework
- `bcryptjs` - Password hashing
- `zod` - Schema validation
- `@hono/zod-validator` - Zod integration for Hono
- `@cloudflare/workers-types` - TypeScript types
- `wrangler` - Cloudflare CLI

### 2. Create and Configure D1 Database

```bash
# Create database
wrangler d1 create tripsync-db
```

Copy the `database_id` from the output and update `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "tripsync-db",
      "database_id": "<PASTE_YOUR_DATABASE_ID_HERE>"
    }
  ]
}
```

### 3. Run Database Migrations

```bash
# Apply schema
wrangler d1 execute tripsync-db --file=./migrations/schema.sql

# Verify (should show 6 tables)
wrangler d1 execute tripsync-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

Expected tables:
- colleges
- users
- profiles
- pooling_requests
- service_posts
- service_requirements
- service_filters

### 4. Set Secrets

```bash
# JWT Secret (use a strong random string, at least 32 characters)
wrangler secret put JWT_SECRET
# When prompted, enter: your-super-secret-jwt-key-at-least-32-chars-long

# OLA Maps API Key
wrangler secret put OLA_MAPS_API_KEY
# When prompted, enter your OLA Maps API key
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs at: **http://localhost:8787**

### 6. Test the API

```bash
# Health check
curl http://localhost:8787/api/health

# Database health
curl http://localhost:8787/api/health/db

# Register a user
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@college.edu",
    "password": "password123",
    "full_name": "Test User",
    "college_name": "Test College"
  }'

# Login
curl -X POST http://localhost:8787/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@college.edu&password=password123"
```

### 7. Deploy to Production

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

Your API will be live at: `https://backend-hono.<your-subdomain>.workers.dev`

## 🔧 Project Structure

```
src/
├── index.ts              # Main app entry
├── types/context.ts      # Type definitions
├── middleware/           # Auth, error handling
├── routes/              # API endpoints
├── schemas/             # Zod validation schemas
├── services/            # Business logic
└── utils/               # Utilities (crypto, JWT, distance)
```

## 📝 Key Features Implemented

✅ User authentication (register, login, JWT)
✅ Profile management
✅ Ride pooling with location matching
✅ Service posts CRUD
✅ Global error handling
✅ CORS support
✅ Request validation with Zod
✅ Password hashing with bcrypt
✅ OLA Maps integration for distance calculations

## 🚀 Next Steps

1. **WebSocket Support**: Implement Durable Objects for real-time pooling notifications
2. **File Uploads**: Add R2 integration for profile images and resumes
3. **Rate Limiting**: Add rate limiting middleware
4. **Logging**: Integrate with external logging service
5. **Testing**: Add unit and integration tests
6. **CI/CD**: Set up GitHub Actions for automated deployment

## 📚 Useful Commands

```bash
# Development
npm run dev                              # Start dev server

# Database
wrangler d1 execute tripsync-db --file=./migrations/schema.sql    # Run migrations
wrangler d1 execute tripsync-db --command="SELECT * FROM users"   # Query database
wrangler d1 list                                                   # List databases

# Secrets
wrangler secret put <SECRET_NAME>        # Set a secret
wrangler secret list                     # List secrets

# Deployment
npm run deploy                           # Deploy to production
wrangler tail                            # View production logs

# Types
npm run cf-typegen                       # Generate Cloudflare types
```

## 🐛 Common Issues

### "Cannot find module" errors
- Run `npm install` to install all dependencies

### Database not found
- Ensure you created the database: `wrangler d1 create tripsync-db`
- Check database_id in `wrangler.jsonc`

### Authentication errors
- Make sure JWT_SECRET is set: `wrangler secret put JWT_SECRET`
- Secret must be at least 32 characters for HS256

### TypeScript errors
- Run `npm install` to get all type definitions
- Restart your IDE/editor

## 📖 API Documentation

See `SETUP.md` for complete API documentation and examples.

## 🎉 You're All Set!

Your Hono backend is now ready. The migration from FastAPI is complete with:
- ✅ All routes migrated
- ✅ Authentication working
- ✅ Database schema created
- ✅ Error handling implemented
- ✅ Validation in place
- ✅ Production-ready configuration
