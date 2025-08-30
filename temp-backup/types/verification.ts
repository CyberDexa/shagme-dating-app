/**
 * UK ID Verification Types and Interfaces
 * Provides type definitions for identity verification services
 * Supporting multiple providers with consistent interfaces
 */

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'rejected';

export type DocumentType = 'passport' | 'driving_license' | 'national_id' | 'provisional_license';

export type Gender = 'M' | 'F' | 'X' | 'O'; // Male, Female, Non-binary, Other

export interface DocumentData {
  id: string;
  type: DocumentType;
  file: string; // Base64 encoded image
  side?: 'front' | 'back';
  mimeType: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface PersonalData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO 8601 format
  gender?: Gender;
  nationality?: string; // ISO 3166-1 alpha-3 country code
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string; // ISO 3166-1 alpha-3 country code
  };
  documentNumber: string;
  issueDate?: string; // ISO 8601 format
  expiryDate?: string; // ISO 8601 format
  issuingCountry?: string; // ISO 3166-1 alpha-3 country code
}

export interface AgeValidation {
  isValid: boolean;
  age: number;
  meetsMinimumAge: boolean; // Must be 20+
  calculatedFrom: string; // Source of age calculation
}

export interface DocumentValidation {
  isAuthentic: boolean;
  confidence: number; // 0-1 confidence score
  checks: {
    documentIntegrity: boolean;
    faceMatch?: boolean;
    mrzValid?: boolean;
    visualZoneValid?: boolean;
    securityFeatures?: boolean;
  };
  warnings: string[];
  errors: string[];
}

export interface VerificationResult {
  id: string;
  status: VerificationStatus;
  provider: string;
  personalData?: PersonalData;
  ageValidation?: AgeValidation;
  documentValidation?: DocumentValidation;
  confidence: number; // Overall confidence 0-1
  processingTime: number; // milliseconds
  createdAt: Date;
  completedAt?: Date;
  metadata: {
    apiVersion?: string;
    requestId?: string;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface VerificationConfig {
  enableAgeVerification: boolean;
  minimumAge: number;
  allowedDocumentTypes: DocumentType[];
  requireBothSides: boolean;
  enableFaceMatch: boolean;
  confidenceThreshold: number;
  maxRetries: number;
}

// Provider-specific interfaces
export interface ProviderCredentials {
  apiKey: string;
  apiSecret?: string;
  region?: 'EU' | 'US' | 'CA' | 'AP';
  environment?: 'sandbox' | 'production';
  webhookSecret?: string;
}

export interface ProviderConfig {
  name: string;
  credentials: ProviderCredentials;
  isEnabled: boolean;
  isPrimary: boolean;
  timeout: number; // milliseconds
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

// Error types
export type VerificationErrorCode = 
  | 'INVALID_DOCUMENT'
  | 'DOCUMENT_EXPIRED'
  | 'DOCUMENT_DAMAGED'
  | 'UNSUPPORTED_DOCUMENT_TYPE'
  | 'AGE_REQUIREMENT_NOT_MET'
  | 'FACE_MISMATCH'
  | 'DOCUMENT_FRAUDULENT'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AUTHENTICATION_FAILED'
  | 'NETWORK_ERROR'
  | 'PROCESSING_TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface VerificationError extends Error {
  code: VerificationErrorCode;
  provider?: string;
  retryable: boolean;
  details?: any;
}

// UK-specific validation rules
export interface UKValidationRules {
  minimumAge: 20;
  acceptedDocuments: {
    passport: {
      required: true;
      biometric: boolean;
    };
    drivingLicense: {
      provisional: boolean;
      photocard: boolean;
    };
    nationalId: {
      acceptEUID: boolean;
    };
  };
  ageVerificationMethod: 'document_date_of_birth' | 'government_database';
  gdprCompliance: {
    dataRetention: string; // ISO 8601 duration
    consentRequired: boolean;
    rightToErasure: boolean;
  };
}

// Webhook event types
export type WebhookEventType = 
  | 'verification.completed'
  | 'verification.failed'
  | 'verification.expired'
  | 'verification.updated';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: VerificationResult;
  timestamp: Date;
  signature: string;
}

// Analytics and monitoring
export interface VerificationMetrics {
  totalVerifications: number;
  successRate: number;
  averageProcessingTime: number;
  providerPerformance: {
    [providerName: string]: {
      successRate: number;
      averageTime: number;
      errorRate: number;
    };
  };
  ageVerificationStats: {
    averageAge: number;
    rejectedUnder20: number;
    ageDistribution: { [ageRange: string]: number };
  };
}
