/*
  # Notification System

  1. New Tables
    - `notifications`
      - System-wide notifications for users
    - `notification_preferences`
      - User preferences for different notification types

  2. Features
    - Course updates, new enrollments, completion notifications
    - Email and in-app notification preferences
    - Notification read/unread status
*/

-- Notification Types Enum
CREATE TYPE notification_type AS ENUM (
  'course_enrollment',
  'course_completion',
  'new_course_available',
  'course_update',
  'discussion_reply',
  'certificate_issued',
  'payment_received',
  'system_announcement'
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  email_enabled boolean DEFAULT true,
  in_app_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Create function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_action_url, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create function to handle enrollment notifications
CREATE OR REPLACE FUNCTION handle_enrollment_notification()
RETURNS TRIGGER AS $$
DECLARE
  course_title text;
BEGIN
  -- Get course title
  SELECT title INTO course_title FROM courses WHERE id = NEW.course_id;
  
  -- Send enrollment notification
  PERFORM send_notification(
    NEW.user_id,
    'course_enrollment',
    'Successfully Enrolled!',
    'You have successfully enrolled in "' || course_title || '"',
    '/courses/enrolled/' || NEW.course_id::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for enrollment notifications
CREATE TRIGGER enrollment_notification_trigger
  AFTER INSERT ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION handle_enrollment_notification();

-- Create function to handle completion notifications
CREATE OR REPLACE FUNCTION handle_completion_notification()
RETURNS TRIGGER AS $$
DECLARE
  course_title text;
BEGIN
  -- Only trigger on completion (when completed_at changes from NULL to a value)
  IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
    -- Get course title
    SELECT title INTO course_title FROM courses WHERE id = NEW.course_id;
    
    -- Send completion notification
    PERFORM send_notification(
      NEW.user_id,
      'course_completion',
      'Course Completed!',
      'Congratulations! You have completed "' || course_title || '"',
      '/courses/enrolled/' || NEW.course_id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for completion notifications
CREATE TRIGGER completion_notification_trigger
  AFTER UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION handle_completion_notification();

-- Create updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();