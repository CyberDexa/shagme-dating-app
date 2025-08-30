import { IDVerificationService } from '../idVerificationService';
import { VerificationResult, DocumentData, PersonalData, ProviderConfig } from '../../../types/verification';

// Mock the provider factory
jest.mock('../providers', () => ({
  providerFactory: {
    create: jest.fn(),
    getSupportedProviders: jest.fn(() => ['onfido', 'persona']),
  },
}));

// Mock encryption utilities
jest.mock('../../../utils/encryption', () => ({
  secureStoreVerificationData: jest.fn(),
  secureRetrieveVerificationData: jest.fn(),
}));

// Mock constants
jest.mock('../../../constants/verification', () => ({
  DEFAULT_VERIFICATION_CONFIG: {
    enableAgeVerification: true,
    minimumAge: 20,
    allowedDocumentTypes: ['passport', 'driving_license', 'national_id'],
    requireBothSides: false,
    enableFaceMatch: true,
    confidenceThreshold: 0.85,
    maxRetries: 3,
  },
  RETRY_CONFIG: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  },
  VERIFICATION_ERROR_MESSAGES: {
    INVALID_DOCUMENT: 'Invalid document provided',
    DOCUMENT_EXPIRED: 'Document has expired',
    UNSUPPORTED_DOCUMENT_TYPE: 'Document type not supported',
  },
}));

import { providerFactory } from '../providers';

const mockProviderFactory = providerFactory as jest.Mocked<typeof providerFactory>;

describe('IDVerificationService', () => {
  let service: IDVerificationService;
  let mockProvider: any;

  const mockProviderConfig: ProviderConfig = {
    name: 'onfido',
    credentials: {
      apiKey: 'test-api-key',
      region: 'EU',
      environment: 'sandbox',
    },
    isEnabled: true,
    isPrimary: true,
    timeout: 30000,
    rateLimits: {
      requestsPerMinute: 100,
      requestsPerDay: 10000,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock provider
    mockProvider = {
      name: 'onfido',
      config: mockProviderConfig,
      initialize: jest.fn().mockResolvedValue(undefined),
      verifyDocument: jest.fn(),
      isServiceAvailable: jest.fn().mockResolvedValue(true),
      getHealthStatus: jest.fn().mockResolvedValue({
        status: 'healthy',
        latency: 100,
        uptime: 99.9,
      }),
      validateConfig: jest.fn().mockReturnValue(true),
      getSupportedDocumentTypes: jest.fn().mockReturnValue(['passport', 'driving_license']),
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    // Mock provider factory
    mockProviderFactory.create.mockReturnValue(mockProvider);

    service = new IDVerificationService();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully with valid provider config', async () => {
      await service.initialize([mockProviderConfig]);

      expect(mockProviderFactory.create).toHaveBeenCalledWith('onfido', mockProviderConfig);
      expect(mockProvider.initialize).toHaveBeenCalledWith(mockProviderConfig);
    });

    it('should throw error when no provider configs provided', async () => {
      await expect(service.initialize([])).rejects.toThrow(
        'At least one provider configuration is required'
      );
    });

    it('should handle provider initialization failures gracefully', async () => {
      mockProvider.initialize.mockRejectedValue(new Error('Provider init failed'));

      await expect(service.initialize([mockProviderConfig])).rejects.toThrow(
        'Provider init failed'
      );
    });
  });

  describe('Document Verification', () => {
    const mockDocument: DocumentData = {
      id: 'doc_123',
      type: 'passport',
      file: 'base64encodedimage',
      mimeType: 'image/jpeg',
      fileName: 'passport.jpg',
      fileSize: 1024,
      uploadedAt: new Date(),
    };

    beforeEach(async () => {
      await service.initialize([mockProviderConfig]);
    });

    it('should successfully verify document', async () => {
      const expectedResult: VerificationResult = {
        id: 'verify_123',
        status: 'verified',
        provider: 'onfido',
        confidence: 0.95,
        processingTime: 5000,
        createdAt: new Date(),
        metadata: {
          requestId: 'req_123',
        },
      };

      mockProvider.verifyDocument.mockResolvedValue(expectedResult);

      const result = await service.verifyGovernmentID(mockDocument);

      expect(result).toEqual(expectedResult);
      expect(mockProvider.verifyDocument).toHaveBeenCalledWith(
        mockDocument,
        expect.objectContaining({
          allowedDocumentTypes: ['passport', 'driving_license', 'national_id'],
        })
      );
    });

    it('should reject unsupported document types', async () => {
      const unsupportedDocument: DocumentData = {
        ...mockDocument,
        type: 'student_id' as any,
      };

      await expect(service.verifyGovernmentID(unsupportedDocument)).rejects.toThrow(
        'Document type student_id is not supported'
      );
    });

    it('should throw error when service not initialized', async () => {
      const uninitializedService = new IDVerificationService();

      await expect(uninitializedService.verifyGovernmentID(mockDocument)).rejects.toThrow(
        'Verification service not initialized'
      );
    });

    it('should handle failed verification results', async () => {
      const failedResult: VerificationResult = {
        id: 'verify_failed',
        status: 'failed',
        provider: 'onfido',
        confidence: 0.3,
        processingTime: 3000,
        createdAt: new Date(),
        metadata: {},
        error: {
          code: 'DOCUMENT_UNREADABLE',
          message: 'Document image quality is too poor',
        },
      };

      mockProvider.verifyDocument.mockResolvedValue(failedResult);

      const result = await service.verifyGovernmentID(mockDocument);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(async () => {
      await service.initialize([mockProviderConfig]);
    });

    it('should return overall health status', async () => {
      const health = await service.getHealthStatus();

      expect(health).toEqual({
        status: 'healthy',
        providers: expect.arrayContaining([
          expect.objectContaining({
            name: 'onfido',
            status: 'healthy',
          }),
        ]),
        timestamp: expect.any(Date),
      });
    });

    it('should detect unhealthy providers', async () => {
      mockProvider.getHealthStatus.mockResolvedValue({
        status: 'unavailable',
        latency: 5000,
        uptime: 50.0,
      });

      const health = await service.getHealthStatus();

      expect(health.overall).toBe('unavailable');
    });

    it('should get service metrics', async () => {
      const metrics = await service.getMetrics();

      expect(metrics).toEqual(
        expect.objectContaining({
          totalVerifications: expect.any(Number),
          successRate: expect.any(Number),
          averageProcessingTime: expect.any(Number),
        })
      );
    });
  });

  describe('Configuration Validation', () => {
    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        allowedDocumentTypes: ['invalid_type' as any],
      };

      // Should not throw during construction, but during usage
      const serviceWithInvalidConfig = new IDVerificationService(invalidConfig);
      expect(serviceWithInvalidConfig).toBeDefined();
    });

    it('should accept valid configuration', () => {
      const validConfig = {
        allowedDocumentTypes: ['passport', 'driving_license'] as ('passport' | 'driving_license')[],
        confidenceThreshold: 0.8,
        maxRetries: 2,
      };

      const serviceWithValidConfig = new IDVerificationService(validConfig);
      expect(serviceWithValidConfig).toBeDefined();
    });
  });

  describe('Provider Management', () => {
    it('should support multiple providers with primary/fallback logic', async () => {
      const secondaryConfig: ProviderConfig = {
        ...mockProviderConfig,
        name: 'persona',
        isPrimary: false,
      };

      const secondaryProvider = {
        ...mockProvider,
        name: 'persona',
        config: secondaryConfig,
      };

      mockProviderFactory.create
        .mockReturnValueOnce(mockProvider)
        .mockReturnValueOnce(secondaryProvider);

      await service.initialize([mockProviderConfig, secondaryConfig]);

      expect(mockProviderFactory.create).toHaveBeenCalledTimes(2);
      expect(mockProvider.initialize).toHaveBeenCalled();
      expect(secondaryProvider.initialize).toHaveBeenCalled();
    });

    it('should handle provider destruction on cleanup', async () => {
      await service.initialize([mockProviderConfig]);
      
      await service.destroy();

      expect(mockProvider.destroy).toHaveBeenCalled();
    });
  });
});
