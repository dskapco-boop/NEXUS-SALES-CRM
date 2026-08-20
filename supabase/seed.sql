-- Supabase seed SQL for Nexus Sales CRM
-- Zero-Cost B2B Sales CRM for General Trading & ISO Consultancy
-- Seeds initial data matching the complete database schema

-- Seed users (NOTE: In production, users are created via Supabase Auth)
INSERT INTO users (email, full_name, role, is_active) VALUES
  ('admin@nexus-sales.com', 'System Administrator', 'admin', true),
  ('sales@nexus-sales.com', 'Sales Manager', 'sales_manager', true),
  ('consultant@nexus-sales.com', 'ISO Consultant', 'sales_rep', true),
  ('ops@nexus-sales.com', 'Operations Manager', 'sales_rep', true),
  ('finance@nexus-sales.com', 'Finance Manager', 'sales_rep', true);

-- Seed teams
INSERT INTO teams (name, description) VALUES
  ('Sales Team', 'All sales personnel'),
  ('Consultancy Team', 'ISO consultants and auditors'),
  ('Operations Team', 'Warehouse and logistics'),
  ('Finance Team', 'Accounting and invoicing');

-- Assign users to teams (admin → Sales Team)
INSERT INTO user_teams (user_id, team_id)
SELECT u.id, t.id 
FROM users u, teams t
WHERE u.email = 'admin@nexus-sales.com' AND t.name = 'Sales Team';

-- Seed warehouses for inventory management
INSERT INTO warehouses (code, name, location, address, capacity, capacity_unit, is_active, manager_id) VALUES
  ('WH-001', 'Main Warehouse', 'Dubai', 'Industrial Area, Dubai, UAE', 5000, 'cubic meters', true,
   (SELECT id FROM users WHERE email = 'ops@nexus-sales.com' LIMIT 1)),
  ('WH-002', 'RAK Depot', 'Ras Al Khaimah', 'Industrial Area, RAK, UAE', 2000, 'cubic meters', true,
   (SELECT id FROM users WHERE email = 'ops@nexus-sales.com' LIMIT 1));

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

-- Seed warehouse stock (initial inventory)
INSERT INTO warehouse_stock (warehouse_id, product_id, quantity, reserved_quantity, reorder_level)
SELECT 
  (SELECT id FROM warehouses WHERE code = 'WH-001'),
  p.id,
  COALESCE(p.stock_quantity::DECIMAL, 0),
  0,
  COALESCE(p.reorder_level::DECIMAL, 0)
FROM products p
WHERE p.type = 'product';

INSERT INTO warehouse_stock (warehouse_id, product_id, quantity, reserved_quantity, reorder_level)
SELECT 
  (SELECT id FROM warehouses WHERE code = 'WH-002'),
  p.id,
  (COALESCE(p.stock_quantity::DECIMAL, 0) / 2)::INTEGER,
  0,
  COALESCE(p.reorder_level::DECIMAL, 0)
FROM products p
WHERE p.type = 'product';

-- Seed accounts and contacts
INSERT INTO accounts (name, type, industry, address, city, country, phone, email, website, currency, vat_registered, is_active) VALUES
  ('Al-Futtaim Group', 'customer', 'Retail', 'Al Ain Rd, Dubai, UAE', 'Dubai', 'UAE', '+971 4 123 4567', 'procurement@alfuttaim.com', 'https://alfuttaim.com', 'AED', true, true),
  ('Emirati Trading Co.', 'customer', 'Manufacturing', 'Industrial Area 12, Sharjah, UAE', 'Sharjah', 'UAE', '+971 6 555 7890', 'info@emirati-trading.com', 'https://emirati-trading.com', 'AED', true, true),
  ('Saudi Technical Supplies', 'customer', 'Construction', 'King Fahd Road, Dammam, Saudi Arabia', 'Dammam', 'Saudi Arabia', '+966 13 800 1234', 'sales@sts.com.sa', 'https://sts.com.sa', 'SAR', true, true),
  ('Global Safety Ltd.', 'prospect', 'Industrial', 'Business Bay, Dubai, UAE', 'Dubai', 'UAE', '+971 4 555 6789', 'contact@globalsafety.com', 'https://globalsafety.com', 'AED', true, true);

-- Seed contacts
INSERT INTO contacts (account_id, first_name, last_name, email, phone, mobile, position, department, is_primary, is_active) VALUES
  ((SELECT id FROM accounts WHERE name = 'Al-Futtaim Group'), 'Ahmed', 'Al-Maktoum', 'ahmed.almaktoum@alfuttaim.com', '+971 4 123 4567', '+971 50 123 4567', 'Procurement Manager', 'Procurement', true, true),
  ((SELECT id FROM accounts WHERE name = 'Emirati Trading Co.'), 'Fatima', 'Al-Balushi', 'fatima.albalushi@emirati-trading.com', '+971 6 555 7890', '+971 55 555 7890', 'Operations Director', 'Operations', true, true),
  ((SELECT id FROM accounts WHERE name = 'Saudi Technical Supplies'), 'Mohammed', 'Al-Saud', 'mohammed.alsaud@sts.com.sa', '+966 13 800 1234', '+966 50 123 4567', 'Purchasing Manager', 'Purchasing', true, true),
  ((SELECT id FROM accounts WHERE name = 'Global Safety Ltd.'), 'Sarah', 'Johnson', 'sarah.johnson@globalsafety.com', '+971 4 555 6789', '+971 52 555 6789', 'Safety Manager', 'Safety', true, true);

-- Seed leads
INSERT INTO leads (first_name, last_name, email, phone, mobile, company, job_title, industry, estimated_value, currency, source, status, score, owner_id, created_by) VALUES
  ('Mohammed', 'Al-Habtoor', 'm.ahmed@habtoor.com', '+971 4 987 6543', '+971 55 987 6543', 'Habtoor Trading LLC', 'Supply Manager', 'General Trading', 25000, 'AED', 'referral', 'qualified', 85,
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1)),
  ('Leila', 'Hassan', 'lhassan@petrocorp.com', '+971 2 333 4444', '+971 50 333 4444', 'Petrocorp FZCO', 'Procurement Specialist', 'Oil & Gas', 50000, 'AED', 'website', 'new', 72,
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1)),
  ('Omar', 'Khan', 'omar.khan@construco.com', '+971 6 777 8888', '+971 56 777 8888', 'ConstruCo', 'Site Supervisor', 'Construction', 18000, 'AED', 'trade_show', 'contacted', 64,
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1)),
  ('Robert', 'Smith', 'r.smith@euromech.co.uk', '+44 20 7946 0958', '+44 7700 900123', 'EuroMech Ltd', 'Managing Director', 'Industrial Machinery', 75000, 'GBP', 'email_outreach', 'qualified', 78,
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1));

-- Seed opportunities (from leads and directly)
INSERT INTO opportunities (account_id, contact_id, lead_id, title, description, stage, probability, amount, currency, close_date, source, assigned_to, created_by, score) VALUES
  ((SELECT id FROM accounts WHERE name = 'Al-Futtaim Group'), 
   (SELECT id FROM contacts WHERE email = 'ahmed.almaktoum@alfuttaim.com'), NULL,
   'Safety Equipment Supply for Al-Futtaim',
   'Supply of safety helmets, gloves, and protective equipment for 500 workers',
   'proposal_sent', 60, 25000, 'AED', '2026-09-15', 'lead',
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1), 85),
  ((SELECT id FROM accounts WHERE name = 'Emirati Trading Co.'), 
   (SELECT id FROM contacts WHERE email = 'fatima.albalushi@emirati-trading.com'), NULL,
   'ISO 9001 Implementation Project',
   'Complete ISO 9001:2015 certification for manufacturing facility',
   'negotiation', 80, 50000, 'AED', '2026-10-01', 'opportunity',
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1), 92);

-- Seed quotes
INSERT INTO quotes (opportunity_id, account_id, quote_number, issue_date, valid_until, currency, subtotal, discount_amount, tax_amount, total_amount, base_currency_total, status, approval_status, version, created_by) VALUES
  ((SELECT id FROM opportunities WHERE title = 'Safety Equipment Supply for Al-Futtaim'),
   (SELECT id FROM accounts WHERE name = 'Al-Futtaim Group'),
   'QUO-2026-0001', '2026-08-19', '2026-09-18', 'AED', 23750, 0, 1187.50, 24937.50, 24937.50,
   'sent', 'approved', 1,
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1)),
  ((SELECT id FROM opportunities WHERE title = 'ISO 9001 Implementation Project'),
   (SELECT id FROM accounts WHERE name = 'Emirati Trading Co.'),
   'QUO-2026-0002', '2026-08-19', '2026-09-18', 'AED', 50000, 5000, 2250, 47250, 47250,
   'sent', 'approved', 1,
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1));

-- Seed quote line items
INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit_price, discount_amount, tax_amount, line_total, currency) VALUES
  ((SELECT id FROM quotes WHERE quote_number = 'QUO-2026-0001'),
   (SELECT id FROM products WHERE sku = 'PROD-001'),
   'Safety Helmet - Standard, pack of 50', 5, 45.00, 0, 11.25, 236.25, 'AED'),
  ((SELECT id FROM quotes WHERE quote_number = 'QUO-2026-0001'),
   (SELECT id FROM products WHERE sku = 'PROD-002'),
   'Work Gloves - Industrial grade, pack of 10', 10, 35.00, 0, 17.50, 367.50, 'AED'),
  ((SELECT id FROM quotes WHERE quote_number = 'QUO-2026-0001'),
   (SELECT id FROM products WHERE sku = 'PROD-003'),
   'Safety Glasses - Protective eyewear', 25, 25.00, 0, 31.25, 656.25, 'AED'),
  ((SELECT id FROM quotes WHERE quote_number = 'QUO-2026-0001'),
   (SELECT id FROM products WHERE sku = 'PROD-004'),
   'Steel Measuring Tape - 5m', 5, 12.50, 0, 3.13, 65.62, 'AED'),
  ((SELECT id FROM quotes WHERE quote_number = 'QUO-2026-0002'),
   (SELECT id FROM products WHERE sku = 'SVC-001'),
   'ISO 9001:2015 Full Cycle Implementation', 1, 50000, 5000, 2250, 47250, 'AED');

-- Seed sales orders (supply)
INSERT INTO sales_orders (opportunity_id, quote_id, account_id, order_number, order_date, currency, subtotal, discount_amount, tax_amount, total_amount, base_currency_total, status, delivery_address, delivery_city, delivery_country, assigned_to, created_by) VALUES
  ((SELECT id FROM opportunities WHERE title = 'Safety Equipment Supply for Al-Futtaim'),
   (SELECT id FROM quotes WHERE quote_number = 'QUO-2026-0001'),
   (SELECT id FROM accounts WHERE name = 'Al-Futtaim Group'),
   'SO-2026-0001', '2026-08-20', 'AED', 23750, 0, 1187.50, 24937.50, 24937.50,
   'confirmed', 'Al Ain Rd, Dubai, UAE', 'Dubai', 'UAE',
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1));

-- Seed order line items
INSERT INTO order_items (sales_order_id, product_id, description, quantity, unit_price, tax_amount, line_total, currency, warehouse_id) VALUES
  ((SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001'),
   (SELECT id FROM products WHERE sku = 'PROD-001'), 'Safety Helmet', 5, 45.00, 11.25, 236.25, 'AED',
   (SELECT id FROM warehouses WHERE code = 'WH-001')),
  ((SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001'),
   (SELECT id FROM products WHERE sku = 'PROD-002'), 'Work Gloves', 10, 35.00, 17.50, 367.50, 'AED',
   (SELECT id FROM warehouses WHERE code = 'WH-001')),
  ((SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001'),
   (SELECT id FROM products WHERE sku = 'PROD-003'), 'Safety Glasses', 25, 25.00, 31.25, 656.25, 'AED',
   (SELECT id FROM warehouses WHERE code = 'WH-002')),
  ((SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001'),
   (SELECT id FROM products WHERE sku = 'PROD-004'), 'Steel Measuring Tape', 5, 12.50, 3.13, 65.62, 'AED',
   (SELECT id FROM warehouses WHERE code = 'WH-001'));

-- Seed completion reports
INSERT INTO completion_reports (order_id, report_type, delivery_date, goods_condition, discrepancies, signoff_status, created_by) VALUES
  ((SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001'),
   'delivery', '2026-08-22', 'good', 'None', 'signed',
   (SELECT id FROM users WHERE email = 'ops@nexus-sales.com' LIMIT 1));

-- Seed invoices
INSERT INTO invoices (sales_order_id, opportunity_id, account_id, invoice_number, invoice_date, due_date, currency, subtotal, tax_amount, total_amount, base_currency_total, status, payment_status, payment_terms, notes, created_by) VALUES
  ((SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001'),
   (SELECT id FROM opportunities WHERE title = 'Safety Equipment Supply for Al-Futtaim'),
   (SELECT id FROM accounts WHERE name = 'Al-Futtaim Group'),
   'INV-2026-0001', '2026-08-22', '2026-09-21', 'AED', 23750, 1187.50, 24937.50, 24937.50,
   'sent', 'pending', 'Net 30', 'Invoice generated from completed order SO-2026-0001',
   (SELECT id FROM users WHERE email = 'finance@nexus-sales.com' LIMIT 1));

-- Seed invoice line items
INSERT INTO invoice_line_items (invoice_id, sales_order_item_id, product_id, description, quantity, unit_price, tax_amount, line_total, currency) VALUES
  ((SELECT id FROM invoices WHERE invoice_number = 'INV-2026-0001'),
   (SELECT id FROM order_items WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001') LIMIT 1),
   (SELECT id FROM products WHERE sku = 'PROD-001'), 'Safety Helmet', 5, 45.00, 11.25, 236.25, 'AED'),
  ((SELECT id FROM invoices WHERE invoice_number = 'INV-2026-0001'),
   (SELECT id FROM order_items WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001') LIMIT 1),
   (SELECT id FROM products WHERE sku = 'PROD-002'), 'Work Gloves', 10, 35.00, 17.50, 367.50, 'AED'),
  ((SELECT id FROM invoices WHERE invoice_number = 'INV-2026-0001'),
   (SELECT id FROM order_items WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001') LIMIT 1),
   (SELECT id FROM products WHERE sku = 'PROD-003'), 'Safety Glasses', 25, 25.00, 31.25, 656.25, 'AED'),
  ((SELECT id FROM invoices WHERE invoice_number = 'INV-2026-0001'),
   (SELECT id FROM order_items WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'SO-2026-0001') LIMIT 1),
   (SELECT id FROM products WHERE sku = 'PROD-004'), 'Steel Measuring Tape', 5, 12.50, 3.13, 65.62, 'AED');

-- Seed ISO clients (for ISO consultancy module)
INSERT INTO iso_clients (account_id, target_standard, certification_status, certification_body, gap_analysis_completed, assigned_consultant, created_by) VALUES
  ((SELECT id FROM accounts WHERE name = 'Emirati Trading Co.'),
   'ISO 9001:2015, ISO 14001:2015', 'in_progress', 'Bureau Veritas', true,
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1));

-- Seed audits for ISO clients
INSERT INTO audits (iso_client_id, audit_type, title, scheduled_date, auditor, status, scope, created_by) VALUES
  ((SELECT id FROM iso_clients WHERE account_id = (SELECT id FROM accounts WHERE name = 'Emirati Trading Co.')),
   'gap_analysis', 'Initial Gap Analysis for ISO 9001', '2026-08-25',
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1),
   'completed', 'Full scope: QMS documentation review, process mapping, GAP identification',
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1)),
  ((SELECT id FROM iso_clients WHERE account_id = (SELECT id FROM accounts WHERE name = 'Emirati Trading Co.')),
   'internal', 'Phase 1 Internal Audit', '2026-09-30',
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1),
   'planned', 'ISO 9001:2015 Clause-by-clause audit',
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1));

-- Seed audit findings
INSERT INTO audit_findings (audit_id, finding_type, severity, reference_clause, description, root_cause, corrective_action, assigned_to, due_date, status, created_at) VALUES
  ((SELECT id FROM audits WHERE title = 'Initial Gap Analysis for ISO 9001'),
   'nonconformity', 'major', '8.2.1', 'Customer communication process not defined',
   'No documented procedure for customer interaction',
   'Create and implement customer communication procedure',
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1),
   '2026-09-15', 'open', '2026-08-19'),
  ((SELECT id FROM audits WHERE title = 'Initial Gap Analysis for ISO 9001'),
   'observation', 'minor', '7.1.3', 'Employee training records incomplete',
   'Training tracking not systematically recorded',
   'Implement training record management system',
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1),
   '2026-09-01', 'open', '2026-08-19');

-- Seed meetings/appointments
INSERT INTO meetings (title, description, meeting_type, scheduled_at, duration_minutes, location, meeting_link, status, related_to_table, related_to_id, assigned_to, created_by) VALUES
  ('Introductory Call - Habtoor Trading', 'Initial discovery call to discuss safety equipment needs',
   'virtual', '2026-08-20T10:00:00+04:00', 45, 'Dubai, UAE',
   'https://meet.google.com/abc-defg-hij', 'completed',
   'leads', (SELECT id FROM leads WHERE company = 'Habtoor Trading LLC' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1)),
  ('Quote Review - Emirati Trading', 'Review quote QUO-2026-0002 with Finance team',
   'in_person', '2026-08-21T14:00:00+04:00', 30, 'Office Meeting Room A', NULL, 'scheduled',
   'quotes', (SELECT id FROM quotes WHERE quote_number = 'QUO-2026-0002' LIMIT 1),
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'consultant@nexus-sales.com' LIMIT 1));

-- Seed activities (timeline entries)
-- Note: activities table uses entity_type (singular) not related_to_table
INSERT INTO activities (entity_type, entity_id, type, subject, description, scheduled_at, due_at, completed_at, duration_minutes, status, owner_id, assigned_to, created_by) VALUES
  ('lead', (SELECT id FROM leads WHERE company = 'Habtoor Trading LLC' LIMIT 1),
   'call', 'Call from Mohammed Al-Habtoor', 'Interested in safety helmet bulk pricing',
   NULL, NULL, '2026-08-19T10:30:00+04:00', 30, 'completed',
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1)),
  ('quote', (SELECT id FROM quotes WHERE quote_number = 'QUO-2026-0001' LIMIT 1),
   'email', 'Quote sent to Al-Futtaim', 'QUO-2026-0001 sent via email',
   NULL, NULL, '2026-08-19T14:00:00+04:00', 15, 'completed',
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1),
   (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1));

-- Seed audit logs (from trigger events)
-- Note: audit_logs table uses entity_type/entity_id columns
INSERT INTO audit_logs (entity_type, entity_id, action, user_id, created_at) VALUES
  ('lead', (SELECT id FROM leads WHERE company = 'Habtoor Trading LLC' LIMIT 1),
   'INSERT', (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1), '2026-08-19 23:00:00'),
  ('account', (SELECT id FROM accounts WHERE name = 'Al-Futtaim Group' LIMIT 1),
   'INSERT', (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1), '2026-08-19 23:00:00');

-- Seed price book entries
INSERT INTO price_book_entries (price_book_id, product_id, unit_price, currency, is_active) VALUES
  ((SELECT id FROM price_books WHERE name = 'Standard Price Book'),
   (SELECT id FROM products WHERE sku = 'PROD-001'), 45.00, 'AED', true),
  ((SELECT id FROM price_books WHERE name = 'Standard Price Book'),
   (SELECT id FROM products WHERE sku = 'PROD-002'), 35.00, 'AED', true),
  ((SELECT id FROM price_books WHERE name = 'Standard Price Book'),
   (SELECT id FROM products WHERE sku = 'PROD-003'), 25.00, 'AED', true),
  ((SELECT id FROM price_books WHERE name = 'Standard Price Book'),
   (SELECT id FROM products WHERE sku = 'PROD-004'), 12.50, 'AED', true),
  ((SELECT id FROM price_books WHERE name = 'Standard Price Book'),
   (SELECT id FROM products WHERE sku = 'PROD-005'), 85.00, 'AED', true),
  ((SELECT id FROM price_books WHERE name = 'Standard Price Book'),
   (SELECT id FROM products WHERE sku = 'SVC-001'), 25000, 'AED', true),
  ((SELECT id FROM price_books WHERE name = 'Standard Price Book'),
   (SELECT id FROM products WHERE sku = 'SVC-002'), 15000, 'AED', true),
  ((SELECT id FROM price_books WHERE name = 'Standard Price Book'),
   (SELECT id FROM products WHERE sku = 'SVC-003'), 12000, 'AED', true),
  ((SELECT id FROM price_books WHERE name = 'Standard Price Book'),
   (SELECT id FROM products WHERE sku = 'SVC-004'), 1200, 'AED', true);

-- Seed settings (updated from original)
INSERT INTO settings (key, value, is_public, description) VALUES
  ('company_name', '"Nexus Trading & Consultancy"', true, 'Company name'),
  ('default_currency', '"AED"', true, 'Default currency'),
  ('vat_rate', '"5.0"', true, 'Default VAT rate for UAE'),
  ('quote_number_format', '"QUO-{YYYY}-{####}"', false, 'Format for quote numbers'),
  ('order_number_format', '"SO-{YYYY}-{####}"', false, 'Format for order numbers'),
  ('invoice_number_format', '"INV-{YYYY}-{####}"', false, 'Format for invoice numbers'),
  ('timezone', '"Asia/Dubai"', true, 'Default timezone for the system'),
  ('company_address', '"Al Barsha, Dubai, UAE"', true, 'Company physical address'),
  ('company_phone', '"+971 4 123 4567"', true, 'Company phone number'),
  ('company_email', '"info@nexus-sales.com"', true, 'Company email address'),
  ('terms_default', '"Payment due within 30 days of invoice date."', false, 'Default payment terms');

-- Seed audit logs (from trigger events)
-- Note: Most audit entries are created automatically by the database trigger
-- This seed is for initial state only
INSERT INTO audit_logs (table_name, record_id, action, user_id, created_at) VALUES
  ('leads', (SELECT id FROM leads WHERE company = 'Habtoor Trading LLC' LIMIT 1),
   'INSERT', (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1), '2026-08-19 23:00:00'),
  ('accounts', (SELECT id FROM accounts WHERE name = 'Habtoor Trading LLC' LIMIT 1),
   'INSERT', (SELECT id FROM users WHERE email = 'sales@nexus-sales.com' LIMIT 1), '2026-08-19 23:00:00');
