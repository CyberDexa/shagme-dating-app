/**
 * Profile Privacy and Visibility Service
 * Epic 002: Profile Creation & Management
 * Story 004: Profile Visibility Controls
 * 
 * Manages profile privacy settings, visibility controls, and user safety features
 */

import {
  UserProfile,
  ProfileVisibility,
  ProfileError,
  ProfileValidationError,
  ProfileNotFoundError,
  ProfilePermissionError
} from '../../types/profile';
import { ProfileService } from './profileService';

export interface VisibilitySettings {
  profileVisibility: 'visible' | 'hidden' | 'incognito';
  showOnlyTo: 'everyone' | 'verified_only' | 'premium_only';
  hideFrom: string[]; // User IDs to hide from
  ageDisplay: 'exact' | 'range' | 'hidden';
  locationDisplay: 'exact' | 'city' | 'approximate' | 'hidden';
  lastActiveDisplay: 'exact' | 'approximate' | 'hidden';
  onlineStatusDisplay: 'online' | 'away' | 'invisible';
}

export interface PrivacyPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<ProfileVisibility>;
  isRecommended: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'maximum';
}

export interface ViewerInfo {
  viewerId: string;
  canViewProfile: boolean;
  canViewPhotos: boolean;
  canSendMessage: boolean;
  restrictions: string[];
  reason?: string;
}

export interface PrivacyAudit {
  profileId: string;
  auditDate: Date;
  exposureLevel: 'minimal' | 'moderate' | 'high' | 'maximum';
  vulnerabilities: string[];
  recommendations: string[];
  score: number; // 0-100 privacy score
}

export class PrivacyVisibilityService {
  private static instance: PrivacyVisibilityService;
  private profileService: ProfileService;

  private constructor() {
    this.profileService = ProfileService.getInstance();
  }

  public static getInstance(): PrivacyVisibilityService {
    if (!PrivacyVisibilityService.instance) {
      PrivacyVisibilityService.instance = new PrivacyVisibilityService();
    }
    return PrivacyVisibilityService.instance;
  }

  /**
   * Update user's privacy and visibility settings
   */
  async updateVisibilitySettings(userId: string, settings: Partial<ProfileVisibility>): Promise<ProfileVisibility> {
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      throw new ProfileNotFoundError(userId);
    }

    // Validate settings
    const validationErrors = await this.validateVisibilitySettings(settings);
    if (validationErrors.length > 0) {
      throw new ProfileValidationError(validationErrors);
    }

    // Merge with existing settings
    const updatedVisibility: ProfileVisibility = {
      ...profile.visibility,
      ...settings
    };

    // Update profile
    await this.profileService.updateProfile(userId, profile.userId, {
      visibility: updatedVisibility
    });

    return updatedVisibility;
  }

  /**
   * Get user's current visibility settings
   */
  async getVisibilitySettings(userId: string): Promise<ProfileVisibility> {
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      throw new ProfileNotFoundError(userId);
    }

    return profile.visibility;
  }

  /**
   * Get privacy presets for quick setup
   */
  async getPrivacyPresets(): Promise<PrivacyPreset[]> {
    return [
      {
        id: 'open',
        name: 'Open & Social',
        description: 'Maximum visibility for more connections',
        settings: {
          isVisible: true,
          hideAge: false,
          hideLocation: false,
          hideLastActive: false,
          showOnlyToVerified: false,
          incognito: false,
          distanceVisibility: 'exact',
          onlineStatus: 'online'
        },
        isRecommended: true,
        securityLevel: 'low'
      },
      {
        id: 'balanced',
        name: 'Balanced Privacy',
        description: 'Good balance between visibility and privacy',
        settings: {
          isVisible: true,
          hideAge: false,
          hideLocation: false,
          hideLastActive: true,
          showOnlyToVerified: true,
          incognito: false,
          distanceVisibility: 'approximate',
          onlineStatus: 'online'
        },
        isRecommended: true,
        securityLevel: 'medium'
      },
      {
        id: 'private',
        name: 'Private & Selective',
        description: 'Enhanced privacy with selective visibility',
        settings: {
          isVisible: true,
          hideAge: true,
          hideLocation: true,
          hideLastActive: true,
          showOnlyToVerified: true,
          incognito: false,
          distanceVisibility: 'approximate',
          onlineStatus: 'away'
        },
        isRecommended: false,
        securityLevel: 'high'
      },
      {
        id: 'stealth',
        name: 'Stealth Mode',
        description: 'Maximum privacy and anonymity',
        settings: {
          isVisible: true,
          hideAge: true,
          hideLocation: true,
          hideLastActive: true,
          showOnlyToVerified: true,
          incognito: true,
          distanceVisibility: 'hidden',
          onlineStatus: 'invisible'
        },
        isRecommended: false,
        securityLevel: 'maximum'
      }
    ];
  }

  /**
   * Apply a privacy preset
   */
  async applyPrivacyPreset(userId: string, presetId: string): Promise<ProfileVisibility> {
    const presets = await this.getPrivacyPresets();
    const preset = presets.find(p => p.id === presetId);
    
    if (!preset) {
      throw new Error(`Privacy preset not found: ${presetId}`);
    }

    return this.updateVisibilitySettings(userId, preset.settings);
  }

  /**
   * Check if a viewer can see a profile
   */
  async checkProfileVisibility(profileId: string, viewerId?: string): Promise<ViewerInfo> {
    const profile = await this.profileService.getProfile(profileId);
    if (!profile) {
      return {
        viewerId: viewerId || 'anonymous',
        canViewProfile: false,
        canViewPhotos: false,
        canSendMessage: false,
        restrictions: ['profile_not_found'],
        reason: 'Profile does not exist'
      };
    }

    const restrictions: string[] = [];
    let canViewProfile = true;
    let canViewPhotos = true;
    let canSendMessage = true;

    // Basic visibility check
    if (!profile.visibility.isVisible) {
      canViewProfile = false;
      restrictions.push('profile_hidden');
    }

    // Verified users only check
    if (profile.visibility.showOnlyToVerified && viewerId) {
      const viewerProfile = await this.profileService.getProfileByUserId(viewerId);
      if (!viewerProfile?.verification.isVerified) {
        canViewProfile = false;
        restrictions.push('viewer_not_verified');
      }
    }

    // Incognito mode check
    if (profile.visibility.incognito && viewerId !== profile.userId) {
      restrictions.push('incognito_mode');
      // In incognito, others can still see basic profile but with limited info
    }

    // Banned or reported check
    if (profile.safety.isBanned) {
      canViewProfile = false;
      restrictions.push('profile_banned');
    }

    // Anonymous viewer restrictions
    if (!viewerId) {
      canSendMessage = false;
      restrictions.push('anonymous_viewer');
    }

    return {
      viewerId: viewerId || 'anonymous',
      canViewProfile,
      canViewPhotos: canViewProfile && canViewPhotos,
      canSendMessage: canViewProfile && canSendMessage,
      restrictions,
      reason: restrictions.length > 0 ? restrictions.join(', ') : undefined
    };
  }

  /**
   * Enable incognito mode
   */
  async enableIncognito(userId: string): Promise<ProfileVisibility> {
    return this.updateVisibilitySettings(userId, {
      incognito: true,
      onlineStatus: 'invisible',
      hideLastActive: true
    });
  }

  /**
   * Disable incognito mode
   */
  async disableIncognito(userId: string): Promise<ProfileVisibility> {
    return this.updateVisibilitySettings(userId, {
      incognito: false,
      onlineStatus: 'online'
    });
  }

  /**
   * Hide profile from specific users
   */
  async hideFromUsers(userId: string, userIdsToHideFrom: string[]): Promise<void> {
    // In real implementation, this would maintain a block/hide list
    console.log(`User ${userId} hiding from:`, userIdsToHideFrom);
  }

  /**
   * Show profile to specific users (remove from hide list)
   */
  async showToUsers(userId: string, userIdsToShow: string[]): Promise<void> {
    // In real implementation, this would remove from block/hide list
    console.log(`User ${userId} showing to:`, userIdsToShow);
  }

  /**
   * Conduct privacy audit for user
   */
  async conductPrivacyAudit(userId: string): Promise<PrivacyAudit> {
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      throw new ProfileNotFoundError(userId);
    }

    const vulnerabilities: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check visibility settings
    if (profile.visibility.isVisible && !profile.visibility.showOnlyToVerified) {
      vulnerabilities.push('Profile visible to unverified users');
      recommendations.push('Consider showing profile only to verified users');
      score -= 15;
    }

    if (!profile.visibility.hideLastActive) {
      vulnerabilities.push('Last active time is visible');
      recommendations.push('Hide last active time for better privacy');
      score -= 10;
    }

    if (profile.visibility.distanceVisibility === 'exact') {
      vulnerabilities.push('Exact location distance visible');
      recommendations.push('Use approximate distance instead of exact');
      score -= 10;
    }

    if (!profile.visibility.hideAge) {
      vulnerabilities.push('Exact age is visible');
      recommendations.push('Consider hiding or showing age range instead');
      score -= 5;
    }

    // Check verification status
    if (!profile.verification.isVerified) {
      vulnerabilities.push('Profile not verified');
      recommendations.push('Complete profile verification for better trustworthiness');
      score -= 20;
    }

    // Check photo privacy
    if (profile.photos.length === 0) {
      vulnerabilities.push('No profile photos');
      recommendations.push('Add photos but ensure they don\'t reveal personal information');
      score -= 10;
    }

    // Check bio for personal information
    if (profile.personalInfo.bio) {
      const sensitivePatterns = [
        /\b\d{10,}\b/, // Phone numbers
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
        /\b(?:instagram|snapchat|whatsapp|telegram)\b/i // Social media
      ];
      
      for (const pattern of sensitivePatterns) {
        if (pattern.test(profile.personalInfo.bio)) {
          vulnerabilities.push('Bio contains potentially sensitive information');
          recommendations.push('Remove contact details and social media handles from bio');
          score -= 15;
          break;
        }
      }
    }

    // Determine exposure level
    let exposureLevel: 'minimal' | 'moderate' | 'high' | 'maximum';
    if (score >= 80) exposureLevel = 'minimal';
    else if (score >= 60) exposureLevel = 'moderate';
    else if (score >= 40) exposureLevel = 'high';
    else exposureLevel = 'maximum';

    return {
      profileId: profile.userId,
      auditDate: new Date(),
      exposureLevel,
      vulnerabilities,
      recommendations,
      score: Math.max(score, 0)
    };
  }

  /**
   * Get privacy recommendations based on user behavior
   */
  async getPrivacyRecommendations(userId: string): Promise<string[]> {
    const audit = await this.conductPrivacyAudit(userId);
    return audit.recommendations;
  }

  /**
   * Export user's privacy settings
   */
  async exportPrivacySettings(userId: string): Promise<{
    visibility: ProfileVisibility;
    audit: PrivacyAudit;
    exportDate: Date;
  }> {
    const visibility = await this.getVisibilitySettings(userId);
    const audit = await this.conductPrivacyAudit(userId);

    return {
      visibility,
      audit,
      exportDate: new Date()
    };
  }

  /**
   * Validate visibility settings
   */
  private async validateVisibilitySettings(settings: Partial<ProfileVisibility>): Promise<ProfileError[]> {
    const errors: ProfileError[] = [];

    // No specific validation errors for visibility settings currently
    // All boolean and enum values are valid as defined in the type

    return errors;
  }

  /**
   * Calculate privacy score
   */
  private calculatePrivacyScore(visibility: ProfileVisibility): number {
    let score = 0;

    // Base points for being visible (necessary for the app to work)
    if (visibility.isVisible) score += 20;

    // Privacy protection points
    if (visibility.hideAge) score += 10;
    if (visibility.hideLocation) score += 15;
    if (visibility.hideLastActive) score += 10;
    if (visibility.showOnlyToVerified) score += 20;
    if (visibility.incognito) score += 15;

    // Distance privacy
    switch (visibility.distanceVisibility) {
      case 'hidden': score += 10; break;
      case 'approximate': score += 5; break;
      case 'exact': score += 0; break;
    }

    // Online status privacy
    switch (visibility.onlineStatus) {
      case 'invisible': score += 10; break;
      case 'away': score += 5; break;
      case 'online': score += 0; break;
    }

    return Math.min(score, 100);
  }
}
