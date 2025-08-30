/**
 * Profile Creation Component
 * Epic 002: Profile Creation & Management
 * Story 001: Basic Profile Setup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet
} from 'react-native';
import { ProfileApiService } from '../../services/api/profileApi';
import {
  SexualOrientation,
  RelationshipType,
  CreateProfileRequest
} from '../../types/profile';

interface ProfileCreationProps {
  userId: string;
  onProfileCreated: (success: boolean) => void;
}

interface ProfileFormData {
  displayName: string;
  age: string;
  bio: string;
  sexualOrientation: SexualOrientation;
  lookingFor: RelationshipType[];
  city: string;
  country: string;
}

export const ProfileCreationComponent: React.FC<ProfileCreationProps> = ({
  userId,
  onProfileCreated
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    age: '',
    bio: '',
    sexualOrientation: 'straight',
    lookingFor: ['casual'],
    city: '',
    country: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const profileApi = ProfileApiService.getInstance();

  // Sexual orientation options
  const sexualOrientations: SexualOrientation[] = [
    'straight', 'gay', 'lesbian', 'bisexual', 'pansexual'
  ];

  // Relationship type options
  const relationshipTypes: RelationshipType[] = [
    'casual', 'hookup', 'friends_with_benefits', 'short_term'
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age)) {
      newErrors.age = 'Age is required';
    } else if (age < 18) {
      newErrors.age = 'You must be at least 18 years old';
    } else if (age > 99) {
      newErrors.age = 'Please enter a valid age';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length < 10) {
      newErrors.bio = 'Bio must be at least 10 characters';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (formData.lookingFor.length === 0) {
      newErrors.lookingFor = 'Please select what you\'re looking for';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const request: CreateProfileRequest = {
        personalInfo: {
          displayName: formData.displayName.trim(),
          age: parseInt(formData.age),
          dateOfBirth: new Date(new Date().getFullYear() - parseInt(formData.age), 0, 1),
          location: {
            latitude: 0, // TODO: Get from location service
            longitude: 0,
            city: formData.city.trim(),
            country: formData.country.trim()
          },
          sexualOrientation: formData.sexualOrientation,
          sexualIntent: 'clear',
          lookingFor: formData.lookingFor,
          bio: formData.bio.trim()
        },
        preferences: {
          ageRange: { min: 18, max: 35 },
          maxDistance: 50,
          sexualOrientations: [formData.sexualOrientation],
          relationshipTypes: formData.lookingFor
        },
        visibility: {
          isVisible: true,
          showOnlyToVerified: false
        }
      };

      const response = await profileApi.createProfile(userId, request);

      if (response.success) {
        Alert.alert('Success', 'Profile created successfully!');
        onProfileCreated(true);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to create profile');
        onProfileCreated(false);
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      onProfileCreated(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleRelationshipType = (type: RelationshipType) => {
    setFormData(prev => ({
      ...prev,
      lookingFor: prev.lookingFor.includes(type)
        ? prev.lookingFor.filter(t => t !== type)
        : [...prev.lookingFor, type]
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>Let's get to know you better</Text>
      </View>

      <View style={styles.form}>
        {/* Display Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={[styles.input, errors.displayName && styles.inputError]}
            value={formData.displayName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
            placeholder="How should others see you?"
            maxLength={30}
          />
          {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
        </View>

        {/* Age */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={[styles.input, errors.age && styles.inputError]}
            value={formData.age}
            onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
            placeholder="Your age"
            keyboardType="numeric"
            maxLength={2}
          />
          {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
        </View>

        {/* Bio */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>About You *</Text>
          <TextInput
            style={[styles.textArea, errors.bio && styles.inputError]}
            value={formData.bio}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{formData.bio.length}/500</Text>
          {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
        </View>

        {/* Sexual Orientation */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sexual Orientation *</Text>
          <View style={styles.optionsGrid}>
            {sexualOrientations.map((orientation) => (
              <TouchableOpacity
                key={orientation}
                style={[
                  styles.optionButton,
                  formData.sexualOrientation === orientation && styles.optionButtonSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, sexualOrientation: orientation }))}
              >
                <Text style={[
                  styles.optionText,
                  formData.sexualOrientation === orientation && styles.optionTextSelected
                ]}>
                  {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Looking For */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Looking For * (select all that apply)</Text>
          <View style={styles.optionsGrid}>
            {relationshipTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  formData.lookingFor.includes(type) && styles.optionButtonSelected
                ]}
                onPress={() => toggleRelationshipType(type)}
              >
                <Text style={[
                  styles.optionText,
                  formData.lookingFor.includes(type) && styles.optionTextSelected
                ]}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.lookingFor && <Text style={styles.errorText}>{errors.lookingFor}</Text>}
        </View>

        {/* Location */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="Your city"
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
            <Text style={styles.label}>Country *</Text>
            <TextInput
              style={[styles.input, errors.country && styles.inputError]}
              value={formData.country}
              onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
              placeholder="Your country"
            />
            {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileCreationComponent;
