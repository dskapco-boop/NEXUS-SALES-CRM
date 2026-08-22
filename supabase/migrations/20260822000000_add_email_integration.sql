-- ============================================================
-- EMAIL INTEGRATION MIGRATION
-- Creates: email_accounts, emails, email_attachments tables
-- =========================================================

-- ============================================================
-- EMAIL ACCOUNTS (IMAP/SMTP connections)
-- Stores user email account configurations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL, -- The email address (e.g., john@company.com)
  display_name TEXT, -- Friendly name for UI display
  provider_type TEXT NOT NULL DEFAULT 'imap' CHECK (provider_type IN ('imap', 'gmail', 'outlook')),
  
  -- IMAP Configuration
  imap_host TEXT,
  imap_port INTEGER,
  imap_encryption TEXT CHECK (imap_encryption IN ('tls', 'starttls', 'none')),
  imap_username TEXT, -- Usually the email address
  
  -- SMTP Configuration
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_encryption TEXT CHECK (smtp_encryption IN ('tls', 'starttls', 'none')),
  smtp_username TEXT,
  
  -- Auth - credentials stored as encrypted reference
  password_hash TEXT,
  
  -- Sync settings
  sync_frequency_minutes INTEGER DEFAULT 15 CHECK (sync_frequency_minutes IN (0, 5, 10, 15, 30, 60)),
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_from_days INTEGER DEFAULT 30,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  connection_status TEXT CHECK (connection_status IN ('connected', 'error', 'disconnected')),
  last_error TEXT,
  
  -- Folder mappings (JSON)
  folder_mappings JSONB DEFAULT '{"inbox": "INBOX", "sent": "Sent", "drafts": "Drafts", "trash": "Trash"}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_user ON public.email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON public.email_accounts(email);
CREATE INDEX IF NOT EXISTS idx_email_accounts_active ON public.email_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_email_accounts_sync_freq ON public.email_accounts(sync_frequency_minutes);

-- ============================================================
-- EMAILS (fetched email messages)
-- Stores email metadata + thread grouping
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  
  -- Email headers
  message_id TEXT,
  thread_id TEXT,
  subject TEXT,
  snippet TEXT,
  body TEXT,
  body_html TEXT,
  
  -- Sender/Recipients
  "from" JSONB,
  "to" JSONB,
  "cc" JSONB,
  "bcc" JSONB,
  
  -- Threading/Linking
  related_to_table TEXT CHECK (related_to_table IN ('leads', 'accounts', 'contacts')),
  related_to_id UUID,
  contact_id UUID,
  
  -- Direction & Status
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_replied_to BOOLEAN DEFAULT FALSE,
  
  -- Tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Metadata
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  folder TEXT DEFAULT 'INBOX',
  size_bytes INTEGER,
  has_attachments BOOLEAN DEFAULT FALSE,
  
  -- AI enrichment flags
  ai_scored BOOLEAN DEFAULT FALSE,
  ai_notes_generated BOOLEAN DEFAULT FALSE,
  ai_followup_suggested BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emails_account ON public.emails(account_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON public.emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON public.emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_related ON public.emails(related_to_table, related_to_id);
CREATE INDEX IF NOT EXISTS idx_emails_contact ON public.emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_folder ON public.emails(folder);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON public.emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_direction ON public.emails(direction);
CREATE INDEX IF NOT EXISTS idx_emails_unread ON public.emails(is_read) WHERE is_read = FALSE;

-- ============================================================
-- EMAIL ATTACHMENTS
-- Stores attachment metadata (files stored in storage bucket)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  storage_path TEXT,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_attachments_email ON public.email_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_attachments_storage ON public.email_attachments(storage_path);

-- ============================================================
-- EMAIL TEMPLATES
-- For reusable email templates with merge tags
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'custom' CHECK (template_type IN ('custom', 'follow_up', 'intro', 'negotiation', 'closing')),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_user ON public.email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);

-- ============================================================
-- EMAIL TRACKING (opens, clicks, replies)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('opened', 'clicked', 'replied')),
  event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tracking_email ON public.email_tracking(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_type ON public.email_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_at ON public.email_tracking(event_at DESC);

-- ============================================================
-- RLS Policies for email tables
-- ============================================================

-- Enable RLS on all email tables
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- Email accounts: users can only access their own accounts
CREATE POLICY "Users can read own email accounts" ON public.email_accounts FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can insert own email accounts" ON public.email_accounts FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can update own email accounts" ON public.email_accounts FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can delete own email accounts" ON public.email_accounts FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Emails: accessible via account ownership
CREATE POLICY "Users can read emails from own accounts" ON public.emails FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE id = emails.account_id
    AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  )
);

CREATE POLICY "Users can insert emails for own accounts" ON public.emails FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE id = emails.account_id
    AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  )
);

CREATE POLICY "Users can update emails for own accounts" ON public.emails FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.email_accounts 
    WHERE id = emails.account_id
    AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  )
);

-- Email templates: same ownership model
CREATE POLICY "Users can read own email templates" ON public.email_templates FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can insert own email templates" ON public.email_templates FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can update own email templates" ON public.email_templates FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can delete own email templates" ON public.email_templates FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Email tracking: same ownership via email->account join
CREATE POLICY "Users can select tracking for emails they own" ON public.email_tracking FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.emails e
    JOIN public.email_accounts ea ON e.account_id = ea.id
    WHERE e.id = email_tracking.email_id
    AND (ea.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  )
);

CREATE POLICY "Users can insert tracking for emails they own" ON public.email_tracking FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.emails e
    JOIN public.email_accounts ea ON e.account_id = ea.id
    WHERE e.id = email_tracking.email_id
    AND (ea.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  )
);

CREATE POLICY "Users can update tracking for emails they own" ON public.email_tracking FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.emails e
    JOIN public.email_accounts ea ON e.account_id = ea.id
    WHERE e.id = email_tracking.email_id
    AND (ea.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  )
);
