/**
 * UK Document Validation Utilities
 * Validation logic for UK government documents and age verification
 */

import { DocumentType, PersonalData, AgeValidation, DocumentValidation } from '../types/verification';
import { UK_VALIDATION_RULES } from '../constants/verification';

/**
 * Validate UK passport number format
 */
export const validateUKPassportNumber = (passportNumber: string): boolean => {
  // UK passport numbers: 9 digits (post-2019) or alphanumeric (pre-2019)
  const modernFormat = /^\d{9}$/; // 9 digits
  const legacyFormat = /^[A-Z]\d{8}$/; // 1 letter + 8 digits
  
  return modernFormat.test(passportNumber) || legacyFormat.test(passportNumber);
};

/**
 * Validate UK driving license number format
 */
export const validateUKDrivingLicenseNumber = (licenseNumber: string): boolean => {
  // UK driving license: 16 characters (SURNAME99999999999AA)
  const ukLicenseFormat = /^[A-Z]{1,5}9{0,5}\d{6}[A-Z]{2}\d{2}$/;
  
  return ukLicenseFormat.test(licenseNumber) && licenseNumber.length === 16;
};

/**
 * Validate UK National Insurance number format (for ID cards)
 */
export const validateUKNationalInsuranceNumber = (niNumber: string): boolean => {
  // UK NI number: 2 letters + 6 digits + 1 letter (e.g., AB123456C)
  const niFormat = /^[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}[0-9]{6}[A-D]{1}$/;
  
  return niFormat.test(niNumber);
};

/**
 * Validate document number based on document type
 */
export const validateDocumentNumber = (
  documentNumber: string,
  documentType: DocumentType
): boolean => {
  if (!documentNumber || documentNumber.trim().length === 0) {
    return false;
  }
  
  const cleanNumber = documentNumber.replace(/\s+/g, '').toUpperCase();
  
  switch (documentType) {
    case 'passport':
      return validateUKPassportNumber(cleanNumber);
    case 'driving_license':
    case 'provisional_license':
      return validateUKDrivingLicenseNumber(cleanNumber);
    case 'national_id':
      return validateUKNationalInsuranceNumber(cleanNumber);
    default:
      return false;
  }
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) {
    throw new Error('Invalid date of birth format');
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validate age meets UK platform requirements (20+)
 */
export const validateAge = (dateOfBirth: string): AgeValidation => {
  try {
    const age = calculateAge(dateOfBirth);
    const meetsMinimumAge = age >= UK_VALIDATION_RULES.minimumAge;
    
    return {
      isValid: true,
      age,
      meetsMinimumAge,
      calculatedFrom: 'document_date_of_birth',
    };
  } catch (error) {
    return {
      isValid: false,
      age: 0,
      meetsMinimumAge: false,
      calculatedFrom: 'invalid_date',
    };
  }
};

/**
 * Validate date format and reasonableness
 */
export const validateDate = (dateString: string, type: 'birth' | 'issue' | 'expiry'): boolean => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return false;
  }
  
  const now = new Date();
  const currentYear = now.getFullYear();
  
  switch (type) {
    case 'birth':
      // Birth date should be between 1900 and current date
      return date.getFullYear() >= 1900 && date <= now;
    
    case 'issue':
      // Issue date should be within reasonable range (not future, not too old)
      const maxAge = 20; // Documents older than 20 years might be suspicious
      const minIssueDate = new Date(currentYear - maxAge, 0, 1);
      return date >= minIssueDate && date <= now;
    
    case 'expiry':
      // Expiry date should be in the future (but not too far)
      const maxFutureYears = 15; // No document valid for more than 15 years
      const maxExpiryDate = new Date(currentYear + maxFutureYears, 11, 31);
      return date > now && date <= maxExpiryDate;
    
    default:
      return false;
  }
};

/**
 * Check if document is expired
 */
export const isDocumentExpired = (expiryDate: string): boolean => {
  const expiry = new Date(expiryDate);
  return expiry <= new Date();
};

/**
 * Validate UK document specific rules
 */
export const validateUKDocumentRules = (
  personalData: PersonalData,
  documentType: DocumentType
): DocumentValidation => {
  const warnings: string[] = [];
  const errors: string[] = [];
  let isAuthentic = true;
  
  // Check document number format
  if (!validateDocumentNumber(personalData.documentNumber, documentType)) {
    errors.push('Invalid document number format');
    isAuthentic = false;
  }
  
  // Check dates
  if (personalData.dateOfBirth && !validateDate(personalData.dateOfBirth, 'birth')) {
    errors.push('Invalid date of birth');
    isAuthentic = false;
  }
  
  if (personalData.issueDate && !validateDate(personalData.issueDate, 'issue')) {
    warnings.push('Issue date appears unusual');
  }
  
  if (personalData.expiryDate) {
    if (!validateDate(personalData.expiryDate, 'expiry')) {
      errors.push('Invalid expiry date');
      isAuthentic = false;
    } else if (isDocumentExpired(personalData.expiryDate)) {
      errors.push('Document has expired');
      isAuthentic = false;
    }
  }
  
  // Check name format
  if (!personalData.firstName || personalData.firstName.trim().length < 2) {
    errors.push('Invalid first name');
    isAuthentic = false;
  }
  
  if (!personalData.lastName || personalData.lastName.trim().length < 2) {
    errors.push('Invalid last name');
    isAuthentic = false;
  }
  
  // Check gender format
  if (personalData.gender && !['M', 'F', 'X', 'O'].includes(personalData.gender)) {
    warnings.push('Unusual gender specification');
  }
  
  // Document-specific validations
  switch (documentType) {
    case 'passport':
      if (!personalData.issuingCountry || personalData.issuingCountry !== 'GBR') {
        warnings.push('Non-UK passport detected');
      }
      break;
    
    case 'driving_license':
    case 'provisional_license':
      if (!personalData.address) {
        warnings.push('Driving license missing address information');
      }
      break;
    
    case 'national_id':
      if (!personalData.nationality) {
        warnings.push('National ID missing nationality information');
      }
      break;
  }
  
  // Calculate confidence based on validation results
  let confidence = 1.0;
  confidence -= errors.length * 0.3; // Each error reduces confidence significantly
  confidence -= warnings.length * 0.1; // Each warning reduces confidence slightly
  confidence = Math.max(0, Math.min(1, confidence)); // Clamp between 0 and 1
  
  return {
    isAuthentic,
    confidence,
    checks: {
      documentIntegrity: errors.length === 0,
      visualZoneValid: true, // Would be checked by OCR/provider
      mrzValid: documentType === 'passport', // MRZ only on passports
      securityFeatures: true, // Would be checked by provider
    },
    warnings,
    errors,
  };
};

/**
 * Validate postal code format (UK)
 */
export const validateUKPostalCode = (postalCode: string): boolean => {
  // UK postal code regex (supports all valid UK postcode formats)
  const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  return ukPostcodeRegex.test(postalCode.replace(/\s+/g, ' ').trim());
};

/**
 * Validate UK phone number format
 */
export const validateUKPhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // UK mobile numbers: 11 digits starting with 07
  // UK landline: 11 digits starting with 01 or 02
  // International format: +44 followed by 10 digits
  if (cleaned.startsWith('44') && cleaned.length === 12) {
    return true; // +44 format
  }
  
  if (cleaned.length === 11) {
    return cleaned.startsWith('01') || cleaned.startsWith('02') || cleaned.startsWith('07');
  }
  
  return false;
};

/**
 * Check if names contain suspicious patterns
 */
export const validateNamePatterns = (firstName: string, lastName: string): boolean => {
  // Check for common suspicious patterns
  const suspiciousPatterns = [
    /^test/i,
    /^fake/i,
    /^dummy/i,
    /^\d+$/,
    /^[a-z]+$/g, // All lowercase might be suspicious
    /(.)\1{4,}/, // Repeated characters
  ];
  
  const fullName = `${firstName} ${lastName}`.toLowerCase();
  
  return !suspiciousPatterns.some(pattern => pattern.test(fullName));
};

/**
 * Comprehensive document validation
 */
export const validateDocument = (
  personalData: PersonalData,
  documentType: DocumentType
): DocumentValidation => {
  const baseValidation = validateUKDocumentRules(personalData, documentType);
  
  // Additional checks
  if (!validateNamePatterns(personalData.firstName, personalData.lastName)) {
    baseValidation.warnings.push('Names contain unusual patterns');
    baseValidation.confidence *= 0.9;
  }
  
  // Address validation if present
  if (personalData.address?.postalCode && 
      !validateUKPostalCode(personalData.address.postalCode)) {
    baseValidation.warnings.push('Invalid UK postal code format');
    baseValidation.confidence *= 0.95;
  }
  
  return baseValidation;
};
