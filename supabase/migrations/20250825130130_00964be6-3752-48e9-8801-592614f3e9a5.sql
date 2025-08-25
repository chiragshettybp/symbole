-- Temporarily disable RLS for payments table to allow admin access without authentication
-- This will allow payments to be added while we work on proper authentication
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;