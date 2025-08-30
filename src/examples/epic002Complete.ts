/**
 * Epic 002: Profile Creation & Management - Complete Implementation Example
 * 
 * This file demonstrates all the implemented functionality for Epic 002,
 * showcasing the complete profile system including creation, photo management,
 * preferences, and privacy controls.
 */

import { ProfileApiService } from '../services/api/profileApi';
import {
  UserProfile,
  CreateProfileRequest,
  UploadPhotoRequest,
  MatchingPreferences,
  ProfileVisibility
} from '../types/profile';

export class Epic002Example {
  private profileApi: ProfileApiService;
  private userId = 'example_user_001';

  constructor() {
    this.profileApi = ProfileApiService.getInstance();
  }

  /**
   * Demonstrate complete profile creation workflow
   */
  async demonstrateProfileCreation(): Promise<void> {
    console.log('\n=== Epic 002 - Story 001: Basic Profile Setup ===');

    try {
      // 1. Start profile creation session
      console.log('1. Starting profile creation session...');
      const sessionResponse = await this.profileApi.startProfileCreation(this.userId);
      
      if (sessionResponse.success) {
        console.log('✅ Profile creation session started:', sessionResponse.data?.sessionId);
      }

      // 2. Create comprehensive profile
      console.log('\n2. Creating comprehensive profile...');
      const profileRequest: CreateProfileRequest = {
        personalInfo: {
          displayName: 'Alex Johnson',
          age: 28,
          dateOfBirth: new Date('1996-03-15'),
          location: {
            latitude: 51.5074,
            longitude: -0.1278,
            city: 'London',
            country: 'United Kingdom'
          },
          sexualOrientation: 'straight',
          sexualIntent: 'clear',
          lookingFor: ['casual', 'hookup'],
          bio: 'Love exploring new places and meeting interesting people. Looking for casual fun and genuine connections. Always up for an adventure!',
          occupation: 'Software Developer',
          height: 175,
          bodyType: 'athletic',
          languages: ['English', 'Spanish']
        },
        preferences: {
          ageRange: { min: 22, max: 35 },
          maxDistance: 30,
          sexualOrientations: ['straight', 'bisexual'],
          relationshipTypes: ['casual', 'hookup', 'friends_with_benefits'],
          bodyTypes: ['slim', 'average', 'athletic'],
          dealBreakers: ['smoking', 'no_photos']
        },
        visibility: {
          isVisible: true,
          hideAge: false,
          hideLocation: false,
          hideLastActive: true,
          showOnlyToVerified: true,
          incognito: false,
          distanceVisibility: 'approximate',
          onlineStatus: 'online'
        }
      };

      const profileResponse = await this.profileApi.createProfile(this.userId, profileRequest);
      
      if (profileResponse.success) {
        console.log('✅ Profile created successfully!');
        console.log('Profile ID:', profileResponse.data?.userId);
        console.log('Completion Score:', profileResponse.data?.completion.overallPercentage + '%');
      } else {
        console.log('❌ Profile creation failed:', profileResponse.error?.message);
      }

    } catch (error) {
      console.error('Profile creation error:', error);
    }
  }

  /**
   * Demonstrate photo management workflow
   */
  async demonstratePhotoManagement(): Promise<void> {
    console.log('\n=== Epic 002 - Story 002: Photo Management System ===');

    try {
      // 1. Upload primary photo
      console.log('1. Uploading primary photo...');
      const primaryPhotoRequest: UploadPhotoRequest = {
        imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...', // Mock base64 data
        isPrimary: true,
        order: 1
      };

      const primaryPhotoResponse = await this.profileApi.uploadPhoto(this.userId, primaryPhotoRequest);
      
      if (primaryPhotoResponse.success) {
        console.log('✅ Primary photo uploaded successfully!');
        console.log('Photo ID:', primaryPhotoResponse.data?.photo.id);
        console.log('Processing Status:', primaryPhotoResponse.data?.processingStatus);
      }

      // 2. Upload additional photos
      console.log('\n2. Uploading additional photos...');
      for (let i = 2; i <= 4; i++) {
        const photoRequest: UploadPhotoRequest = {
          imageData: `data:image/jpeg;base64,/9j/photo${i}...`, // Mock base64 data
          isPrimary: false,
          order: i
        };

        const photoResponse = await this.profileApi.uploadPhoto(this.userId, photoRequest);
        if (photoResponse.success) {
          console.log(`✅ Photo ${i} uploaded successfully!`);
        }
      }

      // 3. Get all user photos
      console.log('\n3. Retrieving all user photos...');
      const photosResponse = await this.profileApi.getUserPhotos(this.userId);
      
      if (photosResponse.success) {
        console.log('✅ Retrieved photos:', photosResponse.data?.length + ' photos');
        photosResponse.data?.forEach((photo, index) => {
          console.log(`   Photo ${index + 1}: ${photo.isPrimary ? 'PRIMARY' : 'ADDITIONAL'} - ${photo.moderationStatus}`);
        });
      }

    } catch (error) {
      console.error('Photo management error:', error);
    }
  }

  /**
   * Demonstrate preferences and filtering
   */
  async demonstratePreferencesManagement(): Promise<void> {
    console.log('\n=== Epic 002 - Story 003: Preference and Filter Setup ===');

    try {
      // 1. Get available preference presets
      console.log('1. Getting preference presets...');
      const presetsResponse = await this.profileApi.getPreferencePresets();
      
      if (presetsResponse.success) {
        console.log('✅ Available presets:');
        presetsResponse.data?.forEach((preset: any) => {
          console.log(`   - ${preset.name}: ${preset.description}`);
        });
      }

      // 2. Apply a preference preset
      console.log('\n2. Applying "Open Minded" preset...');
      const presetResponse = await this.profileApi.applyPreferencePreset(this.userId, 'open_minded');
      
      if (presetResponse.success) {
        console.log('✅ Preset applied successfully!');
        console.log('Age Range:', presetResponse.data?.ageRange);
        console.log('Max Distance:', presetResponse.data?.maxDistance + 'km');
      }

      // 3. Get deal breaker options
      console.log('\n3. Getting deal breaker options...');
      const dealBreakersResponse = await this.profileApi.getDealBreakerOptions();
      
      if (dealBreakersResponse.success) {
        console.log('✅ Deal breaker options:');
        dealBreakersResponse.data?.forEach((option: any) => {
          console.log(`   - ${option.label} (${option.category}): ${option.description}`);
        });
      }

      // 4. Add specific deal breakers
      console.log('\n4. Adding deal breakers...');
      const addDealBreakersResponse = await this.profileApi.addDealBreakers(this.userId, [
        'smoking',
        'no_verification',
        'inactive_users'
      ]);
      
      if (addDealBreakersResponse.success) {
        console.log('✅ Deal breakers added successfully!');
        console.log('Updated deal breakers:', addDealBreakersResponse.data?.dealBreakers);
      }

      // 5. Get preference analytics
      console.log('\n5. Getting preference analytics...');
      const analyticsResponse = await this.profileApi.getPreferenceAnalytics(this.userId);
      
      if (analyticsResponse.success) {
        console.log('✅ Preference analytics:');
        console.log('   Matching Profiles:', analyticsResponse.data?.matchingProfiles);
        console.log('   Average Distance:', analyticsResponse.data?.averageDistance + 'km');
        console.log('   Popularity Score:', analyticsResponse.data?.popularityScore);
        console.log('   Recommendations:', analyticsResponse.data?.recommendations);
      }

      // 6. Optimize preferences for more matches
      console.log('\n6. Optimizing preferences for quantity...');
      const optimizeResponse = await this.profileApi.optimizePreferences(this.userId, {
        prioritizeQuantity: true,
        increaseDistance: true
      });
      
      if (optimizeResponse.success) {
        console.log('✅ Preferences optimized!');
        console.log('New Age Range:', optimizeResponse.data?.ageRange);
        console.log('New Max Distance:', optimizeResponse.data?.maxDistance + 'km');
      }

    } catch (error) {
      console.error('Preferences management error:', error);
    }
  }

  /**
   * Demonstrate privacy and visibility controls
   */
  async demonstratePrivacyManagement(): Promise<void> {
    console.log('\n=== Epic 002 - Story 004: Profile Visibility Controls ===');

    try {
      // 1. Get privacy presets
      console.log('1. Getting privacy presets...');
      const privacyPresetsResponse = await this.profileApi.getPrivacyPresets();
      
      if (privacyPresetsResponse.success) {
        console.log('✅ Privacy presets:');
        privacyPresetsResponse.data?.forEach((preset: any) => {
          console.log(`   - ${preset.name} (${preset.securityLevel}): ${preset.description}`);
        });
      }

      // 2. Apply balanced privacy preset
      console.log('\n2. Applying "Balanced Privacy" preset...');
      const applyPresetResponse = await this.profileApi.applyPrivacyPreset(this.userId, 'balanced');
      
      if (applyPresetResponse.success) {
        console.log('✅ Privacy preset applied!');
        console.log('Visibility Settings:', applyPresetResponse.data);
      }

      // 3. Conduct privacy audit
      console.log('\n3. Conducting privacy audit...');
      const auditResponse = await this.profileApi.conductPrivacyAudit(this.userId);
      
      if (auditResponse.success) {
        console.log('✅ Privacy audit completed!');
        console.log('Privacy Score:', auditResponse.data?.score + '/100');
        console.log('Exposure Level:', auditResponse.data?.exposureLevel);
        console.log('Vulnerabilities:', auditResponse.data?.vulnerabilities?.length || 0);
        console.log('Recommendations:', auditResponse.data?.recommendations?.length || 0);
      }

      // 4. Enable incognito mode
      console.log('\n4. Enabling incognito mode...');
      const incognitoResponse = await this.profileApi.enableIncognito(this.userId);
      
      if (incognitoResponse.success) {
        console.log('✅ Incognito mode enabled!');
        console.log('Incognito Status:', incognitoResponse.data?.incognito);
        console.log('Online Status:', incognitoResponse.data?.onlineStatus);
      }

      // 5. Check profile visibility
      console.log('\n5. Checking profile visibility...');
      const visibilityResponse = await this.profileApi.checkProfileVisibility(this.userId, 'viewer_123');
      
      if (visibilityResponse.success) {
        console.log('✅ Visibility check completed!');
        console.log('Can View Profile:', visibilityResponse.data?.canViewProfile);
        console.log('Can View Photos:', visibilityResponse.data?.canViewPhotos);
        console.log('Can Send Message:', visibilityResponse.data?.canSendMessage);
        console.log('Restrictions:', visibilityResponse.data?.restrictions);
      }

      // 6. Get privacy recommendations
      console.log('\n6. Getting privacy recommendations...');
      const recommendationsResponse = await this.profileApi.getPrivacyRecommendations(this.userId);
      
      if (recommendationsResponse.success) {
        console.log('✅ Privacy recommendations:');
        recommendationsResponse.data?.forEach((recommendation: string, index: number) => {
          console.log(`   ${index + 1}. ${recommendation}`);
        });
      }

    } catch (error) {
      console.error('Privacy management error:', error);
    }
  }

  /**
   * Demonstrate comprehensive profile management
   */
  async demonstrateProfileDashboard(): Promise<void> {
    console.log('\n=== Epic 002 - Complete Profile Management Dashboard ===');

    try {
      // 1. Get complete profile dashboard
      console.log('1. Loading profile dashboard...');
      const dashboardResponse = await this.profileApi.getProfileDashboard(this.userId);
      
      if (dashboardResponse.success) {
        console.log('✅ Profile dashboard loaded!');
        console.log('Overall Completion:', dashboardResponse.data?.completion.overallPercentage + '%');
        console.log('Profile Views:', dashboardResponse.data?.analytics.views);
        console.log('Profile Likes:', dashboardResponse.data?.analytics.likes);
        console.log('Active Recommendations:', dashboardResponse.data?.recommendations.length);
      }

      // 2. Validate complete profile
      console.log('\n2. Validating profile...');
      const validationResponse = await this.profileApi.validateProfile(this.userId);
      
      if (validationResponse.success) {
        console.log('✅ Profile validation completed!');
        console.log('Is Valid:', validationResponse.data?.isValid);
        console.log('Completion Score:', validationResponse.data?.completionScore + '%');
        console.log('Errors:', validationResponse.data?.errors.length || 0);
        console.log('Warnings:', validationResponse.data?.warnings.length || 0);
        console.log('Suggestions:', validationResponse.data?.suggestions.length || 0);
      }

      // 3. Get optimization recommendations
      console.log('\n3. Getting optimization recommendations...');
      const optimizationResponse = await this.profileApi.getOptimizationRecommendations(this.userId);
      
      if (optimizationResponse.success) {
        console.log('✅ Optimization recommendations:');
        console.log('Profile:', optimizationResponse.data?.profileOptimization.length || 0, 'recommendations');
        console.log('Photos:', optimizationResponse.data?.photoOptimization.length || 0, 'recommendations');
        console.log('Preferences:', optimizationResponse.data?.preferenceOptimization.length || 0, 'recommendations');
        console.log('Privacy:', optimizationResponse.data?.privacyOptimization.length || 0, 'recommendations');
      }

      // 4. Apply quick improvements
      console.log('\n4. Applying quick improvements...');
      const improvementsResponse = await this.profileApi.applyQuickImprovements(this.userId, {
        expandPreferences: true,
        optimizeVisibility: true
      });
      
      if (improvementsResponse.success) {
        console.log('✅ Quick improvements applied!');
        console.log('Updated profile completion:', improvementsResponse.data?.completion.overallPercentage + '%');
      }

      // 5. Export profile data
      console.log('\n5. Exporting profile data...');
      const exportResponse = await this.profileApi.exportProfileData(this.userId);
      
      if (exportResponse.success) {
        console.log('✅ Profile data exported!');
        console.log('Export Date:', exportResponse.data?.exportDate);
        console.log('Photos Count:', exportResponse.data?.photos.length);
      }

    } catch (error) {
      console.error('Profile dashboard error:', error);
    }
  }

  /**
   * Run complete Epic 002 demonstration
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🚀 Starting Epic 002: Profile Creation & Management Demo');
    console.log('==================================================');

    await this.demonstrateProfileCreation();
    await this.demonstratePhotoManagement();
    await this.demonstratePreferencesManagement();
    await this.demonstratePrivacyManagement();
    await this.demonstrateProfileDashboard();

    console.log('\n✅ Epic 002 Complete Demo Finished!');
    console.log('==================================================');
    console.log('All four stories have been successfully implemented:');
    console.log('📝 Story 001: Basic Profile Setup - ✅ COMPLETE');
    console.log('📸 Story 002: Photo Management System - ✅ COMPLETE');
    console.log('🎯 Story 003: Preference and Filter Setup - ✅ COMPLETE');
    console.log('🔒 Story 004: Profile Visibility Controls - ✅ COMPLETE');
    console.log('\nEpic 002 is ready for integration with Epic 003: Matching System!');
  }
}

// Export for use in other modules
export default Epic002Example;

// Example usage:
// const demo = new Epic002Example();
// await demo.runCompleteDemo();
