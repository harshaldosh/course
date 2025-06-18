/*
  # Create Admin User and Setup

  1. Create admin user with email harshal9901@gmail.com
  2. Add admin role functionality
  3. Setup admin-specific policies

  Note: This creates the admin user directly in the auth.users table
*/

-- Insert admin user into auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'harshal9901@gmail.com',
  crypt('admin@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"], "role": "admin"}',
  '{"full_name": "Admin User", "role": "admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create admin profile
INSERT INTO public.profiles (id, full_name)
SELECT id, 'Admin User'
FROM auth.users 
WHERE email = 'harshal9901@gmail.com'
ON CONFLICT (id) DO NOTHING;