/**
 * Verification API Client
 * Client interface for making verification requests and managing results
 * Integrates with the main ID verification service
 */

import { IDVerificationService } from '../verification/idVerificationService';
import { 
  VerificationResult, 
  DocumentData, 
  VerificationConfig, 
  ProviderConfig,
  VerificationMetrics,
  VerificationError,
  VerificationErrorCode
} from '../../types/verification';
import { 
  DEFAULT_VERIFICATION_CONFIG,
  VERIFICATION_ERROR_MESSAGES
} from '../../constants/verification';
import { secureStoreVerificationData, secureRetrieveVerificationData } from '../../utils/encryption';

export interface VerificationAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

export class VerificationAPIClient {
  private verificationService: IDVerificationService;
  private isInitialized = false;

  constructor() {
    this.verificationService = new IDVerificationService();
  }

  /**
   * Initialize the verification service with provider configurations
   */
  async initialize(providerConfigs: ProviderConfig[]): Promise<VerificationAPIResponse<boolean>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      await this.verificationService.initialize(providerConfigs);
      this.isInitialized = true;

      return {
        success: true,
        data: true,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INITIALIZATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to initialize verification service',
          details: error,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Verify a UK government ID document
   */
  async verifyDocument(
    document: DocumentData,
    config?: Partial<VerificationConfig>
  ): Promise<VerificationAPIResponse<VerificationResult>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          code: 'SERVICE_NOT_INITIALIZED',
          message: 'Verification service has not been initialized',
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Validate document data
      const validationResult = this.validateDocumentData(document);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_DOCUMENT_DATA',
            message: validationResult.error || 'Invalid document data provided',
            details: validationResult.details,
          },
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
          },
        };
      }

      // Perform verification
      const result = await this.verificationService.verifyGovernmentID(document, config);

      // Store request/response for audit
      await this.storeAuditLog(requestId, document, result);

      return {
        success: true,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };

    } catch (error) {
      // Log error for monitoring
      await this.logError(requestId, error);

      return {
        success: false,
        error: {
          code: this.mapErrorCode(error),
          message: error instanceof Error ? error.message : 'Verification failed',
          details: error,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Get verification result by ID
   */
  async getVerificationResult(verificationId: string): Promise<VerificationAPIResponse<VerificationResult>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const storageKey = `verification_result_${verificationId}`;
      const result = await secureRetrieveVerificationData(storageKey);

      if (!result) {
        return {
          success: false,
          error: {
            code: 'VERIFICATION_NOT_FOUND',
            message: 'Verification result not found',
          },
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
          },
        };
      }

      return {
        success: true,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RETRIEVAL_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve verification result',
          details: error,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<VerificationAPIResponse<any>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const health = await this.verificationService.getHealthStatus();

      return {
        success: true,
        data: health,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Health check failed',
          details: error,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Get verification metrics
   */
  async getMetrics(): Promise<VerificationAPIResponse<VerificationMetrics>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const metrics = await this.verificationService.getMetrics();

      return {
        success: true,
        data: metrics,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'METRICS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve metrics',
          details: error,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Validate age meets requirements (20+)
   */
  async validateAge(birthDate: string): Promise<VerificationAPIResponse<{ isValid: boolean; age: number }>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const isValid = this.verificationService.validateAge20Plus(birthDate);
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      return {
        success: true,
        data: { isValid, age },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AGE_VALIDATION_FAILED',
          message: error instanceof Error ? error.message : 'Age validation failed',
          details: error,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await this.verificationService.destroy();
    this.isInitialized = false;
  }

  // Private methods

  /**
   * Validate document data before processing
   */
  private validateDocumentData(document: DocumentData): {
    isValid: boolean;
    error?: string;
    details?: any;
  } {
    // Check required fields
    if (!document.id || !document.type || !document.file) {
      return {
        isValid: false,
        error: 'Missing required document fields: id, type, or file',
        details: { missingFields: ['id', 'type', 'file'].filter(field => !document[field as keyof DocumentData]) },
      };
    }

    // Validate document type
    const allowedTypes = ['passport', 'driving_license', 'national_id', 'provisional_license'];
    if (!allowedTypes.includes(document.type)) {
      return {
        isValid: false,
        error: `Unsupported document type: ${document.type}`,
        details: { allowedTypes },
      };
    }

    // Validate file format
    if (!document.file.startsWith('data:') && !document.file.match(/^[A-Za-z0-9+/]+={0,2}$/)) {
      return {
        isValid: false,
        error: 'Invalid file format. Must be base64 encoded',
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (document.fileSize && document.fileSize > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds maximum limit of 10MB',
        details: { maxSize, actualSize: document.fileSize },
      };
    }

    // Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (document.mimeType && !allowedMimeTypes.includes(document.mimeType)) {
      return {
        isValid: false,
        error: `Unsupported MIME type: ${document.mimeType}`,
        details: { allowedMimeTypes },
      };
    }

    return { isValid: true };
  }

  /**
   * Store audit log for verification request
   */
  private async storeAuditLog(
    requestId: string,
    document: DocumentData,
    result: VerificationResult
  ): Promise<void> {
    try {
      const auditData = {
        requestId,
        timestamp: new Date().toISOString(),
        documentType: document.type,
        documentId: document.id,
        verificationId: result.id,
        provider: result.provider,
        status: result.status,
        confidence: result.confidence,
        processingTime: result.processingTime,
        // Don't store sensitive personal data
        personalDataPresent: !!result.personalData,
        ageValidationResult: result.ageValidation?.meetsMinimumAge,
      };

      const storageKey = `audit_log_${requestId}`;
      await secureStoreVerificationData(storageKey, auditData, {
        encrypt: false, // Audit logs don't contain sensitive data
        expiration: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years for audit
      });

    } catch (error) {
      console.error('Failed to store audit log:', error);
      // Don't throw - audit logging shouldn't break verification
    }
  }

  /**
   * Log error for monitoring
   */
  private async logError(requestId: string, error: any): Promise<void> {
    try {
      const errorData = {
        requestId,
        timestamp: new Date().toISOString(),
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          code: this.mapErrorCode(error),
        },
      };

      const storageKey = `error_log_${requestId}`;
      await secureStoreVerificationData(storageKey, errorData, {
        encrypt: false,
        expiration: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      });

    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  /**
   * Map error to appropriate error code
   */
  private mapErrorCode(error: any): string {
    if (error && typeof error === 'object' && 'code' in error) {
      return error.code;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('timeout')) return 'PROCESSING_TIMEOUT';
      if (message.includes('network')) return 'NETWORK_ERROR';
      if (message.includes('unauthorized')) return 'AUTHENTICATION_FAILED';
      if (message.includes('rate limit')) return 'RATE_LIMIT_EXCEEDED';
      if (message.includes('service unavailable')) return 'SERVICE_UNAVAILABLE';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `req_${timestamp}_${random}`;
  }
}
