-- Fix critical security issue: Restrict payment information access

-- First, create a user roles system for proper admin authentication
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table to manage admin access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
      AND role = 'admin'
  );
$$;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.is_admin(auth.uid());
$$;

-- Drop the overly permissive payment policy
DROP POLICY IF EXISTS "Admin access to payments" ON public.payments;

-- Create secure RLS policies for payments table
CREATE POLICY "Only admins can view payments"
ON public.payments
FOR SELECT
USING (public.current_user_is_admin());

CREATE POLICY "Only admins can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only admins can update payments"
ON public.payments
FOR UPDATE
USING (public.current_user_is_admin())
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Only admins can delete payments"
ON public.payments
FOR DELETE
USING (public.current_user_is_admin());

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage user roles"
ON public.user_roles
FOR ALL
USING (public.current_user_is_admin())
WITH CHECK (public.current_user_is_admin());

-- Insert a default admin user (you'll need to update this with your actual admin user ID after authentication is set up)
-- This is a placeholder - you should replace this with your actual admin user ID
-- INSERT INTO public.user_roles (user_id, role) VALUES ('your-admin-user-id-here', 'admin');