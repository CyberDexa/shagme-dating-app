/**
 * Onfido Identity Verification Provider
 * Integration with Onfido API for UK government ID verification
 * Supports passport, driving license, and national ID verification
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
import { encryptData, secureStoreVerificationData } from '../../../utils/encryption';

export class OnfidoProvider implements IDVerificationProvider {
  public readonly name = 'onfido';
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
      timeout: PROVIDER_CONFIGS.ONFIDO.timeout,
      rateLimits: PROVIDER_CONFIGS.ONFIDO.rateLimits,
    };
  }

  async initialize(config: ProviderConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error('Invalid Onfido configuration');
    }

    this.config = { ...config };
    this.apiToken = config.credentials.apiKey;
    
    // Set API endpoint based on region
    const region = config.credentials.region || 'EU';
    this.baseUrl = API_ENDPOINTS.ONFIDO[region as keyof typeof API_ENDPOINTS.ONFIDO];
    
    // Test API connection
    await this.testConnection();
    this.isInitialized = true;
  }

  async verifyDocument(
    document: DocumentData, 
    config?: VerificationConfig
  ): Promise<VerificationResult> {
    if (!this.isInitialized) {
      throw new Error('Onfido provider not initialized');
    }

    const startTime = Date.now();
    const verificationId = this.generateVerificationId();

    try {
      // Step 1: Create applicant
      const applicant = await this.createApplicant();
      
      // Step 2: Upload document
      const documentUpload = await this.uploadDocument(applicant.id, document);
      
      // Step 3: Create check
      const check = await this.createCheck(applicant.id, documentUpload.id, config);
      
      // Step 4: Poll for results
      const checkResult = await this.pollCheckResult(check.id);
      
      // Step 5: Process and validate results
      const result = await this.processCheckResult(
        checkResult,
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
          apiVersion: 'v3.6',
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
      const response = await this.makeRequest('GET', '/status');
      return response.status === 'operational';
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
      await this.makeRequest('GET', '/status');
      const latency = Date.now() - startTime;
      
      return {
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
        uptime: 1, // Would be calculated from monitoring data
        details: {
          region: this.config.credentials.region,
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
      config.credentials.region &&
      ['EU', 'US', 'CA'].includes(config.credentials.region) &&
      ['sandbox', 'production'].includes(config.credentials.environment || 'sandbox')
    );
  }

  getSupportedDocumentTypes(): string[] {
    return [...PROVIDER_CONFIGS.ONFIDO.supportedDocumentTypes];
  }

  async destroy(): Promise<void> {
    this.isInitialized = false;
    this.apiToken = '';
    this.baseUrl = '';
  }

  // Private methods

  private async testConnection(): Promise<void> {
    try {
      await this.makeRequest('GET', '/status');
    } catch (error) {
      throw new Error(`Onfido API connection failed: ${error}`);
    }
  }

  private async createApplicant(): Promise<{ id: string }> {
    const response = await this.makeRequest('POST', '/applicants', {
      first_name: 'Verification',
      last_name: 'User',
    });
    
    return { id: response.id };
  }

  private async uploadDocument(
    applicantId: string, 
    document: DocumentData
  ): Promise<{ id: string }> {
    // Convert document type to Onfido format
    const onfidoDocType = DOCUMENT_TYPE_MAPPINGS.ONFIDO[document.type];
    
    if (!onfidoDocType) {
      throw new Error(`Unsupported document type: ${document.type}`);
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('applicant_id', applicantId);
    formData.append('type', onfidoDocType);
    formData.append('side', document.side || 'front');
    
    // Convert base64 to blob
    const blob = this.base64ToBlob(document.file, document.mimeType);
    formData.append('file', blob, document.fileName);

    const response = await this.makeRequest('POST', '/documents', formData, {
      'Content-Type': 'multipart/form-data',
    });
    
    return { id: response.id };
  }

  private async createCheck(
    applicantId: string,
    documentId: string,
    config?: VerificationConfig
  ): Promise<{ id: string }> {
    const checkConfig = {
      applicant_id: applicantId,
      report_names: ['document'],
      document_ids: [documentId],
      suppress_form_emails: true,
      asynchronous: false, // Synchronous for immediate results
    };

    const response = await this.makeRequest('POST', '/checks', checkConfig);
    return { id: response.id };
  }

  private async pollCheckResult(checkId: string): Promise<any> {
    const maxAttempts = 30; // 30 seconds max wait time
    let attempts = 0;

    while (attempts < maxAttempts) {
      const check = await this.makeRequest('GET', `/checks/${checkId}`);
      
      if (check.status === 'complete') {
        return check;
      }
      
      if (check.status === 'cancelled' || check.status === 'paused') {
        throw new Error(`Check ${check.status}`);
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Verification timeout - check taking too long');
  }

  private async processCheckResult(
    checkResult: any,
    verificationId: string,
    startTime: number,
    config?: VerificationConfig
  ): Promise<VerificationResult> {
    const processingTime = Date.now() - startTime;
    
    // Extract document report
    const documentReport = checkResult.reports?.find((r: any) => r.name === 'document');
    
    if (!documentReport) {
      throw new Error('No document report found');
    }

    // Extract personal data from document
    const personalData = this.extractPersonalData(documentReport);
    
    // Validate age
    const ageValidation = personalData.dateOfBirth 
      ? validateAge(personalData.dateOfBirth)
      : undefined;
    
    // Validate document
    const documentValidation = validateDocument(personalData, 'passport'); // Would determine actual type
    
    // Determine overall status
    const status = this.determineStatus(checkResult, ageValidation, documentValidation);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(checkResult, documentValidation);

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
        apiVersion: 'v3.6',
        requestId: checkResult.id,
        onfidoCheckId: checkResult.id,
        onfidoResult: checkResult.result,
      },
    };
  }

  private extractPersonalData(documentReport: any): PersonalData {
    const properties = documentReport.properties || {};
    
    return {
      firstName: properties.first_name || '',
      lastName: properties.last_name || '',
      dateOfBirth: properties.date_of_birth || '',
      gender: this.mapGender(properties.gender),
      nationality: properties.nationality || '',
      documentNumber: properties.document_number || '',
      issueDate: properties.date_of_issue || '',
      expiryDate: properties.date_of_expiry || '',
      issuingCountry: properties.issuing_country || '',
      address: properties.address ? {
        street: properties.address.flat_number + ' ' + properties.address.street,
        city: properties.address.town,
        postalCode: properties.address.postcode,
        country: properties.address.country,
      } : undefined,
    };
  }

  private determineStatus(
    checkResult: any,
    ageValidation?: AgeValidation,
    documentValidation?: DocumentValidation
  ): VerificationStatus {
    // Check Onfido result
    if (checkResult.result === 'clear') {
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
    
    if (checkResult.result === 'consider') {
      return 'pending'; // Might need manual review
    }
    
    return 'failed';
  }

  private calculateConfidence(checkResult: any, documentValidation?: DocumentValidation): number {
    let confidence: number = CONFIDENCE_THRESHOLDS.ONFIDO.overall;
    
    // Adjust based on Onfido result
    if (checkResult.result === 'clear') {
      confidence = Math.max(confidence, 0.95);
    } else if (checkResult.result === 'consider') {
      confidence = Math.min(confidence, 0.75);
    } else {
      confidence = Math.min(confidence, 0.5);
    }
    
    // Adjust based on document validation
    if (documentValidation) {
      confidence = Math.min(confidence, documentValidation.confidence);
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  private mapGender(onfidoGender: string): PersonalData['gender'] {
    const genderMap: { [key: string]: PersonalData['gender'] } = {
      'M': 'M',
      'F': 'F',
      'Male': 'M',
      'Female': 'F',
    };
    
    return genderMap[onfidoGender] || undefined;
  }

  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestHeaders: Record<string, string> = {
      'Authorization': `Token token=${this.apiToken}`,
      'Accept': 'application/json',
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
      throw new Error(`Onfido API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
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
    return `onfido_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapErrorToCode(error: any): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('timeout')) return 'PROCESSING_TIMEOUT';
      if (message.includes('unauthorized') || message.includes('token')) return 'AUTHENTICATION_FAILED';
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
