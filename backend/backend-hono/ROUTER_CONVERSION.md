# Route Mapping: FastAPI router.py → Hono index.ts

## Original FastAPI Structure (router.py)

```python
from fastapi import APIRouter
from app.routes import health_router, auth_router, pooling_router, pooling_ws_router
from app.routes import profile_router, services_router

router = APIRouter()

# Include feature-specific routers
router.include_router(health_router.router, prefix="/health", tags=["Health"])
router.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
router.include_router(pooling_router.router, prefix="/pool", tags=["Pooling"])
router.include_router(profile_router.router, prefix="/profile", tags=["Profile"]) 
router.include_router(services_router.router, prefix="/services", tags=["Services"])
router.include_router(pooling_ws_router.router, tags=["Pooling WebSocket"])
```

## Converted Hono Structure (index.ts)

```typescript
import { Hono } from 'hono'
import authRoutes from './routes/auth.routes'
import healthRoutes from './routes/health.routes'
import poolingRoutes from './routes/pooling.routes'
import profileRoutes from './routes/profile.routes'
import servicesRoutes from './routes/services.routes'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// API routes (all prefixed with /api)
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Mount feature routers - equivalent to router.include_router()
api.route('/health', healthRoutes)        // /api/health/*
api.route('/auth', authRoutes)            // /api/auth/*
api.route('/pool', poolingRoutes)         // /api/pool/*
api.route('/profile', profileRoutes)      // /api/profile/*
api.route('/services', servicesRoutes)    // /api/services/*

// Mount API router with /api prefix
app.route('/api', api)
```

## Route Mapping Table

| FastAPI Route | Hono Route | File |
|--------------|------------|------|
| `router.include_router(health_router.router, prefix="/health")` | `api.route('/health', healthRoutes)` | `routes/health.routes.ts` |
| `router.include_router(auth_router.router, prefix="/auth")` | `api.route('/auth', authRoutes)` | `routes/auth.routes.ts` |
| `router.include_router(pooling_router.router, prefix="/pool")` | `api.route('/pool', poolingRoutes)` | `routes/pooling.routes.ts` |
| `router.include_router(profile_router.router, prefix="/profile")` | `api.route('/profile', profileRoutes)` | `routes/profile.routes.ts` |
| `router.include_router(services_router.router, prefix="/services")` | `api.route('/services', servicesRoutes)` | `routes/services.routes.ts` |
| `router.include_router(pooling_ws_router.router)` | **Durable Object** (separate) | Future: WebSocket DO |

## Key Differences

### 1. Import Pattern
**FastAPI:**
```python
from app.routes import health_router, auth_router
```

**Hono:**
```typescript
import healthRoutes from './routes/health.routes'
import authRoutes from './routes/auth.routes'
```

### 2. Router Creation
**FastAPI:**
```python
router = APIRouter()
```

**Hono:**
```typescript
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>()
```

### 3. Route Mounting
**FastAPI:**
```python
router.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
```

**Hono:**
```typescript
api.route('/auth', authRoutes)  // Tags not needed in Hono
```

### 4. WebSocket Handling
**FastAPI:**
```python
router.include_router(pooling_ws_router.router, tags=["Pooling WebSocket"])
```

**Hono/Cloudflare:**
- WebSockets handled via **Durable Objects**
- Separate implementation required
- Not included in main router

## Complete URL Mapping

When mounted in main.py/index.ts with `/api` prefix:

| Endpoint | FastAPI URL | Hono URL | Status |
|----------|-------------|----------|--------|
| Health Check | `GET /api/health` | `GET /api/health` | ✅ |
| DB Health | `GET /api/health/db` | `GET /api/health/db` | ✅ |
| Register | `POST /api/auth/register` | `POST /api/auth/register` | ✅ |
| Login | `POST /api/auth/token` | `POST /api/auth/token` | ✅ |
| Create Pool | `POST /api/pool/requests` | `POST /api/pool/requests` | ✅ |
| Get Profile | `GET /api/profile/me` | `GET /api/profile/me` | ✅ |
| Update Profile | `PUT /api/profile/me` | `PUT /api/profile/me` | ✅ |
| List Services | `GET /api/services` | `GET /api/services` | ✅ |
| Get Service | `GET /api/services/:id` | `GET /api/services/:id` | ✅ |
| Create Service | `POST /api/services` | `POST /api/services` | ✅ |
| Delete Service | `DELETE /api/services/:id` | `DELETE /api/services/:id` | ✅ |
| WebSocket Pool | `WS /ws/pool` | **Durable Object** | 🚧 |

## Notes

1. **Tags**: Hono doesn't use OpenAPI tags like FastAPI. Documentation is handled differently.

2. **Type Safety**: Hono uses TypeScript generics for type safety:
   ```typescript
   const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
   ```

3. **Middleware**: Applied at the route level instead of router level:
   ```typescript
   pooling.use('*', authMiddleware)  // All pooling routes require auth
   ```

4. **WebSocket**: Requires Durable Objects implementation (not in this router).

## File Structure Comparison

**FastAPI:**
```
app/
├── router.py              # Main router aggregator
├── routes/
│   ├── health_router.py
│   ├── auth_router.py
│   ├── pooling_router.py
│   ├── pooling_ws_router.py
│   ├── profile_router.py
│   └── services_router.py
```

**Hono:**
```
src/
├── index.ts               # Main app + router aggregator
├── routes/
│   ├── health.routes.ts
│   ├── auth.routes.ts
│   ├── pooling.routes.ts
│   ├── profile.routes.ts
│   └── services.routes.ts
└── durable-objects/
    └── PoolingWebSocket.ts  # Future WebSocket implementation
```

## Summary

✅ All HTTP routes converted and functional
✅ Route prefixes preserved
✅ Same URL structure
✅ Type-safe with TypeScript
🚧 WebSocket needs Durable Object implementation

The router logic is already implemented in `src/index.ts` - no additional router file needed!
