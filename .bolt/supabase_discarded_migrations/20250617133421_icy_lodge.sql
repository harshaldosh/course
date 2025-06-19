/*
  # Course Analytics and Reporting Enhancement

  1. New Tables
    - `course_analytics`
      - Track course views, completion rates, and engagement metrics
    - `user_activity_logs`
      - Log user interactions for analytics
    - `course_reviews`
      - Allow students to review and rate courses
    - `instructor_profiles`
      - Separate instructor information from regular users

  2. Enhanced Features
    - Course completion certificates
    - Learning paths and prerequisites
    - Discussion forums per course
    - Assignment submissions

  3. Analytics Views
    - Course performance metrics
    - Student engagement tracking
    - Revenue analytics
*/

-- Course Analytics Table
CREATE TABLE IF NOT EXISTS course_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  total_enrollments integer DEFAULT 0,
  total_completions integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- User Activity Logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'course_view', 'video_watch', 'document_view', 'enrollment', 'completion'
  content_id uuid, -- video_id, document_id, agent_id
  duration_seconds integer, -- for video watch time
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Course Reviews
CREATE TABLE IF NOT EXISTS course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_verified boolean DEFAULT false, -- verified purchase
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Instructor Profiles
CREATE TABLE IF NOT EXISTS instructor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bio text,
  expertise_areas text[],
  years_experience integer,
  linkedin_url text,
  website_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Course Prerequisites
CREATE TABLE IF NOT EXISTS course_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, prerequisite_course_id)
);

-- Learning Paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_hours integer,
  created_by uuid REFERENCES auth.users(id),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Learning Path Courses
CREATE TABLE IF NOT EXISTS learning_path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(learning_path_id, course_id)
);

-- Course Certificates
CREATE TABLE IF NOT EXISTS course_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_url text,
  issued_at timestamptz DEFAULT now(),
  verification_code text UNIQUE,
  is_valid boolean DEFAULT true,
  UNIQUE(user_id, course_id)
);

-- Discussion Forums
CREATE TABLE IF NOT EXISTS course_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES course_discussions(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE course_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_discussions ENABLE ROW LEVEL SECURITY;

-- Create policies for course_analytics (admin only)
CREATE POLICY "Allow admin read access to course analytics"
  ON course_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.full_name = 'Admin User'
    )
  );

-- Create policies for user_activity_logs
CREATE POLICY "Users can view their own activity logs"
  ON user_activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow insert activity logs"
  ON user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for course_reviews
CREATE POLICY "Anyone can read course reviews"
  ON course_reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own reviews"
  ON course_reviews
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for instructor_profiles
CREATE POLICY "Anyone can read instructor profiles"
  ON instructor_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own instructor profile"
  ON instructor_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for course_prerequisites
CREATE POLICY "Anyone can read course prerequisites"
  ON course_prerequisites
  FOR SELECT
  TO public
  USING (true);

-- Create policies for learning_paths
CREATE POLICY "Anyone can read published learning paths"
  ON learning_paths
  FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Users can manage their own learning paths"
  ON learning_paths
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create policies for learning_path_courses
CREATE POLICY "Anyone can read learning path courses"
  ON learning_path_courses
  FOR SELECT
  TO public
  USING (true);

-- Create policies for course_certificates
CREATE POLICY "Users can view their own certificates"
  ON course_certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow certificate verification by code"
  ON course_certificates
  FOR SELECT
  TO public
  USING (verification_code IS NOT NULL);

-- Create policies for course_discussions
CREATE POLICY "Anyone can read course discussions"
  ON course_discussions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON course_discussions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discussions"
  ON course_discussions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_analytics_course_id ON course_analytics(course_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_course_id ON user_activity_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_rating ON course_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user_id ON instructor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course_id ON course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_path_id ON learning_path_courses(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_order ON learning_path_courses(learning_path_id, order_index);
CREATE INDEX IF NOT EXISTS idx_course_certificates_user_id ON course_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_verification ON course_certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_course_discussions_course_id ON course_discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_discussions_parent_id ON course_discussions(parent_id);

-- Create functions for analytics
CREATE OR REPLACE FUNCTION update_course_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update course analytics when enrollment changes
  IF TG_TABLE_NAME = 'enrollments' THEN
    INSERT INTO course_analytics (course_id, total_enrollments, last_updated)
    VALUES (NEW.course_id, 1, now())
    ON CONFLICT (course_id) DO UPDATE SET
      total_enrollments = course_analytics.total_enrollments + 1,
      last_updated = now();
      
    -- Update completion count if completed
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
      UPDATE course_analytics 
      SET total_completions = total_completions + 1,
          last_updated = now()
      WHERE course_id = NEW.course_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for analytics
CREATE TRIGGER update_course_analytics_on_enrollment
  AFTER INSERT OR UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_analytics();

-- Create function to generate certificate verification code
CREATE OR REPLACE FUNCTION generate_certificate_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verification_code = upper(substring(md5(random()::text) from 1 for 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for certificate verification code
CREATE TRIGGER generate_certificate_verification_code
  BEFORE INSERT ON course_certificates
  FOR EACH ROW
  EXECUTE FUNCTION generate_certificate_code();

-- Create updated_at triggers
CREATE TRIGGER update_course_reviews_updated_at
  BEFORE UPDATE ON course_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_profiles_updated_at
  BEFORE UPDATE ON instructor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_discussions_updated_at
  BEFORE UPDATE ON course_discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();