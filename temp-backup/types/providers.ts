/**
 * Provider Interface Types
 * Defines contracts for identity verification service providers
 */

import { VerificationResult, DocumentData, VerificationConfig, ProviderConfig } from './verification';

export interface IDVerificationProvider {
  readonly name: string;
  readonly config: ProviderConfig;
  
  /**
   * Initialize the provider with configuration
   */
  initialize(config: ProviderConfig): Promise<void>;
  
  /**
   * Verify a government ID document
   */
  verifyDocument(document: DocumentData, config?: VerificationConfig): Promise<VerificationResult>;
  
  /**
   * Check if the service is currently available
   */
  isServiceAvailable(): Promise<boolean>;
  
  /**
   * Get provider-specific health status
   */
  getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unavailable';
    latency: number;
    uptime: number;
    details?: any;
  }>;
  
  /**
   * Validate configuration before use
   */
  validateConfig(config: ProviderConfig): boolean;
  
  /**
   * Get supported document types for UK
   */
  getSupportedDocumentTypes(): string[];
  
  /**
   * Clean up resources
   */
  destroy(): Promise<void>;
}

export interface ProviderFactory {
  create(providerName: string, config: ProviderConfig): IDVerificationProvider;
  getSupportedProviders(): string[];
}

// Provider-specific result interfaces
export interface OnfidoResult {
  id: string;
  status: 'in_progress' | 'awaiting_applicant' | 'complete' | 'withdrawn';
  result: 'clear' | 'consider' | 'unidentified';
  form_uri?: string;
  redirect_uri?: string;
  results_uri?: string;
  reports: OnfidoReport[];
  tags: string[];
  applicant_id: string;
  created_at: string;
  href: string;
}

export interface OnfidoReport {
  id: string;
  name: string;
  status: 'awaiting_data' | 'awaiting_approval' | 'cancelled' | 'complete' | 'withdrawn';
  result: 'clear' | 'consider' | 'unidentified';
  sub_result?: string;
  variant?: string;
  properties: any;
  created_at: string;
  href: string;
}

export interface PersonaResult {
  type: 'verification/government-id';
  id: string;
  attributes: {
    status: 'initiated' | 'submitted' | 'passed' | 'failed' | 'requires_retry' | 'canceled' | 'confirmed';
    created_at: string;
    completed_at?: string;
    name_first?: string;
    name_last?: string;
    birthdate?: string;
    address_street_1?: string;
    address_city?: string;
    address_subdivision?: string;
    address_postal_code?: string;
    identification_number?: string;
    identification_class?: string;
    issuing_authority?: string;
    issuing_subdivision?: string;
    nationality?: string;
    document_type?: string;
    checks: PersonaCheck[];
  };
}

export interface PersonaCheck {
  name: string;
  status: 'passed' | 'failed' | 'requires_retry' | 'canceled' | 'not_applicable';
  reasons: string[];
  requirement: 'required' | 'optional';
  metadata?: any;
}

export interface JumioResult {
  verificationStatus: 'APPROVED_VERIFIED' | 'DENIED_FRAUD' | 'DENIED_UNSUPPORTED_ID_TYPE' | 'DENIED_UNSUPPORTED_ID_COUNTRY' | 'ERROR_NOT_READABLE_ID' | 'NO_ID_UPLOADED';
  idScanStatus: 'SUCCESS' | 'ERROR';
  identityVerification: {
    similarity: 'MATCH' | 'NO_MATCH' | 'NOT_POSSIBLE';
    validity: boolean;
    reason?: string;
  };
  idScanSource: 'WEB' | 'SDK';
  verificationId: string;
  idCountry: string;
  idType: string;
  idSubtype?: string;
  rejectReason?: {
    rejectReasonCode: string;
    rejectReasonDescription: string;
    rejectReasonDetails: any[];
  };
  idScanImage?: string;
  faceImage?: string;
}
