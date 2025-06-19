/*
  # Payment and Subscription System

  1. New Tables
    - `payment_methods`
      - Store user payment methods (tokenized)
    - `transactions`
      - Track all payment transactions
    - `subscription_plans`
      - Different subscription tiers
    - `user_subscriptions`
      - User subscription status

  2. Features
    - Course purchases and subscriptions
    - Payment history and invoicing
    - Subscription management
    - Discount codes and promotions
*/

-- Payment Status Enum
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

-- Subscription Status Enum
CREATE TYPE subscription_status AS ENUM (
  'active',
  'cancelled',
  'expired',
  'past_due',
  'trialing'
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id text,
  type text NOT NULL, -- 'card', 'paypal', etc.
  last_four text,
  brand text,
  exp_month integer,
  exp_year integer,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL,
  price_yearly numeric,
  features jsonb DEFAULT '[]',
  max_courses integer, -- NULL for unlimited
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id text,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Discount Codes Table
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  min_amount numeric DEFAULT 0,
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  applicable_courses uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Discount Code Usage Table
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id uuid NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  used_at timestamptz DEFAULT now(),
  UNIQUE(discount_code_id, user_id)
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_methods
CREATE POLICY "Users can manage their own payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for subscription_plans
CREATE POLICY "Anyone can read active subscription plans"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for discount_codes
CREATE POLICY "Anyone can read active discount codes"
  ON discount_codes
  FOR SELECT
  TO public
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Create policies for discount_code_usage
CREATE POLICY "Users can view their own discount usage"
  ON discount_code_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_user_id ON discount_code_usage(user_id);

-- Create function to check subscription access
CREATE OR REPLACE FUNCTION has_subscription_access(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  has_active_subscription boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > now()
  ) INTO has_active_subscription;
  
  RETURN has_active_subscription;
END;
$$;

-- Create function to validate discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code text,
  p_user_id uuid,
  p_amount numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  discount_record discount_codes%ROWTYPE;
  usage_count integer;
  result jsonb;
BEGIN
  -- Get discount code
  SELECT * INTO discount_record
  FROM discount_codes
  WHERE code = p_code
  AND is_active = true
  AND (valid_until IS NULL OR valid_until > now())
  AND valid_from <= now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired discount code');
  END IF;
  
  -- Check if user already used this code
  SELECT COUNT(*) INTO usage_count
  FROM discount_code_usage
  WHERE discount_code_id = discount_record.id
  AND user_id = p_user_id;
  
  IF usage_count > 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Discount code already used');
  END IF;
  
  -- Check max uses
  IF discount_record.max_uses IS NOT NULL AND discount_record.current_uses >= discount_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Discount code usage limit reached');
  END IF;
  
  -- Check minimum amount
  IF p_amount IS NOT NULL AND p_amount < discount_record.min_amount THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum amount not met');
  END IF;
  
  -- Calculate discount
  result := jsonb_build_object(
    'valid', true,
    'discount_type', discount_record.discount_type,
    'discount_value', discount_record.discount_value,
    'description', discount_record.description
  );
  
  RETURN result;
END;
$$;

-- Create updated_at triggers
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_courses) VALUES
('Free', 'Access to free courses only', 0, 0, '["Access to free courses", "Basic support"]', 5),
('Pro', 'Access to all courses with premium features', 29.99, 299.99, '["Access to all courses", "Priority support", "Certificates", "Offline downloads"]', NULL),
('Enterprise', 'Full access with team management', 99.99, 999.99, '["Everything in Pro", "Team management", "Analytics dashboard", "Custom branding"]', NULL)
ON CONFLICT DO NOTHING;