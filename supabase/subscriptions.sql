-- Run this in the Supabase SQL Editor
-- Creates the subscriptions table for GYM Tracker Premium

CREATE TABLE IF NOT EXISTS subscriptions (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      varchar     NOT NULL UNIQUE,
  plan         varchar     NOT NULL,        -- trial | monthly | 6month | 12month | 24month | lifetime
  status       varchar     NOT NULL DEFAULT 'active',  -- active | expired | cancelled
  started_at   timestamptz DEFAULT now(),
  expires_at   timestamptz,                 -- NULL = lifetime / never expires
  paypal_order_id varchar,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Seed lifetime premium for the admin account
-- Replace the user_id with the actual UUID from the users table
INSERT INTO subscriptions (user_id, plan, status, expires_at)
SELECT id, 'lifetime', 'active', NULL
FROM users
WHERE email = 'ashtyka.dev@gmail.com'
ON CONFLICT (user_id) DO UPDATE
  SET plan = 'lifetime', status = 'active', expires_at = NULL, updated_at = now();
