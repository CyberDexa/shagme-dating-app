/**
 * Real Profile API Service using Supabase
 * Replaces mock ProfileApiService with actual database operations
 * Epic 002: Profile Creation & Management - Production Implementation
 */

import { supabase, type Database } from '../../lib/supabase';
import {
  UserProfile,
  CreateProfileRequest,
  UpdateProfileRequest,
  UploadPhotoRequest,
  ProfileCreationSession,
  MatchingPreferences,
  ProfileVisibility,
  ProfilePhoto
} from '../../types/profile';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

export class SupabaseProfileService {
  private static instance: SupabaseProfileService;

  public static getInstance(): SupabaseProfileService {
    if (!SupabaseProfileService.instance) {
      SupabaseProfileService.instance = new SupabaseProfileService();
    }
    return SupabaseProfileService.instance;
  }

  /**
   * Profile Management APIs
   */
  async createProfile(userId: string, request: CreateProfileRequest): Promise<ApiResponse<UserProfile>> {
    try {
      // First create the user record if it doesn't exist
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: 'user@example.com', // Will be updated with actual email
          is_active: true
        }, { onConflict: 'id' });

      if (userError) throw userError;

      // Create the profile
      const profileData: ProfileInsert = {
        user_id: userId,
        display_name: request.personalInfo.displayName || 'New User',
        bio: request.personalInfo.bio,
        age: request.personalInfo.age,
        gender: request.personalInfo.sexualOrientation,
        relationship_type: request.personalInfo.lookingFor?.[0],
        city: request.personalInfo.location?.city,
        state: request.personalInfo.location?.city, // Using city as state for now
        country: request.personalInfo.location?.country,
        occupation: request.personalInfo.occupation,
        education: request.personalInfo.education,
        height: request.personalInfo.height,
        interests: request.personalInfo.interests,
        lifestyle: request.personalInfo.lifestyle,
        is_complete: false,
        completion_score: 30 // Basic info provided
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) throw profileError;

      // Create matching preferences if provided
      if (request.preferences) {
        const { error: prefsError } = await supabase
          .from('matching_preferences')
          .insert({
            user_id: userId,
            age_min: request.preferences.ageRange?.min || 18,
            age_max: request.preferences.ageRange?.max || 99,
            distance_max: request.preferences.maxDistance || 50,
            gender_preference: request.preferences.sexualOrientations || ['straight'],
            relationship_goals: request.preferences.relationshipTypes || [],
            deal_breakers: request.preferences.dealBreakers || [],
            preferences: request.preferences
          });

        if (prefsError) console.warn('Failed to create preferences:', prefsError);
      }

      // Create visibility settings
      const { error: visibilityError } = await supabase
        .from('profile_visibility')
        .insert({
          user_id: userId,
          is_discoverable: request.visibility?.isVisible !== false,
          show_distance: !request.visibility?.hideLocation,
          show_last_active: !request.visibility?.hideLastActive
        });

      if (visibilityError) console.warn('Failed to create visibility settings:', visibilityError);

      return this.success(this.mapProfileFromDatabase(profile));
    } catch (error) {
      return this.error('PROFILE_CREATION_FAILED', 'Failed to create profile', error);
    }
  }

  async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_photos(*),
          matching_preferences(*),
          profile_visibility(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!profile) {
        return this.error('PROFILE_NOT_FOUND', 'Profile not found');
      }

      return this.success(this.mapProfileFromDatabase(profile));
    } catch (error) {
      return this.error('PROFILE_FETCH_FAILED', 'Failed to fetch profile', error);
    }
  }

  async updateProfile(userId: string, request: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    try {
      const updateData: ProfileUpdate = {};
      
      if (request.personalInfo) {
        const info = request.personalInfo;
        if (info.displayName) updateData.display_name = info.displayName;
        if (info.bio) updateData.bio = info.bio;
        if (info.age) updateData.age = info.age;
        if (info.sexualOrientation) updateData.gender = info.sexualOrientation;
        if (info.lookingFor?.[0]) updateData.relationship_type = info.lookingFor[0];
        if (info.occupation) updateData.occupation = info.occupation;
        if (info.education) updateData.education = info.education;
        if (info.height) updateData.height = info.height;
        if (info.interests) updateData.interests = info.interests;
        if (info.lifestyle) updateData.lifestyle = info.lifestyle;
        if (info.location?.city) updateData.city = info.location.city;
        if (info.location?.city) updateData.state = info.location.city; // Using city as state
        if (info.location?.country) updateData.country = info.location.country;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return this.success(this.mapProfileFromDatabase(profile));
    } catch (error) {
      return this.error('PROFILE_UPDATE_FAILED', 'Failed to update profile', error);
    }
  }

  /**
   * Photo Management APIs
   */
  async uploadPhoto(userId: string, request: UploadPhotoRequest): Promise<ApiResponse<ProfilePhoto>> {
    try {
      // Note: In a real implementation, you would upload to Supabase Storage
      // For now, we'll simulate the photo upload
      const photoData = {
        user_id: userId,
        url: `https://storage.supabase.co/v1/object/public/photos/${userId}/${Date.now()}.jpg`,
        thumbnail_url: `https://storage.supabase.co/v1/object/public/photos/${userId}/thumb_${Date.now()}.jpg`,
        is_primary: request.isPrimary || false,
        order_index: request.order || 0,
        metadata: {
          width: 800,
          height: 800,
          fileSize: 150000,
          format: 'jpeg'
        }
      };

      const { data: photo, error } = await supabase
        .from('profile_photos')
        .insert(photoData)
        .select()
        .single();

      if (error) throw error;

      return this.success({
        id: photo.id,
        userId: photo.user_id,
        url: photo.url,
        thumbnailUrl: photo.thumbnail_url,
        isPrimary: photo.is_primary,
        order: photo.order_index,
        isVerified: photo.is_verified,
        moderationStatus: 'approved' as const,
        metadata: photo.metadata,
        uploadedAt: new Date(photo.created_at)
      });
    } catch (error) {
      return this.error('PHOTO_UPLOAD_FAILED', 'Failed to upload photo', error);
    }
  }

  async getUserPhotos(userId: string): Promise<ApiResponse<ProfilePhoto[]>> {
    try {
      const { data: photos, error } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('user_id', userId)
        .order('order_index');

      if (error) throw error;

      const mappedPhotos = photos.map(photo => ({
        id: photo.id,
        userId: photo.user_id,
        url: photo.url,
        thumbnailUrl: photo.thumbnail_url,
        isPrimary: photo.is_primary,
        order: photo.order_index,
        isVerified: photo.is_verified,
        moderationStatus: 'approved' as const,
        metadata: photo.metadata,
        uploadedAt: new Date(photo.created_at)
      }));

      return this.success(mappedPhotos);
    } catch (error) {
      return this.error('PHOTOS_FETCH_FAILED', 'Failed to fetch photos', error);
    }
  }

  /**
   * Matching and Discovery APIs
   */
  async findPotentialMatches(userId: string, limit: number = 20): Promise<ApiResponse<UserProfile[]>> {
    try {
      // Get user's preferences
      const { data: prefs } = await supabase
        .from('matching_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Find profiles based on preferences
      let query = supabase
        .from('profiles')
        .select(`
          *,
          profile_photos!inner(*),
          profile_visibility!inner(*)
        `)
        .neq('user_id', userId) // Exclude self
        .eq('profile_visibility.is_discoverable', true)
        .limit(limit);

      // Apply age filter if preferences exist
      if (prefs) {
        query = query
          .gte('age', prefs.age_min)
          .lte('age', prefs.age_max);

        // Apply gender filter
        if (prefs.gender_preference?.length) {
          query = query.in('gender', prefs.gender_preference);
        }
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      const mappedProfiles = profiles.map(profile => this.mapProfileFromDatabase(profile));
      return this.success(mappedProfiles);
    } catch (error) {
      return this.error('MATCHES_FETCH_FAILED', 'Failed to find potential matches', error);
    }
  }

  /**
   * Real-time features
   */
  async likeProfile(userId: string, targetUserId: string): Promise<ApiResponse<{ isMatch: boolean; matchId?: string }>> {
    try {
      // Record the like
      const { error: likeError } = await supabase
        .from('user_interactions')
        .insert({
          user_id: userId,
          target_user_id: targetUserId,
          interaction_type: 'like'
        });

      if (likeError) throw likeError;

      // Check for mutual like (match)
      const { data: mutualLike } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('target_user_id', userId)
        .eq('interaction_type', 'like')
        .single();

      if (mutualLike) {
        // Create match
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: userId < targetUserId ? userId : targetUserId,
            user2_id: userId < targetUserId ? targetUserId : userId,
            match_score: 0.85
          })
          .select()
          .single();

        if (matchError) throw matchError;

        return this.success({ isMatch: true, matchId: match.id });
      }

      return this.success({ isMatch: false });
    } catch (error) {
      return this.error('LIKE_FAILED', 'Failed to like profile', error);
    }
  }

  /**
   * Helper methods
   */
  private mapProfileFromDatabase(dbProfile: any): UserProfile {
    return {
      userId: dbProfile.user_id,
      personalInfo: {
        displayName: dbProfile.display_name,
        bio: dbProfile.bio,
        age: dbProfile.age,
        dateOfBirth: new Date(), // Mock value
        sexualOrientation: dbProfile.gender || 'straight',
        sexualIntent: 'clear',
        lookingFor: dbProfile.relationship_type ? [dbProfile.relationship_type] : [],
        location: {
          latitude: 0, // Mock values - would be from PostGIS in real implementation
          longitude: 0,
          city: dbProfile.city || '',
          country: dbProfile.country || ''
        },
        occupation: dbProfile.occupation,
        education: dbProfile.education,
        height: dbProfile.height,
        interests: dbProfile.interests || [],
        lifestyle: dbProfile.lifestyle || {}
      },
      photos: dbProfile.profile_photos?.map((photo: any) => ({
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnail_url,
        isPrimary: photo.is_primary,
        order: photo.order_index,
        isVerified: photo.is_verified,
        moderationStatus: 'approved' as const,
        metadata: photo.metadata,
        uploadedAt: new Date(photo.created_at)
      })) || [],
      preferences: {
        ageRange: { min: 18, max: 99 },
        maxDistance: 50,
        sexualOrientations: ['straight'],
        relationshipTypes: ['casual']
      },
      visibility: {
        isVisible: true,
        hideAge: false,
        hideLocation: false,
        hideLastActive: false,
        showOnlyToVerified: false,
        incognito: false,
        distanceVisibility: 'approximate',
        onlineStatus: 'online'
      },
      completion: {
        overallPercentage: dbProfile.completion_score || 0,
        personalInfo: 70,
        photos: 0,
        preferences: 50,
        visibility: 100,
        missingFields: [],
        recommendedActions: []
      },
      createdAt: new Date(dbProfile.created_at),
      updatedAt: new Date(dbProfile.updated_at),
      lastActiveAt: new Date(),
      profileViews: dbProfile.profile_views || 0,
      profileLikes: 0,
      verification: {
        isVerified: false,
        verificationResults: [],
        verificationScore: 0,
        lastVerificationUpdate: new Date()
      },
      premium: {
        isActive: false,
        features: []
      },
      safety: {
        isReported: false,
        reportCount: 0,
        isBanned: false,
        trustScore: 75
      }
    };
  }

  private success<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date()
    };
  }

  private error(code: string, message: string, details?: any): ApiResponse<any> {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      timestamp: new Date()
    };
  }
}
