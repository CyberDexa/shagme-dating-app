/**
 * Profile Service
 * Epic 002: Profile Creation & Management
 * Story 001: Basic Profile Setup
 * 
 * Core service for managing user profiles including creation, updates,
 * validation, and integration with verification system.
 */

import {
  UserProfile,
  PersonalInfo,
  MatchingPreferences,
  ProfileVisibility,
  ProfileCompletion,
  ProfileCreationSession,
  ProfileCreationStep,
  CreateProfileRequest,
  UpdateProfileRequest,
  ProfileValidationRules,
  ProfileError,
  ProfileValidationError,
  ProfileNotFoundError,
  ProfilePermissionError,
  Location,
  ProfilePhoto,
  SexualOrientation,
  RelationshipType
} from '../../types/profile';
// Note: VerificationStatusService to be imported when available
// import { VerificationStatusService } from '../verification/verificationStatusService';
import { VerificationResult } from '../../types/verification';

export class ProfileService {
  private static instance: ProfileService;
  // private verificationService: VerificationStatusService;
  
  private constructor() {
    // this.verificationService = VerificationStatusService.getInstance();
  }

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  // Validation rules
  private validationRules: ProfileValidationRules = {
    displayName: {
      minLength: 2,
      maxLength: 30,
      allowedCharacters: /^[a-zA-Z0-9\s\-_\.]+$/
    },
    bio: {
      minLength: 10,
      maxLength: 500,
      prohibitedWords: ['contact', 'phone', 'email', 'instagram', 'snapchat', 'whatsapp']
    },
    photos: {
      minCount: 1,
      maxCount: 9,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFormats: ['jpeg', 'jpg', 'png', 'webp']
    },
    age: {
      min: 18,
      max: 99
    }
  };

  /**
   * Create a new profile creation session
   */
  async createProfileSession(userId: string): Promise<ProfileCreationSession> {
    const sessionId = `profile_session_${userId}_${Date.now()}`;
    const steps: ProfileCreationStep[] = [
      {
        stepId: 'personal_info',
        title: 'Personal Information',
        description: 'Basic details about yourself',
        isCompleted: false,
        isRequired: true,
        validationErrors: []
      },
      {
        stepId: 'photos',
        title: 'Profile Photos',
        description: 'Upload your best photos',
        isCompleted: false,
        isRequired: true,
        validationErrors: []
      },
      {
        stepId: 'preferences',
        title: 'Matching Preferences',
        description: 'Tell us what you\'re looking for',
        isCompleted: false,
        isRequired: true,
        validationErrors: []
      },
      {
        stepId: 'visibility',
        title: 'Privacy Settings',
        description: 'Control who can see your profile',
        isCompleted: false,
        isRequired: false,
        validationErrors: []
      }
    ];

    const session: ProfileCreationSession = {
      sessionId,
      userId,
      currentStep: 'personal_info',
      steps,
      tempData: {},
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    // Store session (in real app, this would be persisted)
    await this.storeProfileSession(session);
    return session;
  }

  /**
   * Create a new user profile
   */
  async createProfile(userId: string, request: CreateProfileRequest): Promise<UserProfile> {
    // Validate request
    const validationErrors = await this.validateProfileData(request);
    if (validationErrors.length > 0) {
      throw new ProfileValidationError(validationErrors);
    }

    // Get verification data (simplified for now)
    const verificationResults: VerificationResult[] = await this.getVerificationResults(userId);
    const verificationScore = this.calculateVerificationScore(verificationResults);

    // Create profile
    const profile: UserProfile = {
      userId,
      personalInfo: this.buildPersonalInfo(request.personalInfo),
      photos: [],
      preferences: this.buildMatchingPreferences(request.preferences),
      visibility: this.buildProfileVisibility(request.visibility),
      completion: this.calculateProfileCompletion({} as UserProfile),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      profileViews: 0,
      profileLikes: 0,
      verification: {
        isVerified: verificationScore >= 0.8,
        verificationResults,
        verificationScore,
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
        trustScore: verificationScore
      }
    };

    // Recalculate completion after building profile
    profile.completion = this.calculateProfileCompletion(profile);

    // Store profile
    await this.storeProfile(profile);
    
    return profile;
  }

  /**
   * Update an existing profile
   */
  async updateProfile(userId: string, profileId: string, request: UpdateProfileRequest): Promise<UserProfile> {
    const existingProfile = await this.getProfile(profileId);
    
    if (!existingProfile) {
      throw new ProfileNotFoundError(profileId);
    }

    if (existingProfile.userId !== userId) {
      throw new ProfilePermissionError('update', profileId);
    }

    // Validate updates
    const validationErrors = await this.validateProfileData(request);
    if (validationErrors.length > 0) {
      throw new ProfileValidationError(validationErrors);
    }

    // Apply updates
    const updatedProfile: UserProfile = {
      ...existingProfile,
      personalInfo: request.personalInfo 
        ? { ...existingProfile.personalInfo, ...request.personalInfo }
        : existingProfile.personalInfo,
      preferences: request.preferences
        ? { ...existingProfile.preferences, ...request.preferences }
        : existingProfile.preferences,
      visibility: request.visibility
        ? { ...existingProfile.visibility, ...request.visibility }
        : existingProfile.visibility,
      updatedAt: new Date()
    };

    // Recalculate completion
    updatedProfile.completion = this.calculateProfileCompletion(updatedProfile);

    // Store updated profile
    await this.storeProfile(updatedProfile);
    
    return updatedProfile;
  }

  /**
   * Get user profile by ID
   */
  async getProfile(profileId: string): Promise<UserProfile | null> {
    // In real implementation, this would fetch from database
    return this.retrieveProfile(profileId);
  }

  /**
   * Get user profile by user ID
   */
  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    // In real implementation, this would query database by userId
    return this.retrieveProfileByUserId(userId);
  }

  /**
   * Delete a profile
   */
  async deleteProfile(userId: string, profileId: string): Promise<boolean> {
    const profile = await this.getProfile(profileId);
    
    if (!profile) {
      throw new ProfileNotFoundError(profileId);
    }

    if (profile.userId !== userId) {
      throw new ProfilePermissionError('delete', profileId);
    }

    // Soft delete profile
    const deletedProfile = {
      ...profile,
      safety: {
        ...profile.safety,
        isBanned: true,
        banReason: 'User deleted profile',
        banExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days retention
      },
      updatedAt: new Date()
    };

    await this.storeProfile(deletedProfile);
    return true;
  }

  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion(profile: UserProfile): ProfileCompletion {
    const weights = {
      personalInfo: 0.4,
      photos: 0.3,
      preferences: 0.2,
      visibility: 0.1
    };

    // Personal info completion
    const personalInfoFields = [
      'displayName', 'age', 'location', 'sexualOrientation', 
      'sexualIntent', 'lookingFor', 'bio'
    ];
    const personalInfoCompleted = personalInfoFields.filter(field => {
      const value = (profile.personalInfo as any)?.[field];
      return value !== undefined && value !== null && value !== '';
    }).length;
    const personalInfoPercentage = (personalInfoCompleted / personalInfoFields.length) * 100;

    // Photos completion
    const photosPercentage = Math.min((profile.photos?.length || 0) / this.validationRules.photos.minCount, 1) * 100;

    // Preferences completion
    const preferencesFields = ['ageRange', 'maxDistance', 'sexualOrientations', 'relationshipTypes'];
    const preferencesCompleted = preferencesFields.filter(field => {
      const value = (profile.preferences as any)?.[field];
      return value !== undefined && value !== null;
    }).length;
    const preferencesPercentage = (preferencesCompleted / preferencesFields.length) * 100;

    // Visibility completion (always 100% as it has defaults)
    const visibilityPercentage = 100;

    // Overall percentage
    const overallPercentage = Math.round(
      personalInfoPercentage * weights.personalInfo +
      photosPercentage * weights.photos +
      preferencesPercentage * weights.preferences +
      visibilityPercentage * weights.visibility
    );

    // Missing fields
    const missingFields: string[] = [];
    if (personalInfoPercentage < 100) missingFields.push('Personal Information');
    if (photosPercentage < 100) missingFields.push('Profile Photos');
    if (preferencesPercentage < 100) missingFields.push('Matching Preferences');

    // Recommended actions
    const recommendedActions: string[] = [];
    if (!profile.personalInfo?.bio || profile.personalInfo.bio.length < 50) {
      recommendedActions.push('Add a detailed bio');
    }
    if (!profile.photos || profile.photos.length < 3) {
      recommendedActions.push('Upload more photos');
    }
    if (!profile.verification?.isVerified) {
      recommendedActions.push('Complete profile verification');
    }

    return {
      overallPercentage,
      personalInfo: personalInfoPercentage,
      photos: photosPercentage,
      preferences: preferencesPercentage,
      visibility: visibilityPercentage,
      missingFields,
      recommendedActions
    };
  }

  /**
   * Validate profile data
   */
  private async validateProfileData(data: Partial<CreateProfileRequest | UpdateProfileRequest>): Promise<ProfileError[]> {
    const errors: ProfileError[] = [];

    // Validate personal info
    if (data.personalInfo) {
      const personalInfo = data.personalInfo;

      // Display name validation
      if (personalInfo.displayName !== undefined) {
        if (!personalInfo.displayName || personalInfo.displayName.length < this.validationRules.displayName.minLength) {
          errors.push({
            code: 'DISPLAY_NAME_TOO_SHORT',
            message: `Display name must be at least ${this.validationRules.displayName.minLength} characters`,
            field: 'displayName'
          });
        }
        if (personalInfo.displayName && personalInfo.displayName.length > this.validationRules.displayName.maxLength) {
          errors.push({
            code: 'DISPLAY_NAME_TOO_LONG',
            message: `Display name must be no more than ${this.validationRules.displayName.maxLength} characters`,
            field: 'displayName'
          });
        }
        if (personalInfo.displayName && !this.validationRules.displayName.allowedCharacters.test(personalInfo.displayName)) {
          errors.push({
            code: 'DISPLAY_NAME_INVALID_CHARACTERS',
            message: 'Display name contains invalid characters',
            field: 'displayName'
          });
        }
      }

      // Age validation
      if (personalInfo.age !== undefined) {
        if (personalInfo.age < this.validationRules.age.min) {
          errors.push({
            code: 'AGE_TOO_YOUNG',
            message: `You must be at least ${this.validationRules.age.min} years old`,
            field: 'age'
          });
        }
        if (personalInfo.age > this.validationRules.age.max) {
          errors.push({
            code: 'AGE_TOO_OLD',
            message: `Age cannot exceed ${this.validationRules.age.max}`,
            field: 'age'
          });
        }
      }

      // Bio validation
      if (personalInfo.bio !== undefined) {
        if (personalInfo.bio && personalInfo.bio.length < this.validationRules.bio.minLength) {
          errors.push({
            code: 'BIO_TOO_SHORT',
            message: `Bio must be at least ${this.validationRules.bio.minLength} characters`,
            field: 'bio'
          });
        }
        if (personalInfo.bio && personalInfo.bio.length > this.validationRules.bio.maxLength) {
          errors.push({
            code: 'BIO_TOO_LONG',
            message: `Bio must be no more than ${this.validationRules.bio.maxLength} characters`,
            field: 'bio'
          });
        }
        
        // Check for prohibited words
        if (personalInfo.bio) {
          const lowerBio = personalInfo.bio.toLowerCase();
          const foundProhibited = this.validationRules.bio.prohibitedWords.find((word: string) => 
            lowerBio.includes(word.toLowerCase())
          );
          if (foundProhibited) {
            errors.push({
              code: 'BIO_PROHIBITED_CONTENT',
              message: 'Bio contains prohibited content. Please avoid sharing contact information.',
              field: 'bio'
            });
          }
        }
      }

      // Location validation
      if (personalInfo.location) {
        if (!personalInfo.location.latitude || !personalInfo.location.longitude) {
          errors.push({
            code: 'LOCATION_INCOMPLETE',
            message: 'Location coordinates are required',
            field: 'location'
          });
        }
        if (!personalInfo.location.city || !personalInfo.location.country) {
          errors.push({
            code: 'LOCATION_MISSING_DETAILS',
            message: 'City and country are required',
            field: 'location'
          });
        }
      }
    }

    // Validate preferences
    if (data.preferences) {
      const preferences = data.preferences;

      // Age range validation
      if (preferences.ageRange) {
        if (preferences.ageRange.min < this.validationRules.age.min) {
          errors.push({
            code: 'PREFERENCE_AGE_MIN_INVALID',
            message: `Minimum age preference cannot be less than ${this.validationRules.age.min}`,
            field: 'preferences.ageRange.min'
          });
        }
        if (preferences.ageRange.max > this.validationRules.age.max) {
          errors.push({
            code: 'PREFERENCE_AGE_MAX_INVALID',
            message: `Maximum age preference cannot exceed ${this.validationRules.age.max}`,
            field: 'preferences.ageRange.max'
          });
        }
        if (preferences.ageRange.min >= preferences.ageRange.max) {
          errors.push({
            code: 'PREFERENCE_AGE_RANGE_INVALID',
            message: 'Minimum age must be less than maximum age',
            field: 'preferences.ageRange'
          });
        }
      }

      // Distance validation
      if (preferences.maxDistance !== undefined) {
        if (preferences.maxDistance <= 0) {
          errors.push({
            code: 'PREFERENCE_DISTANCE_INVALID',
            message: 'Maximum distance must be greater than 0',
            field: 'preferences.maxDistance'
          });
        }
        if (preferences.maxDistance > 1000) {
          errors.push({
            code: 'PREFERENCE_DISTANCE_TOO_LARGE',
            message: 'Maximum distance cannot exceed 1000km',
            field: 'preferences.maxDistance'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Build personal info with defaults
   */
  private buildPersonalInfo(data?: Partial<PersonalInfo>): PersonalInfo {
    if (!data) {
      throw new Error('Personal info is required');
    }

    return {
      displayName: data.displayName || '',
      age: data.age || 0,
      dateOfBirth: data.dateOfBirth || new Date(),
      location: data.location || { latitude: 0, longitude: 0, city: '', country: '' },
      sexualOrientation: data.sexualOrientation || 'straight',
      sexualIntent: data.sexualIntent || 'clear',
      lookingFor: data.lookingFor || ['casual'],
      bio: data.bio || '',
      occupation: data.occupation,
      education: data.education,
      height: data.height,
      bodyType: data.bodyType,
      ethnicity: data.ethnicity,
      languages: data.languages || ['English']
    };
  }

  /**
   * Build matching preferences with defaults
   */
  private buildMatchingPreferences(data?: Partial<MatchingPreferences>): MatchingPreferences {
    return {
      ageRange: data?.ageRange || { min: 18, max: 35 },
      maxDistance: data?.maxDistance || 50,
      sexualOrientations: data?.sexualOrientations || ['straight'],
      relationshipTypes: data?.relationshipTypes || ['casual', 'hookup'],
      bodyTypes: data?.bodyTypes,
      heightRange: data?.heightRange,
      ethnicities: data?.ethnicities,
      education: data?.education,
      dealBreakers: data?.dealBreakers || []
    };
  }

  /**
   * Build profile visibility with defaults
   */
  private buildProfileVisibility(data?: Partial<ProfileVisibility>): ProfileVisibility {
    return {
      isVisible: data?.isVisible !== false, // Default to visible
      hideAge: data?.hideAge || false,
      hideLocation: data?.hideLocation || false,
      hideLastActive: data?.hideLastActive || false,
      showOnlyToVerified: data?.showOnlyToVerified || false,
      incognito: data?.incognito || false,
      distanceVisibility: data?.distanceVisibility || 'approximate',
      onlineStatus: data?.onlineStatus || 'online'
    };
  }

  /**
   * Calculate verification score from results
   */
  private calculateVerificationScore(results: VerificationResult[]): number {
    if (!results || results.length === 0) return 0;

    // For now, use a simple confidence-based calculation
    // In the future, this will integrate with specific verification types
    const totalConfidence = results.reduce((sum, result) => sum + (result.confidence || 0), 0);
    return Math.min(totalConfidence / results.length, 1);
  }

  /**
   * Get verification results for user (placeholder implementation)
   */
  private async getVerificationResults(userId: string): Promise<VerificationResult[]> {
    // TODO: This will be replaced with actual verification service integration
    // For now, return empty array
    return [];
  }

  // Storage methods (in real implementation, these would interact with database)
  private async storeProfile(profile: UserProfile): Promise<void> {
    // Mock storage - in real app, this would save to database
    console.log('Profile stored:', profile.userId);
  }

  private async retrieveProfile(profileId: string): Promise<UserProfile | null> {
    // Mock retrieval - in real app, this would fetch from database
    return null;
  }

  private async retrieveProfileByUserId(userId: string): Promise<UserProfile | null> {
    // Mock retrieval - in real app, this would fetch from database
    return null;
  }

  private async storeProfileSession(session: ProfileCreationSession): Promise<void> {
    // Mock storage - in real app, this would save to cache/database
    console.log('Profile session stored:', session.sessionId);
  }
}
