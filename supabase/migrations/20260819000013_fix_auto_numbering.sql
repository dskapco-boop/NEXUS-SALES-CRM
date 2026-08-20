-- ============================================
-- FIX: Auto-generate quote_number and order_number
-- These fields are NOT NULL UNIQUE but weren't being auto-generated
-- in the database layer (handled by edge function).
-- 
-- Fix: Add BEFORE INSERT triggers to auto-generate numbers:
--   quotes: QUO-YYYY-XXXX (e.g., QUO-2026-0001)
--   sales_orders: SO-YYYY-XXXX (e.g., SO-2026-0001)
--   invoices: INV-YYYY-XXXX (e.g., INV-2026-0001)
--   payments: PAY-YYYY-XXXX (e.g., PAY-2026-0001)
-- ============================================

-- Function to generate sequential quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  last_num INTEGER;
  new_num INTEGER;
  new_number TEXT;
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    SELECT COALESCE(MAX(quote_number), '') INTO new_number
    FROM public.quotes
    WHERE quote_number LIKE ('QUO-' || year_part || '-%');
    
    IF new_number != '' THEN
      last_num := (RIGHT(new_number, 4))::INTEGER + 1;
    ELSE
      last_num := 1;
    END IF;
    
    new_num := last_num;
    NEW.quote_number := 'QUO-' || year_part || '-' || LPAD(new_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate sequential order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  last_num INTEGER;
  new_num INTEGER;
  new_number TEXT;
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    SELECT COALESCE(MAX(order_number), '') INTO new_number
    FROM public.sales_orders
    WHERE order_number LIKE ('SO-' || year_part || '-%');
    
    IF new_number != '' THEN
      last_num := (RIGHT(new_number, 4))::INTEGER + 1;
    ELSE
      last_num := 1;
    END IF;
    
    new_num := last_num;
    NEW.order_number := 'SO-' || year_part || '-' || LPAD(new_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate sequential invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  last_num INTEGER;
  new_num INTEGER;
  new_number TEXT;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    SELECT COALESCE(MAX(invoice_number), '') INTO new_number
    FROM public.invoices
    WHERE invoice_number LIKE ('INV-' || year_part || '-%');
    
    IF new_number != '' THEN
      last_num := (RIGHT(new_number, 4))::INTEGER + 1;
    ELSE
      last_num := 1;
    END IF;
    
    new_num := last_num;
    NEW.invoice_number := 'INV-' || year_part || '-' || LPAD(new_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_generate_quote_number ON public.quotes;
CREATE TRIGGER trigger_generate_quote_number
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.generate_quote_number();

DROP TRIGGER IF EXISTS trigger_generate_order_number ON public.sales_orders;
CREATE TRIGGER trigger_generate_order_number
  BEFORE INSERT ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON public.invoices;
CREATE TRIGGER trigger_generate_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();
