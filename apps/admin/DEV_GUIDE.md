# Nexus CRM - Development Guide

## Quick Start

### 1. Start all services
```bash
# Start the dev server
cd apps/admin && npx vite --port 5174 --host

# OmniRoute AI gateway (if not running)
# (runs at localhost:20128)
```

### 2. Access the admin panel
- URL: `http://localhost:5174/`
- First time: You'll see the login screen
- Register a new user or log in with existing credentials
- The system auto-creates your user profile in `public.users` on first login

### 3. Default users
No default users are seeded in the database. To get started:
1. Click "Sign Up" on the login page
2. Enter any email/password
3. Your user profile will be auto-created via the `on_auth_user_created` trigger
4. You'll have `role: sales_rep` by default

To get admin access:
```sql
-- Run in Supabase SQL editor
UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Database Schema

### Tables
- `users` - User profiles (extends auth.users)
- `leads` - Lead management with AI scoring
- `accounts` - Company/customer accounts
- `contacts` - Contact persons
- `opportunities` - Sales opportunities
- `quotes` - Quotations (auto-numbered: QUO-2026-XXXX)
- `sales_orders` - Orders (auto-numbered: SO-2026-XXXX)
- `invoices` - Invoices (auto-numbered: INV-2026-XXXX)
- `products` - Product catalog
- `activities` - Call/email/meeting tracking
- `settings` - App configuration

### Auto-generated fields
- `id`: UUID (auto-generated)
- `quote_number`: `QUO-YYYY-XXXX` (trigger)
- `order_number`: `SO-YYYY-XXXX` (trigger)
- `invoice_number`: `INV-YYYY-XXXX` (trigger)
- `owner_id`: Current authenticated user (trigger)
- `created_by`: Current authenticated user (trigger)
- `created_at` / `updated_at`: Timestamps (trigger)

### RLS Policies
- **Admin**: Full access to all records
- **Sales Manager**: Full access to all records
- **Sales Rep**: Can see own records + system-owned records + team records
- **Viewer**: Read-only access to assigned records

All authenticated users can view records owned by the system user (`00000000-...`).
