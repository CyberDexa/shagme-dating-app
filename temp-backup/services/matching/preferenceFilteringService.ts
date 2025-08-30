/**
 * Preference Filtering Service
 * Epic 003 - Story 002: Preference-Based Filtering
 * 
 * Sophisticated preference-based filtering service that provides advanced
 * compatibility scoring, deal breaker filtering, and preference optimization
 */

import { UserProfile, MatchingPreferences } from '../../types/profile';
import { 
  AdvancedMatchingCriteria, 
  PreferenceMatchResult, 
  CategoryScores, 
  PreferenceAlignment,
  PreferenceAnalytics,
  OptimizationGoals,
  PreferenceOptimizationSuggestions,
  MatchExplanation,
  PreferenceFilteringConfig
} from '../../types/matching';

export class PreferenceFilteringService {
  private config: PreferenceFilteringConfig;

  constructor(config?: Partial<PreferenceFilteringConfig>) {
    this.config = {
      enableCategoryWeighting: true,
      enableDealBreakerFiltering: true,
      enableMustHaveFiltering: true,
      enableNiceToHaveBoosts: true,
      defaultWeights: {
        physical: 0.3,
        lifestyle: 0.25,
        social: 0.25,
        relationship: 0.2
      },
      defaultThresholds: {
        overall: 0.6,
        physical: 0.4,
        lifestyle: 0.3,
        social: 0.3,
        relationship: 0.4
      },
      scoringAlgorithm: 'weighted_average',
      enableMachineLearning: false,
      enableUserFeedbackLearning: false,
      ...config
    };
  }

  /**
   * Apply deal breaker filters to eliminate incompatible candidates
   */
  applyDealBreakerFilters(
    userProfile: UserProfile,
    candidates: UserProfile[],
    dealBreakers: string[]
  ): UserProfile[] {
    if (!this.config.enableDealBreakerFiltering || dealBreakers.length === 0) {
      return candidates;
    }

    return candidates.filter(candidate => {
      for (const dealBreaker of dealBreakers) {
        if (this.isDealBreakerTriggered(userProfile, candidate, dealBreaker)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Check if a specific deal breaker is triggered
   */
  private isDealBreakerTriggered(
    userProfile: UserProfile,
    candidate: UserProfile,
    dealBreaker: string
  ): boolean {
    switch (dealBreaker) {
      // Physical deal breakers
      case 'smoking':
        return candidate.personalInfo.lifestyle?.smoking === 'regularly' ||
               candidate.personalInfo.lifestyle?.smoking === 'socially';
      case 'no_photos':
        return !candidate.photos || candidate.photos.length === 0;
      case 'height_mismatch':
        const userHeight = userProfile.personalInfo.height || 0;
        const candidateHeight = candidate.personalInfo.height || 0;
        return Math.abs(userHeight - candidateHeight) > 20; // 20cm difference
      case 'body_type_mismatch':
        const preferredBodyTypes = userProfile.preferences?.bodyTypes || [];
        const candidateBodyType = candidate.personalInfo.bodyType;
        return preferredBodyTypes.length > 0 && 
               candidateBodyType !== undefined && 
               !preferredBodyTypes.includes(candidateBodyType);

      // Lifestyle deal breakers
      case 'drinking_heavily':
        return candidate.personalInfo.lifestyle?.drinking === 'frequently';
      case 'drug_use':
        return candidate.personalInfo.lifestyle?.drugs === 'regularly' ||
               candidate.personalInfo.lifestyle?.drugs === 'occasionally';
      case 'no_exercise':
        return candidate.personalInfo.lifestyle?.exercise === 'never';

      // Social deal breakers
      case 'no_verification':
        return !candidate.verification?.isVerified;
      case 'education_mismatch':
        const userEducation = userProfile.personalInfo.education;
        const candidateEducation = candidate.personalInfo.education;
        if (userEducation && candidateEducation) {
          return this.getEducationLevel(userEducation) - this.getEducationLevel(candidateEducation) > 2;
        }
        return false;
      case 'language_barrier':
        const userLanguages = userProfile.personalInfo.languages || [];
        const candidateLanguages = candidate.personalInfo.languages || [];
        return !userLanguages.some(lang => candidateLanguages.includes(lang));

      // Activity deal breakers
      case 'inactive_users':
        const daysSinceActive = candidate.lastActiveAt ? 
          (Date.now() - candidate.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24) : 
          999;
        return daysSinceActive > 14; // More than 2 weeks inactive
      case 'new_profiles':
        const daysSinceCreated = candidate.createdAt ? 
          (Date.now() - candidate.createdAt.getTime()) / (1000 * 60 * 60 * 24) : 
          999;
        return daysSinceCreated < 1; // Less than 1 day old

      // Relationship deal breakers
      case 'age_gaps':
        const ageDifference = Math.abs(userProfile.personalInfo.age - candidate.personalInfo.age);
        return ageDifference > 15; // More than 15 years difference
      case 'relationship_mismatch':
        const userLookingFor = userProfile.personalInfo.lookingFor || [];
        const candidateLookingFor = candidate.personalInfo.lookingFor || [];
        return !userLookingFor.some(type => candidateLookingFor.includes(type));

      default:
        return false;
    }
  }

  /**
   * Calculate comprehensive category scores for a user-candidate pair
   */
  calculateCategoryScores(
    userProfile: UserProfile,
    candidate: UserProfile
  ): CategoryScores {
    return {
      physical: this.calculatePhysicalScore(userProfile, candidate),
      lifestyle: this.calculateLifestyleScore(userProfile, candidate),
      social: this.calculateSocialScore(userProfile, candidate),
      relationship: this.calculateRelationshipScore(userProfile, candidate)
    };
  }

  /**
   * Calculate physical compatibility score
   */
  private calculatePhysicalScore(userProfile: UserProfile, candidate: UserProfile): CategoryScores['physical'] {
    let totalScore = 0;
    let factorCount = 0;

    // Body type compatibility
    const bodyTypeScore = this.calculateBodyTypeCompatibility(userProfile, candidate);
    totalScore += bodyTypeScore;
    factorCount++;

    // Height compatibility
    const heightScore = this.calculateHeightCompatibility(userProfile, candidate);
    totalScore += heightScore;
    factorCount++;

    // Age compatibility (within physical category)
    const ageScore = this.calculateAgeCompatibility(userProfile, candidate);
    totalScore += ageScore;
    factorCount++;

    // Overall appearance score (based on photo count and quality)
    const appearanceScore = this.calculateAppearanceScore(candidate);
    totalScore += appearanceScore;
    factorCount++;

    const averageScore = factorCount > 0 ? totalScore / factorCount : 0;

    return {
      score: averageScore,
      breakdown: {
        bodyType: bodyTypeScore,
        height: heightScore,
        age: ageScore,
        appearance: appearanceScore
      }
    };
  }

  /**
   * Calculate lifestyle compatibility score
   */
  private calculateLifestyleScore(userProfile: UserProfile, candidate: UserProfile): CategoryScores['lifestyle'] {
    let totalScore = 0;
    let factorCount = 0;

    // Smoking compatibility
    const smokingScore = this.calculateSmokingCompatibility(userProfile, candidate);
    totalScore += smokingScore;
    factorCount++;

    // Drinking compatibility
    const drinkingScore = this.calculateDrinkingCompatibility(userProfile, candidate);
    totalScore += drinkingScore;
    factorCount++;

    // Exercise compatibility
    const exerciseScore = this.calculateExerciseCompatibility(userProfile, candidate);
    totalScore += exerciseScore;
    factorCount++;

    // Diet compatibility
    const dietScore = this.calculateDietCompatibility(userProfile, candidate);
    totalScore += dietScore;
    factorCount++;

    // Social habits compatibility
    const socialScore = this.calculateSocialHabitsCompatibility(userProfile, candidate);
    totalScore += socialScore;
    factorCount++;

    const averageScore = factorCount > 0 ? totalScore / factorCount : 0.5;

    return {
      score: averageScore,
      breakdown: {
        smoking: smokingScore,
        drinking: drinkingScore,
        exercise: exerciseScore,
        diet: dietScore,
        socialHabits: socialScore
      }
    };
  }

  /**
   * Calculate social compatibility score
   */
  private calculateSocialScore(userProfile: UserProfile, candidate: UserProfile): CategoryScores['social'] {
    let totalScore = 0;
    let factorCount = 0;

    // Education compatibility
    const educationScore = this.calculateEducationCompatibility(userProfile, candidate);
    totalScore += educationScore;
    factorCount++;

    // Occupation compatibility
    const occupationScore = this.calculateOccupationCompatibility(userProfile, candidate);
    totalScore += occupationScore;
    factorCount++;

    // Interests compatibility
    const interestsScore = this.calculateInterestsCompatibility(userProfile, candidate);
    totalScore += interestsScore;
    factorCount++;

    // Language compatibility
    const languageScore = this.calculateLanguageCompatibility(userProfile, candidate);
    totalScore += languageScore;
    factorCount++;

    // Personality compatibility (placeholder)
    const personalityScore = 0.5; // Would be based on personality test results
    totalScore += personalityScore;
    factorCount++;

    const averageScore = factorCount > 0 ? totalScore / factorCount : 0.5;

    return {
      score: averageScore,
      breakdown: {
        education: educationScore,
        occupation: occupationScore,
        interests: interestsScore,
        languages: languageScore,
        personality: personalityScore
      }
    };
  }

  /**
   * Calculate relationship compatibility score
   */
  private calculateRelationshipScore(userProfile: UserProfile, candidate: UserProfile): CategoryScores['relationship'] {
    let totalScore = 0;
    let factorCount = 0;

    // Relationship type compatibility
    const relationshipTypeScore = this.calculateRelationshipTypeCompatibility(userProfile, candidate);
    totalScore += relationshipTypeScore;
    factorCount++;

    // Sexual orientation compatibility
    const orientationScore = this.calculateSexualOrientationCompatibility(userProfile, candidate);
    totalScore += orientationScore;
    factorCount++;

    // Commitment level compatibility
    const commitmentScore = this.calculateCommitmentCompatibility(userProfile, candidate);
    totalScore += commitmentScore;
    factorCount++;

    // Family goals compatibility
    const familyScore = this.calculateFamilyGoalsCompatibility(userProfile, candidate);
    totalScore += familyScore;
    factorCount++;

    // Communication style compatibility (placeholder)
    const communicationScore = 0.5; // Would be based on communication preferences
    totalScore += communicationScore;
    factorCount++;

    const averageScore = factorCount > 0 ? totalScore / factorCount : 0.5;

    return {
      score: averageScore,
      breakdown: {
        relationshipType: relationshipTypeScore,
        sexualOrientation: orientationScore,
        commitmentLevel: commitmentScore,
        familyGoals: familyScore,
        communication: communicationScore
      }
    };
  }

  /**
   * Calculate weighted compatibility score using category scores and weights
   */
  calculateWeightedCompatibility(
    categoryScores: CategoryScores, 
    weights: AdvancedMatchingCriteria['preferenceWeights']
  ): number {
    const { physical, lifestyle, social, relationship } = weights;
    
    // Normalize weights to ensure they sum to 1
    const totalWeight = physical + lifestyle + social + relationship;
    const normalizedWeights = {
      physical: physical / totalWeight,
      lifestyle: lifestyle / totalWeight,
      social: social / totalWeight,
      relationship: relationship / totalWeight
    };

    switch (this.config.scoringAlgorithm) {
      case 'weighted_average':
        return (
          categoryScores.physical.score * normalizedWeights.physical +
          categoryScores.lifestyle.score * normalizedWeights.lifestyle +
          categoryScores.social.score * normalizedWeights.social +
          categoryScores.relationship.score * normalizedWeights.relationship
        );

      case 'multiplicative':
        // Multiplicative scoring - all categories must be good
        return Math.pow(
          categoryScores.physical.score * categoryScores.lifestyle.score *
          categoryScores.social.score * categoryScores.relationship.score,
          1/4
        );

      case 'hybrid':
        // Hybrid approach - weighted average with multiplicative penalty for very low scores
        const weightedAverage = (
          categoryScores.physical.score * normalizedWeights.physical +
          categoryScores.lifestyle.score * normalizedWeights.lifestyle +
          categoryScores.social.score * normalizedWeights.social +
          categoryScores.relationship.score * normalizedWeights.relationship
        );
        
        // Apply penalty for any category below 0.3
        const minScore = Math.min(
          categoryScores.physical.score,
          categoryScores.lifestyle.score,
          categoryScores.social.score,
          categoryScores.relationship.score
        );
        
        const penalty = minScore < 0.3 ? minScore / 0.3 : 1;
        return weightedAverage * penalty;

      default:
        return 0.5;
    }
  }

  /**
   * Analyze detailed preference alignment between user and candidate
   */
  analyzePreferenceMatch(
    userProfile: UserProfile,
    candidate: UserProfile,
    criteria: AdvancedMatchingCriteria
  ): PreferenceAlignment {
    const categoryScores = this.calculateCategoryScores(userProfile, candidate);
    const totalScore = this.calculateWeightedCompatibility(categoryScores, criteria.preferenceWeights);

    // Analyze matched and mismatched preferences
    const { matchedPreferences, mismatchedPreferences } = this.analyzePreferenceMatches(userProfile, candidate);

    // Analyze deal breakers
    const dealBreakerAnalysis = this.analyzeDealBreakers(userProfile, candidate, criteria.dealBreakers);

    // Analyze must-haves
    const mustHaveAnalysis = this.analyzeMustHaves(userProfile, candidate, criteria.mustHaves);

    // Analyze nice-to-haves
    const niceToHaveAnalysis = this.analyzeNiceToHaves(userProfile, candidate, criteria.niceToHaves);

    return {
      totalScore,
      categoryAlignments: categoryScores,
      matchedPreferences,
      mismatchedPreferences,
      dealBreakerAnalysis,
      mustHaveAnalysis,
      niceToHaveAnalysis
    };
  }

  /**
   * Generate optimization suggestions for user preferences
   */
  async optimizePreferenceSettings(
    userProfile: UserProfile,
    goals: OptimizationGoals,
    currentResults: PreferenceMatchResult[]
  ): Promise<PreferenceOptimizationSuggestions> {
    const currentSettings = this.analyzeCurrentSettings(userProfile, currentResults);
    const suggestions = this.generateOptimizationSuggestions(userProfile, goals, currentResults);
    const presets = this.generatePreferencePresets(userProfile, goals);

    return {
      currentSettings,
      suggestions,
      presets
    };
  }

  /**
   * Generate match explanation for why a candidate was suggested
   */
  generateMatchExplanation(
    userProfile: UserProfile,
    candidate: UserProfile,
    preferenceAlignment: PreferenceAlignment
  ): MatchExplanation {
    const primaryReasons: string[] = [];
    const secondaryReasons: string[] = [];
    const compatibilityHighlights: string[] = [];
    const potentialConcerns: string[] = [];

    // Analyze high-scoring categories
    Object.entries(preferenceAlignment.categoryAlignments).forEach(([category, data]) => {
      if (data.score >= 0.8) {
        primaryReasons.push(`Excellent ${category} compatibility (${Math.round(data.score * 100)}%)`);
      } else if (data.score >= 0.6) {
        secondaryReasons.push(`Good ${category} compatibility (${Math.round(data.score * 100)}%)`);
      } else if (data.score < 0.4) {
        potentialConcerns.push(`Lower ${category} compatibility (${Math.round(data.score * 100)}%)`);
      }
    });

    // Add specific compatibility highlights
    preferenceAlignment.matchedPreferences.physical.forEach(match => {
      compatibilityHighlights.push(`Matching ${match} preference`);
    });

    // Determine overall assessment
    let overallAssessment: 'excellent' | 'very_good' | 'good' | 'fair';
    if (preferenceAlignment.totalScore >= 0.85) {
      overallAssessment = 'excellent';
    } else if (preferenceAlignment.totalScore >= 0.7) {
      overallAssessment = 'very_good';
    } else if (preferenceAlignment.totalScore >= 0.55) {
      overallAssessment = 'good';
    } else {
      overallAssessment = 'fair';
    }

    return {
      matchId: `match-${userProfile.userId}-${candidate.userId}`,
      primaryReasons,
      secondaryReasons,
      compatibilityHighlights,
      potentialConcerns,
      overallAssessment,
      recommendationStrength: preferenceAlignment.totalScore
    };
  }

  // Helper methods for specific compatibility calculations
  private calculateBodyTypeCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const preferredBodyTypes = userProfile.preferences?.bodyTypes || [];
    const candidateBodyType = candidate.personalInfo.bodyType;
    
    if (preferredBodyTypes.length === 0 || !candidateBodyType) {
      return 0.7; // Neutral score if no preferences or data
    }
    
    return preferredBodyTypes.includes(candidateBodyType) ? 1.0 : 0.3;
  }

  private calculateHeightCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userHeight = userProfile.personalInfo.height;
    const candidateHeight = candidate.personalInfo.height;
    
    if (!userHeight || !candidateHeight) {
      return 0.7; // Neutral score if no height data
    }
    
    const heightDifference = Math.abs(userHeight - candidateHeight);
    
    // Perfect match: 0-5cm difference
    if (heightDifference <= 5) return 1.0;
    
    // Good match: 5-15cm difference
    if (heightDifference <= 15) return 0.8;
    
    // Acceptable: 15-25cm difference
    if (heightDifference <= 25) return 0.6;
    
    // Poor match: >25cm difference
    return 0.3;
  }

  private calculateAgeCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userAge = userProfile.personalInfo.age;
    const candidateAge = candidate.personalInfo.age;
    const preferredAgeRange = userProfile.preferences?.ageRange;
    
    if (!preferredAgeRange) {
      // Default compatibility based on reasonable age range
      const ageDifference = Math.abs(userAge - candidateAge);
      if (ageDifference <= 3) return 1.0;
      if (ageDifference <= 7) return 0.8;
      if (ageDifference <= 12) return 0.6;
      return 0.3;
    }
    
    // Check if candidate is within preferred range
    if (candidateAge >= preferredAgeRange.min && candidateAge <= preferredAgeRange.max) {
      return 1.0;
    }
    
    // Calculate how far outside the range
    const outsideBy = Math.min(
      Math.abs(candidateAge - preferredAgeRange.min),
      Math.abs(candidateAge - preferredAgeRange.max)
    );
    
    if (outsideBy <= 2) return 0.7;
    if (outsideBy <= 5) return 0.4;
    return 0.1;
  }

  private calculateAppearanceScore(candidate: UserProfile): number {
    const photoCount = candidate.photos?.length || 0;
    
    if (photoCount === 0) return 0.2;
    if (photoCount >= 5) return 1.0;
    if (photoCount >= 3) return 0.8;
    if (photoCount >= 2) return 0.6;
    return 0.4;
  }

  private calculateSmokingCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userSmoking = userProfile.personalInfo.lifestyle?.smoking || 'unknown';
    const candidateSmoking = candidate.personalInfo.lifestyle?.smoking || 'unknown';
    
    // Exact match is best
    if (userSmoking === candidateSmoking) return 1.0;
    
    // Non-smoker with social smoker
    if ((userSmoking === 'never' && candidateSmoking === 'socially') ||
        (userSmoking === 'socially' && candidateSmoking === 'never')) {
      return 0.6;
    }
    
    // Non-smoker with regular smoker (poor match)
    if ((userSmoking === 'never' && candidateSmoking === 'regularly') ||
        (userSmoking === 'regularly' && candidateSmoking === 'never')) {
      return 0.2;
    }
    
    return 0.5; // Default for unknown combinations
  }

  private calculateDrinkingCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userDrinking = userProfile.personalInfo.lifestyle?.drinking || 'unknown';
    const candidateDrinking = candidate.personalInfo.lifestyle?.drinking || 'unknown';
    
    // Exact match is best
    if (userDrinking === candidateDrinking) return 1.0;
    
    // Compatible drinking levels
    const drinkingLevels = ['never', 'rarely', 'socially', 'regularly', 'frequently'];
    const userLevel = drinkingLevels.indexOf(userDrinking);
    const candidateLevel = drinkingLevels.indexOf(candidateDrinking);
    
    if (userLevel >= 0 && candidateLevel >= 0) {
      const difference = Math.abs(userLevel - candidateLevel);
      if (difference <= 1) return 0.8;
      if (difference <= 2) return 0.6;
      return 0.3;
    }
    
    return 0.5; // Default for unknown
  }

  private calculateExerciseCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userExercise = userProfile.personalInfo.lifestyle?.exercise || 'unknown';
    const candidateExercise = candidate.personalInfo.lifestyle?.exercise || 'unknown';
    
    // Exact match is best
    if (userExercise === candidateExercise) return 1.0;
    
    // Compatible exercise levels
    const exerciseLevels = ['never', 'rarely', 'sometimes', 'regularly', 'daily'];
    const userLevel = exerciseLevels.indexOf(userExercise);
    const candidateLevel = exerciseLevels.indexOf(candidateExercise);
    
    if (userLevel >= 0 && candidateLevel >= 0) {
      const difference = Math.abs(userLevel - candidateLevel);
      if (difference <= 1) return 0.8;
      if (difference <= 2) return 0.6;
      return 0.4;
    }
    
    return 0.5; // Default for unknown
  }

  private calculateDietCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userDiet = userProfile.personalInfo.lifestyle?.diet || 'unknown';
    const candidateDiet = candidate.personalInfo.lifestyle?.diet || 'unknown';
    
    // Exact match is best
    if (userDiet === candidateDiet) return 1.0;
    
    // Some diets are more compatible than others
    if (userDiet === 'vegetarian' && candidateDiet === 'vegan') return 0.7;
    if (userDiet === 'vegan' && candidateDiet === 'vegetarian') return 0.7;
    if ((userDiet === 'omnivore' && candidateDiet === 'vegetarian') ||
        (userDiet === 'vegetarian' && candidateDiet === 'omnivore')) {
      return 0.6;
    }
    
    return 0.5; // Default compatibility
  }

  private calculateSocialHabitsCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    // This would analyze social preferences like party frequency, social circle size, etc.
    // For now, return a neutral score
    return 0.5;
  }

  private calculateEducationCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userEducation = userProfile.personalInfo.education;
    const candidateEducation = candidate.personalInfo.education;
    
    if (!userEducation || !candidateEducation) {
      return 0.5; // Neutral if no data
    }
    
    const userLevel = this.getEducationLevel(userEducation);
    const candidateLevel = this.getEducationLevel(candidateEducation);
    
    const difference = Math.abs(userLevel - candidateLevel);
    
    if (difference === 0) return 1.0;
    if (difference === 1) return 0.8;
    if (difference === 2) return 0.6;
    return 0.4;
  }

  private getEducationLevel(education: string): number {
    const levels: Record<string, number> = {
      'high_school': 1,
      'some_college': 2,
      'bachelors': 3,
      'masters': 4,
      'phd': 5,
      'trade_school': 2,
      'associate': 2
    };
    return levels[education] || 2;
  }

  private calculateOccupationCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    // This would analyze occupation compatibility based on lifestyle, income, schedule, etc.
    // For now, return a neutral score
    return 0.5;
  }

  private calculateInterestsCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userInterests = userProfile.personalInfo.interests || [];
    const candidateInterests = candidate.personalInfo.interests || [];
    
    if (userInterests.length === 0 || candidateInterests.length === 0) {
      return 0.5; // Neutral if no interests data
    }
    
    const commonInterests = userInterests.filter(interest => 
      candidateInterests.includes(interest)
    );
    
    const totalInterests = new Set([...userInterests, ...candidateInterests]).size;
    const compatibility = commonInterests.length / Math.min(userInterests.length, candidateInterests.length);
    
    return Math.min(compatibility, 1.0);
  }

  private calculateLanguageCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userLanguages = userProfile.personalInfo.languages || [];
    const candidateLanguages = candidate.personalInfo.languages || [];
    
    if (userLanguages.length === 0 || candidateLanguages.length === 0) {
      return 0.7; // Assume some common language
    }
    
    const hasCommonLanguage = userLanguages.some(lang => candidateLanguages.includes(lang));
    return hasCommonLanguage ? 1.0 : 0.2;
  }

  private calculateRelationshipTypeCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userLookingFor = userProfile.personalInfo.lookingFor || [];
    const candidateLookingFor = candidate.personalInfo.lookingFor || [];
    
    const hasCommonType = userLookingFor.some(type => candidateLookingFor.includes(type));
    return hasCommonType ? 1.0 : 0.2;
  }

  private calculateSexualOrientationCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    const userOrientation = userProfile.personalInfo.sexualOrientation;
    const candidateOrientation = candidate.personalInfo.sexualOrientation;
    
    // This is a simplified compatibility check
    // In reality, this would be more nuanced based on the user's preferences
    if (userOrientation === candidateOrientation) return 1.0;
    if (userOrientation === 'bisexual' || candidateOrientation === 'bisexual') return 0.8;
    return 0.3;
  }

  private calculateCommitmentCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    // This would analyze commitment level preferences
    // For now, return a neutral score
    return 0.5;
  }

  private calculateFamilyGoalsCompatibility(userProfile: UserProfile, candidate: UserProfile): number {
    // This would analyze family and children preferences
    // For now, return a neutral score
    return 0.5;
  }

  // Additional helper methods for preference analysis
  private analyzePreferenceMatches(userProfile: UserProfile, candidate: UserProfile) {
    const matchedPreferences = {
      physical: [] as string[],
      lifestyle: [] as string[],
      social: [] as string[],
      relationship: [] as string[]
    };

    const mismatchedPreferences = {
      physical: [] as string[],
      lifestyle: [] as string[],
      social: [] as string[],
      relationship: [] as string[]
    };

    // Analyze specific preference matches/mismatches
    // This would be expanded based on specific preference analysis
    
    return { matchedPreferences, mismatchedPreferences };
  }

  private analyzeDealBreakers(userProfile: UserProfile, candidate: UserProfile, dealBreakers: string[]) {
    const triggeredDealBreakers: string[] = [];
    const passedDealBreakers: string[] = [];

    dealBreakers.forEach(dealBreaker => {
      if (this.isDealBreakerTriggered(userProfile, candidate, dealBreaker)) {
        triggeredDealBreakers.push(dealBreaker);
      } else {
        passedDealBreakers.push(dealBreaker);
      }
    });

    return {
      passed: triggeredDealBreakers.length === 0,
      triggeredDealBreakers,
      passedDealBreakers
    };
  }

  private analyzeMustHaves(userProfile: UserProfile, candidate: UserProfile, mustHaves: string[]) {
    const satisfiedItems: string[] = [];
    const missedItems: string[] = [];

    mustHaves.forEach(mustHave => {
      // This would check if the must-have is satisfied by the candidate
      // For now, assume 70% are satisfied
      if (Math.random() > 0.3) {
        satisfiedItems.push(mustHave);
      } else {
        missedItems.push(mustHave);
      }
    });

    return {
      totalMustHaves: mustHaves.length,
      satisfiedMustHaves: satisfiedItems.length,
      satisfiedItems,
      missedItems
    };
  }

  private analyzeNiceToHaves(userProfile: UserProfile, candidate: UserProfile, niceToHaves: string[]) {
    const matchedItems: string[] = [];
    const missedItems: string[] = [];

    niceToHaves.forEach(niceToHave => {
      // This would check if the nice-to-have is matched by the candidate
      // For now, assume 50% are matched
      if (Math.random() > 0.5) {
        matchedItems.push(niceToHave);
      } else {
        missedItems.push(niceToHave);
      }
    });

    return {
      totalNiceToHaves: niceToHaves.length,
      matchedNiceToHaves: matchedItems.length,
      matchedItems,
      missedItems
    };
  }

  private analyzeCurrentSettings(userProfile: UserProfile, currentResults: PreferenceMatchResult[]) {
    const avgCompatibility = currentResults.length > 0 
      ? currentResults.reduce((sum, match) => sum + match.compatibilityScore, 0) / currentResults.length
      : 0;

    let restrictiveness: 'very_strict' | 'strict' | 'moderate' | 'relaxed' | 'very_relaxed';
    
    if (avgCompatibility > 0.8) restrictiveness = 'very_strict';
    else if (avgCompatibility > 0.65) restrictiveness = 'strict';
    else if (avgCompatibility > 0.5) restrictiveness = 'moderate';
    else if (avgCompatibility > 0.35) restrictiveness = 'relaxed';
    else restrictiveness = 'very_relaxed';

    return {
      restrictiveness,
      expectedMatches: currentResults.length,
      averageCompatibility: avgCompatibility
    };
  }

  private generateOptimizationSuggestions(
    userProfile: UserProfile, 
    goals: OptimizationGoals, 
    currentResults: PreferenceMatchResult[]
  ) {
    const suggestions: PreferenceOptimizationSuggestions['suggestions'] = [];

    if (goals.prioritizeQuantity && currentResults.length < 10) {
      suggestions.push({
        type: 'expand_age',
        description: 'Expand your age range by 5 years to find more matches',
        impact: 'high',
        expectedIncrease: 40,
        tradeoff: 'May include matches outside your preferred age range'
      });

      suggestions.push({
        type: 'increase_distance',
        description: 'Increase your search radius to find more matches',
        impact: 'high',
        expectedIncrease: 60,
        tradeoff: 'Matches may be further away'
      });
    }

    if (goals.prioritizeQuality) {
      suggestions.push({
        type: 'add_preference',
        description: 'Add education level filter for higher quality matches',
        impact: 'medium',
        expectedIncrease: -20,
        tradeoff: 'Fewer matches but better compatibility'
      });
    }

    return suggestions;
  }

  private generatePreferencePresets(userProfile: UserProfile, goals: OptimizationGoals) {
    return [
      {
        name: 'Quality Focused',
        description: 'Prioritize high compatibility over quantity',
        changes: ['Add education filter', 'Increase minimum compatibility'],
        expectedMatches: 5
      },
      {
        name: 'Quantity Focused',
        description: 'Expand criteria for more potential matches',
        changes: ['Expand age range', 'Increase distance', 'Remove strict filters'],
        expectedMatches: 25
      },
      {
        name: 'Balanced',
        description: 'Good balance of quality and quantity',
        changes: ['Moderate filters', 'Balanced weights'],
        expectedMatches: 15
      }
    ];
  }
}
