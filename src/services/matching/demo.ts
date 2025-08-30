#!/usr/bin/env node

/**
 * Simple Matching Service Demo
 * Epic 003: Matching System
 * Story 001: Location-Based Matching
 * 
 * Standalone demonstration of the location-based matching system
 */

console.log('🧪 Starting Matching Service Demo...\n');

// Mock the basic types and interfaces
interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

interface LocationBounds {
  center: GeoLocation;
  radius: number;
  northEast: GeoLocation;
  southWest: GeoLocation;
}

// Simple distance calculation using Haversine formula
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): { distance: number; bearing: number } {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * 
    Math.cos(toRadians(point2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Calculate bearing
  const y = Math.sin(dLon) * Math.cos(toRadians(point2.latitude));
  const x = Math.cos(toRadians(point1.latitude)) * Math.sin(toRadians(point2.latitude)) -
            Math.sin(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) * Math.cos(dLon);
  
  const bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360;

  return {
    distance: Math.round(distance * 100) / 100,
    bearing: Math.round(bearing)
  };
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Create location bounds
function createLocationBounds(center: GeoLocation, radiusKm: number): LocationBounds {
  const radiusInDegrees = radiusKm / 111; // Approximate km to degrees conversion
  
  return {
    center,
    radius: radiusKm * 1000, // Convert to meters
    northEast: {
      ...center,
      latitude: center.latitude + radiusInDegrees,
      longitude: center.longitude + radiusInDegrees
    },
    southWest: {
      ...center,
      latitude: center.latitude - radiusInDegrees,
      longitude: center.longitude - radiusInDegrees
    }
  };
}

// Mock user data
const users = [
  { id: 'user_001', name: 'Alex', age: 28, lat: 51.5074, lng: -0.1278 }, // London
  { id: 'user_002', name: 'Sam', age: 25, lat: 51.5155, lng: -0.0922 }, // London Bridge
  { id: 'user_003', name: 'Taylor', age: 30, lat: 51.4994, lng: -0.1270 }, // Westminster
  { id: 'user_004', name: 'Jordan', age: 26, lat: 51.5138, lng: -0.0984 }, // City of London
  { id: 'user_005', name: 'Casey', age: 32, lat: 51.5033, lng: -0.1195 }, // Southwark
];

// Base user location (Alex)
const baseLocation: GeoLocation = {
  latitude: 51.5074,
  longitude: -0.1278,
  timestamp: new Date()
};

console.log('👤 Base User: Alex (28) at London coordinates');
console.log(`   Location: ${baseLocation.latitude.toFixed(4)}, ${baseLocation.longitude.toFixed(4)}\n`);

console.log('📍 Calculating distances to other users:');

const matches = users.slice(1).map(user => {
  const userLocation = { latitude: user.lat, longitude: user.lng };
  const distanceData = calculateDistance(baseLocation, userLocation);
  
  // Simple compatibility score based on age and distance
  const ageDiff = Math.abs(28 - user.age);
  const ageScore = Math.max(0, 1 - ageDiff / 10); // Penalty for large age differences
  const distanceScore = Math.max(0, 1 - distanceData.distance / 25); // Penalty for distance > 25km
  const compatibilityScore = (ageScore * 0.4 + distanceScore * 0.6) * 100;

  return {
    ...user,
    distance: distanceData.distance,
    bearing: distanceData.bearing,
    compatibilityScore: Math.round(compatibilityScore)
  };
}).sort((a, b) => b.compatibilityScore - a.compatibilityScore);

matches.forEach((match, index) => {
  console.log(`${index + 1}. ${match.name} (${match.age})`);
  console.log(`   Distance: ${match.distance}km`);
  console.log(`   Bearing: ${match.bearing}°`);
  console.log(`   Compatibility: ${match.compatibilityScore}%`);
  console.log();
});

console.log('🗺️  Testing Location Bounds:');
const bounds = createLocationBounds(baseLocation, 10);
console.log(`   Center: ${bounds.center.latitude.toFixed(4)}, ${bounds.center.longitude.toFixed(4)}`);
console.log(`   NE: ${bounds.northEast.latitude.toFixed(4)}, ${bounds.northEast.longitude.toFixed(4)}`);
console.log(`   SW: ${bounds.southWest.latitude.toFixed(4)}, ${bounds.southWest.longitude.toFixed(4)}`);
console.log(`   Radius: ${bounds.radius / 1000}km\n`);

console.log('🎯 Filtering users within 5km radius:');
const nearbyUsers = matches.filter(user => user.distance <= 5);
if (nearbyUsers.length > 0) {
  nearbyUsers.forEach(user => {
    console.log(`   ${user.name}: ${user.distance}km away (${user.compatibilityScore}% compatible)`);
  });
} else {
  console.log('   No users found within 5km radius');
}

console.log('\n✅ Location-Based Matching Demo Completed!');
console.log('\n📋 Summary:');
console.log(`   - Processed ${users.length - 1} potential matches`);
console.log(`   - Found ${nearbyUsers.length} users within 5km`);
console.log(`   - Best match: ${matches[0].name} (${matches[0].compatibilityScore}% compatible, ${matches[0].distance}km away)`);
console.log(`   - Location services: Distance calculation, bearing, bounds creation ✓`);
console.log(`   - Matching algorithm: Age + distance scoring ✓`);
console.log(`   - Filtering: Radius-based filtering ✓`);

export {};
