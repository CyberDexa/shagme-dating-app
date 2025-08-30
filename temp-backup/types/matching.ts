/**
 * Matching System Types
 * Epic 003: Matching System
 * 
 * Core types and interfaces for the location-based matching system
 * with preference filtering and freemium controls
 */

import { UserProfile, Location, SexualOrientation, RelationshipType } from './profile';

// Location and distance types
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface LocationBounds {
  center: GeoLocation;
  radius: number; // in meters
  northEast: GeoLocation;
  southWest: GeoLocation;
}

// Matching criteria and filters
export interface MatchingCriteria {
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  preferences: {
    ageRange: {
      min: number;
      max: number;
    };
    sexualOrientations: SexualOrientation[];
    relationshipTypes: RelationshipType[];
    maxDistance: number; // in kilometers
  };
  filters: {
    isVerified?: boolean;
    hasPhotos?: boolean;
    lastActiveWithin?: number; // hours
    excludeUserIds?: string[]; // Previously seen/rejected users
    includePremiumOnly?: boolean;
    minimumPhotoCount?: number;
  };
  sort: {
    by: 'distance' | 'activity' | 'compatibility' | 'verification' | 'random';
    direction: 'asc' | 'desc';
  };
}

// Enhanced preference-based matching criteria (Story 002)
export interface AdvancedMatchingCriteria extends MatchingCriteria {
  preferenceWeights: {
    physical: number;      // 0-1 weight for physical preferences (default: 0.3)
    lifestyle: number;     // 0-1 weight for lifestyle preferences (default: 0.25)
    social: number;        // 0-1 weight for social preferences (default: 0.25)
    relationship: number;  // 0-1 weight for relationship preferences (default: 0.2)
  };
  minimumThresholds: {
    overall: number;       // Minimum overall compatibility (0-1, default: 0.6)
    physical?: number;     // Minimum physical compatibility (default: 0.4)
    lifestyle?: number;    // Minimum lifestyle compatibility (default: 0.3)
    social?: number;       // Minimum social compatibility (default: 0.3)
    relationship?: number; // Minimum relationship compatibility (default: 0.4)
  };
  dealBreakers: string[]; // Hard filters that eliminate candidates
  mustHaves: string[];    // Required preferences that boost scoring
  niceToHaves: string[];  // Optional preferences that add scoring bonus
  enableAdvancedFiltering: boolean; // Whether to use advanced preference filtering
}

// Match result and scoring
export interface MatchResult {
  matchId: string;
  userId: string;
  targetUserId: string;
  score: number; // 0-1 compatibility score
  distance: number; // in kilometers
  distanceUnit: 'km' | 'miles';
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'liked' | 'passed' | 'mutual' | 'expired';
  isNewMatch: boolean;
  matchFactors: {
    locationScore: number;
    ageCompatibility: number;
    preferenceAlignment: number;
    activityScore: number;
    verificationBonus: number;
    premiumBonus?: number;
  };
}

// Enhanced preference-based match result (Story 002)
export interface PreferenceMatchResult extends MatchResult {
  compatibilityScore: number;           // 0-1 overall compatibility
  categoryScores: {
    physical: number;                   // 0-1 physical compatibility
    lifestyle: number;                  // 0-1 lifestyle compatibility
    social: number;                     // 0-1 social compatibility
    relationship: number;               // 0-1 relationship compatibility
  };
  preferenceAlignment: {
    matches: string[];                  // Preferences that matched
    mismatches: string[];               // Preferences that didn't match
    dealBreakersPassed: boolean;        // No deal breakers triggered
    mustHavesSatisfied: number;         // Count of must-haves satisfied
    niceToHavesMatched: number;         // Count of nice-to-haves matched
  };
  matchExplanation: string;             // Why this match was suggested
  improvementSuggestions?: string[];    // How to get better matches
}

// Preference category scoring breakdown
export interface CategoryScores {
  physical: {
    score: number;
    breakdown: {
      bodyType: number;
      height: number;
      age: number;
      appearance: number;
    };
  };
  lifestyle: {
    score: number;
    breakdown: {
      smoking: number;
      drinking: number;
      exercise: number;
      diet: number;
      socialHabits: number;
    };
  };
  social: {
    score: number;
    breakdown: {
      education: number;
      occupation: number;
      interests: number;
      languages: number;
      personality: number;
    };
  };
  relationship: {
    score: number;
    breakdown: {
      relationshipType: number;
      sexualOrientation: number;
      commitmentLevel: number;
      familyGoals: number;
      communication: number;
    };
  };
}

// Preference alignment analysis
export interface PreferenceAlignment {
  totalScore: number;
  categoryAlignments: CategoryScores;
  matchedPreferences: {
    physical: string[];
    lifestyle: string[];
    social: string[];
    relationship: string[];
  };
  mismatchedPreferences: {
    physical: string[];
    lifestyle: string[];
    social: string[];
    relationship: string[];
  };
  dealBreakerAnalysis: {
    passed: boolean;
    triggeredDealBreakers: string[];
    passedDealBreakers: string[];
  };
  mustHaveAnalysis: {
    totalMustHaves: number;
    satisfiedMustHaves: number;
    satisfiedItems: string[];
    missedItems: string[];
  };
  niceToHaveAnalysis: {
    totalNiceToHaves: number;
    matchedNiceToHaves: number;
    matchedItems: string[];
    missedItems: string[];
  };
}

// Match discovery and queue
export interface MatchDiscovery {
  discoveryId: string;
  userId: string;
  totalMatches: number;
  matchesReturned: number;
  matches: MatchResult[];
  hasMoreMatches: boolean;
  nextPageToken?: string;
  refreshedAt: Date;
  locationUsed: GeoLocation;
  criteriaUsed: MatchingCriteria;
}

export interface MatchQueue {
  queueId: string;
  userId: string;
  pendingMatches: MatchResult[];
  processedCount: number;
  totalCount: number;
  lastProcessedAt: Date;
  queueStatus: 'active' | 'paused' | 'exhausted' | 'error';
  refreshInterval: number; // minutes
}

// User interactions with matches
export interface MatchInteraction {
  interactionId: string;
  matchId: string;
  userId: string;
  targetUserId: string;
  action: 'like' | 'pass' | 'super_like' | 'view' | 'report';
  timestamp: Date;
  context: {
    viewDuration?: number; // seconds
    swipeDirection?: 'left' | 'right' | 'up';
    deviceInfo?: string;
  };
  metadata?: Record<string, any>;
}

// Mutual matches (when both users like each other)
export interface MutualMatch {
  mutualMatchId: string;
  userIds: [string, string];
  matchIds: [string, string]; // Individual match IDs
  matchedAt: Date;
  isActive: boolean;
  conversationStarted: boolean;
  firstMessageSent?: boolean;
  firstMessageAt?: Date;
  lastActivityAt: Date;
  matchSource: 'discovery' | 'premium_boost' | 'super_like';
}

// Freemium matching controls
export interface MatchingLimits {
  userId: string;
  userTier: 'free' | 'premium' | 'vip';
  dailyLimits: {
    maxMatches: number; // -1 for unlimited
    maxLikes: number;
    maxSuperLikes: number;
  };
  currentUsage: {
    matchesUsed: number;
    likesUsed: number;
    superLikesUsed: number;
    resetAt: Date; // When daily limits reset
  };
  premiumFeatures: {
    unlimitedMatches: boolean;
    priorityMatching: boolean;
    advancedFilters: boolean;
    boostAvailable: boolean;
    superLikesIncluded: number;
  };
  restrictions: {
    canViewMatches: boolean;
    canLikeProfiles: boolean;
    canUseSuperLike: boolean;
    requiresUpgrade: boolean;
    upgradeReason?: string;
  };
}

// Match notifications
export interface MatchNotification {
  notificationId: string;
  userId: string;
  type: 'new_match' | 'mutual_match' | 'super_like_received' | 'match_expiring' | 'daily_matches_ready';
  matchId?: string;
  mutualMatchId?: string;
  title: string;
  body: string;
  data: Record<string, any>;
  scheduledFor: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels: ('push' | 'email' | 'in_app')[];
}

// Matching preferences and settings
export interface MatchingSettings {
  userId: string;
  isActive: boolean; // Whether user wants to be shown to others
  discoverySettings: {
    showMe: boolean;
    ageRange: { min: number; max: number };
    maxDistance: number;
    onlyShowVerified: boolean;
    onlyShowWithPhotos: boolean;
    hideFromFacebook: boolean; // If connected to Facebook
  };
  notificationSettings: {
    newMatches: boolean;
    mutualMatches: boolean;
    superLikes: boolean;
    matchReminders: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
  };
  premiumSettings?: {
    priorityListing: boolean;
    advancedFilters: {
      education: string[];
      profession: string[];
      interests: string[];
    };
    locationOverride?: GeoLocation; // Travel mode
  };
}

// Match analytics and insights
export interface MatchAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: {
    profileViews: number;
    likesReceived: number;
    likesSent: number;
    matches: number;
    mutualMatches: number;
    superLikesReceived: number;
    superLikesSent: number;
    messagesFromMatches: number;
  };
  insights: {
    peakActivityHours: number[];
    topMatchingFactors: string[];
    averageMatchDistance: number;
    conversionRate: number; // matches to conversations
    popularityScore: number; // relative to other users
  };
  recommendations: string[];
}

// Matching algorithm configuration
export interface MatchingAlgorithmConfig {
  version: string;
  weights: {
    distance: number; // Weight for location proximity
    age: number; // Weight for age compatibility
    preferences: number; // Weight for preference alignment
    activity: number; // Weight for recent activity
    verification: number; // Bonus for verified users
    premium: number; // Bonus for premium users
    photos: number; // Weight for photo count
    completeness: number; // Weight for profile completeness
  };
  penalties: {
    incompleteProfile: number;
    noPhotos: number;
    unverified: number;
    inactive: number;
  };
  thresholds: {
    minimumScore: number; // Minimum score to show as match
    excellentScore: number; // Score threshold for "excellent match"
    maxDistance: number; // Maximum distance to consider (km)
    maxInactivity: number; // Maximum days inactive to consider
  };
  features: {
    enableMachineLearning: boolean;
    enableCollaborativeFiltering: boolean;
    enableSeasonalAdjustments: boolean;
    enableLocationHistory: boolean;
  };
}

// Location services configuration
export interface LocationConfig {
  accuracy: 'low' | 'balanced' | 'high' | 'highest';
  enableBackground: boolean;
  distanceFilter: number; // meters
  enableHighAccuracy: boolean;
  timeout: number; // milliseconds
  maximumAge: number; // milliseconds
  enableForegroundService: boolean; // Android
  showLocationDialog: boolean;
  interval: number; // location update interval in milliseconds
}

// API request/response types
export interface GetMatchesRequest {
  criteria: MatchingCriteria;
  pagination?: {
    limit: number;
    offset: number;
    pageToken?: string;
  };
}

export interface GetMatchesResponse {
  discovery: MatchDiscovery;
  limits: MatchingLimits;
  settings: MatchingSettings;
}

export interface LikeProfileRequest {
  matchId: string;
  targetUserId: string;
  isSuperLike?: boolean;
  source?: 'discovery' | 'profile_view' | 'search';
}

export interface LikeProfileResponse {
  success: boolean;
  isMutualMatch: boolean;
  mutualMatch?: MutualMatch;
  limitsExceeded: boolean;
  remainingLikes?: number;
  message?: string;
}

// Error types
export interface MatchingError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export class MatchingValidationError extends Error {
  constructor(
    public errors: MatchingError[],
    message: string = 'Matching validation failed'
  ) {
    super(message);
    this.name = 'MatchingValidationError';
  }
}

export class LocationPermissionError extends Error {
  constructor(message: string = 'Location permission required') {
    super(message);
    this.name = 'LocationPermissionError';
  }
}

export class MatchingLimitExceededError extends Error {
  constructor(
    public limitType: string,
    public resetTime: Date,
    message?: string
  ) {
    super(message || `${limitType} limit exceeded. Resets at ${resetTime.toISOString()}`);
    this.name = 'MatchingLimitExceededError';
  }
}

export class NoMatchesFoundError extends Error {
  constructor(message: string = 'No matches found with current criteria') {
    super(message);
    this.name = 'NoMatchesFoundError';
  }
}

// Preference analytics and optimization types (Story 002)
export interface PreferenceAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  preferenceMetrics: {
    totalCandidatesEvaluated: number;
    dealBreakerEliminations: number;
    thresholdEliminations: number;
    highCompatibilityMatches: number;
    averageCompatibilityScore: number;
    categoryAverages: {
      physical: number;
      lifestyle: number;
      social: number;
      relationship: number;
    };
  };
  optimizationInsights: {
    restrictivePreferences: string[];
    underutilizedPreferences: string[];
    improvementSuggestions: string[];
    expandRecommendations: string[];
  };
  matchSuccessMetrics: {
    preferenceMatchesToLikes: number;
    preferenceMatchesToConversations: number;
    topMatchingFactors: string[];
    leastImportantFactors: string[];
  };
}

export interface OptimizationGoals {
  prioritizeQuantity?: boolean;     // Get more matches
  prioritizeQuality?: boolean;      // Get better compatibility
  increaseDistance?: boolean;       // Expand geographic range
  expandAge?: boolean;              // Expand age preferences
  relaxDealBreakers?: boolean;      // Reduce deal breaker restrictions
  focusOnActivity?: boolean;        // Prioritize active users
  improveConversions?: boolean;     // Focus on factors that lead to conversations
}

export interface PreferenceOptimizationSuggestions {
  currentSettings: {
    restrictiveness: 'very_strict' | 'strict' | 'moderate' | 'relaxed' | 'very_relaxed';
    expectedMatches: number;
    averageCompatibility: number;
  };
  suggestions: {
    type: 'expand_age' | 'increase_distance' | 'remove_dealbreaker' | 'adjust_weight' | 'add_preference';
    description: string;
    impact: 'low' | 'medium' | 'high';
    expectedIncrease: number; // percentage increase in matches
    tradeoff?: string; // what user might sacrifice
  }[];
  presets: {
    name: string;
    description: string;
    changes: string[];
    expectedMatches: number;
  }[];
}

export interface MatchExplanation {
  matchId: string;
  primaryReasons: string[];
  secondaryReasons: string[];
  compatibilityHighlights: string[];
  potentialConcerns: string[];
  overallAssessment: 'excellent' | 'very_good' | 'good' | 'fair';
  recommendationStrength: number; // 0-1
}

export interface PreferenceMatchAnalytics {
  userId: string;
  totalMatches: number;
  qualityDistribution: {
    excellent: number;
    veryGood: number;
    good: number;
    fair: number;
  };
  categoryPerformance: {
    physical: { averageScore: number; importance: number };
    lifestyle: { averageScore: number; importance: number };
    social: { averageScore: number; importance: number };
    relationship: { averageScore: number; importance: number };
  };
  userBehaviorInsights: {
    preferenceConsistency: number; // how consistent user likes are with preferences
    dealBreakerViolations: number; // times user liked despite deal breakers
    mostInfluentialFactors: string[];
    leastInfluentialFactors: string[];
  };
  recommendations: {
    adjustPreferences: string[];
    adjustWeights: string[];
    addFilters: string[];
    removeFilters: string[];
  };
}

// Preference filtering configuration
export interface PreferenceFilteringConfig {
  enableCategoryWeighting: boolean;
  enableDealBreakerFiltering: boolean;
  enableMustHaveFiltering: boolean;
  enableNiceToHaveBoosts: boolean;
  defaultWeights: {
    physical: number;
    lifestyle: number;
    social: number;
    relationship: number;
  };
  defaultThresholds: {
    overall: number;
    physical: number;
    lifestyle: number;
    social: number;
    relationship: number;
  };
  scoringAlgorithm: 'weighted_average' | 'multiplicative' | 'hybrid';
  enableMachineLearning: boolean;
  enableUserFeedbackLearning: boolean;
}
