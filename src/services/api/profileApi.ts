/**
 * Profile API Service
 * Epic 002: Profile Creation & Management
 * 
 * API layer for all profile-related operations
 */

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

import { ProfileManagementService } from '../profile/profileManagementService';
import { PhotoManagementService } from '../profile/photoManagementService';
import { PreferencesService } from '../profile/preferencesService';
import { PrivacyVisibilityService } from '../profile/privacyVisibilityService';

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

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class ProfileApiService {
  private static instance: ProfileApiService;
  
  private profileManagement: ProfileManagementService;
  private photoService: PhotoManagementService;
  private preferencesService: PreferencesService;
  private privacyService: PrivacyVisibilityService;

  private constructor() {
    this.profileManagement = ProfileManagementService.getInstance();
    this.photoService = PhotoManagementService.getInstance();
    this.preferencesService = PreferencesService.getInstance();
    this.privacyService = PrivacyVisibilityService.getInstance();
  }

  public static getInstance(): ProfileApiService {
    if (!ProfileApiService.instance) {
      ProfileApiService.instance = new ProfileApiService();
    }
    return ProfileApiService.instance;
  }

  /**
   * Profile Creation APIs
   */
  async createProfile(userId: string, request: CreateProfileRequest): Promise<ApiResponse<UserProfile>> {
    try {
      const profile = await this.profileManagement.completeProfileSetup(userId, {
        personalInfo: request.personalInfo,
        photos: [],
        preferences: request.preferences || {},
        visibility: request.visibility || {}
      });

      return this.success(profile);
    } catch (error) {
      return this.error('PROFILE_CREATION_FAILED', 'Failed to create profile', error);
    }
  }

  async startProfileCreation(userId: string): Promise<ApiResponse<ProfileCreationSession>> {
    try {
      const session = await this.profileManagement.startProfileCreation(userId);
      return this.success(session);
    } catch (error) {
      return this.error('SESSION_CREATION_FAILED', 'Failed to start profile creation', error);
    }
  }

  /**
   * Profile Management APIs
   */
  async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const profile = await this.profileManagement.getCompleteProfile(userId);
      return this.success(profile);
    } catch (error) {
      return this.error('PROFILE_NOT_FOUND', 'Profile not found', error);
    }
  }

  async updateProfile(userId: string, request: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    try {
      const profile = await this.profileManagement.updateProfileComprehensive(userId, {
        personalInfo: request.personalInfo,
        preferences: request.preferences,
        visibility: request.visibility
      });
      return this.success(profile);
    } catch (error) {
      return this.error('PROFILE_UPDATE_FAILED', 'Failed to update profile', error);
    }
  }

  async deleteProfile(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.profileManagement.deleteProfileCompletely(userId);
      return this.success(result);
    } catch (error) {
      return this.error('PROFILE_DELETION_FAILED', 'Failed to delete profile', error);
    }
  }

  async getProfileDashboard(userId: string): Promise<ApiResponse<any>> {
    try {
      const dashboard = await this.profileManagement.getProfileDashboard(userId);
      return this.success(dashboard);
    } catch (error) {
      return this.error('DASHBOARD_FAILED', 'Failed to load dashboard', error);
    }
  }

  async validateProfile(userId: string): Promise<ApiResponse<any>> {
    try {
      const validation = await this.profileManagement.validateProfile(userId);
      return this.success(validation);
    } catch (error) {
      return this.error('VALIDATION_FAILED', 'Failed to validate profile', error);
    }
  }

  /**
   * Photo Management APIs
   */
  async uploadPhoto(userId: string, request: UploadPhotoRequest): Promise<ApiResponse<any>> {
    try {
      const result = await this.photoService.uploadPhoto(userId, request);
      return this.success(result);
    } catch (error) {
      return this.error('PHOTO_UPLOAD_FAILED', 'Failed to upload photo', error);
    }
  }

  async getUserPhotos(userId: string): Promise<ApiResponse<ProfilePhoto[]>> {
    try {
      const photos = await this.photoService.getUserPhotos(userId);
      return this.success(photos);
    } catch (error) {
      return this.error('PHOTOS_FETCH_FAILED', 'Failed to fetch photos', error);
    }
  }

  async updatePhoto(userId: string, photoId: string, updates: {
    isPrimary?: boolean;
    order?: number;
  }): Promise<ApiResponse<ProfilePhoto>> {
    try {
      const photo = await this.photoService.updatePhoto(userId, photoId, updates);
      return this.success(photo);
    } catch (error) {
      return this.error('PHOTO_UPDATE_FAILED', 'Failed to update photo', error);
    }
  }

  async deletePhoto(userId: string, photoId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.photoService.deletePhoto(userId, photoId);
      return this.success(result);
    } catch (error) {
      return this.error('PHOTO_DELETE_FAILED', 'Failed to delete photo', error);
    }
  }

  /**
   * Preferences APIs
   */
  async getPreferences(userId: string): Promise<ApiResponse<MatchingPreferences>> {
    try {
      const preferences = await this.preferencesService.getPreferences(userId);
      return this.success(preferences);
    } catch (error) {
      return this.error('PREFERENCES_FETCH_FAILED', 'Failed to fetch preferences', error);
    }
  }

  async updatePreferences(userId: string, preferences: Partial<MatchingPreferences>): Promise<ApiResponse<MatchingPreferences>> {
    try {
      const updated = await this.preferencesService.updatePreferences(userId, preferences);
      return this.success(updated);
    } catch (error) {
      return this.error('PREFERENCES_UPDATE_FAILED', 'Failed to update preferences', error);
    }
  }

  async getPreferencePresets(): Promise<ApiResponse<any[]>> {
    try {
      const presets = await this.preferencesService.getPreferencePresets();
      return this.success(presets);
    } catch (error) {
      return this.error('PRESETS_FETCH_FAILED', 'Failed to fetch presets', error);
    }
  }

  async applyPreferencePreset(userId: string, presetId: string): Promise<ApiResponse<MatchingPreferences>> {
    try {
      const preferences = await this.preferencesService.applyPreferencePreset(userId, presetId);
      return this.success(preferences);
    } catch (error) {
      return this.error('PRESET_APPLY_FAILED', 'Failed to apply preset', error);
    }
  }

  async getDealBreakerOptions(): Promise<ApiResponse<any[]>> {
    try {
      const options = await this.preferencesService.getDealBreakerOptions();
      return this.success(options);
    } catch (error) {
      return this.error('DEAL_BREAKERS_FETCH_FAILED', 'Failed to fetch deal breaker options', error);
    }
  }

  async addDealBreakers(userId: string, dealBreakers: string[]): Promise<ApiResponse<MatchingPreferences>> {
    try {
      const preferences = await this.preferencesService.addDealBreakers(userId, dealBreakers);
      return this.success(preferences);
    } catch (error) {
      return this.error('DEAL_BREAKERS_ADD_FAILED', 'Failed to add deal breakers', error);
    }
  }

  async removeDealBreakers(userId: string, dealBreakers: string[]): Promise<ApiResponse<MatchingPreferences>> {
    try {
      const preferences = await this.preferencesService.removeDealBreakers(userId, dealBreakers);
      return this.success(preferences);
    } catch (error) {
      return this.error('DEAL_BREAKERS_REMOVE_FAILED', 'Failed to remove deal breakers', error);
    }
  }

  async getPreferenceAnalytics(userId: string): Promise<ApiResponse<any>> {
    try {
      const analytics = await this.preferencesService.getPreferenceAnalytics(userId);
      return this.success(analytics);
    } catch (error) {
      return this.error('ANALYTICS_FETCH_FAILED', 'Failed to fetch analytics', error);
    }
  }

  async optimizePreferences(userId: string, goals: {
    prioritizeQuantity?: boolean;
    prioritizeQuality?: boolean;
    increaseDistance?: boolean;
    expandAge?: boolean;
  }): Promise<ApiResponse<MatchingPreferences>> {
    try {
      const preferences = await this.preferencesService.optimizePreferences(userId, goals);
      return this.success(preferences);
    } catch (error) {
      return this.error('OPTIMIZATION_FAILED', 'Failed to optimize preferences', error);
    }
  }

  /**
   * Privacy & Visibility APIs
   */
  async getPrivacySettings(userId: string): Promise<ApiResponse<ProfileVisibility>> {
    try {
      const settings = await this.privacyService.getVisibilitySettings(userId);
      return this.success(settings);
    } catch (error) {
      return this.error('PRIVACY_FETCH_FAILED', 'Failed to fetch privacy settings', error);
    }
  }

  async updatePrivacySettings(userId: string, settings: Partial<ProfileVisibility>): Promise<ApiResponse<ProfileVisibility>> {
    try {
      const updated = await this.privacyService.updateVisibilitySettings(userId, settings);
      return this.success(updated);
    } catch (error) {
      return this.error('PRIVACY_UPDATE_FAILED', 'Failed to update privacy settings', error);
    }
  }

  async getPrivacyPresets(): Promise<ApiResponse<any[]>> {
    try {
      const presets = await this.privacyService.getPrivacyPresets();
      return this.success(presets);
    } catch (error) {
      return this.error('PRIVACY_PRESETS_FAILED', 'Failed to fetch privacy presets', error);
    }
  }

  async applyPrivacyPreset(userId: string, presetId: string): Promise<ApiResponse<ProfileVisibility>> {
    try {
      const settings = await this.privacyService.applyPrivacyPreset(userId, presetId);
      return this.success(settings);
    } catch (error) {
      return this.error('PRIVACY_PRESET_FAILED', 'Failed to apply privacy preset', error);
    }
  }

  async enableIncognito(userId: string): Promise<ApiResponse<ProfileVisibility>> {
    try {
      const settings = await this.privacyService.enableIncognito(userId);
      return this.success(settings);
    } catch (error) {
      return this.error('INCOGNITO_ENABLE_FAILED', 'Failed to enable incognito mode', error);
    }
  }

  async disableIncognito(userId: string): Promise<ApiResponse<ProfileVisibility>> {
    try {
      const settings = await this.privacyService.disableIncognito(userId);
      return this.success(settings);
    } catch (error) {
      return this.error('INCOGNITO_DISABLE_FAILED', 'Failed to disable incognito mode', error);
    }
  }

  async checkProfileVisibility(profileId: string, viewerId?: string): Promise<ApiResponse<any>> {
    try {
      const visibility = await this.privacyService.checkProfileVisibility(profileId, viewerId);
      return this.success(visibility);
    } catch (error) {
      return this.error('VISIBILITY_CHECK_FAILED', 'Failed to check profile visibility', error);
    }
  }

  async conductPrivacyAudit(userId: string): Promise<ApiResponse<any>> {
    try {
      const audit = await this.privacyService.conductPrivacyAudit(userId);
      return this.success(audit);
    } catch (error) {
      return this.error('PRIVACY_AUDIT_FAILED', 'Failed to conduct privacy audit', error);
    }
  }

  async getPrivacyRecommendations(userId: string): Promise<ApiResponse<string[]>> {
    try {
      const recommendations = await this.privacyService.getPrivacyRecommendations(userId);
      return this.success(recommendations);
    } catch (error) {
      return this.error('RECOMMENDATIONS_FAILED', 'Failed to get privacy recommendations', error);
    }
  }

  async hideFromUsers(userId: string, userIdsToHideFrom: string[]): Promise<ApiResponse<boolean>> {
    try {
      await this.privacyService.hideFromUsers(userId, userIdsToHideFrom);
      return this.success(true);
    } catch (error) {
      return this.error('HIDE_USERS_FAILED', 'Failed to hide from users', error);
    }
  }

  async showToUsers(userId: string, userIdsToShow: string[]): Promise<ApiResponse<boolean>> {
    try {
      await this.privacyService.showToUsers(userId, userIdsToShow);
      return this.success(true);
    } catch (error) {
      return this.error('SHOW_USERS_FAILED', 'Failed to show to users', error);
    }
  }

  /**
   * Advanced Profile APIs
   */
  async getOptimizationRecommendations(userId: string): Promise<ApiResponse<any>> {
    try {
      const recommendations = await this.profileManagement.getOptimizationRecommendations(userId);
      return this.success(recommendations);
    } catch (error) {
      return this.error('OPTIMIZATION_RECOMMENDATIONS_FAILED', 'Failed to get optimization recommendations', error);
    }
  }

  async applyQuickImprovements(userId: string, improvements: {
    expandPreferences?: boolean;
    addPrivacySettings?: boolean;
    optimizeVisibility?: boolean;
  }): Promise<ApiResponse<UserProfile>> {
    try {
      const profile = await this.profileManagement.applyQuickImprovements(userId, improvements);
      return this.success(profile);
    } catch (error) {
      return this.error('QUICK_IMPROVEMENTS_FAILED', 'Failed to apply quick improvements', error);
    }
  }

  async exportProfileData(userId: string): Promise<ApiResponse<any>> {
    try {
      const data = await this.profileManagement.exportProfileData(userId);
      return this.success(data);
    } catch (error) {
      return this.error('EXPORT_FAILED', 'Failed to export profile data', error);
    }
  }

  /**
   * Helper methods for API responses
   */
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

  /**
   * Pagination helper
   */
  protected paginate<T>(
    items: T[],
    page: number = 1,
    pageSize: number = 20
  ): PaginatedResponse<T> {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      totalCount: items.length,
      page,
      pageSize,
      hasNext: endIndex < items.length,
      hasPrevious: page > 1
    };
  }
}
