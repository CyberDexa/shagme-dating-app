/**
 * Comprehensive Profile Management Service
 * Epic 002: Profile Creation & Management
 * 
 * Main coordination service that brings together all profile-related functionality
 */

import {
  UserProfile,
  ProfileCreationSession,
  CreateProfileRequest,
  UpdateProfileRequest,
  ProfileCompletion,
  MatchingPreferences,
  ProfileVisibility,
  ProfilePhoto,
  UploadPhotoRequest
} from '../../types/profile';

import { ProfileService } from './profileService';
import { PhotoManagementService } from './photoManagementService';
import { PreferencesService } from './preferencesService';
import { PrivacyVisibilityService } from './privacyVisibilityService';

export interface CompleteProfileSetup {
  personalInfo: Partial<CreateProfileRequest['personalInfo']>;
  photos: UploadPhotoRequest[];
  preferences: Partial<MatchingPreferences>;
  visibility: Partial<ProfileVisibility>;
}

export interface ProfileDashboard {
  profile: UserProfile;
  completion: ProfileCompletion;
  analytics: {
    views: number;
    likes: number;
    matches: number;
    responseRate: number;
  };
  recommendations: string[];
  nextSteps: string[];
}

export interface ProfileValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  completionScore: number;
}

export class ProfileManagementService {
  private static instance: ProfileManagementService;
  
  private profileService: ProfileService;
  private photoService: PhotoManagementService;
  private preferencesService: PreferencesService;
  private privacyService: PrivacyVisibilityService;

  private constructor() {
    this.profileService = ProfileService.getInstance();
    this.photoService = PhotoManagementService.getInstance();
    this.preferencesService = PreferencesService.getInstance();
    this.privacyService = PrivacyVisibilityService.getInstance();
  }

  public static getInstance(): ProfileManagementService {
    if (!ProfileManagementService.instance) {
      ProfileManagementService.instance = new ProfileManagementService();
    }
    return ProfileManagementService.instance;
  }

  /**
   * Start the profile creation flow
   */
  async startProfileCreation(userId: string): Promise<ProfileCreationSession> {
    return this.profileService.createProfileSession(userId);
  }

  /**
   * Complete profile setup in one go
   */
  async completeProfileSetup(userId: string, setup: CompleteProfileSetup): Promise<UserProfile> {
    // 1. Create basic profile
    const profile = await this.profileService.createProfile(userId, {
      personalInfo: setup.personalInfo,
      preferences: setup.preferences,
      visibility: setup.visibility
    });

    // 2. Upload photos
    for (const photoRequest of setup.photos) {
      await this.photoService.uploadPhoto(userId, photoRequest);
    }

    // 3. Return updated profile
    return this.getCompleteProfile(userId);
  }

  /**
   * Get complete profile with all related data
   */
  async getCompleteProfile(userId: string): Promise<UserProfile> {
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    // Enrich with photos
    const photos = await this.photoService.getUserPhotos(userId);
    profile.photos = photos;

    return profile;
  }

  /**
   * Get profile dashboard with analytics
   */
  async getProfileDashboard(userId: string): Promise<ProfileDashboard> {
    const profile = await this.getCompleteProfile(userId);
    const completion = this.profileService.calculateProfileCompletion(profile);
    
    // Get privacy recommendations
    const privacyRecommendations = await this.privacyService.getPrivacyRecommendations(userId);
    
    // Get preference analytics
    const preferenceAnalytics = await this.preferencesService.getPreferenceAnalytics(userId);
    
    return {
      profile,
      completion,
      analytics: {
        views: profile.profileViews,
        likes: profile.profileLikes,
        matches: 0, // TODO: Get from matching service
        responseRate: 0 // TODO: Get from messaging service
      },
      recommendations: [
        ...privacyRecommendations,
        ...preferenceAnalytics.recommendations,
        ...completion.recommendedActions
      ],
      nextSteps: this.generateNextSteps(profile, completion)
    };
  }

  /**
   * Validate complete profile
   */
  async validateProfile(userId: string): Promise<ProfileValidationReport> {
    const profile = await this.getCompleteProfile(userId);
    const completion = this.profileService.calculateProfileCompletion(profile);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!profile.personalInfo.displayName) {
      errors.push('Display name is required');
    }
    
    if (!profile.personalInfo.bio || profile.personalInfo.bio.length < 10) {
      errors.push('Bio must be at least 10 characters');
    }

    if (profile.photos.length === 0) {
      errors.push('At least one photo is required');
    }

    // Warnings
    if (profile.photos.length < 3) {
      warnings.push('Consider adding more photos for better engagement');
    }

    if (!profile.verification.isVerified) {
      warnings.push('Complete profile verification for better trustworthiness');
    }

    if (profile.personalInfo.bio.length < 50) {
      warnings.push('A longer bio helps others understand you better');
    }

    // Suggestions
    if (completion.overallPercentage < 80) {
      suggestions.push('Complete your profile to increase match potential');
    }

    if (profile.visibility.showOnlyToVerified === false) {
      suggestions.push('Consider showing profile only to verified users for better safety');
    }

    // Conduct privacy audit
    const privacyAudit = await this.privacyService.conductPrivacyAudit(userId);
    if (privacyAudit.score < 60) {
      warnings.push('Your profile has privacy vulnerabilities');
      suggestions.push(...privacyAudit.recommendations);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      completionScore: completion.overallPercentage
    };
  }

  /**
   * Update profile with comprehensive validation
   */
  async updateProfileComprehensive(
    userId: string, 
    updates: {
      personalInfo?: Partial<UpdateProfileRequest['personalInfo']>;
      preferences?: Partial<MatchingPreferences>;
      visibility?: Partial<ProfileVisibility>;
    }
  ): Promise<UserProfile> {
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    // Update profile info
    if (updates.personalInfo) {
      await this.profileService.updateProfile(userId, profile.userId, {
        personalInfo: updates.personalInfo
      });
    }

    // Update preferences
    if (updates.preferences) {
      await this.preferencesService.updatePreferences(userId, updates.preferences);
    }

    // Update visibility
    if (updates.visibility) {
      await this.privacyService.updateVisibilitySettings(userId, updates.visibility);
    }

    return this.getCompleteProfile(userId);
  }

  /**
   * Delete profile and all associated data
   */
  async deleteProfileCompletely(userId: string): Promise<boolean> {
    // Delete all photos
    const photos = await this.photoService.getUserPhotos(userId);
    for (const photo of photos) {
      await this.photoService.deletePhoto(userId, photo.id);
    }

    // Delete profile
    const profile = await this.profileService.getProfileByUserId(userId);
    if (profile) {
      await this.profileService.deleteProfile(userId, profile.userId);
    }

    return true;
  }

  /**
   * Get profile optimization recommendations
   */
  async getOptimizationRecommendations(userId: string): Promise<{
    profileOptimization: string[];
    photoOptimization: string[];
    preferenceOptimization: string[];
    privacyOptimization: string[];
  }> {
    const profile = await this.getCompleteProfile(userId);
    const completion = this.profileService.calculateProfileCompletion(profile);
    const privacyAudit = await this.privacyService.conductPrivacyAudit(userId);
    const preferenceAnalytics = await this.preferencesService.getPreferenceAnalytics(userId);

    return {
      profileOptimization: completion.recommendedActions,
      photoOptimization: this.generatePhotoRecommendations(profile),
      preferenceOptimization: preferenceAnalytics.recommendations,
      privacyOptimization: privacyAudit.recommendations
    };
  }

  /**
   * Apply quick profile improvements
   */
  async applyQuickImprovements(userId: string, improvements: {
    expandPreferences?: boolean;
    addPrivacySettings?: boolean;
    optimizeVisibility?: boolean;
  }): Promise<UserProfile> {
    if (improvements.expandPreferences) {
      await this.preferencesService.optimizePreferences(userId, {
        prioritizeQuantity: true
      });
    }

    if (improvements.addPrivacySettings) {
      await this.privacyService.applyPrivacyPreset(userId, 'balanced');
    }

    if (improvements.optimizeVisibility) {
      await this.privacyService.updateVisibilitySettings(userId, {
        showOnlyToVerified: true,
        hideLastActive: false // Show activity for better engagement
      });
    }

    return this.getCompleteProfile(userId);
  }

  /**
   * Generate next steps for profile improvement
   */
  private generateNextSteps(profile: UserProfile, completion: ProfileCompletion): string[] {
    const steps: string[] = [];

    if (completion.photos < 100) {
      steps.push('Upload more photos to reach the recommended minimum');
    }

    if (completion.personalInfo < 100) {
      steps.push('Complete all personal information fields');
    }

    if (!profile.verification.isVerified) {
      steps.push('Complete profile verification process');
    }

    if (profile.personalInfo.bio.length < 100) {
      steps.push('Expand your bio to tell your story better');
    }

    if (profile.photos.length > 0 && !profile.photos.some(p => p.isVerified)) {
      steps.push('Wait for photo verification to complete');
    }

    return steps;
  }

  /**
   * Generate photo-specific recommendations
   */
  private generatePhotoRecommendations(profile: UserProfile): string[] {
    const recommendations: string[] = [];

    if (profile.photos.length < 3) {
      recommendations.push('Add more photos - profiles with 3+ photos get more matches');
    }

    if (profile.photos.length > 0 && !profile.photos.some(p => p.isPrimary)) {
      recommendations.push('Set a primary photo for better first impressions');
    }

    const unverifiedPhotos = profile.photos.filter(p => !p.isVerified);
    if (unverifiedPhotos.length > 0) {
      recommendations.push('Some photos are still pending verification');
    }

    if (profile.photos.length === 0) {
      recommendations.push('Add at least one photo to start getting matches');
    }

    return recommendations;
  }

  /**
   * Export complete profile data
   */
  async exportProfileData(userId: string): Promise<{
    profile: UserProfile;
    photos: ProfilePhoto[];
    privacySettings: ProfileVisibility;
    exportDate: Date;
  }> {
    const profile = await this.getCompleteProfile(userId);
    const photos = await this.photoService.getUserPhotos(userId);
    const privacySettings = await this.privacyService.getVisibilitySettings(userId);

    return {
      profile,
      photos,
      privacySettings,
      exportDate: new Date()
    };
  }
}
