/**
 * ID Verification Service
 * Main service for UK government ID verification with multiple provider support
 * Implements fallback chain, retry logic, and GDPR compliance
 */

import { IDVerificationProvider } from '../../types/providers';
import { 
  VerificationResult, 
  DocumentData, 
  VerificationConfig, 
  ProviderConfig,
  VerificationError,
  VerificationErrorCode,
  VerificationMetrics
} from '../../types/verification';
import { 
  DEFAULT_VERIFICATION_CONFIG,
  RETRY_CONFIG,
  VERIFICATION_ERROR_MESSAGES
} from '../../constants/verification';
import { providerFactory } from './providers';
import { secureStoreVerificationData, secureRetrieveVerificationData } from '../../utils/encryption';

export class IDVerificationService {
  private providers: IDVerificationProvider[] = [];
  private primaryProvider?: IDVerificationProvider;
  private fallbackProviders: IDVerificationProvider[] = [];
  private config: VerificationConfig;
  private isInitialized = false;

  constructor(config?: Partial<VerificationConfig>) {
    this.config = { ...DEFAULT_VERIFICATION_CONFIG, ...config };
  }

  /**
   * Initialize the verification service with provider configurations
   */
  async initialize(providerConfigs: ProviderConfig[]): Promise<void> {
    if (providerConfigs.length === 0) {
      throw new Error('At least one provider configuration is required');
    }

    // Create and initialize providers
    const initPromises = providerConfigs.map(async (config) => {
      const provider = providerFactory.create(config.name, config);
      await provider.initialize(config);
      return provider;
    });

    this.providers = await Promise.all(initPromises);

    // Set primary and fallback providers
    this.primaryProvider = this.providers.find(p => p.config.isPrimary) || this.providers[0];
    this.fallbackProviders = this.providers.filter(p => p !== this.primaryProvider);

    this.isInitialized = true;
  }

  /**
   * Verify a UK government ID document
   */
  async verifyGovernmentID(
    document: DocumentData,
    config?: Partial<VerificationConfig>
  ): Promise<VerificationResult> {
    if (!this.isInitialized) {
      throw new Error('Verification service not initialized');
    }

    const verificationConfig = { ...this.config, ...config };
    
    // Validate document type
    if (!verificationConfig.allowedDocumentTypes.includes(document.type)) {
      throw this.createVerificationError(
        'UNSUPPORTED_DOCUMENT_TYPE',
        `Document type ${document.type} is not supported`
      );
    }

    // Try primary provider first
    let lastError: Error | null = null;
    
    if (this.primaryProvider) {
      try {
        const result = await this.verifyWithProvider(
          this.primaryProvider,
          document,
          verificationConfig
        );
        
        if (this.isSuccessfulVerification(result)) {
          await this.recordMetrics(result);
          return result;
        }
        
        // If verification failed but not due to service error, don't try fallbacks
        if (result.status === 'rejected' || result.status === 'failed') {
          await this.recordMetrics(result);
          return result;
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Primary provider ${this.primaryProvider.name} failed:`, error);
      }
    }

    // Try fallback providers
    for (const provider of this.fallbackProviders) {
      try {
        const result = await this.verifyWithProvider(
          provider,
          document,
          verificationConfig
        );
        
        if (this.isSuccessfulVerification(result)) {
          await this.recordMetrics(result);
          return result;
        }
        
        // If verification failed but not due to service error, return result
        if (result.status === 'rejected' || result.status === 'failed') {
          await this.recordMetrics(result);
          return result;
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Fallback provider ${provider.name} failed:`, error);
      }
    }

    // All providers failed
    throw lastError || this.createVerificationError(
      'SERVICE_UNAVAILABLE',
      'All verification providers are currently unavailable'
    );
  }

  /**
   * Verify with a specific provider including retry logic
   */
  private async verifyWithProvider(
    provider: IDVerificationProvider,
    document: DocumentData,
    config: VerificationConfig
  ): Promise<VerificationResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const result = await provider.verifyDocument(document, config);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempt === RETRY_CONFIG.maxRetries) {
          throw lastError;
        }

        // Calculate delay for exponential backoff
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Check if verification result is successful
   */
  private isSuccessfulVerification(result: VerificationResult): boolean {
    return result.status === 'verified' && 
           result.confidence >= this.config.confidenceThreshold;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    return RETRY_CONFIG.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase().replace('_', ' '))
    );
  }

  /**
   * Validate age meets platform requirements (20+)
   */
  validateAge20Plus(birthDate: string): boolean {
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age >= 20;
    } catch {
      return false;
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unavailable';
    providers: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unavailable';
      latency: number;
    }>;
  }> {
    const providerStatuses = await Promise.all(
      this.providers.map(async (provider) => {
        const health = await provider.getHealthStatus();
        return {
          name: provider.name,
          status: health.status,
          latency: health.latency,
        };
      })
    );

    const healthyProviders = providerStatuses.filter(p => p.status === 'healthy').length;
    const totalProviders = providerStatuses.length;

    let overall: 'healthy' | 'degraded' | 'unavailable';
    if (healthyProviders === totalProviders) {
      overall = 'healthy';
    } else if (healthyProviders > 0) {
      overall = 'degraded';
    } else {
      overall = 'unavailable';
    }

    return {
      overall,
      providers: providerStatuses,
    };
  }

  /**
   * Get verification metrics
   */
  async getMetrics(): Promise<VerificationMetrics> {
    const metricsData = await secureRetrieveVerificationData('verification_metrics') || {
      totalVerifications: 0,
      successfulVerifications: 0,
      totalProcessingTime: 0,
      providerStats: {},
      ageStats: {
        totalAge: 0,
        rejectedUnder20: 0,
        ageDistribution: {},
      },
    };

    const successRate = metricsData.totalVerifications > 0 
      ? metricsData.successfulVerifications / metricsData.totalVerifications 
      : 0;

    const averageProcessingTime = metricsData.totalVerifications > 0
      ? metricsData.totalProcessingTime / metricsData.totalVerifications
      : 0;

    const averageAge = metricsData.ageStats.totalAge > 0
      ? metricsData.ageStats.totalAge / metricsData.successfulVerifications
      : 0;

    // Calculate provider performance
    const providerPerformance: { [key: string]: any } = {};
    Object.entries(metricsData.providerStats).forEach(([provider, stats]: [string, any]) => {
      providerPerformance[provider] = {
        successRate: stats.attempts > 0 ? stats.successes / stats.attempts : 0,
        averageTime: stats.attempts > 0 ? stats.totalTime / stats.attempts : 0,
        errorRate: stats.attempts > 0 ? stats.errors / stats.attempts : 0,
      };
    });

    return {
      totalVerifications: metricsData.totalVerifications,
      successRate,
      averageProcessingTime,
      providerPerformance,
      ageVerificationStats: {
        averageAge,
        rejectedUnder20: metricsData.ageStats.rejectedUnder20,
        ageDistribution: metricsData.ageStats.ageDistribution,
      },
    };
  }

  /**
   * Record verification metrics
   */
  private async recordMetrics(result: VerificationResult): Promise<void> {
    try {
      const currentMetrics = await secureRetrieveVerificationData('verification_metrics') || {
        totalVerifications: 0,
        successfulVerifications: 0,
        totalProcessingTime: 0,
        providerStats: {},
        ageStats: {
          totalAge: 0,
          rejectedUnder20: 0,
          ageDistribution: {},
        },
      };

      // Update overall metrics
      currentMetrics.totalVerifications++;
      currentMetrics.totalProcessingTime += result.processingTime;

      if (result.status === 'verified') {
        currentMetrics.successfulVerifications++;
      }

      // Update provider stats
      const providerName = result.provider;
      if (!currentMetrics.providerStats[providerName]) {
        currentMetrics.providerStats[providerName] = {
          attempts: 0,
          successes: 0,
          errors: 0,
          totalTime: 0,
        };
      }

      const providerStats = currentMetrics.providerStats[providerName];
      providerStats.attempts++;
      providerStats.totalTime += result.processingTime;

      if (result.status === 'verified') {
        providerStats.successes++;
      } else if (result.error) {
        providerStats.errors++;
      }

      // Update age statistics
      if (result.ageValidation?.age) {
        const age = result.ageValidation.age;
        
        if (result.status === 'verified') {
          currentMetrics.ageStats.totalAge += age;
        }
        
        if (age < 20) {
          currentMetrics.ageStats.rejectedUnder20++;
        }

        // Age distribution
        const ageRange = this.getAgeRange(age);
        currentMetrics.ageStats.ageDistribution[ageRange] = 
          (currentMetrics.ageStats.ageDistribution[ageRange] || 0) + 1;
      }

      // Store updated metrics
      await secureStoreVerificationData('verification_metrics', currentMetrics, {
        encrypt: false, // Metrics don't contain sensitive data
      });

    } catch (error) {
      console.error('Failed to record metrics:', error);
      // Don't throw - metrics recording shouldn't break the verification flow
    }
  }

  /**
   * Get age range for statistics
   */
  private getAgeRange(age: number): string {
    if (age < 20) return 'under_20';
    if (age < 25) return '20_24';
    if (age < 30) return '25_29';
    if (age < 35) return '30_34';
    if (age < 40) return '35_39';
    if (age < 50) return '40_49';
    if (age < 60) return '50_59';
    return '60_plus';
  }

  /**
   * Create a verification error
   */
  private createVerificationError(
    code: VerificationErrorCode,
    message?: string
  ): VerificationError {
    const error = new Error(message || VERIFICATION_ERROR_MESSAGES[code]) as VerificationError;
    error.code = code;
    error.retryable = [...RETRY_CONFIG.retryableErrors].includes(code as any);
    return error;
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await providerFactory.destroyAll();
    this.providers = [];
    this.primaryProvider = undefined;
    this.fallbackProviders = [];
    this.isInitialized = false;
  }
}
