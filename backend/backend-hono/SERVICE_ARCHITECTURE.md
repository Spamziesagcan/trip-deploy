# Service Layer Organization

## ✅ Service Structure

All business logic is separated into dedicated service files. Controllers (routes) handle only request/response.

---

## 📁 Service Files

### 1. **auth.service.ts** - Authentication & Registration

**Location:** `src/services/auth.service.ts`

**Functions:**
- ✅ `registerUser(db, userData)` - Register new user, create profile
- ✅ `loginUser(db, credentials, jwtSecret, expiresIn)` - Authenticate and generate JWT
- ✅ `getOrCreateCollege(db, name)` - Internal: College management

**Business Logic:**
- Check for existing users
- Hash passwords with bcrypt
- Create user + default profile in transaction
- Verify credentials
- Generate JWT tokens
- Manage college entities

**Error Handling:**
- Throws `throwBadRequest()` for duplicate emails
- Throws `throwUnauthorized()` for invalid credentials
- Throws generic `Error` for database failures

---

### 2. **user.service.ts** - User Management

**Location:** `src/services/user.service.ts`

**Functions:**
- ✅ `getUserById(db, userId)` - Get user by ID (throws if not found)
- ✅ `getUserByEmail(db, email)` - Get user by email (returns null if not found)
- ✅ `updateUserName(db, userId, fullName)` - Update user's full name
- ✅ `deleteUser(db, userId)` - Delete user and cascade data
- ✅ `getUsersByCollege(db, collegeId, limit)` - Get users from same college

**Business Logic:**
- User lookups
- User updates
- User deletion with cascading

**Error Handling:**
- Throws `throwNotFound()` when user doesn't exist

---

### 3. **pooling.service.ts** - Ride Pooling & Matching

**Location:** `src/services/pooling.service.ts`

**Functions:**
- ✅ `createPoolingRequest(db, userId, requestData)` - Create ride request
- ✅ `findMatches(db, newRequest, currentUser, olaApiKey)` - Find matching riders

**Business Logic:**
- Cancel existing active requests before creating new one
- Create new pooling request
- Find potential matches (same college, active, within time window)
- Filter by start location proximity (5km radius)
- Filter by destination proximity (5km radius)
- Update matched requests to 'matched' status
- Call OLA Maps API for distance calculations

**Constants:**
- `START_LOCATION_RADIUS_METERS = 5000`
- `DESTINATION_RADIUS_METERS = 5000`
- `ACTIVE_TIMEOUT_MINUTES = 15`

**Error Handling:**
- Throws generic `Error` for database failures
- Gracefully handles OLA Maps API errors (returns empty matches)

---

### 4. **profile.service.ts** - User Profile Management

**Location:** `src/services/profile.service.ts`

**Functions:**
- ✅ `getUserProfile(db, user)` - Get complete user profile with college info
- ✅ `updateUserProfile(db, user, updateData)` - Update profile fields

**Business Logic:**
- Fetch user + profile + college in optimized query
- Parse JSON fields (reviews, preferences, social_media_links, emergency_contact)
- Create profile if doesn't exist
- Dynamic update of profile fields
- Update user.full_name if provided
- Return combined profile data

**Error Handling:**
- Throws `throwNotFound()` when profile doesn't exist

---

### 5. **service.service.ts** - Service Posts (Tasks/Gigs)

**Location:** `src/services/service.service.ts`

**Functions:**
- ✅ `createServicePost(db, user, postData)` - Create service post with requirements & filters
- ✅ `getAllServicePosts(db, skip, limit)` - List all open service posts (paginated)
- ✅ `getServicePostById(db, postId)` - Get single post with full details
- ✅ `deleteServicePost(db, postId, user)` - Delete post (owner only)

**Business Logic:**
- Create service post with related requirements and filters
- Fetch posts with eager loading (join with users/profiles)
- Return structured response with nested data
- Enforce ownership for deletions
- Pagination support

**Error Handling:**
- Throws `throwNotFound()` when post doesn't exist
- Throws `throwForbidden()` when user isn't owner
- Throws generic `Error` for database failures

---

## 🎯 Service vs Controller Separation

### ❌ **BAD** - Business logic in controller:
```typescript
// routes/auth.routes.ts - DON'T DO THIS
auth.post('/register', async (c) => {
  const userData = c.req.valid('json')
  
  // ❌ DB logic in controller
  const existing = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(userData.email)
    .first()
  
  if (existing) {
    return c.json({ error: 'User exists' }, 400)
  }
  
  const hashed = await hashPassword(userData.password)
  // ... more DB logic
})
```

### ✅ **GOOD** - Thin controller, fat service:
```typescript
// routes/auth.routes.ts - Controller
auth.post('/register', zValidator('json', UserCreateSchema), async (c) => {
  const userData = c.req.valid('json')
  const user = await registerUser(c.env.DB, userData)  // ✅ Service handles logic
  return c.json(user, 201)
})

// services/auth.service.ts - Service
export async function registerUser(db: D1Database, userData: UserCreate) {
  const existing = await db.prepare('SELECT * FROM users WHERE email = ?')
    .bind(userData.email).first()
  
  if (existing) throwBadRequest('Email already registered')
  
  const hashed = await hashPassword(userData.password)
  // ... all business logic here
}
```

---

## 📊 Responsibility Matrix

| Layer | Responsibilities | Example |
|-------|------------------|---------|
| **Route/Controller** | Request validation, Response formatting, HTTP status codes | `auth.routes.ts` |
| **Service** | Business logic, Database queries, External API calls | `auth.service.ts` |
| **Middleware** | Authentication, Error handling, CORS | `auth.middleware.ts` |
| **Utils** | Pure functions, Helpers, No side effects | `crypto.ts`, `jwt.ts` |
| **Schemas** | Request/response validation | `user.schema.ts` |

---

## 🔄 Data Flow Example

### User Registration Flow:

```
1. Client sends POST /api/auth/register
   ↓
2. Route (auth.routes.ts)
   - Validates with Zod (UserCreateSchema)
   - Extracts validated data
   ↓
3. Service (auth.service.ts)
   - registerUser()
     - Check existing user (DB query)
     - Get/create college (DB query)
     - Hash password (crypto util)
     - Create user (DB query)
     - Create profile (DB query)
     - Return sanitized user object
   ↓
4. Route
   - Formats response
   - Returns JSON with 201 status
   ↓
5. Client receives response
```

---

## 🛡️ Error Handling Pattern

### Service Layer Errors:
```typescript
// Services throw specific errors
export async function getUserById(db: D1Database, userId: number): Promise<User> {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId).first<User>()
  
  if (!user) {
    throwNotFound('User not found')  // ✅ Specific error
  }
  
  return user
}
```

### Controller Layer Handles:
```typescript
// Controllers catch and format errors
profile.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')!
    const profile = await getUserProfile(c.env.DB, user)
    return c.json(profile)
  } catch (error) {
    // Global error handler catches this
    throw error
  }
})
```

---

## 📝 Function Naming Conventions

### CRUD Operations:
- `create*` - Create new entity
- `get*` - Retrieve entity(ies)
- `update*` - Update existing entity
- `delete*` - Remove entity

### Examples:
- `createPoolingRequest()`
- `getUserById()`
- `getAllServicePosts()`
- `updateUserProfile()`
- `deleteServicePost()`

### Business Logic:
- Use descriptive verb names
- `findMatches()` - Find matching ride requests
- `registerUser()` - Register new user with profile
- `loginUser()` - Authenticate and generate token

---

## 🎯 Service Design Principles

### 1. **Single Responsibility**
Each service handles one domain (auth, user, pooling, profile, service posts)

### 2. **Pure Functions**
Services receive all dependencies as parameters (no global state)

### 3. **Error First**
Validate inputs, throw errors early, return success values

### 4. **Type Safety**
All functions fully typed with TypeScript

### 5. **Small Functions**
Keep functions focused and under 50 lines when possible

### 6. **Database Abstraction**
Services abstract D1 queries from controllers

---

## 📦 Complete Service Structure

```
src/services/
├── auth.service.ts          ✅ Authentication, registration
├── user.service.ts          ✅ User CRUD operations
├── pooling.service.ts       ✅ Ride pooling & matching
├── profile.service.ts       ✅ Profile management
└── service.service.ts       ✅ Service posts (tasks/gigs)
```

---

## 🚀 Usage Examples

### In Routes (Controllers):
```typescript
import { registerUser, loginUser } from '../services/auth.service'
import { getUserProfile, updateUserProfile } from '../services/profile.service'
import { createPoolingRequest, findMatches } from '../services/pooling.service'

// Thin controllers - just orchestration
auth.post('/register', zValidator('json', UserCreateSchema), async (c) => {
  const userData = c.req.valid('json')
  const user = await registerUser(c.env.DB, userData)
  return c.json(user, 201)
})
```

### Service Functions:
```typescript
// Fat services - all business logic
export async function registerUser(db: D1Database, userData: UserCreate) {
  // 1. Validation
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?')
    .bind(userData.email).first()
  if (existing) throwBadRequest('Email already registered')
  
  // 2. Business logic
  const college = await getOrCreateCollege(db, userData.college_name)
  const hashedPassword = await hashPassword(userData.password)
  
  // 3. Database operations
  const user = await db.prepare(`INSERT INTO users ...`).bind(...).first()
  await db.prepare('INSERT INTO profiles ...').bind(user.id).run()
  
  // 4. Return result
  return { id: user.id, email: user.email, full_name: user.full_name }
}
```

---

## ✅ Benefits of This Architecture

1. **Testability** - Services can be unit tested independently
2. **Reusability** - Services can be called from multiple routes
3. **Maintainability** - Business logic centralized in one place
4. **Separation of Concerns** - Clear boundaries between layers
5. **Type Safety** - Full TypeScript coverage
6. **Error Handling** - Consistent error throwing/catching
7. **Scalability** - Easy to add new features/services

---

Your service layer is production-ready! 🎉
