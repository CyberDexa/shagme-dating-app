/**
 * Persona Identity Verification Provider
 * Integration with Persona API for UK government ID verification
 * Alternative provider for document verification with strong GDPR compliance
 */

import { IDVerificationProvider } from '../../../types/providers';
import { 
  VerificationResult, 
  DocumentData, 
  VerificationConfig, 
  ProviderConfig,
  VerificationError,
  VerificationErrorCode,
  DocumentValidation,
  AgeValidation,
  PersonalData,
  DocumentType,
  VerificationStatus
} from '../../../types/verification';
import { 
  PROVIDER_CONFIGS,
  DOCUMENT_TYPE_MAPPINGS,
  VERIFICATION_ERROR_MESSAGES,
  CONFIDENCE_THRESHOLDS,
  API_ENDPOINTS
} from '../../../constants/verification';
import { validateAge, validateDocument } from '../../../utils/validation';
import { secureStoreVerificationData } from '../../../utils/encryption';

export class PersonaProvider implements IDVerificationProvider {
  public readonly name = 'persona';
  public config: ProviderConfig;
  private apiToken: string = '';
  private baseUrl: string = '';
  private isInitialized = false;

  constructor() {
    this.config = {
      name: this.name,
      credentials: {
        apiKey: '',
        region: 'EU',
        environment: 'sandbox',
      },
      isEnabled: false,
      isPrimary: false,
      timeout: PROVIDER_CONFIGS.PERSONA.timeout,
      rateLimits: PROVIDER_CONFIGS.PERSONA.rateLimits,
    };
  }

  async initialize(config: ProviderConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error('Invalid Persona configuration');
    }

    this.config = { ...config };
    this.apiToken = config.credentials.apiKey;
    
    // Persona uses the same endpoint for all regions
    this.baseUrl = config.credentials.environment === 'production' 
      ? API_ENDPOINTS.PERSONA.production 
      : API_ENDPOINTS.PERSONA.sandbox;
    
    // Test API connection
    await this.testConnection();
    this.isInitialized = true;
  }

  async verifyDocument(
    document: DocumentData, 
    config?: VerificationConfig
  ): Promise<VerificationResult> {
    if (!this.isInitialized) {
      throw new Error('Persona provider not initialized');
    }

    const startTime = Date.now();
    const verificationId = this.generateVerificationId();

    try {
      // Step 1: Create verification
      const verification = await this.createVerification(document, config);
      
      // Step 2: Upload document
      await this.uploadDocument(verification.id, document);
      
      // Step 3: Submit verification
      const submittedVerification = await this.submitVerification(verification.id);
      
      // Step 4: Poll for results
      const completedVerification = await this.pollVerificationResult(verification.id);
      
      // Step 5: Process results
      const result = await this.processVerificationResult(
        completedVerification,
        verificationId,
        startTime,
        config
      );

      // Step 6: Store result securely
      await this.storeVerificationResult(result);
      
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        id: verificationId,
        status: 'failed',
        provider: this.name,
        confidence: 0,
        processingTime,
        createdAt: new Date(),
        metadata: {
          apiVersion: 'v1',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        error: {
          code: this.mapErrorToCode(error),
          message: this.getErrorMessage(error),
          details: error,
        },
      };
    }
  }

  async isServiceAvailable(): Promise<boolean> {
    try {
      // Check API health by attempting to create a verification template
      await this.makeRequest('GET', '/verification-templates');
      return true;
    } catch {
      return false;
    }
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unavailable';
    latency: number;
    uptime: number;
    details?: any;
  }> {
    const startTime = Date.now();
    
    try {
      await this.makeRequest('GET', '/verification-templates');
      const latency = Date.now() - startTime;
      
      return {
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
        uptime: 1,
        details: {
          environment: this.config.credentials.environment,
        },
      };
    } catch (error) {
      return {
        status: 'unavailable',
        latency: Date.now() - startTime,
        uptime: 0,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  validateConfig(config: ProviderConfig): boolean {
    return !!(
      config.credentials.apiKey &&
      ['sandbox', 'production'].includes(config.credentials.environment || 'sandbox')
    );
  }

  getSupportedDocumentTypes(): string[] {
    return [...PROVIDER_CONFIGS.PERSONA.supportedDocumentTypes];
  }

  async destroy(): Promise<void> {
    this.isInitialized = false;
    this.apiToken = '';
    this.baseUrl = '';
  }

  // Private methods

  private async testConnection(): Promise<void> {
    try {
      await this.makeRequest('GET', '/verification-templates');
    } catch (error) {
      throw new Error(`Persona API connection failed: ${error}`);
    }
  }

  private async createVerification(
    document: DocumentData,
    config?: VerificationConfig
  ): Promise<{ id: string }> {
    const personaDocType = DOCUMENT_TYPE_MAPPINGS.PERSONA[document.type];
    
    if (!personaDocType) {
      throw new Error(`Unsupported document type: ${document.type}`);
    }

    const verificationData = {
      data: {
        type: 'verification/government-id',
        attributes: {
          'inquiry-template-id': await this.getInquiryTemplateId(),
          'government-id-template-id': await this.getGovernmentIdTemplateId(),
        },
      },
    };

    const response = await this.makeRequest('POST', '/verifications/government-id', verificationData);
    return { id: response.data.id };
  }

  private async uploadDocument(
    verificationId: string,
    document: DocumentData
  ): Promise<void> {
    // Create document
    const documentData = {
      data: {
        type: 'document/government-id',
        attributes: {
          'verification-id': verificationId,
          'document-type': DOCUMENT_TYPE_MAPPINGS.PERSONA[document.type],
          'side': document.side || 'front',
        },
      },
    };

    const documentResponse = await this.makeRequest('POST', '/documents/government-id', documentData);
    const documentId = documentResponse.data.id;

    // Upload file
    const formData = new FormData();
    const blob = this.base64ToBlob(document.file, document.mimeType);
    formData.append('file', blob, document.fileName);

    await this.makeRequest('POST', `/documents/government-id/${documentId}/upload`, formData, {
      'Content-Type': 'multipart/form-data',
    });
  }

  private async submitVerification(verificationId: string): Promise<any> {
    const response = await this.makeRequest('POST', `/verifications/government-id/${verificationId}/submit`);
    return response.data;
  }

  private async pollVerificationResult(verificationId: string): Promise<any> {
    const maxAttempts = 60; // 60 seconds max wait time
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await this.makeRequest('GET', `/verifications/government-id/${verificationId}`);
      const verification = response.data;
      
      if (['passed', 'failed', 'requires_retry', 'canceled'].includes(verification.attributes.status)) {
        return verification;
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Verification timeout - check taking too long');
  }

  private async processVerificationResult(
    verification: any,
    verificationId: string,
    startTime: number,
    config?: VerificationConfig
  ): Promise<VerificationResult> {
    const processingTime = Date.now() - startTime;
    const attributes = verification.attributes;
    
    // Extract personal data
    const personalData = this.extractPersonalData(attributes);
    
    // Validate age
    const ageValidation = personalData.dateOfBirth 
      ? validateAge(personalData.dateOfBirth)
      : undefined;
    
    // Validate document
    const documentValidation = validateDocument(personalData, 'passport'); // Would determine actual type
    
    // Determine overall status
    const status = this.determineStatus(attributes, ageValidation, documentValidation);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(attributes, documentValidation);

    return {
      id: verificationId,
      status,
      provider: this.name,
      personalData,
      ageValidation,
      documentValidation,
      confidence,
      processingTime,
      createdAt: new Date(startTime),
      completedAt: new Date(),
      metadata: {
        apiVersion: 'v1',
        requestId: verification.id,
        personaVerificationId: verification.id,
        personaStatus: attributes.status,
      },
    };
  }

  private extractPersonalData(attributes: any): PersonalData {
    return {
      firstName: attributes.name_first || '',
      lastName: attributes.name_last || '',
      dateOfBirth: attributes.birthdate || '',
      nationality: attributes.nationality || '',
      documentNumber: attributes.identification_number || '',
      issuingCountry: attributes.issuing_subdivision || '',
      address: attributes.address_street_1 ? {
        street: attributes.address_street_1,
        city: attributes.address_city,
        postalCode: attributes.address_postal_code,
        country: 'GBR', // Assuming UK
      } : undefined,
    };
  }

  private determineStatus(
    attributes: any,
    ageValidation?: AgeValidation,
    documentValidation?: DocumentValidation
  ): VerificationStatus {
    // Check Persona status
    if (attributes.status === 'passed') {
      // Check age requirement
      if (ageValidation && !ageValidation.meetsMinimumAge) {
        return 'rejected';
      }
      
      // Check document validation
      if (documentValidation && !documentValidation.isAuthentic) {
        return 'failed';
      }
      
      return 'verified';
    }
    
    if (attributes.status === 'requires_retry') {
      return 'pending';
    }
    
    return 'failed';
  }

  private calculateConfidence(attributes: any, documentValidation?: DocumentValidation): number {
    let confidence: number = CONFIDENCE_THRESHOLDS.PERSONA.overall;
    
    // Adjust based on Persona status and checks
    if (attributes.status === 'passed') {
      // Check individual verification checks
      const checks = attributes.checks || [];
      const passedChecks = checks.filter((check: any) => check.status === 'passed').length;
      const totalChecks = checks.length;
      
      if (totalChecks > 0) {
        const checkRatio = passedChecks / totalChecks;
        confidence = Math.max(confidence, checkRatio * 0.95);
      }
    } else if (attributes.status === 'requires_retry') {
      confidence = Math.min(confidence, 0.6);
    } else {
      confidence = Math.min(confidence, 0.3);
    }
    
    // Adjust based on document validation
    if (documentValidation) {
      confidence = Math.min(confidence, documentValidation.confidence);
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  private async getInquiryTemplateId(): Promise<string> {
    // This would typically be configured or retrieved from templates
    return 'itmpl_DEFAULT_INQUIRY_TEMPLATE';
  }

  private async getGovernmentIdTemplateId(): Promise<string> {
    // This would typically be configured or retrieved from templates
    return 'itmpl_DEFAULT_GOVERNMENT_ID_TEMPLATE';
  }

  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestHeaders: Record<string, string> = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Accept': 'application/json',
      'Persona-Version': '2023-01-05',
      ...headers,
    };
    
    // Don't set Content-Type for FormData
    if (!(data instanceof FormData) && data) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (data) {
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Persona API error: ${response.status} - ${errorData.errors?.[0]?.title || response.statusText}`);
    }
    
    return await response.json();
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64.split(',')[1] || base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private generateVerificationId(): string {
    return `persona_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapErrorToCode(error: any): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('timeout')) return 'PROCESSING_TIMEOUT';
      if (message.includes('unauthorized') || message.includes('bearer')) return 'AUTHENTICATION_FAILED';
      if (message.includes('rate limit')) return 'RATE_LIMIT_EXCEEDED';
      if (message.includes('unsupported')) return 'UNSUPPORTED_DOCUMENT_TYPE';
      if (message.includes('network') || message.includes('connection')) return 'NETWORK_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  private getErrorMessage(error: any): string {
    const errorCode = this.mapErrorToCode(error);
    return VERIFICATION_ERROR_MESSAGES[errorCode as keyof typeof VERIFICATION_ERROR_MESSAGES] || 
           VERIFICATION_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  private async storeVerificationResult(result: VerificationResult): Promise<void> {
    const storageKey = `verification_result_${result.id}`;
    await secureStoreVerificationData(storageKey, result, {
      encrypt: true,
      expiration: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
    });
  }
}
