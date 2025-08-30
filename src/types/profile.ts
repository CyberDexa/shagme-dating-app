/**
 * Profile Types for ShagMe
 * Epic 002: Profile Creation & Management
 * Story 001: Basic Profile Setup
 */

import { VerificationResult } from './verification';

// Location interface
export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  address?: string;
}

// Sexual orientation and intent
export type SexualOrientation = 
  | 'straight' 
  | 'gay' 
  | 'lesbian' 
  | 'bisexual' 
  | 'pansexual' 
  | 'queer' 
  | 'questioning' 
  | 'other';

export type SexualIntent = 'clear' | 'explicit';

export type RelationshipType = 
  | 'casual' 
  | 'hookup' 
  | 'friends_with_benefits' 
  | 'short_term' 
  | 'serious'
  | 'long_term'
  | 'open_relationship' 
  | 'polyamorous';

// Profile photo interface
export interface ProfilePhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
  isVerified: boolean;
  uploadedAt: Date;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationNotes?: string;
  order: number;
  metadata?: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
  };
}

// Personal information
export interface PersonalInfo {
  displayName: string;
  age: number;
  dateOfBirth: Date;
  location: Location;
  sexualOrientation: SexualOrientation;
  sexualIntent: SexualIntent;
  lookingFor: RelationshipType[];
  bio: string;
  occupation?: string;
  education?: string;
  height?: number; // in cm
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'plus_size' | 'muscular';
  ethnicity?: string;
  languages?: string[];
  lifestyle?: {
    smoking?: 'never' | 'socially' | 'regularly' | 'unknown';
    drinking?: 'never' | 'rarely' | 'socially' | 'frequently' | 'unknown';
    drugs?: 'never' | 'occasionally' | 'regularly' | 'unknown';
    exercise?: 'never' | 'rarely' | 'weekly' | 'daily' | 'unknown';
    diet?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'unknown';
  };
  interests?: string[];
}

// Matching preferences
export interface MatchingPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  maxDistance: number; // in km
  sexualOrientations: SexualOrientation[];
  relationshipTypes: RelationshipType[];
  bodyTypes?: string[];
  heightRange?: {
    min: number;
    max: number;
  };
  ethnicities?: string[];
  education?: string[];
  dealBreakers?: string[];
}

// Profile visibility settings
export interface ProfileVisibility {
  isVisible: boolean;
  hideAge: boolean;
  hideLocation: boolean;
  hideLastActive: boolean;
  showOnlyToVerified: boolean;
  incognito: boolean;
  distanceVisibility: 'exact' | 'approximate' | 'hidden';
  onlineStatus: 'online' | 'away' | 'invisible';
}

// Profile completion tracking
export interface ProfileCompletion {
  overallPercentage: number;
  personalInfo: number;
  photos: number;
  preferences: number;
  visibility: number;
  missingFields: string[];
  recommendedActions: string[];
}

// Main user profile interface
export interface UserProfile {
  userId: string;
  personalInfo: PersonalInfo;
  photos: ProfilePhoto[];
  preferences: MatchingPreferences;
  visibility: ProfileVisibility;
  completion: ProfileCompletion;
  
  // Profile metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  profileViews: number;
  profileLikes: number;
  
  // Verification integration
  verification: {
    isVerified: boolean;
    verificationResults: VerificationResult[];
    verificationScore: number;
    lastVerificationUpdate: Date;
  };
  
  // Premium features
  premium: {
    isActive: boolean;
    tier?: 'basic' | 'premium' | 'vip';
    expiresAt?: Date;
    features: string[];
  };
  
  // Safety and reporting
  safety: {
    isReported: boolean;
    reportCount: number;
    isBanned: boolean;
    banReason?: string;
    banExpiresAt?: Date;
    trustScore: number;
  };
}

// Profile creation flow types
export interface ProfileCreationStep {
  stepId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  validationErrors: string[];
}

export interface ProfileCreationSession {
  sessionId: string;
  userId: string;
  currentStep: string;
  steps: ProfileCreationStep[];
  tempData: Partial<UserProfile>;
  startedAt: Date;
  lastUpdatedAt: Date;
  expiresAt: Date;
}

// API interfaces
export interface CreateProfileRequest {
  personalInfo: Partial<PersonalInfo>;
  preferences?: Partial<MatchingPreferences>;
  visibility?: Partial<ProfileVisibility>;
}

export interface UpdateProfileRequest {
  personalInfo?: Partial<PersonalInfo>;
  preferences?: Partial<MatchingPreferences>;
  visibility?: Partial<ProfileVisibility>;
}

export interface UploadPhotoRequest {
  imageData: string; // base64 encoded
  isPrimary?: boolean;
  order?: number;
}

export interface ProfileSearchFilters {
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  ageRange?: {
    min: number;
    max: number;
  };
  sexualOrientations?: SexualOrientation[];
  relationshipTypes?: RelationshipType[];
  isVerified?: boolean;
  isOnline?: boolean;
  hasPhotos?: boolean;
}

// Profile view and interaction types
export interface ProfileView {
  viewerId: string;
  profileId: string;
  viewedAt: Date;
  duration: number; // in seconds
  source: 'discovery' | 'search' | 'match' | 'direct';
}

export interface ProfileLike {
  likerId: string;
  profileId: string;
  likedAt: Date;
  isMatch: boolean;
  source: 'discovery' | 'search' | 'profile';
}

// Validation schemas
export interface ProfileValidationRules {
  displayName: {
    minLength: number;
    maxLength: number;
    allowedCharacters: RegExp;
  };
  bio: {
    minLength: number;
    maxLength: number;
    prohibitedWords: string[];
  };
  photos: {
    minCount: number;
    maxCount: number;
    maxFileSize: number;
    allowedFormats: string[];
  };
  age: {
    min: number;
    max: number;
  };
}

// Error types
export interface ProfileError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export class ProfileValidationError extends Error {
  constructor(
    public errors: ProfileError[],
    message: string = 'Profile validation failed'
  ) {
    super(message);
    this.name = 'ProfileValidationError';
  }
}

export class ProfileNotFoundError extends Error {
  constructor(profileId: string) {
    super(`Profile not found: ${profileId}`);
    this.name = 'ProfileNotFoundError';
  }
}

export class ProfilePermissionError extends Error {
  constructor(action: string, profileId: string) {
    super(`Permission denied for action '${action}' on profile ${profileId}`);
    this.name = 'ProfilePermissionError';
  }
}
