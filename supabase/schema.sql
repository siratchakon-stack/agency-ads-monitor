-- ============================================
-- Agency Ads Balance Monitor - Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facebook_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  picture_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  line_token TEXT,
  alert_threshold INTEGER DEFAULT 1500,
  warning_threshold INTEGER DEFAULT 3000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: ad_accounts
-- ============================================
CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  ad_account_name TEXT NOT NULL,
  platform TEXT DEFAULT 'facebook',
  currency TEXT DEFAULT 'THB',
  account_status INTEGER DEFAULT 1,
  spend_today DECIMAL(15, 2) DEFAULT 0,
  total_spend DECIMAL(15, 2) DEFAULT 0,
  topup_amount DECIMAL(15, 2) DEFAULT 0,
  remaining_balance DECIMAL(15, 2) GENERATED ALWAYS AS (topup_amount - total_spend) STORED,
  threshold DECIMAL(15, 2) DEFAULT 1500,
  alert_sent BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  remaining_balance DECIMAL(15, 2),
  notification_type TEXT DEFAULT 'low_balance',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: sync_logs
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sync_type TEXT DEFAULT 'cron' CHECK (sync_type IN ('cron', 'manual')),
  accounts_synced INTEGER DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,
  errors TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ad_accounts_user_id ON ad_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_account_id ON ad_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_alert_sent ON ad_accounts(alert_sent);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ad_account_id ON notifications(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (id = auth.uid()::uuid);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (id = auth.uid()::uuid);

-- Ad accounts belong to users
CREATE POLICY "Users can view own ad accounts"
  ON ad_accounts FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own ad accounts"
  ON ad_accounts FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update own ad accounts"
  ON ad_accounts FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete own ad accounts"
  ON ad_accounts FOR DELETE USING (user_id = auth.uid()::uuid);

-- Notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Sync logs
CREATE POLICY "Users can view own sync logs"
  ON sync_logs FOR SELECT USING (user_id = auth.uid()::uuid);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ad_accounts_updated_at
  BEFORE UPDATE ON ad_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SERVICE ROLE POLICIES (for cron/server)
-- ============================================
-- These allow server-side operations using service role key

CREATE POLICY "Service role full access users"
  ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access ad_accounts"
  ON ad_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access notifications"
  ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access sync_logs"
  ON sync_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
