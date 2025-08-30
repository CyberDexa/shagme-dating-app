/**
 * Matching Service
 * Epic 003: Matching System
 * Story 001: Location-Based Matching (Complete)
 * Story 002: Preference-Based Filtering (Enhanced)
 * 
 * Core matching logic that combines location services with sophisticated
 * preference filtering for high-quality match suggestions
 */

import {
  MatchingCriteria,
  AdvancedMatchingCriteria,
  MatchResult,
  PreferenceMatchResult,
  MatchQueue,
  MutualMatch,
  GeoLocation,
  MatchingLimits,
  MatchAnalytics,
  MatchingValidationError,
  LocationPermissionError,
  MatchExplanation,
  PreferenceMatchAnalytics,
  PreferenceOptimizationSuggestions,
  OptimizationGoals
} from '../../types/matching';

import { UserProfile } from '../../types/profile';
import { LocationService, DistanceCalculation } from './locationService';
import { PreferenceFilteringService } from './preferenceFilteringService';

export interface MatchingConfig {
  defaultRadius: number; // in kilometers
  maxRadius: number; // maximum search radius
  maxResults: number; // maximum matches per search
  cooldownPeriod: number; // minutes between searches
  enableLocationFiltering: boolean;
  enableAgeFiltering: boolean;
  enableDistanceWeighting: boolean;
}

export interface UserLocationData {
  userId: string;
  location: GeoLocation;
  lastSeen: Date;
  accuracy: number;
  isOnline: boolean;
}

export interface MatchingAlgorithmWeights {
  distance: number; // 0-1
  age: number; // 0-1
  commonInterests: number; // 0-1
  activityLevel: number; // 0-1
  profileCompleteness: number; // 0-1
}

export class MatchingService {
  private static instance: MatchingService;
  private locationService: LocationService;
  private preferenceFilteringService: PreferenceFilteringService;
  private matchQueue: Map<string, MatchQueue> = new Map();
  private mutualMatches: Map<string, MutualMatch[]> = new Map();
  private userCooldowns: Map<string, Date> = new Map();

  // Default configuration
  private config: MatchingConfig = {
    defaultRadius: 25, // 25km
    maxRadius: 100, // 100km
    maxResults: 50,
    cooldownPeriod: 5, // 5 minutes
    enableLocationFiltering: true,
    enableAgeFiltering: true,
    enableDistanceWeighting: true
  };

  // Algorithm weights for scoring
  private weights: MatchingAlgorithmWeights = {
    distance: 0.3,
    age: 0.2,
    commonInterests: 0.25,
    activityLevel: 0.15,
    profileCompleteness: 0.1
  };

  private constructor() {
    this.locationService = LocationService.getInstance();
    this.preferenceFilteringService = new PreferenceFilteringService();
  }

  public static getInstance(): MatchingService {
    if (!MatchingService.instance) {
      MatchingService.instance = new MatchingService();
    }
    return MatchingService.instance;
  }

  /**
   * Find potential matches for a user based on location and preferences
   */
  async findMatches(
    userId: string,
    userProfile: UserProfile,
    criteria: MatchingCriteria,
    availableUsers: UserProfile[],
    userLocations: UserLocationData[]
  ): Promise<MatchResult[]> {
    try {
      // Check if user is on cooldown
      if (this.isUserOnCooldown(userId)) {
        const cooldownEnd = this.userCooldowns.get(userId);
        throw new Error(`User is on cooldown until ${cooldownEnd?.toISOString()}`);
      }

      // Validate criteria
      this.validateMatchingCriteria(criteria);

      // Get user's current location
      const userLocation = await this.getUserLocation(userId, userLocations);
      if (!userLocation) {
        throw new Error('User location not available');
      }

      // Filter candidates by basic criteria
      const candidates = this.filterCandidates(
        userId,
        userProfile,
        criteria,
        availableUsers,
        userLocations
      );

      console.log(`Found ${candidates.length} potential candidates`);

      // Calculate match scores and distances
      const scoredMatches = await this.scoreMatches(
        userProfile,
        userLocation,
        candidates,
        criteria
      );

      // Sort by score (descending)
      const sortedMatches = scoredMatches.sort((a, b) => b.score - a.score);

      // Limit results
      const limitedMatches = sortedMatches.slice(0, this.config.maxResults);

      // Set cooldown
      this.setCooldown(userId);

      // Add to match queue
      this.addToMatchQueue(userId, limitedMatches);

      console.log(`Returning ${limitedMatches.length} matches for user ${userId}`);
      return limitedMatches;

    } catch (error) {
      console.error('Error finding matches:', error);
      throw error;
    }
  }

  /**
   * Get a user's current location
   */
  private async getUserLocation(
    userId: string,
    userLocations: UserLocationData[]
  ): Promise<GeoLocation | null> {
    // Find user's location data
    const userData = userLocations.find(ul => ul.userId === userId);
    if (!userData) {
      return null;
    }

    // Check if location is recent (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (userData.lastSeen < oneHourAgo) {
      console.warn(`User ${userId} location is stale (last seen: ${userData.lastSeen})`);
    }

    return userData.location;
  }

  /**
   * Filter candidates based on basic criteria
   */
  private filterCandidates(
    userId: string,
    userProfile: UserProfile,
    criteria: MatchingCriteria,
    availableUsers: UserProfile[],
    userLocations: UserLocationData[]
  ): Array<{ profile: UserProfile; locationData: UserLocationData }> {
    return availableUsers
      .filter(candidate => {
        // Exclude self
        if (candidate.userId === userId) return false;

        // Check profile visibility
        if (!candidate.visibility.isVisible) return false;

        // Find location data
        const locationData = userLocations.find(ul => ul.userId === candidate.userId);
        if (!locationData) return false;

        // Age filter
        if (this.config.enableAgeFiltering && criteria.preferences.ageRange) {
          const age = candidate.personalInfo.age;
          if (age < criteria.preferences.ageRange.min || age > criteria.preferences.ageRange.max) {
            return false;
          }
        }

        // Sexual orientation filter
        if (criteria.preferences.sexualOrientations && criteria.preferences.sexualOrientations.length > 0) {
          if (!criteria.preferences.sexualOrientations.includes(candidate.personalInfo.sexualOrientation)) {
            return false;
          }
        }

        // Online status filter (if available)
        if (criteria.filters?.lastActiveWithin) {
          const hoursAgo = new Date(Date.now() - criteria.filters.lastActiveWithin * 60 * 60 * 1000);
          if (candidate.lastActiveAt < hoursAgo) return false;
        }

        return true;
      })
      .map(profile => ({
        profile,
        locationData: userLocations.find(ul => ul.userId === profile.userId)!
      }));
  }

  /**
   * Score and rank potential matches
   */
  private async scoreMatches(
    userProfile: UserProfile,
    userLocation: GeoLocation,
    candidates: Array<{ profile: UserProfile; locationData: UserLocationData }>,
    criteria: MatchingCriteria
  ): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];

    for (const candidate of candidates) {
      try {
        // Calculate distance
        const distanceData = this.locationService.calculateDistance(
          userLocation,
          candidate.locationData.location
        );

        // Skip if outside radius
        if (this.config.enableLocationFiltering && 
            distanceData.distance > criteria.preferences.maxDistance) {
          continue;
        }

        // Calculate compatibility score
        const score = this.calculateCompatibilityScore(
          userProfile,
          candidate.profile,
          distanceData
        );

        // Create match result
        const matchResult: MatchResult = {
          matchId: `match_${userProfile.userId}_${candidate.profile.userId}_${Date.now()}`,
          userId: userProfile.userId,
          targetUserId: candidate.profile.userId,
          score,
          distance: distanceData.distance,
          distanceUnit: 'km',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'pending',
          isNewMatch: true,
          matchFactors: {
            locationScore: this.calculateDistanceScore(distanceData.distance, criteria.preferences.maxDistance),
            ageCompatibility: this.calculateAgeCompatibility(userProfile, candidate.profile),
            preferenceAlignment: this.calculatePreferenceAlignment(userProfile, candidate.profile),
            activityScore: this.calculateActivityScore(candidate.profile),
            verificationBonus: candidate.profile.verification.isVerified ? 0.1 : 0,
            premiumBonus: candidate.profile.premium.isActive ? 0.05 : 0
          }
        };

        matches.push(matchResult);

      } catch (error) {
        console.error(`Error scoring candidate ${candidate.profile.userId}:`, error);
        // Continue with other candidates
      }
    }

    return matches;
  }

  /**
   * Calculate overall compatibility score
   */
  private calculateCompatibilityScore(
    userProfile: UserProfile,
    candidateProfile: UserProfile,
    distanceData: DistanceCalculation
  ): number {
    let totalScore = 0;

    // Distance score (closer is better)
    const distanceScore = this.calculateDistanceScore(distanceData.distance, 50); // max 50km
    totalScore += distanceScore * this.weights.distance;

    // Age compatibility
    const ageScore = this.calculateAgeCompatibility(userProfile, candidateProfile);
    totalScore += ageScore * this.weights.age;

    // Preference alignment
    const preferenceScore = this.calculatePreferenceAlignment(userProfile, candidateProfile);
    totalScore += preferenceScore * this.weights.commonInterests;

    // Activity level
    const activityScore = this.calculateActivityScore(candidateProfile);
    totalScore += activityScore * this.weights.activityLevel;

    // Profile completeness
    const completenessScore = candidateProfile.completion.overallPercentage / 100;
    totalScore += completenessScore * this.weights.profileCompleteness;

    // Normalize to 0-1 range
    return Math.round(totalScore * 100) / 100;
  }

  /**
   * Calculate distance score (0-1, where 1 is best)
   */
  private calculateDistanceScore(distance: number, maxDistance: number): number {
    if (distance >= maxDistance) return 0;
    return 1 - (distance / maxDistance);
  }

  /**
   * Calculate age compatibility score
   */
  private calculateAgeCompatibility(userProfile: UserProfile, candidateProfile: UserProfile): number {
    const userAge = userProfile.personalInfo.age;
    const candidateAge = candidateProfile.personalInfo.age;
    
    const ageDiff = Math.abs(userAge - candidateAge);
    
    // Prefer smaller age differences
    if (ageDiff <= 2) return 1.0;
    if (ageDiff <= 5) return 0.8;
    if (ageDiff <= 10) return 0.6;
    if (ageDiff <= 15) return 0.4;
    return 0.2;
  }

  /**
   * Calculate preference alignment score
   */
  private calculatePreferenceAlignment(userProfile: UserProfile, candidateProfile: UserProfile): number {
    let score = 0.5; // base score
    
    // Check relationship type alignment
    const userLookingFor = userProfile.personalInfo.lookingFor;
    const candidateLookingFor = candidateProfile.personalInfo.lookingFor;
    
    const hasCommonRelationshipType = userLookingFor.some(type => 
      candidateLookingFor.includes(type)
    );
    
    if (hasCommonRelationshipType) {
      score += 0.3;
    }

    // Check sexual orientation compatibility
    if (userProfile.personalInfo.sexualOrientation === candidateProfile.personalInfo.sexualOrientation) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate activity score based on profile data
   */
  private calculateActivityScore(candidateProfile: UserProfile): number {
    let score = 0.5; // base score

    // Has recent photos
    if (candidateProfile.photos.length > 0) {
      score += 0.2;
    }

    // Profile completeness indicates activity
    if (candidateProfile.personalInfo.bio && candidateProfile.personalInfo.bio.length > 50) {
      score += 0.2;
    }

    // Recent activity
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (candidateProfile.lastActiveAt > threeDaysAgo) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Validate matching criteria
   */
  private validateMatchingCriteria(criteria: MatchingCriteria): void {
    if (criteria.preferences.maxDistance > this.config.maxRadius) {
      throw new Error(`Maximum distance cannot exceed ${this.config.maxRadius}km`);
    }

    if (criteria.preferences.ageRange && 
        (criteria.preferences.ageRange.min < 18 || criteria.preferences.ageRange.max > 99)) {
      throw new Error('Invalid age range');
    }
  }

  /**
   * Check if user is on cooldown
   */
  private isUserOnCooldown(userId: string): boolean {
    const cooldownEnd = this.userCooldowns.get(userId);
    if (!cooldownEnd) return false;
    
    return new Date() < cooldownEnd;
  }

  /**
   * Set cooldown for user
   */
  private setCooldown(userId: string): void {
    const cooldownEnd = new Date(Date.now() + this.config.cooldownPeriod * 60 * 1000);
    this.userCooldowns.set(userId, cooldownEnd);
  }

  /**
   * Add matches to user's match queue
   */
  private addToMatchQueue(userId: string, matches: MatchResult[]): void {
    const queue: MatchQueue = {
      queueId: `queue_${userId}_${Date.now()}`,
      userId,
      pendingMatches: matches,
      processedCount: 0,
      totalCount: matches.length,
      lastProcessedAt: new Date(),
      queueStatus: 'active',
      refreshInterval: 60 // 60 minutes
    };

    this.matchQueue.set(userId, queue);
  }

  /**
   * Get user's match queue
   */
  getMatchQueue(userId: string): MatchQueue | null {
    return this.matchQueue.get(userId) || null;
  }

  /**
   * Update matching configuration
   */
  updateConfig(newConfig: Partial<MatchingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Update algorithm weights
   */
  updateWeights(newWeights: Partial<MatchingAlgorithmWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
    
    // Normalize weights to sum to 1
    const totalWeight = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight !== 1.0) {
      Object.keys(this.weights).forEach(key => {
        this.weights[key as keyof MatchingAlgorithmWeights] /= totalWeight;
      });
    }
  }

  /**
   * Get matching analytics
   */
  getAnalytics(userId: string): Partial<MatchAnalytics> {
    const queue = this.matchQueue.get(userId);
    const mutualMatches = this.mutualMatches.get(userId) || [];

    return {
      userId,
      period: 'daily',
      startDate: new Date(),
      endDate: new Date(),
      metrics: {
        profileViews: 0,
        likesReceived: 0,
        likesSent: 0,
        matches: queue?.totalCount || 0,
        mutualMatches: mutualMatches.length,
        superLikesReceived: 0,
        superLikesSent: 0,
        messagesFromMatches: 0
      },
      insights: {
        peakActivityHours: [],
        topMatchingFactors: [],
        averageMatchDistance: 0,
        conversionRate: 0,
        popularityScore: 0
      },
      recommendations: []
    };
  }

  /**
   * Clear user cooldown (admin function)
   */
  clearCooldown(userId: string): void {
    this.userCooldowns.delete(userId);
  }

  /**
   * Get all active cooldowns (admin function)
   */
  getActiveCooldowns(): Map<string, Date> {
    const now = new Date();
    const activeCooldowns = new Map<string, Date>();
    
    this.userCooldowns.forEach((cooldownEnd, userId) => {
      if (cooldownEnd > now) {
        activeCooldowns.set(userId, cooldownEnd);
      }
    });
    
    return activeCooldowns;
  }

  // ===== EPIC 003 STORY 002: PREFERENCE-BASED FILTERING METHODS =====

  /**
   * Find matches using advanced preference-based filtering
   * Enhances basic location matching with sophisticated preference analysis
   */
  async findAdvancedMatches(
    criteria: AdvancedMatchingCriteria,
    availableUsers: UserProfile[]
  ): Promise<PreferenceMatchResult[]> {
    try {
      // Get user profile for preference analysis
      const userProfile = await this.getUserProfile(criteria.userId);
      if (!userProfile) {
        throw new MatchingValidationError(
          [{ code: 'USER_NOT_FOUND', message: 'User profile not found' }]
        );
      }

      // Phase 1: Basic location and demographic filtering (from Story 001)
      const basicCriteria: MatchingCriteria = {
        userId: criteria.userId,
        location: criteria.location,
        preferences: criteria.preferences,
        filters: criteria.filters,
        sort: criteria.sort
      };
      
      // Get user locations for basic matching (simplified for demo)
      const userLocations: UserLocationData[] = availableUsers.map(user => ({
        userId: user.userId,
        location: {
          latitude: 51.5074 + (Math.random() - 0.5) * 0.1, // London area
          longitude: -0.1278 + (Math.random() - 0.5) * 0.1,
          timestamp: new Date(),
          accuracy: 10
        },
        lastSeen: new Date(),
        accuracy: 10,
        isOnline: true
      }));
      
      const basicMatches = await this.findMatches(
        criteria.userId,
        userProfile,
        basicCriteria,
        availableUsers,
        userLocations
      );

      // Phase 2: Apply deal breaker filters (hard elimination)
      let candidateProfiles = basicMatches.map(match => 
        availableUsers.find(user => user.userId === match.targetUserId)!
      );

      candidateProfiles = this.preferenceFilteringService.applyDealBreakerFilters(
        userProfile,
        candidateProfiles,
        criteria.dealBreakers
      );

      // Phase 3: Advanced preference scoring and filtering
      const preferenceMatches: PreferenceMatchResult[] = [];

      for (const candidate of candidateProfiles) {
        // Calculate comprehensive preference alignment
        const preferenceAlignment = this.preferenceFilteringService.analyzePreferenceMatch(
          userProfile,
          candidate,
          criteria
        );

        // Apply minimum threshold filters
        if (!this.meetsMinimumThresholds(preferenceAlignment, criteria.minimumThresholds)) {
          continue;
        }

        // Find the original basic match for location data
        const basicMatch = basicMatches.find(match => match.targetUserId === candidate.userId);
        if (!basicMatch) continue;

        // Create enhanced match result
        const preferenceMatch: PreferenceMatchResult = {
          ...basicMatch,
          compatibilityScore: preferenceAlignment.totalScore,
          categoryScores: {
            physical: preferenceAlignment.categoryAlignments.physical.score,
            lifestyle: preferenceAlignment.categoryAlignments.lifestyle.score,
            social: preferenceAlignment.categoryAlignments.social.score,
            relationship: preferenceAlignment.categoryAlignments.relationship.score
          },
          preferenceAlignment: {
            matches: [
              ...preferenceAlignment.matchedPreferences.physical,
              ...preferenceAlignment.matchedPreferences.lifestyle,
              ...preferenceAlignment.matchedPreferences.social,
              ...preferenceAlignment.matchedPreferences.relationship
            ],
            mismatches: [
              ...preferenceAlignment.mismatchedPreferences.physical,
              ...preferenceAlignment.mismatchedPreferences.lifestyle,
              ...preferenceAlignment.mismatchedPreferences.social,
              ...preferenceAlignment.mismatchedPreferences.relationship
            ],
            dealBreakersPassed: preferenceAlignment.dealBreakerAnalysis.passed,
            mustHavesSatisfied: preferenceAlignment.mustHaveAnalysis.satisfiedMustHaves,
            niceToHavesMatched: preferenceAlignment.niceToHaveAnalysis.matchedNiceToHaves
          },
          matchExplanation: this.generateMatchExplanation(userProfile, candidate, preferenceAlignment),
          improvementSuggestions: this.generateImprovementSuggestions(userProfile, preferenceAlignment)
        };

        preferenceMatches.push(preferenceMatch);
      }

      // Phase 4: Sort by advanced compatibility score
      preferenceMatches.sort((a, b) => {
        if (criteria.sort.by === 'compatibility') {
          return criteria.sort.direction === 'desc' 
            ? b.compatibilityScore - a.compatibilityScore
            : a.compatibilityScore - b.compatibilityScore;
        }
        return b.score - a.score; // Fall back to basic score
      });

      // Phase 5: Limit results
      const limitedResults = preferenceMatches.slice(0, this.config.maxResults);

      console.log(`Advanced matching completed: ${limitedResults.length} high-quality matches found`);
      return limitedResults;

    } catch (error) {
      console.error('Advanced matching error:', error);
      throw error;
    }
  }

  /**
   * Explain why specific matches were suggested
   */
  explainMatchReasons(
    userProfile: UserProfile,
    matches: PreferenceMatchResult[]
  ): MatchExplanation[] {
    return matches.map(match => {
      const candidate = this.getCandidateProfile(match.targetUserId);
      if (!candidate) {
        return {
          matchId: match.matchId,
          primaryReasons: ['Profile data unavailable'],
          secondaryReasons: [],
          compatibilityHighlights: [],
          potentialConcerns: [],
          overallAssessment: 'fair',
          recommendationStrength: 0.5
        };
      }

      // Use preference filtering service to generate detailed explanation
      const preferenceAlignment = this.preferenceFilteringService.analyzePreferenceMatch(
        userProfile,
        candidate,
        this.getDefaultAdvancedCriteria(userProfile)
      );

      return this.preferenceFilteringService.generateMatchExplanation(
        userProfile,
        candidate,
        preferenceAlignment
      );
    });
  }

  /**
   * Suggest preference optimizations to improve match quality/quantity
   */
  async suggestPreferenceOptimizations(
    userId: string,
    goals: OptimizationGoals
  ): Promise<PreferenceOptimizationSuggestions> {
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new MatchingValidationError(
        [{ code: 'USER_NOT_FOUND', message: 'User profile not found' }]
      );
    }

    // Get current match results for analysis
    const currentCriteria = this.getDefaultAdvancedCriteria(userProfile);
    const availableUsers = await this.getAvailableUsers(); // This would fetch from your user service
    const currentResults = await this.findAdvancedMatches(currentCriteria, availableUsers);

    return this.preferenceFilteringService.optimizePreferenceSettings(
      userProfile,
      goals,
      currentResults
    );
  }

  /**
   * Get detailed preference matching analytics
   */
  async getPreferenceMatchAnalytics(userId: string): Promise<PreferenceMatchAnalytics> {
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new MatchingValidationError(
        [{ code: 'USER_NOT_FOUND', message: 'User profile not found' }]
      );
    }

    // Get recent matches for analysis
    const criteria = this.getDefaultAdvancedCriteria(userProfile);
    const availableUsers = await this.getAvailableUsers();
    const recentMatches = await this.findAdvancedMatches(criteria, availableUsers);

    // Analyze match quality distribution
    const qualityDistribution = {
      excellent: recentMatches.filter(m => m.compatibilityScore >= 0.85).length,
      veryGood: recentMatches.filter(m => m.compatibilityScore >= 0.7 && m.compatibilityScore < 0.85).length,
      good: recentMatches.filter(m => m.compatibilityScore >= 0.55 && m.compatibilityScore < 0.7).length,
      fair: recentMatches.filter(m => m.compatibilityScore < 0.55).length
    };

    // Calculate category performance
    const categoryPerformance = {
      physical: {
        averageScore: this.calculateCategoryAverage(recentMatches, 'physical'),
        importance: 0.3 // Default weight
      },
      lifestyle: {
        averageScore: this.calculateCategoryAverage(recentMatches, 'lifestyle'),
        importance: 0.25
      },
      social: {
        averageScore: this.calculateCategoryAverage(recentMatches, 'social'),
        importance: 0.25
      },
      relationship: {
        averageScore: this.calculateCategoryAverage(recentMatches, 'relationship'),
        importance: 0.2
      }
    };

    return {
      userId,
      totalMatches: recentMatches.length,
      qualityDistribution,
      categoryPerformance,
      userBehaviorInsights: {
        preferenceConsistency: 0.8, // Would be calculated from user behavior data
        dealBreakerViolations: 0,
        mostInfluentialFactors: ['physical compatibility', 'shared interests'],
        leastInfluentialFactors: ['occupation', 'education level']
      },
      recommendations: {
        adjustPreferences: ['Consider expanding age range for more matches'],
        adjustWeights: ['Increase social weight if conversation is important'],
        addFilters: ['Add education filter for higher compatibility'],
        removeFilters: ['Remove height restriction to increase matches']
      }
    };
  }

  // ===== HELPER METHODS FOR PREFERENCE-BASED FILTERING =====

  /**
   * Check if a match meets minimum threshold requirements
   */
  private meetsMinimumThresholds(
    preferenceAlignment: any,
    thresholds: AdvancedMatchingCriteria['minimumThresholds']
  ): boolean {
    // Overall threshold
    if (preferenceAlignment.totalScore < thresholds.overall) {
      return false;
    }

    // Category-specific thresholds
    const categoryScores = preferenceAlignment.categoryAlignments;
    
    if (thresholds.physical && categoryScores.physical.score < thresholds.physical) {
      return false;
    }
    
    if (thresholds.lifestyle && categoryScores.lifestyle.score < thresholds.lifestyle) {
      return false;
    }
    
    if (thresholds.social && categoryScores.social.score < thresholds.social) {
      return false;
    }
    
    if (thresholds.relationship && categoryScores.relationship.score < thresholds.relationship) {
      return false;
    }

    return true;
  }

  /**
   * Generate match explanation string
   */
  private generateMatchExplanation(
    userProfile: UserProfile,
    candidate: UserProfile,
    preferenceAlignment: any
  ): string {
    const score = Math.round(preferenceAlignment.totalScore * 100);
    const topCategory = this.getTopScoringCategory(preferenceAlignment.categoryAlignments);
    
    if (score >= 85) {
      return `Excellent match (${score}%) with outstanding ${topCategory} compatibility and strong overall alignment.`;
    } else if (score >= 70) {
      return `Very good match (${score}%) with strong ${topCategory} compatibility and good overall fit.`;
    } else if (score >= 55) {
      return `Good match (${score}%) with decent ${topCategory} compatibility and potential for connection.`;
    } else {
      return `Fair match (${score}%) with some compatible factors but mixed overall alignment.`;
    }
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(
    userProfile: UserProfile,
    preferenceAlignment: any
  ): string[] {
    const suggestions: string[] = [];
    
    // Analyze low-scoring categories
    Object.entries(preferenceAlignment.categoryAlignments).forEach(([category, data]: [string, any]) => {
      if (data.score < 0.5) {
        suggestions.push(`Consider adjusting ${category} preferences to find more compatible matches`);
      }
    });

    if (suggestions.length === 0) {
      suggestions.push('Your preferences are well-optimized for finding compatible matches');
    }

    return suggestions;
  }

  /**
   * Get default advanced criteria from user profile
   */
  private getDefaultAdvancedCriteria(userProfile: UserProfile): AdvancedMatchingCriteria {
    const preferences = userProfile.preferences || {};
    
    return {
      userId: userProfile.userId,
      location: {
        latitude: 51.5074, // Default to London coordinates
        longitude: -0.1278,
        radius: preferences.maxDistance || 25
      },
      preferences: {
        ageRange: preferences.ageRange || { min: 22, max: 35 },
        sexualOrientations: preferences.sexualOrientations || [],
        relationshipTypes: preferences.relationshipTypes || [],
        maxDistance: preferences.maxDistance || 25
      },
      filters: {
        isVerified: true,
        hasPhotos: true,
        lastActiveWithin: 168 // 1 week
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
      dealBreakers: preferences.dealBreakers || [],
      mustHaves: [], // Would be derived from preferences
      niceToHaves: [], // Would be derived from preferences
      enableAdvancedFiltering: true
    };
  }

  /**
   * Get top scoring category
   */
  private getTopScoringCategory(categoryScores: any): string {
    let topCategory = 'overall';
    let topScore = 0;

    Object.entries(categoryScores).forEach(([category, data]: [string, any]) => {
      if (data.score > topScore) {
        topScore = data.score;
        topCategory = category;
      }
    });

    return topCategory;
  }

  /**
   * Calculate average score for a category across matches
   */
  private calculateCategoryAverage(
    matches: PreferenceMatchResult[], 
    category: keyof PreferenceMatchResult['categoryScores']
  ): number {
    if (matches.length === 0) return 0;
    
    const total = matches.reduce((sum, match) => sum + match.categoryScores[category], 0);
    return total / matches.length;
  }

  /**
   * Get candidate profile (placeholder - would integrate with your profile service)
   */
  private getCandidateProfile(userId: string): UserProfile | undefined {
    // This would integrate with your profile service
    return undefined;
  }

  /**
   * Get user profile (placeholder - would integrate with your profile service)
   */
  private async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    // This would integrate with your profile service
    return undefined;
  }

  /**
   * Get available users (placeholder - would integrate with your user service)
   */
  private async getAvailableUsers(): Promise<UserProfile[]> {
    // This would integrate with your user service
    return [];
  }
}
