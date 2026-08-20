-- Supabase seed SQL for Nexus CRM
-- Zero-Cost B2B Sales CRM for General Trading & ISO Consultancy
-- Seeds initial data matching the database schema

-- Seed users (NOTE: In production, users are created via Supabase Auth)
INSERT INTO users (email, full_name, role, is_active) VALUES
  ('admin@nexus.com', 'System Administrator', 'admin', true),
  ('sales@nexus.com', 'Sales Manager', 'sales_manager', true),
  ('consultant@nexus.com', 'ISO Consultant', 'sales_rep', true);

-- Seed teams
INSERT INTO teams (name, description) VALUES
  ('Sales Team', 'All sales personnel'),
  ('Consultancy Team', 'ISO consultants and auditors'),
  ('Operations Team', 'Warehouse and logistics'),
  ('Finance Team', 'Accounting and invoicing');

-- Assign admin to Sales Team
INSERT INTO user_teams (user_id, team_id) VALUES
  ((SELECT id FROM users WHERE email = 'admin@nexus.com' LIMIT 1), (SELECT id FROM teams WHERE name = 'Sales Team'));

-- Seed products for trading operations
INSERT INTO products (sku, name, description, category, unit_of_measure, unit_price, stock_quantity, reorder_level, tax_rate, type) VALUES
  ('PROD-001', 'Safety Helmet', 'Standard safety helmet for construction workers', 'Safety Equipment', 'pcs', 45.00, 100, 20, 5.00, 'product'),
  ('PROD-002', 'Work Gloves', 'Industrial work gloves, pack of 10', 'Safety Equipment', 'pack', 35.00, 50, 10, 5.00, 'product'),
  ('PROD-003', 'Safety Glasses', 'Protective eyewear', 'Safety Equipment', 'pcs', 25.00, 75, 15, 5.00, 'product'),
  ('PROD-004', 'Steel Measuring Tape', '5m steel measuring tape', 'Tools', 'pcs', 12.50, 200, 50, 5.00, 'product'),
  ('PROD-005', 'Industrial Flashlight', 'LED industrial flashlight, rechargeable', 'Tools', 'pcs', 85.00, 40, 10, 5.00, 'product');

-- Seed services for ISO consultancy
INSERT INTO products (sku, name, description, category, unit_of_measure, unit_price, tax_rate, type, track_inventory) VALUES
  ('SVC-001', 'ISO 9001 Implementation', 'Full-cycle ISO 9001:2015 quality management system implementation', 'Consulting', 'project', 25000, 5.00, 'service', false),
  ('SVC-002', 'ISO 14001 Gap Analysis', 'Environmental management system gap assessment', 'Consulting', 'project', 15000, 5.00, 'service', false),
  ('SVC-003', 'ISO 45001 Internal Audit', 'Occupational health & safety internal audit', 'Consulting', 'project', 12000, 5.00, 'service', false),
  ('SVC-004', 'ISO Certification Training', 'Employee training for ISO standards awareness', 'Consulting', 'day', 1200, 5.00, 'service', false);

-- Seed price book
INSERT INTO price_books (name, description, is_default, is_active) VALUES
  ('Standard Price Book', 'Default price book for all products and services', true, true),
  ('Trade Partner Pricing', 'Special pricing for trade partners', false, true);

-- Seed settings
INSERT INTO settings (key, value, is_public, description) VALUES
  ('company_name', '"Nexus Trading & Consultancy"', true, 'Company name'),
  ('default_currency', '"AED"', true, 'Default currency'),
  ('vat_rate', '"5.0"', true, 'Default VAT rate for UAE'),
  ('quote_number_format', '"QUO-{YYYY}-{####}"', false, 'Format for quote numbers'),
  ('invoice_number_format', '"INV-{YYYY}-{####}"', false, 'Format for invoice numbers'),
  ('timezone', '"Asia/Dubai"', true, 'Default timezone for the system');
