-- ShagMe Dating App Database Schema
-- Comprehensive schema for all Epic features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- EPIC 001: USER VERIFICATION & AUTHENTICATION
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_level INTEGER DEFAULT 0, -- 0: none, 1: email, 2: phone, 3: id, 4: facial, 5: background
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  privacy_accepted_at TIMESTAMP WITH TIME ZONE
);

-- Verification records
CREATE TABLE public.user_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL, -- 'government_id', 'facial_recognition', 'background_check', 'photo'
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  data JSONB, -- verification specific data
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EPIC 002: PROFILE CREATION & MANAGEMENT
-- =====================================================

-- User profiles
CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  age INTEGER,
  gender TEXT,
  relationship_type TEXT, -- 'casual', 'serious', 'long_term', 'marriage'
  location GEOGRAPHY(POINT, 4326),
  city TEXT,
  state TEXT,
  country TEXT,
  occupation TEXT,
  education TEXT,
  height INTEGER, -- in cm
  interests TEXT[],
  lifestyle JSONB, -- smoking, drinking, exercise, etc.
  is_complete BOOLEAN DEFAULT false,
  completion_score INTEGER DEFAULT 0,
  visibility_score INTEGER DEFAULT 50,
  profile_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile photos
CREATE TABLE public.profile_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verification_data JSONB,
  metadata JSONB, -- width, height, file_size, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matching preferences
CREATE TABLE public.matching_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 99,
  distance_max INTEGER DEFAULT 50, -- km
  gender_preference TEXT[], -- 'male', 'female', 'non_binary'
  relationship_goals TEXT[],
  deal_breakers TEXT[],
  preferences JSONB, -- detailed preferences object
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile visibility settings
CREATE TABLE public.profile_visibility (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  is_discoverable BOOLEAN DEFAULT true,
  is_incognito BOOLEAN DEFAULT false,
  show_distance BOOLEAN DEFAULT true,
  show_last_active BOOLEAN DEFAULT true,
  visibility_to TEXT DEFAULT 'everyone', -- 'everyone', 'premium_only', 'mutual_likes'
  hidden_from_users UUID[],
  visible_to_users UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EPIC 003: MATCHING SYSTEM
-- =====================================================

-- Matches and swipes
CREATE TABLE public.user_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'like', 'pass', 'super_like'
  is_mutual BOOLEAN DEFAULT false,
  match_score REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

-- Active matches
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_score REAL,
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE,
  conversation_starter TEXT,
  UNIQUE(user1_id, user2_id)
);

-- Match notifications
CREATE TABLE public.match_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  notification_type TEXT, -- 'new_match', 'new_message', 'profile_view'
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EPIC 004: COMMUNICATION FEATURES
-- =====================================================

-- Conversations
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'audio', 'gif'
  metadata JSONB, -- file urls, dimensions, etc.
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video call records
CREATE TABLE public.video_calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  call_status TEXT DEFAULT 'initiated', -- 'initiated', 'ringing', 'answered', 'ended', 'missed'
  duration_seconds INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- EPIC 005: SAFETY & SECURITY FEATURES
-- =====================================================

-- Safety check-ins
CREATE TABLE public.safety_checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id),
  checkin_type TEXT, -- 'meeting_start', 'meeting_end', 'emergency'
  status TEXT, -- 'safe', 'unsafe', 'no_response'
  location GEOGRAPHY(POINT, 4326),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_time TIMESTAMP WITH TIME ZONE,
  emergency_contacts_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts
CREATE TABLE public.emergency_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  relationship TEXT, -- 'family', 'friend', 'partner'
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety reports
CREATE TABLE public.safety_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id),
  reported_user_id UUID REFERENCES public.users(id),
  report_type TEXT, -- 'harassment', 'inappropriate_content', 'fake_profile', 'safety_concern'
  description TEXT,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'dismissed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  assigned_to TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- User ratings (anonymous)
CREATE TABLE public.user_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rater_id UUID REFERENCES public.users(id),
  rated_user_id UUID REFERENCES public.users(id),
  match_id UUID REFERENCES public.matches(id),
  safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  feedback TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rater_id, rated_user_id, match_id)
);

-- =====================================================
-- EPIC 006: PREMIUM PAYMENT SYSTEM
-- =====================================================

-- Subscription plans
CREATE TABLE public.subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_quarterly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_quarterly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT, -- 'active', 'canceled', 'past_due', 'unpaid'
  billing_cycle TEXT, -- 'monthly', 'quarterly', 'yearly'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment records
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  status TEXT, -- 'pending', 'succeeded', 'failed', 'refunded'
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature usage tracking
CREATE TABLE public.feature_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  feature_name TEXT, -- 'super_likes', 'boosts', 'rewinds', 'unlimited_likes'
  usage_count INTEGER DEFAULT 0,
  limit_count INTEGER,
  reset_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_name, reset_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Geographic indexes
CREATE INDEX idx_profiles_location ON public.profiles USING GIST (location);
CREATE INDEX idx_safety_checkins_location ON public.safety_checkins USING GIST (location);

-- User interactions indexes
CREATE INDEX idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_target_user_id ON public.user_interactions(target_user_id);
CREATE INDEX idx_user_interactions_created_at ON public.user_interactions(created_at);

-- Matches indexes
CREATE INDEX idx_matches_user1_id ON public.matches(user1_id);
CREATE INDEX idx_matches_user2_id ON public.matches(user2_id);
CREATE INDEX idx_matches_matched_at ON public.matches(matched_at);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Notifications indexes
CREATE INDEX idx_match_notifications_user_id ON public.match_notifications(user_id);
CREATE INDEX idx_match_notifications_created_at ON public.match_notifications(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile data" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own photos" ON public.profile_photos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own preferences" ON public.matching_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own visibility settings" ON public.profile_visibility
  FOR ALL USING (auth.uid() = user_id);

-- Matching policies (users can view profiles they're matching with)
CREATE POLICY "Users can view discoverable profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profile_visibility pv
      WHERE pv.user_id = profiles.user_id 
      AND pv.is_discoverable = true
    )
  );

-- Messages policies (users can view messages in conversations they're part of)
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = conversations.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create mutual matches
CREATE OR REPLACE FUNCTION create_mutual_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this creates a mutual match
    IF NEW.interaction_type = 'like' THEN
        -- Look for reciprocal like
        UPDATE public.user_interactions 
        SET is_mutual = true
        WHERE user_id = NEW.target_user_id 
        AND target_user_id = NEW.user_id 
        AND interaction_type = 'like';
        
        -- If we updated a row, create the match
        IF FOUND THEN
            UPDATE public.user_interactions 
            SET is_mutual = true 
            WHERE id = NEW.id;
            
            INSERT INTO public.matches (user1_id, user2_id, match_score)
            VALUES (
                LEAST(NEW.user_id, NEW.target_user_id),
                GREATEST(NEW.user_id, NEW.target_user_id),
                0.8 -- Default match score
            )
            ON CONFLICT (user1_id, user2_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for mutual matching
CREATE TRIGGER create_mutual_match_trigger 
    AFTER INSERT ON public.user_interactions
    FOR EACH ROW EXECUTE FUNCTION create_mutual_match();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_quarterly, price_yearly, features) VALUES
('Free', 'Basic features with limited matches', 0, 0, 0, '{"daily_likes": 10, "super_likes": 1, "rewinds": 0, "boosts": 0, "unlimited_likes": false}'),
('Premium', 'Enhanced features for serious daters', 19.99, 49.99, 159.99, '{"daily_likes": 100, "super_likes": 5, "rewinds": 3, "boosts": 1, "unlimited_likes": true, "see_who_likes": true, "premium_filters": true}'),
('VIP', 'All features for the ultimate dating experience', 39.99, 99.99, 299.99, '{"daily_likes": -1, "super_likes": 20, "rewinds": 10, "boosts": 5, "unlimited_likes": true, "see_who_likes": true, "premium_filters": true, "priority_support": true, "exclusive_matches": true}');
