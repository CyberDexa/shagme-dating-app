/**
 * Preference Filter Component
 * Epic 003 - Story 002: Preference-Based Filtering
 * 
 * React Native component for advanced preference filtering interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet
} from 'react-native';
// Note: For Slider, you would need to install @react-native-community/slider
// import Slider from '@react-native-community/slider';

import { AdvancedMatchingCriteria, PreferenceOptimizationSuggestions } from '../../types/matching';
import { UserProfile } from '../../types/profile';

interface PreferenceFilterComponentProps {
  userProfile: UserProfile;
  currentCriteria: AdvancedMatchingCriteria;
  onCriteriaChange: (criteria: AdvancedMatchingCriteria) => void;
  onOptimizationRequest: () => void;
}

interface PreferenceWeights {
  physical: number;
  lifestyle: number;
  social: number;
  relationship: number;
}

interface MinimumThresholds {
  overall: number;
  physical?: number;
  lifestyle?: number;
  social?: number;
  relationship?: number;
}

export const PreferenceFilterComponent: React.FC<PreferenceFilterComponentProps> = ({
  userProfile,
  currentCriteria,
  onCriteriaChange,
  onOptimizationRequest
}) => {
  const [weights, setWeights] = useState<PreferenceWeights>(currentCriteria.preferenceWeights);
  const [thresholds, setThresholds] = useState<MinimumThresholds>(currentCriteria.minimumThresholds);
  const [dealBreakers, setDealBreakers] = useState<string[]>(currentCriteria.dealBreakers);
  const [mustHaves, setMustHaves] = useState<string[]>(currentCriteria.mustHaves);
  const [niceToHaves, setNiceToHaves] = useState<string[]>(currentCriteria.niceToHaves);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Available deal breaker options
  const dealBreakerOptions = [
    { id: 'smoking', label: 'Smoking', category: 'Lifestyle' },
    { id: 'no_photos', label: 'No Photos', category: 'Profile' },
    { id: 'no_verification', label: 'Not Verified', category: 'Safety' },
    { id: 'drinking_heavily', label: 'Heavy Drinking', category: 'Lifestyle' },
    { id: 'drug_use', label: 'Drug Use', category: 'Lifestyle' },
    { id: 'inactive_users', label: 'Inactive Users', category: 'Activity' },
    { id: 'age_gaps', label: 'Large Age Gaps', category: 'Demographics' },
    { id: 'education_mismatch', label: 'Education Mismatch', category: 'Social' },
    { id: 'language_barrier', label: 'Language Barrier', category: 'Communication' },
    { id: 'body_type_mismatch', label: 'Body Type Mismatch', category: 'Physical' }
  ];

  // Must-have options
  const mustHaveOptions = [
    { id: 'fitness_oriented', label: 'Fitness Oriented', category: 'Lifestyle' },
    { id: 'career_focused', label: 'Career Focused', category: 'Professional' },
    { id: 'travel_lover', label: 'Travel Lover', category: 'Interests' },
    { id: 'family_oriented', label: 'Family Oriented', category: 'Values' },
    { id: 'creative_type', label: 'Creative Type', category: 'Personality' },
    { id: 'intellectual', label: 'Intellectual', category: 'Personality' },
    { id: 'adventurous', label: 'Adventurous', category: 'Lifestyle' },
    { id: 'social_butterfly', label: 'Social Butterfly', category: 'Personality' }
  ];

  // Nice-to-have options
  const niceToHaveOptions = [
    { id: 'good_education', label: 'Good Education', category: 'Social' },
    { id: 'same_interests', label: 'Shared Interests', category: 'Compatibility' },
    { id: 'local_resident', label: 'Local Resident', category: 'Location' },
    { id: 'pet_lover', label: 'Pet Lover', category: 'Lifestyle' },
    { id: 'foodie', label: 'Food Enthusiast', category: 'Interests' },
    { id: 'music_lover', label: 'Music Lover', category: 'Interests' },
    { id: 'outdoorsy', label: 'Outdoorsy', category: 'Activities' },
    { id: 'night_owl', label: 'Night Owl', category: 'Lifestyle' }
  ];

  // Update criteria when values change
  useEffect(() => {
    const updatedCriteria: AdvancedMatchingCriteria = {
      ...currentCriteria,
      preferenceWeights: weights,
      minimumThresholds: thresholds,
      dealBreakers,
      mustHaves,
      niceToHaves
    };
    onCriteriaChange(updatedCriteria);
  }, [weights, thresholds, dealBreakers, mustHaves, niceToHaves]);

  const updateWeight = (category: keyof PreferenceWeights, value: number) => {
    setWeights(prev => ({ ...prev, [category]: value }));
  };

  const updateThreshold = (category: keyof MinimumThresholds, value: number) => {
    setThresholds(prev => ({ ...prev, [category]: value }));
  };

  const toggleDealBreaker = (dealBreakerId: string) => {
    setDealBreakers(prev => 
      prev.includes(dealBreakerId)
        ? prev.filter(id => id !== dealBreakerId)
        : [...prev, dealBreakerId]
    );
  };

  const toggleMustHave = (mustHaveId: string) => {
    setMustHaves(prev => 
      prev.includes(mustHaveId)
        ? prev.filter(id => id !== mustHaveId)
        : [...prev, mustHaveId]
    );
  };

  const toggleNiceToHave = (niceToHaveId: string) => {
    setNiceToHaves(prev => 
      prev.includes(niceToHaveId)
        ? prev.filter(id => id !== niceToHaveId)
        : [...prev, niceToHaveId]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Preferences',
      'This will reset all preference settings to default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setWeights({ physical: 0.3, lifestyle: 0.25, social: 0.25, relationship: 0.2 });
            setThresholds({ overall: 0.6, physical: 0.4, lifestyle: 0.3, social: 0.3, relationship: 0.4 });
            setDealBreakers([]);
            setMustHaves([]);
            setNiceToHaves([]);
          }
        }
      ]
    );
  };

  const validateWeights = () => {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      Alert.alert(
        'Invalid Weights',
        `Preference weights must total 100%. Current total: ${Math.round(total * 100)}%`,
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = {
      physical: weights.physical / total,
      lifestyle: weights.lifestyle / total,
      social: weights.social / total,
      relationship: weights.relationship / total
    };
    setWeights(normalizedWeights);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Preference Filtering</Text>
        <Text style={styles.subtitle}>Customize your match criteria</Text>
      </View>

      {/* Preference Weights Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Importance Weights</Text>
          <TouchableOpacity onPress={normalizeWeights} style={styles.normalizeButton}>
            <Text style={styles.normalizeButtonText}>Normalize</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionDescription}>
          Adjust how important each category is for your matches
        </Text>

        {Object.entries(weights).map(([category, weight]) => (
          <View key={category} style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <Text style={styles.sliderValue}>{Math.round(weight * 100)}%</Text>
            </View>
            <View style={styles.weightControls}>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => updateWeight(category as keyof PreferenceWeights, Math.max(0, weight - 0.05))}
              >
                <Text style={styles.weightButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.weightBar}>
                <View style={[styles.weightFill, { width: `${weight * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => updateWeight(category as keyof PreferenceWeights, Math.min(1, weight + 0.05))}
              >
                <Text style={styles.weightButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Minimum Thresholds Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minimum Compatibility</Text>
        <Text style={styles.sectionDescription}>
          Set minimum compatibility requirements for each category
        </Text>

        {Object.entries(thresholds).map(([category, threshold]) => (
          <View key={category} style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <Text style={styles.sliderValue}>{Math.round((threshold || 0) * 100)}%</Text>
            </View>
            <View style={styles.weightControls}>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => updateThreshold(category as keyof MinimumThresholds, Math.max(0, (threshold || 0) - 0.05))}
              >
                <Text style={styles.weightButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.weightBar}>
                <View style={[styles.weightFill, { width: `${(threshold || 0) * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => updateThreshold(category as keyof MinimumThresholds, Math.min(1, (threshold || 0) + 0.05))}
              >
                <Text style={styles.weightButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Deal Breakers Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deal Breakers</Text>
        <Text style={styles.sectionDescription}>
          Automatically filter out profiles with these characteristics
        </Text>

        <View style={styles.optionsGrid}>
          {dealBreakerOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionChip,
                dealBreakers.includes(option.id) && styles.optionChipSelected
              ]}
              onPress={() => toggleDealBreaker(option.id)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  dealBreakers.includes(option.id) && styles.optionChipTextSelected
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Must Haves Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Must Haves</Text>
        <Text style={styles.sectionDescription}>
          Strongly prioritize profiles with these characteristics
        </Text>

        <View style={styles.optionsGrid}>
          {mustHaveOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionChip,
                mustHaves.includes(option.id) && styles.mustHaveChipSelected
              ]}
              onPress={() => toggleMustHave(option.id)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  mustHaves.includes(option.id) && styles.mustHaveChipTextSelected
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nice to Haves Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nice to Haves</Text>
        <Text style={styles.sectionDescription}>
          Slight bonus for profiles with these characteristics
        </Text>

        <View style={styles.optionsGrid}>
          {niceToHaveOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionChip,
                niceToHaves.includes(option.id) && styles.niceToHaveChipSelected
              ]}
              onPress={() => toggleNiceToHave(option.id)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  niceToHaves.includes(option.id) && styles.niceToHaveChipTextSelected
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Advanced Settings Toggle */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Text style={styles.advancedToggleText}>Advanced Settings</Text>
          <Switch
            value={showAdvanced}
            onValueChange={setShowAdvanced}
            trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
            thumbColor={showAdvanced ? '#FFFFFF' : '#FFFFFF'}
          />
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedSection}>
            <Text style={styles.advancedTitle}>Advanced Preference Controls</Text>
            
            <View style={styles.advancedOption}>
              <Text style={styles.advancedOptionLabel}>Scoring Algorithm</Text>
              <Text style={styles.advancedOptionValue}>Weighted Average</Text>
            </View>

            <View style={styles.advancedOption}>
              <Text style={styles.advancedOptionLabel}>Machine Learning</Text>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.advancedOption}>
              <Text style={styles.advancedOptionLabel}>User Feedback Learning</Text>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.optimizeButton} onPress={onOptimizationRequest}>
          <Text style={styles.optimizeButtonText}>Get Optimization Suggestions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Current Settings Summary</Text>
        <Text style={styles.summaryText}>
          • {dealBreakers.length} deal breakers active
        </Text>
        <Text style={styles.summaryText}>
          • {mustHaves.length} must-have preferences
        </Text>
        <Text style={styles.summaryText}>
          • {niceToHaves.length} nice-to-have preferences
        </Text>
        <Text style={styles.summaryText}>
          • Overall threshold: {Math.round(thresholds.overall * 100)}%
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 20,
  },
  normalizeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  normalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  sliderValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  weightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  weightBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipSelected: {
    backgroundColor: '#FF3B30',
  },
  mustHaveChipSelected: {
    backgroundColor: '#34C759',
  },
  niceToHaveChipSelected: {
    backgroundColor: '#007AFF',
  },
  optionChipText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },
  mustHaveChipTextSelected: {
    color: '#FFFFFF',
  },
  niceToHaveChipTextSelected: {
    color: '#FFFFFF',
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  advancedToggleText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  advancedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  advancedOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  advancedOptionLabel: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  advancedOptionValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  optimizeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  optimizeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    margin: 20,
    borderRadius: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
});

export default PreferenceFilterComponent;
