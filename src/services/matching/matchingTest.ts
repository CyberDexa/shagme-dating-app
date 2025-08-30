/**
 * Matching Service Test
 * Epic 003: Matching System
 * Story 001: Location-Based Matching
 * 
 * Demonstrates the location-based matching system functionality
 */

import { LocationService, MatchingService, UserLocationData } from './index';
import { UserProfile, SexualOrientation, RelationshipType } from '../../types/profile';
import { MatchingCriteria, GeoLocation, MatchResult } from '../../types/matching';

/**
 * Mock user profiles for testing
 */
const createMockUserProfile = (
  userId: string,
  displayName: string,
  age: number,
  sexualOrientation: SexualOrientation,
  lookingFor: RelationshipType[],
  bio: string = "Hello there!",
  photoCount: number = 3
): UserProfile => ({
  userId,
  personalInfo: {
    displayName,
    age,
    dateOfBirth: new Date(new Date().getFullYear() - age, 0, 1),
    location: {
      latitude: 51.5074,
      longitude: -0.1278,
      city: 'London',
      country: 'UK'
    },
    sexualOrientation,
    sexualIntent: 'clear',
    lookingFor,
    bio,
    occupation: 'Professional',
    education: 'University',
    height: 175,
    bodyType: 'average',
    ethnicity: 'Mixed',
    languages: ['English']
  },
  photos: Array.from({ length: photoCount }, (_, i) => ({
    id: `photo_${userId}_${i}`,
    url: `https://example.com/photos/${userId}/${i}.jpg`,
    thumbnailUrl: `https://example.com/photos/${userId}/${i}_thumb.jpg`,
    isPrimary: i === 0,
    isVerified: true,
    uploadedAt: new Date(),
    moderationStatus: 'approved' as const,
    order: i,
    metadata: {
      width: 800,
      height: 1200,
      fileSize: 150000,
      format: 'jpeg'
    }
  })),
  preferences: {
    ageRange: { min: Math.max(18, age - 10), max: age + 10 },
    maxDistance: 50,
    sexualOrientations: [sexualOrientation],
    relationshipTypes: lookingFor,
    bodyTypes: ['slim', 'average', 'athletic'],
    heightRange: { min: 160, max: 190 },
    ethnicities: ['Mixed', 'White', 'Black', 'Asian'],
    education: ['University', 'College'],
    dealBreakers: []
  },
  visibility: {
    isVisible: true,
    hideAge: false,
    hideLocation: false,
    hideLastActive: false,
    showOnlyToVerified: false,
    incognito: false,
    distanceVisibility: 'approximate',
    onlineStatus: 'online'
  },
  completion: {
    overallPercentage: 85,
    personalInfo: 90,
    photos: 95,
    preferences: 80,
    visibility: 75,
    missingFields: [],
    recommendedActions: []
  },
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  updatedAt: new Date(),
  lastActiveAt: new Date(),
  profileViews: Math.floor(Math.random() * 100),
  profileLikes: Math.floor(Math.random() * 50),
  verification: {
    isVerified: Math.random() > 0.3, // 70% verified
    verificationResults: [],
    verificationScore: Math.floor(Math.random() * 100),
    lastVerificationUpdate: new Date()
  },
  premium: {
    isActive: Math.random() > 0.7, // 30% premium
    tier: Math.random() > 0.5 ? 'premium' : 'basic',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    features: ['unlimited_matches', 'priority_matching']
  },
  safety: {
    isReported: false,
    reportCount: 0,
    isBanned: false,
    trustScore: 95
  }
});

/**
 * Create mock location data for users
 */
const createUserLocationData = (
  userId: string,
  baseLocation: GeoLocation,
  radiusKm: number = 10
): UserLocationData => {
  // Generate random location within radius
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radiusKm;
  
  // Convert to lat/lng offset (approximate)
  const latOffset = (randomRadius * Math.cos(randomAngle)) / 111; // 111 km per degree
  const lngOffset = (randomRadius * Math.sin(randomAngle)) / (111 * Math.cos(baseLocation.latitude * Math.PI / 180));

  return {
    userId,
    location: {
      latitude: baseLocation.latitude + latOffset,
      longitude: baseLocation.longitude + lngOffset,
      accuracy: Math.floor(Math.random() * 20) + 5, // 5-25 meters
      timestamp: new Date()
    },
    lastSeen: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000), // Within 2 hours
    accuracy: Math.floor(Math.random() * 20) + 5,
    isOnline: Math.random() > 0.4 // 60% online
  };
};

/**
 * Test the matching service
 */
export async function testMatchingService(): Promise<void> {
  console.log('🧪 Testing Matching Service with Location-Based Matching...\n');

  // Initialize services
  const locationService = LocationService.getInstance();
  const matchingService = MatchingService.getInstance();

  // Create a base location (London)
  const baseLocation: GeoLocation = {
    latitude: 51.5074,
    longitude: -0.1278,
    accuracy: 10,
    timestamp: new Date()
  };

  // Create the searching user
  const searchingUser = createMockUserProfile(
    'user_001',
    'Alex',
    28,
    'bisexual',
    ['casual', 'short_term'],
    'Looking for fun connections in London!'
  );

  console.log(`👤 Searching User: ${searchingUser.personalInfo.displayName} (${searchingUser.personalInfo.age})`);
  console.log(`   Location: ${baseLocation.latitude.toFixed(4)}, ${baseLocation.longitude.toFixed(4)}`);
  console.log(`   Looking for: ${searchingUser.personalInfo.lookingFor.join(', ')}`);
  console.log(`   Sexual orientation: ${searchingUser.personalInfo.sexualOrientation}\n`);

  // Create potential matches
  const potentialMatches: UserProfile[] = [
    createMockUserProfile('user_002', 'Sam', 25, 'straight', ['casual', 'hookup'], 'Love adventures!'),
    createMockUserProfile('user_003', 'Taylor', 30, 'bisexual', ['casual', 'friends_with_benefits'], 'Open minded and fun'),
    createMockUserProfile('user_004', 'Jordan', 26, 'gay', ['short_term'], 'New to the city'),
    createMockUserProfile('user_005', 'Casey', 32, 'pansexual', ['casual', 'open_relationship'], 'Exploring connections'),
    createMockUserProfile('user_006', 'Riley', 24, 'lesbian', ['hookup'], 'Just looking for fun'),
    createMockUserProfile('user_007', 'Morgan', 29, 'straight', ['casual'], 'Weekend warrior'),
    createMockUserProfile('user_008', 'Avery', 27, 'bisexual', ['short_term', 'casual'], 'Easygoing and chill')
  ];

  // Create location data for all users (within 25km of base location)
  const userLocations: UserLocationData[] = [
    createUserLocationData('user_001', baseLocation, 0), // Searching user at exact location
    ...potentialMatches.map(user => createUserLocationData(user.userId, baseLocation, 25))
  ];

  console.log(`📍 Generated ${userLocations.length} user locations:`);
  userLocations.slice(1).forEach(loc => {
    const distance = locationService.calculateDistance(baseLocation, loc.location);
    console.log(`   ${loc.userId}: ${distance.distance.toFixed(2)}km away (${loc.isOnline ? 'online' : 'offline'})`);
  });
  console.log();

  // Create matching criteria
  const criteria: MatchingCriteria = {
    userId: searchingUser.userId,
    location: {
      latitude: baseLocation.latitude,
      longitude: baseLocation.longitude,
      radius: 25 // 25km radius
    },
    preferences: {
      ageRange: { min: 22, max: 35 },
      sexualOrientations: ['straight', 'bisexual', 'pansexual'],
      relationshipTypes: ['casual', 'short_term', 'hookup'],
      maxDistance: 25
    },
    filters: {
      hasPhotos: true,
      lastActiveWithin: 24, // 24 hours
      minimumPhotoCount: 1
    },
    sort: {
      by: 'compatibility',
      direction: 'desc'
    }
  };

  console.log('🎯 Matching Criteria:');
  console.log(`   Age range: ${criteria.preferences.ageRange.min}-${criteria.preferences.ageRange.max}`);
  console.log(`   Max distance: ${criteria.preferences.maxDistance}km`);
  console.log(`   Sexual orientations: ${criteria.preferences.sexualOrientations.join(', ')}`);
  console.log(`   Relationship types: ${criteria.preferences.relationshipTypes.join(', ')}`);
  console.log();

  try {
    // Find matches
    const matches = await matchingService.findMatches(
      searchingUser.userId,
      searchingUser,
      criteria,
      potentialMatches,
      userLocations
    );

    console.log(`✨ Found ${matches.length} potential matches:\n`);

    matches.forEach((match: MatchResult, index: number) => {
      const candidate = potentialMatches.find(p => p.userId === match.targetUserId);
      if (candidate) {
        console.log(`${index + 1}. ${candidate.personalInfo.displayName} (${candidate.personalInfo.age})`);
        console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
        console.log(`   Distance: ${match.distance.toFixed(2)}km`);
        console.log(`   Sexual orientation: ${candidate.personalInfo.sexualOrientation}`);
        console.log(`   Looking for: ${candidate.personalInfo.lookingFor.join(', ')}`);
        console.log(`   Factors:`);
        console.log(`     Location: ${(match.matchFactors.locationScore * 100).toFixed(1)}%`);
        console.log(`     Age compatibility: ${(match.matchFactors.ageCompatibility * 100).toFixed(1)}%`);
        console.log(`     Preference alignment: ${(match.matchFactors.preferenceAlignment * 100).toFixed(1)}%`);
        console.log(`     Activity: ${(match.matchFactors.activityScore * 100).toFixed(1)}%`);
        console.log(`     Verified: ${match.matchFactors.verificationBonus > 0 ? 'Yes' : 'No'}`);
        console.log(`     Premium: ${match.matchFactors.premiumBonus && match.matchFactors.premiumBonus > 0 ? 'Yes' : 'No'}`);
        console.log();
      }
    });

    // Get analytics
    const analytics = matchingService.getAnalytics(searchingUser.userId);
    console.log('📊 Matching Analytics:');
    console.log(`   Total matches found: ${analytics.metrics?.matches || 0}`);
    console.log(`   Queue status: Active`);
    console.log();

    // Test location services directly
    console.log('🗺️  Testing Location Services:');
    
    // Test distance calculations
    const testLocation1 = { latitude: 51.5074, longitude: -0.1278 }; // London
    const testLocation2 = { latitude: 51.5155, longitude: -0.0922 }; // London Bridge
    const distance = locationService.calculateDistance(testLocation1, testLocation2);
    
    console.log(`   Distance between two London points: ${distance.distance.toFixed(2)}km`);
    console.log(`   Bearing: ${distance.bearing}°`);
    console.log(`   Estimated travel time: ${distance.duration} minutes`);
    console.log();

    // Test location bounds
    const bounds = locationService.createLocationBounds(baseLocation, 10);
    console.log(`   Location bounds (10km radius):`);
    console.log(`     Center: ${bounds.center.latitude.toFixed(4)}, ${bounds.center.longitude.toFixed(4)}`);
    console.log(`     NE: ${bounds.northEast.latitude.toFixed(4)}, ${bounds.northEast.longitude.toFixed(4)}`);
    console.log(`     SW: ${bounds.southWest.latitude.toFixed(4)}, ${bounds.southWest.longitude.toFixed(4)}`);
    console.log();

    // Test finding users in area
    const usersInArea = await locationService.findUsersInArea(
      baseLocation,
      15, // 15km radius
      userLocations.map(ul => ({ userId: ul.userId, location: ul.location }))
    );

    console.log(`   Users within 15km: ${usersInArea.length}`);
    usersInArea.slice(0, 3).forEach((user: { userId: string; distance: number }) => {
      console.log(`     ${user.userId}: ${user.distance.toFixed(2)}km away`);
    });

    console.log('\n✅ Matching Service Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Error during matching test:', error);
  }
}

// Export for use in other files
export { createMockUserProfile, createUserLocationData };
