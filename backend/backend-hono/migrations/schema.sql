-- TripSync Database Schema for Cloudflare D1
-- SQLite-based schema migrated from PostgreSQL

-- ============================================================================
-- Colleges Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS colleges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  college_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (college_id) REFERENCES colleges(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id);

-- ============================================================================
-- Profiles Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  username TEXT UNIQUE,
  phone_number TEXT,
  bio TEXT,
  year_of_study TEXT,
  reviews TEXT,                 -- JSON string
  preferences TEXT,             -- JSON string
  social_media_links TEXT,      -- JSON string
  emergency_contact TEXT,       -- JSON string
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================================================
-- Pooling Requests Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS pooling_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'matched', 'completed', 'cancelled')),
  start_latitude REAL NOT NULL,
  start_longitude REAL NOT NULL,
  destination_latitude REAL NOT NULL,
  destination_longitude REAL NOT NULL,
  destination_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pooling_status ON pooling_requests(status);
CREATE INDEX IF NOT EXISTS idx_pooling_user_id ON pooling_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pooling_created_at ON pooling_requests(created_at);

-- ============================================================================
-- Service Posts Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poster_user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'completed', 'cancelled')),
  is_paid INTEGER NOT NULL DEFAULT 0,  -- SQLite boolean: 0 = false, 1 = true
  price REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (poster_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_service_posts_status ON service_posts(status);
CREATE INDEX IF NOT EXISTS idx_service_posts_poster ON service_posts(poster_user_id);
CREATE INDEX IF NOT EXISTS idx_service_posts_created_at ON service_posts(created_at);

-- ============================================================================
-- Service Requirements Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_post_id INTEGER NOT NULL,
  requirement TEXT NOT NULL,
  FOREIGN KEY (service_post_id) REFERENCES service_posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_requirements_post_id ON service_requirements(service_post_id);

-- ============================================================================
-- Service Filters Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_filters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_post_id INTEGER NOT NULL,
  filter_type TEXT NOT NULL,
  filter_value TEXT NOT NULL,
  FOREIGN KEY (service_post_id) REFERENCES service_posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_filters_post_id ON service_filters(service_post_id);
