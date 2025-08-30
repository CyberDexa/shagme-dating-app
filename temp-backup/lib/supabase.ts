/**
 * Supabase Client Configuration
 * Production-ready setup for ShagMe Dating App
 */

import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Environment variables - these will be set in deployment
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'shagme-dating-app'
    }
  }
});

// Database type definitions
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          phone?: string;
          created_at: string;
          updated_at: string;
          last_active: string;
          is_active: boolean;
          is_verified: boolean;
          verification_level: number;
          terms_accepted_at?: string;
          privacy_accepted_at?: string;
        };
        Insert: {
          id: string;
          email: string;
          phone?: string;
          is_active?: boolean;
          is_verified?: boolean;
          verification_level?: number;
          terms_accepted_at?: string;
          privacy_accepted_at?: string;
        };
        Update: {
          email?: string;
          phone?: string;
          last_active?: string;
          is_active?: boolean;
          is_verified?: boolean;
          verification_level?: number;
          terms_accepted_at?: string;
          privacy_accepted_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          bio?: string;
          age?: number;
          gender?: string;
          relationship_type?: string;
          location?: any; // PostGIS geography type
          city?: string;
          state?: string;
          country?: string;
          occupation?: string;
          education?: string;
          height?: number;
          interests?: string[];
          lifestyle?: any; // JSONB
          is_complete: boolean;
          completion_score: number;
          visibility_score: number;
          profile_views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          bio?: string;
          age?: number;
          gender?: string;
          relationship_type?: string;
          city?: string;
          state?: string;
          country?: string;
          occupation?: string;
          education?: string;
          height?: number;
          interests?: string[];
          lifestyle?: any;
          is_complete?: boolean;
          completion_score?: number;
          visibility_score?: number;
        };
        Update: {
          display_name?: string;
          bio?: string;
          age?: number;
          gender?: string;
          relationship_type?: string;
          city?: string;
          state?: string;
          country?: string;
          occupation?: string;
          education?: string;
          height?: number;
          interests?: string[];
          lifestyle?: any;
          is_complete?: boolean;
          completion_score?: number;
          visibility_score?: number;
          profile_views?: number;
        };
      };
      profile_photos: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          thumbnail_url?: string;
          is_primary: boolean;
          order_index: number;
          is_verified: boolean;
          verification_data?: any;
          metadata?: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          url: string;
          thumbnail_url?: string;
          is_primary?: boolean;
          order_index?: number;
          is_verified?: boolean;
          verification_data?: any;
          metadata?: any;
        };
        Update: {
          url?: string;
          thumbnail_url?: string;
          is_primary?: boolean;
          order_index?: number;
          is_verified?: boolean;
          verification_data?: any;
          metadata?: any;
        };
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          matched_at: string;
          match_score?: number;
          is_active: boolean;
          last_message_at?: string;
          conversation_starter?: string;
        };
        Insert: {
          user1_id: string;
          user2_id: string;
          match_score?: number;
          is_active?: boolean;
          conversation_starter?: string;
        };
        Update: {
          match_score?: number;
          is_active?: boolean;
          last_message_at?: string;
          conversation_starter?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content?: string;
          message_type: string;
          metadata?: any;
          is_read: boolean;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          content?: string;
          message_type?: string;
          metadata?: any;
          is_read?: boolean;
          is_deleted?: boolean;
        };
        Update: {
          content?: string;
          message_type?: string;
          metadata?: any;
          is_read?: boolean;
          is_deleted?: boolean;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          status?: string;
          billing_cycle?: string;
          current_period_start?: string;
          current_period_end?: string;
          trial_start?: string;
          trial_end?: string;
          canceled_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plan_id: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          status?: string;
          billing_cycle?: string;
          current_period_start?: string;
          current_period_end?: string;
          trial_start?: string;
          trial_end?: string;
        };
        Update: {
          plan_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          status?: string;
          billing_cycle?: string;
          current_period_start?: string;
          current_period_end?: string;
          trial_start?: string;
          trial_end?: string;
          canceled_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const signUp = async (email: string, password: string, metadata?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// File upload helpers
export const uploadPhoto = async (userId: string, file: File | Blob, fileName: string) => {
  const filePath = `profiles/${userId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('photos')
    .getPublicUrl(filePath);
  
  return {
    path: data.path,
    url: publicUrlData.publicUrl
  };
};

// Real-time subscriptions helpers
export const subscribeToMessages = (conversationId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToMatches = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`matches:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user1_id=eq.${userId},user2_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
};

export type SupabaseDatabase = Database;
export type SupabaseClient = typeof supabase;
