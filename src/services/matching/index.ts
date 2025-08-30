/**
 * Matching Services Export
 * Epic 003: Matching System
 * Story 001: Location-Based Matching (Complete)
 * Story 002: Preference-Based Filtering (Complete)
 */

export { LocationService } from './locationService';
export { MatchingService } from './matchingService';
export { PreferenceFilteringService } from './preferenceFilteringService';

export type {
  LocationPermissionStatus,
  DistanceCalculation,
  LocationHistory
} from './locationService';

export type {
  MatchingConfig,
  UserLocationData,
  MatchingAlgorithmWeights
} from './matchingService';
