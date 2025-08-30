/**
 * Profile Preferences Service
 * Epic 002: Profile Creation & Management
 * Story 003: Preference and Filter Setup
 * 
 * Manages user matching preferences, filters, and deal-breakers
 */

import {
  UserProfile,
  MatchingPreferences,
  SexualOrientation,
  RelationshipType,
  ProfileError,
  ProfileValidationError,
  ProfileNotFoundError,
  ProfilePermissionError
} from '../../types/profile';
import { ProfileService } from './profileService';

export interface PreferencePreset {
  id: string;
  name: string;
  description: string;
  preferences: Partial<MatchingPreferences>;
  isPopular: boolean;
}

export interface PreferenceAnalytics {
  preferenceId: string;
  matchingProfiles: number;
  averageDistance: number;
  popularityScore: number;
  recommendations: string[];
}

export interface DealBreakerOption {
  id: string;
  category: 'lifestyle' | 'physical' | 'social' | 'other';
  label: string;
  description: string;
  isCommon: boolean;
}

export class PreferencesService {
  private static instance: PreferencesService;
  private profileService: ProfileService;

  // Preference validation ranges
  private readonly AGE_LIMITS = { min: 18, max: 99 };
  private readonly DISTANCE_LIMITS = { min: 1, max: 1000 }; // km
  private readonly MAX_DEAL_BREAKERS = 10;

  private constructor() {
    this.profileService = ProfileService.getInstance();
  }

  public static getInstance(): PreferencesService {
    if (!PreferencesService.instance) {
      PreferencesService.instance = new PreferencesService();
    }
    return PreferencesService.instance;
  }

  /**
   * Update user's matching preferences
   */
  async updatePreferences(userId: string, preferences: Partial<MatchingPreferences>): Promise<MatchingPreferences> {
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      throw new ProfileNotFoundError(userId);
    }

    // Validate preferences
    const validationErrors = await this.validatePreferences(preferences);
    if (validationErrors.length > 0) {
      throw new ProfileValidationError(validationErrors);
    }

    // Merge with existing preferences
    const updatedPreferences: MatchingPreferences = {
      ...profile.preferences,
      ...preferences
    };

    // Update profile
    await this.profileService.updateProfile(userId, profile.userId, {
      preferences: updatedPreferences
    });

    return updatedPreferences;
  }

  /**
   * Get user's current preferences
   */
  async getPreferences(userId: string): Promise<MatchingPreferences> {
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      throw new ProfileNotFoundError(userId);
    }

    return profile.preferences;
  }

  /**
   * Get preference presets for quick setup
   */
  async getPreferencePresets(): Promise<PreferencePreset[]> {
    return [
      {
        id: 'casual_nearby',
        name: 'Casual & Nearby',
        description: 'Looking for casual encounters within 25km',
        preferences: {
          ageRange: { min: 21, max: 35 },
          maxDistance: 25,
          relationshipTypes: ['casual', 'hookup'],
          sexualOrientations: ['straight', 'bisexual']
        },
        isPopular: true
      },
      {
        id: 'open_minded',
        name: 'Open Minded',
        description: 'Exploring all types of connections',
        preferences: {
          ageRange: { min: 20, max: 45 },
          maxDistance: 50,
          relationshipTypes: ['casual', 'hookup', 'friends_with_benefits'],
          sexualOrientations: ['straight', 'bisexual', 'gay', 'lesbian']
        },
        isPopular: true
      },
      {
        id: 'selective',
        name: 'Selective',
        description: 'Quality over quantity with specific criteria',
        preferences: {
          ageRange: { min: 25, max: 40 },
          maxDistance: 30,
          relationshipTypes: ['casual', 'short_term'],
          dealBreakers: ['smoking', 'no_photos']
        },
        isPopular: false
      },
      {
        id: 'adventurous',
        name: 'Adventurous',
        description: 'Open to new experiences and connections',
        preferences: {
          ageRange: { min: 18, max: 50 },
          maxDistance: 75,
          relationshipTypes: ['casual', 'hookup', 'friends_with_benefits', 'open_relationship'],
          sexualOrientations: ['straight', 'bisexual', 'pansexual']
        },
        isPopular: true
      }
    ];
  }

  /**
   * Apply a preference preset
   */
  async applyPreferencePreset(userId: string, presetId: string): Promise<MatchingPreferences> {
    const presets = await this.getPreferencePresets();
    const preset = presets.find(p => p.id === presetId);
    
    if (!preset) {
      throw new Error(`Preference preset not found: ${presetId}`);
    }

    return this.updatePreferences(userId, preset.preferences);
  }

  /**
   * Get deal breaker options
   */
  async getDealBreakerOptions(): Promise<DealBreakerOption[]> {
    return [
      // Lifestyle
      {
        id: 'smoking',
        category: 'lifestyle',
        label: 'Smoking',
        description: 'Users who smoke cigarettes',
        isCommon: true
      },
      {
        id: 'heavy_drinking',
        category: 'lifestyle',
        label: 'Heavy Drinking',
        description: 'Users who drink alcohol frequently',
        isCommon: true
      },
      {
        id: 'drug_use',
        category: 'lifestyle',
        label: 'Drug Use',
        description: 'Users who use recreational drugs',
        isCommon: true
      },
      {
        id: 'no_exercise',
        category: 'lifestyle',
        label: 'Sedentary Lifestyle',
        description: 'Users who don\'t exercise regularly',
        isCommon: false
      },

      // Physical
      {
        id: 'no_photos',
        category: 'physical',
        label: 'No Photos',
        description: 'Profiles without photos',
        isCommon: true
      },
      {
        id: 'body_type_restrictions',
        category: 'physical',
        label: 'Specific Body Types',
        description: 'Exclude certain body types',
        isCommon: false
      },
      {
        id: 'height_restrictions',
        category: 'physical',
        label: 'Height Requirements',
        description: 'Strict height preferences',
        isCommon: false
      },

      // Social
      {
        id: 'no_verification',
        category: 'social',
        label: 'Unverified Profiles',
        description: 'Profiles that haven\'t completed verification',
        isCommon: true
      },
      {
        id: 'inactive_users',
        category: 'social',
        label: 'Inactive Users',
        description: 'Users who haven\'t been active recently',
        isCommon: false
      },
      {
        id: 'new_profiles',
        category: 'social',
        label: 'New Profiles',
        description: 'Profiles created very recently',
        isCommon: false
      },

      // Other
      {
        id: 'long_distance',
        category: 'other',
        label: 'Long Distance',
        description: 'Users outside preferred distance',
        isCommon: true
      },
      {
        id: 'age_gaps',
        category: 'other',
        label: 'Large Age Gaps',
        description: 'Significant age differences',
        isCommon: false
      }
    ];
  }

  /**
   * Add deal breakers to preferences
   */
  async addDealBreakers(userId: string, dealBreakers: string[]): Promise<MatchingPreferences> {
    const currentPreferences = await this.getPreferences(userId);
    const existingDealBreakers = currentPreferences.dealBreakers || [];
    
    // Combine and deduplicate
    const updatedDealBreakers = [...new Set([...existingDealBreakers, ...dealBreakers])];
    
    // Validate limit
    if (updatedDealBreakers.length > this.MAX_DEAL_BREAKERS) {
      throw new ProfileValidationError([{
        code: 'TOO_MANY_DEAL_BREAKERS',
        message: `Maximum ${this.MAX_DEAL_BREAKERS} deal breakers allowed`,
        field: 'dealBreakers'
      }]);
    }

    return this.updatePreferences(userId, {
      dealBreakers: updatedDealBreakers
    });
  }

  /**
   * Remove deal breakers from preferences
   */
  async removeDealBreakers(userId: string, dealBreakers: string[]): Promise<MatchingPreferences> {
    const currentPreferences = await this.getPreferences(userId);
    const existingDealBreakers = currentPreferences.dealBreakers || [];
    
    const updatedDealBreakers = existingDealBreakers.filter(
      dealBreaker => !dealBreakers.includes(dealBreaker)
    );

    return this.updatePreferences(userId, {
      dealBreakers: updatedDealBreakers
    });
  }

  /**
   * Get preference analytics and suggestions
   */
  async getPreferenceAnalytics(userId: string): Promise<PreferenceAnalytics> {
    const preferences = await this.getPreferences(userId);
    
    // In real implementation, this would analyze matching pool
    // For now, return mock analytics
    return {
      preferenceId: userId,
      matchingProfiles: this.estimateMatchingProfiles(preferences),
      averageDistance: this.calculateAverageDistance(preferences),
      popularityScore: this.calculatePopularityScore(preferences),
      recommendations: this.generateRecommendations(preferences)
    };
  }

  /**
   * Optimize preferences for better matches
   */
  async optimizePreferences(userId: string, goals: {
    prioritizeQuantity?: boolean;
    prioritizeQuality?: boolean;
    increaseDistance?: boolean;
    expandAge?: boolean;
  }): Promise<MatchingPreferences> {
    const currentPreferences = await this.getPreferences(userId);
    const optimizedPreferences = { ...currentPreferences };

    if (goals.prioritizeQuantity) {
      // Expand criteria for more matches
      optimizedPreferences.maxDistance = Math.min(optimizedPreferences.maxDistance * 1.5, 100);
      optimizedPreferences.ageRange = {
        min: Math.max(optimizedPreferences.ageRange.min - 2, this.AGE_LIMITS.min),
        max: Math.min(optimizedPreferences.ageRange.max + 5, this.AGE_LIMITS.max)
      };
    }

    if (goals.prioritizeQuality) {
      // Add quality filters
      const qualityDealBreakers = ['no_verification', 'no_photos'];
      optimizedPreferences.dealBreakers = [
        ...(optimizedPreferences.dealBreakers || []),
        ...qualityDealBreakers.filter(db => !(optimizedPreferences.dealBreakers || []).includes(db))
      ];
    }

    if (goals.increaseDistance) {
      optimizedPreferences.maxDistance = Math.min(optimizedPreferences.maxDistance * 2, this.DISTANCE_LIMITS.max);
    }

    if (goals.expandAge) {
      optimizedPreferences.ageRange = {
        min: Math.max(optimizedPreferences.ageRange.min - 3, this.AGE_LIMITS.min),
        max: Math.min(optimizedPreferences.ageRange.max + 7, this.AGE_LIMITS.max)
      };
    }

    return this.updatePreferences(userId, optimizedPreferences);
  }

  /**
   * Validate preference updates
   */
  private async validatePreferences(preferences: Partial<MatchingPreferences>): Promise<ProfileError[]> {
    const errors: ProfileError[] = [];

    // Age range validation
    if (preferences.ageRange) {
      const { min, max } = preferences.ageRange;
      
      if (min < this.AGE_LIMITS.min) {
        errors.push({
          code: 'AGE_MIN_TOO_LOW',
          message: `Minimum age cannot be less than ${this.AGE_LIMITS.min}`,
          field: 'ageRange.min'
        });
      }
      
      if (max > this.AGE_LIMITS.max) {
        errors.push({
          code: 'AGE_MAX_TOO_HIGH',
          message: `Maximum age cannot exceed ${this.AGE_LIMITS.max}`,
          field: 'ageRange.max'
        });
      }
      
      if (min >= max) {
        errors.push({
          code: 'INVALID_AGE_RANGE',
          message: 'Minimum age must be less than maximum age',
          field: 'ageRange'
        });
      }

      if (max - min < 3) {
        errors.push({
          code: 'AGE_RANGE_TOO_NARROW',
          message: 'Age range should be at least 3 years',
          field: 'ageRange'
        });
      }
    }

    // Distance validation
    if (preferences.maxDistance !== undefined) {
      if (preferences.maxDistance < this.DISTANCE_LIMITS.min) {
        errors.push({
          code: 'DISTANCE_TOO_LOW',
          message: `Maximum distance cannot be less than ${this.DISTANCE_LIMITS.min}km`,
          field: 'maxDistance'
        });
      }
      
      if (preferences.maxDistance > this.DISTANCE_LIMITS.max) {
        errors.push({
          code: 'DISTANCE_TOO_HIGH',
          message: `Maximum distance cannot exceed ${this.DISTANCE_LIMITS.max}km`,
          field: 'maxDistance'
        });
      }
    }

    // Sexual orientations validation
    if (preferences.sexualOrientations) {
      if (preferences.sexualOrientations.length === 0) {
        errors.push({
          code: 'NO_SEXUAL_ORIENTATIONS',
          message: 'At least one sexual orientation must be selected',
          field: 'sexualOrientations'
        });
      }
    }

    // Relationship types validation
    if (preferences.relationshipTypes) {
      if (preferences.relationshipTypes.length === 0) {
        errors.push({
          code: 'NO_RELATIONSHIP_TYPES',
          message: 'At least one relationship type must be selected',
          field: 'relationshipTypes'
        });
      }
    }

    // Deal breakers validation
    if (preferences.dealBreakers) {
      if (preferences.dealBreakers.length > this.MAX_DEAL_BREAKERS) {
        errors.push({
          code: 'TOO_MANY_DEAL_BREAKERS',
          message: `Maximum ${this.MAX_DEAL_BREAKERS} deal breakers allowed`,
          field: 'dealBreakers'
        });
      }
    }

    // Height range validation
    if (preferences.heightRange) {
      const { min, max } = preferences.heightRange;
      if (min && max && min >= max) {
        errors.push({
          code: 'INVALID_HEIGHT_RANGE',
          message: 'Minimum height must be less than maximum height',
          field: 'heightRange'
        });
      }
    }

    return errors;
  }

  // Analytics helper methods
  private estimateMatchingProfiles(preferences: MatchingPreferences): number {
    // Mock calculation based on preferences breadth
    let baseCount = 1000;
    
    // Age range factor
    const ageSpan = preferences.ageRange.max - preferences.ageRange.min;
    baseCount *= (ageSpan / 20); // Normalize to 20-year span
    
    // Distance factor
    baseCount *= Math.min(preferences.maxDistance / 50, 2);
    
    // Deal breakers reduction
    baseCount *= Math.max(1 - (preferences.dealBreakers?.length || 0) * 0.15, 0.1);
    
    return Math.round(baseCount);
  }

  private calculateAverageDistance(preferences: MatchingPreferences): number {
    // Mock calculation
    return Math.round(preferences.maxDistance * 0.6);
  }

  private calculatePopularityScore(preferences: MatchingPreferences): number {
    // Mock calculation based on how common the preferences are
    let score = 0.5;
    
    // Common age ranges score higher
    const ageSpan = preferences.ageRange.max - preferences.ageRange.min;
    if (ageSpan >= 10 && ageSpan <= 20) score += 0.2;
    
    // Moderate distance preferences score higher
    if (preferences.maxDistance >= 20 && preferences.maxDistance <= 50) score += 0.2;
    
    // Common relationship types
    const commonTypes = ['casual', 'hookup'];
    if (preferences.relationshipTypes.some(type => commonTypes.includes(type))) score += 0.1;
    
    return Math.min(score, 1);
  }

  private generateRecommendations(preferences: MatchingPreferences): string[] {
    const recommendations: string[] = [];
    
    // Age range recommendations
    const ageSpan = preferences.ageRange.max - preferences.ageRange.min;
    if (ageSpan < 5) {
      recommendations.push('Consider expanding your age range to increase matches');
    }
    
    // Distance recommendations
    if (preferences.maxDistance < 20) {
      recommendations.push('Increasing your distance radius could significantly increase matches');
    }
    
    // Deal breakers recommendations
    if ((preferences.dealBreakers?.length || 0) > 5) {
      recommendations.push('Consider reducing deal breakers to see more potential matches');
    }
    
    // Relationship type recommendations
    if (preferences.relationshipTypes.length === 1) {
      recommendations.push('Adding more relationship types could broaden your options');
    }
    
    return recommendations;
  }
}
