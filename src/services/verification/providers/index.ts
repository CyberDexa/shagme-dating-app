/**
 * Provider Factory
 * Creates and manages verification service providers
 */

import { IDVerificationProvider, ProviderFactory } from '../../../types/providers';
import { ProviderConfig } from '../../../types/verification';
import { OnfidoProvider } from './onfidoProvider';
import { PersonaProvider } from './personaProvider';

export class VerificationProviderFactory implements ProviderFactory {
  private providers: Map<string, IDVerificationProvider> = new Map();

  create(providerName: string, config: ProviderConfig): IDVerificationProvider {
    // Check if provider already exists and is configured
    const existingProvider = this.providers.get(providerName);
    if (existingProvider && existingProvider.config.credentials.apiKey === config.credentials.apiKey) {
      return existingProvider;
    }

    let provider: IDVerificationProvider;

    switch (providerName.toLowerCase()) {
      case 'onfido':
        provider = new OnfidoProvider();
        break;
      
      case 'persona':
        provider = new PersonaProvider();
        break;
      
      default:
        throw new Error(`Unsupported verification provider: ${providerName}`);
    }

    // Store provider for reuse
    this.providers.set(providerName, provider);
    
    return provider;
  }

  getSupportedProviders(): string[] {
    return ['onfido', 'persona'];
  }

  async destroyProvider(providerName: string): Promise<void> {
    const provider = this.providers.get(providerName);
    if (provider) {
      await provider.destroy();
      this.providers.delete(providerName);
    }
  }

  async destroyAll(): Promise<void> {
    const destroyPromises = Array.from(this.providers.values()).map(provider => provider.destroy());
    await Promise.all(destroyPromises);
    this.providers.clear();
  }

  getProvider(providerName: string): IDVerificationProvider | undefined {
    return this.providers.get(providerName);
  }

  getAllProviders(): IDVerificationProvider[] {
    return Array.from(this.providers.values());
  }
}

// Singleton instance
export const providerFactory = new VerificationProviderFactory();
