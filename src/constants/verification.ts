/**
 * Verification Service Constants
 * Configuration values and constants for UK ID verification
 */

import { UKValidationRules, VerificationConfig } from '../types/verification';

// UK-specific validation rules and requirements
export const UK_VALIDATION_RULES: UKValidationRules = {
  minimumAge: 20,
  acceptedDocuments: {
    passport: {
      required: true,
      biometric: true,
    },
    drivingLicense: {
      provisional: true,
      photocard: true,
    },
    nationalId: {
      acceptEUID: true, // Accept EU ID cards for eligible residents
    },
  },
  ageVerificationMethod: 'document_date_of_birth',
  gdprCompliance: {
    dataRetention: 'P2Y', // 2 years as per UK regulations
    consentRequired: true,
    rightToErasure: true,
  },
};

// Default verification configuration
export const DEFAULT_VERIFICATION_CONFIG: VerificationConfig = {
  enableAgeVerification: true,
  minimumAge: 20,
  allowedDocumentTypes: ['passport', 'driving_license', 'national_id'],
  requireBothSides: false, // Only for driving licenses
  enableFaceMatch: false, // Enabled in later epic (facial recognition)
  confidenceThreshold: 0.85, // 85% minimum confidence
  maxRetries: 3,
};

// Provider configurations
export const PROVIDER_CONFIGS = {
  ONFIDO: {
    name: 'onfido',
    supportedRegions: ['EU', 'US', 'CA'],
    defaultRegion: 'EU',
    supportedDocumentTypes: ['passport', 'driving_license', 'national_id'],
    features: {
      realTimeVerification: true,
      faceMatch: true,
      ageVerification: true,
      ukCompliance: true,
    },
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
    },
    timeout: 30000, // 30 seconds
  },
  PERSONA: {
    name: 'persona',
    supportedRegions: ['US', 'EU'],
    defaultRegion: 'EU',
    supportedDocumentTypes: ['passport', 'driving_license'],
    features: {
      realTimeVerification: true,
      faceMatch: true,
      ageVerification: true,
      ukCompliance: true,
    },
    rateLimits: {
      requestsPerMinute: 100,
      requestsPerDay: 50000,
    },
    timeout: 25000, // 25 seconds
  },
  JUMIO: {
    name: 'jumio',
    supportedRegions: ['EU', 'US', 'AP'],
    defaultRegion: 'EU',
    supportedDocumentTypes: ['passport', 'driving_license', 'national_id'],
    features: {
      realTimeVerification: true,
      faceMatch: true,
      ageVerification: true,
      ukCompliance: true,
      mobileOptimized: true,
    },
    rateLimits: {
      requestsPerMinute: 120,
      requestsPerDay: 25000,
    },
    timeout: 35000, // 35 seconds
  },
} as const;

// Error messages for different scenarios
export const VERIFICATION_ERROR_MESSAGES = {
  INVALID_DOCUMENT: 'Please upload a clear, valid UK government ID document',
  DOCUMENT_EXPIRED: 'Your document has expired. Please provide a valid, current ID',
  DOCUMENT_DAMAGED: 'Document image is unclear or damaged. Please take a clearer photo',
  UNSUPPORTED_DOCUMENT_TYPE: 'This document type is not supported. Please use a UK passport, driving license, or national ID',
  AGE_REQUIREMENT_NOT_MET: 'You must be 20 or older to use this platform',
  FACE_MISMATCH: 'Face does not match the ID document. Please ensure good lighting and clear visibility',
  DOCUMENT_FRAUDULENT: 'Document appears to be fraudulent or tampered with',
  SERVICE_UNAVAILABLE: 'Verification service is temporarily unavailable. Please try again in a few minutes',
  RATE_LIMIT_EXCEEDED: 'Too many verification attempts. Please wait before trying again',
  AUTHENTICATION_FAILED: 'Verification service authentication failed. Please contact support',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection and try again',
  PROCESSING_TIMEOUT: 'Verification is taking longer than expected. Please try again',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please contact support if the issue persists',
} as const;

// API endpoints and configuration
export const API_ENDPOINTS = {
  ONFIDO: {
    EU: 'https://api.eu.onfido.com/v3.6',
    US: 'https://api.us.onfido.com/v3.6',
    CA: 'https://api.ca.onfido.com/v3.6',
  },
  PERSONA: {
    production: 'https://withpersona.com/api/v1',
    sandbox: 'https://withpersona.com/api/v1',
  },
  JUMIO: {
    EU: 'https://netverify.com/api/netverify/v2',
    US: 'https://netverify.com/api/netverify/v2',
    AP: 'https://netverify.com/api/netverify/v2',
  },
} as const;

// Document type mappings for different providers
export const DOCUMENT_TYPE_MAPPINGS = {
  ONFIDO: {
    passport: 'passport',
    driving_license: 'driving_licence',
    national_id: 'national_identity_card',
    provisional_license: 'driving_licence',
  },
  PERSONA: {
    passport: 'passport',
    driving_license: 'license',
    national_id: 'id_card',
    provisional_license: 'license',
  },
  JUMIO: {
    passport: 'PASSPORT',
    driving_license: 'DRIVING_LICENSE',
    national_id: 'ID_CARD',
    provisional_license: 'DRIVING_LICENSE',
  },
} as const;

// Confidence thresholds by provider
export const CONFIDENCE_THRESHOLDS = {
  ONFIDO: {
    document: 0.85,
    face: 0.90,
    overall: 0.85,
  },
  PERSONA: {
    document: 0.80,
    face: 0.85,
    overall: 0.80,
  },
  JUMIO: {
    document: 0.88,
    face: 0.92,
    overall: 0.88,
  },
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'SERVICE_UNAVAILABLE',
    'NETWORK_ERROR',
    'PROCESSING_TIMEOUT',
    'RATE_LIMIT_EXCEEDED',
  ],
} as const;

// GDPR compliance settings
export const GDPR_SETTINGS = {
  dataRetentionPeriod: 'P2Y', // 2 years
  anonymizationDelay: 'P30D', // 30 days after deletion request
  encryptionRequired: true,
  auditLogRetention: 'P7Y', // 7 years for audit logs
  consentCategories: [
    'identity_verification',
    'age_verification',
    'fraud_prevention',
    'regulatory_compliance',
  ],
} as const;

// Monitoring and analytics
export const MONITORING_CONFIG = {
  enableMetrics: true,
  enableHealthChecks: true,
  healthCheckInterval: 60000, // 1 minute
  metricsRetention: 'P90D', // 90 days
  alertThresholds: {
    successRate: 0.95, // Alert if success rate drops below 95%
    averageProcessingTime: 30000, // Alert if average time > 30 seconds
    errorRate: 0.05, // Alert if error rate > 5%
  },
} as const;
