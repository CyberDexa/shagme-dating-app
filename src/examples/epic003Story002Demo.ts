/**
 * Epic 003 - Story 002: Preference-Based Filtering Demo
 * 
 * Comprehensive demonstration of advanced preference-based filtering
 * that builds on the location-based matching from Story 001
 */

import { UserProfile } from '../types/profile';
import { AdvancedMatchingCriteria, PreferenceMatchResult } from '../types/matching';
import { MatchingService, PreferenceFilteringService } from '../services/matching';

export class Epic003Story002Demo {
  private matchingService: MatchingService;
  private preferenceFilteringService: PreferenceFilteringService;

  constructor() {
    this.matchingService = MatchingService.getInstance();
    this.preferenceFilteringService = new PreferenceFilteringService();
  }

  /**
   * Run the complete Epic 003 Story 002 demonstration
   */
  async runCompleteDemo(): Promise<void> {
    console.log('\n🎯 ===== EPIC 003 - STORY 002: PREFERENCE-BASED FILTERING DEMO =====\n');

    try {
      // Demo 1: Basic preference filtering
      await this.demonstrateBasicPreferenceFiltering();

      // Demo 2: Advanced preference weighting
      await this.demonstrateAdvancedPreferenceWeighting();

      // Demo 3: Deal breaker filtering
      await this.demonstrateDealBreakerFiltering();

      // Demo 4: Preference optimization
      await this.demonstratePreferenceOptimization();

      // Demo 5: Match explanations
      await this.demonstrateMatchExplanations();

      // Demo 6: Preference analytics
      await this.demonstratePreferenceAnalytics();

      console.log('\n✅ Epic 003 Story 002 Demo Completed Successfully!');
      console.log('🚀 Advanced preference-based filtering is fully functional');

    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Demo 1: Basic preference filtering with category scoring
   */
  private async demonstrateBasicPreferenceFiltering(): Promise<void> {
    console.log('📋 DEMO 1: Basic Preference Filtering\n');

    // Create a sample user profile
    const userProfile = this.createSampleUserProfile('user-001', {
      age: 28,
      bodyType: 'athletic',
      smoking: 'never',
      drinking: 'socially',
      education: 'bachelors',
      interests: ['fitness', 'travel', 'cooking']
    });

    // Create diverse candidate profiles
    const candidates = [
      this.createSampleUserProfile('candidate-001', {
        age: 26,
        bodyType: 'athletic',
        smoking: 'never',
        drinking: 'socially',
        education: 'bachelors',
        interests: ['fitness', 'travel', 'reading']
      }),
      this.createSampleUserProfile('candidate-002', {
        age: 32,
        bodyType: 'average',
        smoking: 'occasionally',
        drinking: 'frequently',
        education: 'masters',
        interests: ['music', 'art', 'dining']
      }),
      this.createSampleUserProfile('candidate-003', {
        age: 24,
        bodyType: 'slim',
        smoking: 'never',
        drinking: 'rarely',
        education: 'high_school',
        interests: ['fitness', 'cooking', 'hiking']
      })
    ];

    // Set up advanced matching criteria
    const criteria: AdvancedMatchingCriteria = {
      userId: 'user-001',
      location: {
        latitude: 51.5074,
        longitude: -0.1278,
        radius: 25
      },
      preferences: {
        ageRange: { min: 24, max: 32 },
        sexualOrientations: ['straight'],
        relationshipTypes: ['casual', 'serious'],
        maxDistance: 25
      },
      filters: {
        isVerified: true,
        hasPhotos: true
      },
      sort: {
        by: 'compatibility',
        direction: 'desc'
      },
      preferenceWeights: {
        physical: 0.3,
        lifestyle: 0.25,
        social: 0.25,
        relationship: 0.2
      },
      minimumThresholds: {
        overall: 0.6,
        physical: 0.4,
        lifestyle: 0.3,
        social: 0.3,
        relationship: 0.4
      },
      dealBreakers: [],
      mustHaves: ['fitness_oriented'],
      niceToHaves: ['travel_lover', 'good_education'],
      enableAdvancedFiltering: true
    };

    console.log('User Profile:', userProfile.personalInfo.age, 'years old,', userProfile.personalInfo.bodyType);
    console.log('Preference weights:', criteria.preferenceWeights);
    console.log('Minimum thresholds:', criteria.minimumThresholds);

    // Demonstrate category scoring
    console.log('\n📊 Category Scoring Analysis:');
    for (const candidate of candidates) {
      const categoryScores = this.preferenceFilteringService.calculateCategoryScores(userProfile, candidate);
      console.log(`\nCandidate ${candidate.userId}:`);
      console.log(`  Physical: ${Math.round(categoryScores.physical.score * 100)}%`);
      console.log(`  Lifestyle: ${Math.round(categoryScores.lifestyle.score * 100)}%`);
      console.log(`  Social: ${Math.round(categoryScores.social.score * 100)}%`);
      console.log(`  Relationship: ${Math.round(categoryScores.relationship.score * 100)}%`);
      
      const overallScore = this.preferenceFilteringService.calculateWeightedCompatibility(
        categoryScores, 
        criteria.preferenceWeights
      );
      console.log(`  Overall: ${Math.round(overallScore * 100)}%`);
    }
  }

  /**
   * Demo 2: Advanced preference weighting scenarios
   */
  private async demonstrateAdvancedPreferenceWeighting(): Promise<void> {
    console.log('\n\n🎛️ DEMO 2: Advanced Preference Weighting\n');

    const userProfile = this.createSampleUserProfile('user-002', {
      age: 30,
      bodyType: 'average',
      smoking: 'never',
      drinking: 'socially',
      education: 'masters',
      interests: ['career', 'fitness', 'travel']
    });

    const candidate = this.createSampleUserProfile('candidate-004', {
      age: 29,
      bodyType: 'slim',
      smoking: 'never',
      drinking: 'socially',
      education: 'bachelors',
      interests: ['fitness', 'travel', 'cooking']
    });

    // Test different weighting scenarios
    const scenarios = [
      {
        name: 'Physical Focused',
        weights: { physical: 0.6, lifestyle: 0.2, social: 0.1, relationship: 0.1 }
      },
      {
        name: 'Lifestyle Focused',
        weights: { physical: 0.1, lifestyle: 0.6, social: 0.2, relationship: 0.1 }
      },
      {
        name: 'Social Focused',
        weights: { physical: 0.1, lifestyle: 0.2, social: 0.6, relationship: 0.1 }
      },
      {
        name: 'Relationship Focused',
        weights: { physical: 0.1, lifestyle: 0.1, social: 0.2, relationship: 0.6 }
      },
      {
        name: 'Balanced',
        weights: { physical: 0.25, lifestyle: 0.25, social: 0.25, relationship: 0.25 }
      }
    ];

    const categoryScores = this.preferenceFilteringService.calculateCategoryScores(userProfile, candidate);
    
    console.log('Base Category Scores:');
    console.log(`  Physical: ${Math.round(categoryScores.physical.score * 100)}%`);
    console.log(`  Lifestyle: ${Math.round(categoryScores.lifestyle.score * 100)}%`);
    console.log(`  Social: ${Math.round(categoryScores.social.score * 100)}%`);
    console.log(`  Relationship: ${Math.round(categoryScores.relationship.score * 100)}%`);

    console.log('\n📈 Weighting Impact Analysis:');
    for (const scenario of scenarios) {
      const weightedScore = this.preferenceFilteringService.calculateWeightedCompatibility(
        categoryScores,
        scenario.weights
      );
      console.log(`${scenario.name}: ${Math.round(weightedScore * 100)}%`);
    }
  }

  /**
   * Demo 3: Deal breaker filtering
   */
  private async demonstrateDealBreakerFiltering(): Promise<void> {
    console.log('\n\n🚫 DEMO 3: Deal Breaker Filtering\n');

    const userProfile = this.createSampleUserProfile('user-003', {
      age: 27,
      bodyType: 'athletic',
      smoking: 'never',
      drinking: 'rarely',
      education: 'bachelors',
      interests: ['fitness', 'health', 'outdoors']
    });

    // Create candidates that trigger different deal breakers
    const candidates = [
      this.createSampleUserProfile('candidate-005', {
        age: 25,
        bodyType: 'athletic',
        smoking: 'never', // Passes smoking deal breaker
        drinking: 'rarely',
        education: 'bachelors',
        interests: ['fitness', 'health'],
        verified: true,
        photoCount: 5
      }),
      this.createSampleUserProfile('candidate-006', {
        age: 28,
        bodyType: 'average',
        smoking: 'regularly', // Triggers smoking deal breaker
        drinking: 'socially',
        education: 'masters',
        interests: ['travel', 'dining'],
        verified: true,
        photoCount: 3
      }),
      this.createSampleUserProfile('candidate-007', {
        age: 30,
        bodyType: 'slim',
        smoking: 'never',
        drinking: 'socially',
        education: 'masters',
        interests: ['fitness', 'career'],
        verified: false, // Triggers verification deal breaker
        photoCount: 2
      }),
      this.createSampleUserProfile('candidate-008', {
        age: 26,
        bodyType: 'athletic',
        smoking: 'never',
        drinking: 'rarely',
        education: 'bachelors',
        interests: ['fitness', 'outdoors'],
        verified: true,
        photoCount: 0 // Triggers no photos deal breaker
      })
    ];

    // Test different deal breaker combinations
    const dealBreakerScenarios = [
      {
        name: 'No Deal Breakers',
        dealBreakers: []
      },
      {
        name: 'Anti-Smoking Only',
        dealBreakers: ['smoking']
      },
      {
        name: 'Verification Required',
        dealBreakers: ['no_verification']
      },
      {
        name: 'Photos Required',
        dealBreakers: ['no_photos']
      },
      {
        name: 'Strict Standards',
        dealBreakers: ['smoking', 'no_verification', 'no_photos']
      }
    ];

    console.log('Testing candidates with different deal breaker scenarios:\n');

    for (const scenario of dealBreakerScenarios) {
      console.log(`🔍 ${scenario.name}:`);
      
      const filteredCandidates = this.preferenceFilteringService.applyDealBreakerFilters(
        userProfile,
        candidates,
        scenario.dealBreakers
      );

      console.log(`  Candidates before filtering: ${candidates.length}`);
      console.log(`  Candidates after filtering: ${filteredCandidates.length}`);
      
      if (filteredCandidates.length < candidates.length) {
        const eliminated = candidates.filter(c => !filteredCandidates.find(fc => fc.userId === c.userId));
        console.log(`  Eliminated: ${eliminated.map(c => c.userId).join(', ')}`);
      }
      console.log('');
    }
  }

  /**
   * Demo 4: Preference optimization
   */
  private async demonstratePreferenceOptimization(): Promise<void> {
    console.log('\n⚡ DEMO 4: Preference Optimization\n');

    const userProfile = this.createSampleUserProfile('user-004', {
      age: 29,
      bodyType: 'average',
      smoking: 'never',
      drinking: 'socially',
      education: 'masters',
      interests: ['career', 'travel', 'fitness']
    });

    // Create current match results for analysis
    const currentMatches: PreferenceMatchResult[] = [
      this.createMockPreferenceMatch('match-001', 0.85, { physical: 0.9, lifestyle: 0.8, social: 0.9, relationship: 0.8 }),
      this.createMockPreferenceMatch('match-002', 0.65, { physical: 0.7, lifestyle: 0.6, social: 0.7, relationship: 0.6 }),
      this.createMockPreferenceMatch('match-003', 0.72, { physical: 0.8, lifestyle: 0.7, social: 0.6, relationship: 0.8 })
    ];

    console.log('Current Match Performance:');
    console.log(`  Total matches: ${currentMatches.length}`);
    console.log(`  Average compatibility: ${Math.round(currentMatches.reduce((sum, m) => sum + m.compatibilityScore, 0) / currentMatches.length * 100)}%`);
    console.log(`  High quality matches (>80%): ${currentMatches.filter(m => m.compatibilityScore > 0.8).length}`);

    // Test different optimization goals
    const optimizationGoals = [
      {
        name: 'Increase Quantity',
        goals: { prioritizeQuantity: true, increaseDistance: true, expandAge: true }
      },
      {
        name: 'Improve Quality',
        goals: { prioritizeQuality: true, focusOnActivity: true }
      },
      {
        name: 'Better Conversations',
        goals: { improveConversions: true, prioritizeQuality: true }
      }
    ];

    console.log('\n📊 Optimization Recommendations:');
    for (const scenario of optimizationGoals) {
      console.log(`\n${scenario.name}:`);
      
      const suggestions = await this.preferenceFilteringService.optimizePreferenceSettings(
        userProfile,
        scenario.goals,
        currentMatches
      );

      console.log(`  Current restrictiveness: ${suggestions.currentSettings.restrictiveness}`);
      console.log(`  Expected matches: ${suggestions.currentSettings.expectedMatches}`);
      
      console.log('  Suggestions:');
      suggestions.suggestions.forEach((suggestion, index) => {
        console.log(`    ${index + 1}. ${suggestion.description} (${suggestion.impact} impact, +${suggestion.expectedIncrease}%)`);
        if (suggestion.tradeoff) {
          console.log(`       Trade-off: ${suggestion.tradeoff}`);
        }
      });
    }
  }

  /**
   * Demo 5: Match explanations
   */
  private async demonstrateMatchExplanations(): Promise<void> {
    console.log('\n\n💬 DEMO 5: Match Explanations\n');

    const userProfile = this.createSampleUserProfile('user-005', {
      age: 26,
      bodyType: 'slim',
      smoking: 'never',
      drinking: 'socially',
      education: 'bachelors',
      interests: ['art', 'music', 'travel']
    });

    const candidates = [
      {
        profile: this.createSampleUserProfile('candidate-009', {
          age: 27,
          bodyType: 'slim',
          smoking: 'never',
          drinking: 'socially',
          education: 'bachelors',
          interests: ['art', 'music', 'photography']
        }),
        scenario: 'Excellent Match'
      },
      {
        profile: this.createSampleUserProfile('candidate-010', {
          age: 24,
          bodyType: 'athletic',
          smoking: 'never',
          drinking: 'rarely',
          education: 'masters',
          interests: ['fitness', 'business', 'travel']
        }),
        scenario: 'Good Match with Differences'
      },
      {
        profile: this.createSampleUserProfile('candidate-011', {
          age: 35,
          bodyType: 'average',
          smoking: 'occasionally',
          drinking: 'frequently',
          education: 'high_school',
          interests: ['sports', 'gaming', 'cars']
        }),
        scenario: 'Poor Match'
      }
    ];

    console.log('Generating match explanations:\n');

    for (const { profile: candidate, scenario } of candidates) {
      console.log(`🎯 ${scenario} - ${candidate.userId}:`);
      
      const preferenceAlignment = this.preferenceFilteringService.analyzePreferenceMatch(
        userProfile,
        candidate,
        this.getDefaultCriteria(userProfile.userId)
      );

      const explanation = this.preferenceFilteringService.generateMatchExplanation(
        userProfile,
        candidate,
        preferenceAlignment
      );

      console.log(`  Overall Assessment: ${explanation.overallAssessment}`);
      console.log(`  Recommendation Strength: ${Math.round(explanation.recommendationStrength * 100)}%`);
      
      if (explanation.primaryReasons.length > 0) {
        console.log(`  Primary Reasons: ${explanation.primaryReasons.join(', ')}`);
      }
      
      if (explanation.secondaryReasons.length > 0) {
        console.log(`  Secondary Reasons: ${explanation.secondaryReasons.join(', ')}`);
      }
      
      if (explanation.compatibilityHighlights.length > 0) {
        console.log(`  Highlights: ${explanation.compatibilityHighlights.join(', ')}`);
      }
      
      if (explanation.potentialConcerns.length > 0) {
        console.log(`  Concerns: ${explanation.potentialConcerns.join(', ')}`);
      }
      
      console.log('');
    }
  }

  /**
   * Demo 6: Preference analytics
   */
  private async demonstratePreferenceAnalytics(): Promise<void> {
    console.log('\n📈 DEMO 6: Preference Analytics\n');

    // Mock analytics data
    const analytics = {
      userId: 'user-006',
      period: 'weekly' as const,
      preferenceMetrics: {
        totalCandidatesEvaluated: 150,
        dealBreakerEliminations: 45,
        thresholdEliminations: 32,
        highCompatibilityMatches: 18,
        averageCompatibilityScore: 0.68,
        categoryAverages: {
          physical: 0.72,
          lifestyle: 0.65,
          social: 0.71,
          relationship: 0.64
        }
      },
      optimizationInsights: {
        restrictivePreferences: ['age_range_too_narrow', 'body_type_too_specific'],
        underutilizedPreferences: ['education_level', 'interests'],
        improvementSuggestions: [
          'Expand age range by 3 years for 40% more matches',
          'Add education preference weight for better compatibility'
        ],
        expandRecommendations: [
          'Increase search radius to 35km',
          'Consider profiles with 1-2 fewer photos'
        ]
      },
      matchSuccessMetrics: {
        preferenceMatchesToLikes: 0.34,
        preferenceMatchesToConversations: 0.18,
        topMatchingFactors: ['shared_interests', 'lifestyle_compatibility', 'physical_attraction'],
        leastImportantFactors: ['education_level', 'occupation']
      }
    };

    console.log('📊 Weekly Preference Analytics Report:\n');
    
    console.log('Filtering Performance:');
    console.log(`  Candidates evaluated: ${analytics.preferenceMetrics.totalCandidatesEvaluated}`);
    console.log(`  Eliminated by deal breakers: ${analytics.preferenceMetrics.dealBreakerEliminations} (${Math.round(analytics.preferenceMetrics.dealBreakerEliminations / analytics.preferenceMetrics.totalCandidatesEvaluated * 100)}%)`);
    console.log(`  Eliminated by thresholds: ${analytics.preferenceMetrics.thresholdEliminations} (${Math.round(analytics.preferenceMetrics.thresholdEliminations / analytics.preferenceMetrics.totalCandidatesEvaluated * 100)}%)`);
    console.log(`  High compatibility matches: ${analytics.preferenceMetrics.highCompatibilityMatches} (${Math.round(analytics.preferenceMetrics.highCompatibilityMatches / analytics.preferenceMetrics.totalCandidatesEvaluated * 100)}%)`);

    console.log('\nCategory Performance:');
    Object.entries(analytics.preferenceMetrics.categoryAverages).forEach(([category, score]) => {
      console.log(`  ${category}: ${Math.round(score * 100)}%`);
    });

    console.log('\nOptimization Insights:');
    console.log('  Restrictive preferences:', analytics.optimizationInsights.restrictivePreferences.join(', '));
    console.log('  Underutilized preferences:', analytics.optimizationInsights.underutilizedPreferences.join(', '));
    
    console.log('\n  Improvement suggestions:');
    analytics.optimizationInsights.improvementSuggestions.forEach((suggestion, index) => {
      console.log(`    ${index + 1}. ${suggestion}`);
    });

    console.log('\nSuccess Metrics:');
    console.log(`  Match-to-like rate: ${Math.round(analytics.matchSuccessMetrics.preferenceMatchesToLikes * 100)}%`);
    console.log(`  Match-to-conversation rate: ${Math.round(analytics.matchSuccessMetrics.preferenceMatchesToConversations * 100)}%`);
    console.log(`  Top matching factors: ${analytics.matchSuccessMetrics.topMatchingFactors.join(', ')}`);
  }

  // Helper methods for creating mock data

  private createSampleUserProfile(userId: string, traits: {
    age: number;
    bodyType: string;
    smoking: string;
    drinking: string;
    education: string;
    interests: string[];
    verified?: boolean;
    photoCount?: number;
  }): UserProfile {
    return {
      userId,
      personalInfo: {
        displayName: `User ${userId.split('-')[1]}`,
        age: traits.age,
        dateOfBirth: new Date(new Date().getFullYear() - traits.age, 0, 1),
        location: {
          latitude: 51.5074 + (Math.random() - 0.5) * 0.1,
          longitude: -0.1278 + (Math.random() - 0.5) * 0.1,
          city: 'London',
          country: 'UK'
        },
        bio: `Sample bio for ${userId}`,
        occupation: 'Professional',
        height: 170 + Math.random() * 20,
        bodyType: traits.bodyType as any,
        sexualOrientation: 'straight',
        sexualIntent: 'clear',
        lookingFor: ['casual', 'serious'],
        languages: ['English'],
        interests: traits.interests,
        lifestyle: {
          smoking: traits.smoking as any,
          drinking: traits.drinking as any,
          exercise: 'daily',
          diet: 'omnivore'
        }
      },
      photos: Array(traits.photoCount || 3).fill(null).map((_, i) => ({
        id: `photo-${userId}-${i}`,
        url: `https://example.com/photo-${userId}-${i}.jpg`,
        thumbnailUrl: `https://example.com/thumb-${userId}-${i}.jpg`,
        isPrimary: i === 0,
        isVerified: true,
        uploadedAt: new Date(),
        moderationStatus: 'approved' as const,
        order: i,
        metadata: undefined
      })),
      preferences: {
        ageRange: { min: traits.age - 5, max: traits.age + 5 },
        maxDistance: 25,
        sexualOrientations: ['straight'],
        relationshipTypes: ['casual', 'serious'],
        bodyTypes: ['slim', 'average', 'athletic'],
        dealBreakers: ['smoking']
      },
      visibility: {
        isVisible: true,
        hideAge: false,
        hideLocation: false,
        hideLastActive: false,
        showOnlyToVerified: false,
        incognito: false,
        distanceVisibility: 'approximate' as const,
        onlineStatus: 'online' as const
      },
      completion: {
        overallPercentage: 85,
        personalInfo: 100,
        photos: 80,
        preferences: 90,
        visibility: traits.verified !== false ? 100 : 0,
        missingFields: [],
        recommendedActions: []
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      profileViews: Math.floor(Math.random() * 100),
      profileLikes: Math.floor(Math.random() * 50),
      verification: {
        isVerified: traits.verified !== false,
        verificationResults: [
          {
            id: 'gov_' + Math.random().toString(36).substr(2, 9),
            status: 'verified' as const,
            provider: 'government_id',
            confidence: 0.95,
            processingTime: 5000,
            createdAt: new Date(),
            completedAt: new Date(),
            metadata: {}
          }
        ],
        verificationScore: traits.verified !== false ? 95 : 0,
        lastVerificationUpdate: new Date()
      },
      premium: {
        isActive: false,
        tier: undefined,
        expiresAt: undefined,
        features: []
      },
      safety: {
        isReported: false,
        reportCount: 0,
        isBanned: false,
        trustScore: 0.9
      }
    };
  }

  private createMockPreferenceMatch(
    matchId: string, 
    compatibilityScore: number, 
    categoryScores: { physical: number; lifestyle: number; social: number; relationship: number }
  ): PreferenceMatchResult {
    return {
      matchId,
      userId: 'demo-user',
      targetUserId: `target-${matchId}`,
      score: compatibilityScore,
      distance: 5 + Math.random() * 20,
      distanceUnit: 'km',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'pending',
      isNewMatch: true,
      matchFactors: {
        locationScore: 0.9,
        ageCompatibility: 0.8,
        preferenceAlignment: compatibilityScore,
        activityScore: 0.7,
        verificationBonus: 0.1
      },
      compatibilityScore,
      categoryScores,
      preferenceAlignment: {
        matches: ['fitness', 'travel', 'education'],
        mismatches: ['smoking_preference'],
        dealBreakersPassed: true,
        mustHavesSatisfied: 2,
        niceToHavesMatched: 3
      },
      matchExplanation: `${Math.round(compatibilityScore * 100)}% compatibility based on strong preference alignment`,
      improvementSuggestions: []
    };
  }

  private getDefaultCriteria(userId: string): AdvancedMatchingCriteria {
    return {
      userId,
      location: { latitude: 51.5074, longitude: -0.1278, radius: 25 },
      preferences: {
        ageRange: { min: 22, max: 35 },
        sexualOrientations: ['straight'],
        relationshipTypes: ['casual', 'serious'],
        maxDistance: 25
      },
      filters: { isVerified: true, hasPhotos: true },
      sort: { by: 'compatibility', direction: 'desc' },
      preferenceWeights: { physical: 0.3, lifestyle: 0.25, social: 0.25, relationship: 0.2 },
      minimumThresholds: { overall: 0.6, physical: 0.4, lifestyle: 0.3, social: 0.3, relationship: 0.4 },
      dealBreakers: [],
      mustHaves: [],
      niceToHaves: [],
      enableAdvancedFiltering: true
    };
  }
}

// Auto-run demo if this file is executed directly
if (require.main === module) {
  const demo = new Epic003Story002Demo();
  demo.runCompleteDemo().catch(console.error);
}

export default Epic003Story002Demo;
