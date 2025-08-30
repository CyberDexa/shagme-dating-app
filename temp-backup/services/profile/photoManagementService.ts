/**
 * Photo Management Service
 * Epic 002: Profile Creation & Management
 * Story 002: Photo Management System
 * 
 * Handles photo upload, verification, moderation, and management
 */

import {
  ProfilePhoto,
  UserProfile,
  UploadPhotoRequest,
  ProfileError,
  ProfileValidationError,
  ProfileNotFoundError,
  ProfilePermissionError
} from '../../types/profile';
import { ProfileService } from './profileService';

export interface PhotoUploadResult {
  photo: ProfilePhoto;
  uploadTime: number;
  processingStatus: 'uploaded' | 'processing' | 'completed' | 'failed';
}

export interface PhotoModerationResult {
  photoId: string;
  status: 'approved' | 'rejected' | 'flagged';
  confidence: number;
  flags: string[];
  moderatorNotes?: string;
}

export interface PhotoAnalysisResult {
  quality: number; // 0-1 score
  lighting: number; // 0-1 score
  clarity: number; // 0-1 score
  faceDetected: boolean;
  inappropriateContent: boolean;
  suggestedCategory: 'primary' | 'additional' | 'reject';
}

export class PhotoManagementService {
  private static instance: PhotoManagementService;
  private profileService: ProfileService;
  
  // Photo constraints
  private readonly MAX_PHOTOS = 9;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];
  private readonly MIN_RESOLUTION = { width: 400, height: 400 };
  private readonly MAX_RESOLUTION = { width: 4000, height: 4000 };

  private constructor() {
    this.profileService = ProfileService.getInstance();
  }

  public static getInstance(): PhotoManagementService {
    if (!PhotoManagementService.instance) {
      PhotoManagementService.instance = new PhotoManagementService();
    }
    return PhotoManagementService.instance;
  }

  /**
   * Upload a new photo to user's profile
   */
  async uploadPhoto(userId: string, request: UploadPhotoRequest): Promise<PhotoUploadResult> {
    const startTime = Date.now();

    // Get user's profile
    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile) {
      throw new ProfileNotFoundError(userId);
    }

    // Validate photo constraints
    await this.validatePhotoUpload(profile, request);

    // Process the image
    const processedPhoto = await this.processPhotoUpload(request);

    // Create photo record
    const photo: ProfilePhoto = {
      id: this.generatePhotoId(),
      url: processedPhoto.url,
      thumbnailUrl: processedPhoto.thumbnailUrl,
      isPrimary: request.isPrimary || profile.photos.length === 0, // First photo is primary
      isVerified: false, // Will be verified through moderation
      uploadedAt: new Date(),
      moderationStatus: 'pending',
      order: request.order || profile.photos.length + 1,
      metadata: processedPhoto.metadata
    };

    // Add photo to profile
    const updatedPhotos = [...profile.photos, photo];
    
    // If this is set as primary, update other photos
    if (photo.isPrimary) {
      updatedPhotos.forEach(p => {
        if (p.id !== photo.id) {
          p.isPrimary = false;
        }
      });
    }

    // Update profile
    await this.profileService.updateProfile(userId, profile.userId, {
      // Note: This would need to be updated when profile service supports photo updates
    });

    // Store photo separately (for now)
    await this.storePhoto(photo);

    // Trigger moderation process
    this.triggerPhotoModeration(photo.id);

    return {
      photo,
      uploadTime: Date.now() - startTime,
      processingStatus: 'completed'
    };
  }

  /**
   * Update photo order and settings
   */
  async updatePhoto(userId: string, photoId: string, updates: {
    isPrimary?: boolean;
    order?: number;
  }): Promise<ProfilePhoto> {
    const photo = await this.getPhoto(photoId);
    if (!photo) {
      throw new Error(`Photo not found: ${photoId}`);
    }

    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile || profile.userId !== userId) {
      throw new ProfilePermissionError('update photo', photoId);
    }

    // Apply updates
    const updatedPhoto: ProfilePhoto = {
      ...photo,
      isPrimary: updates.isPrimary ?? photo.isPrimary,
      order: updates.order ?? photo.order
    };

    // If setting as primary, update other photos
    if (updates.isPrimary) {
      const allPhotos = await this.getUserPhotos(userId);
      for (const otherPhoto of allPhotos) {
        if (otherPhoto.id !== photoId) {
          otherPhoto.isPrimary = false;
          await this.storePhoto(otherPhoto);
        }
      }
    }

    await this.storePhoto(updatedPhoto);
    return updatedPhoto;
  }

  /**
   * Delete a photo from user's profile
   */
  async deletePhoto(userId: string, photoId: string): Promise<boolean> {
    const photo = await this.getPhoto(photoId);
    if (!photo) {
      throw new Error(`Photo not found: ${photoId}`);
    }

    const profile = await this.profileService.getProfileByUserId(userId);
    if (!profile || profile.userId !== userId) {
      throw new ProfilePermissionError('delete photo', photoId);
    }

    // Check if this is the only photo
    const userPhotos = await this.getUserPhotos(userId);
    if (userPhotos.length === 1) {
      throw new ProfileValidationError([{
        code: 'CANNOT_DELETE_LAST_PHOTO',
        message: 'Cannot delete the last photo. Upload a new photo before deleting this one.',
        field: 'photos'
      }]);
    }

    // If deleting primary photo, set another as primary
    if (photo.isPrimary && userPhotos.length > 1) {
      const nextPrimary = userPhotos.find(p => p.id !== photoId);
      if (nextPrimary) {
        nextPrimary.isPrimary = true;
        await this.storePhoto(nextPrimary);
      }
    }

    // Delete the photo
    await this.deletePhotoRecord(photoId);
    
    // Delete from storage
    await this.deletePhotoFromStorage(photo.url);
    
    return true;
  }

  /**
   * Get all photos for a user
   */
  async getUserPhotos(userId: string): Promise<ProfilePhoto[]> {
    // In real implementation, this would query database
    return this.retrieveUserPhotos(userId);
  }

  /**
   * Get photo by ID
   */
  async getPhoto(photoId: string): Promise<ProfilePhoto | null> {
    return this.retrievePhoto(photoId);
  }

  /**
   * Moderate a photo (admin function)
   */
  async moderatePhoto(photoId: string, moderation: {
    status: 'approved' | 'rejected' | 'flagged';
    notes?: string;
  }): Promise<PhotoModerationResult> {
    const photo = await this.getPhoto(photoId);
    if (!photo) {
      throw new Error(`Photo not found: ${photoId}`);
    }

    const updatedPhoto: ProfilePhoto = {
      ...photo,
      moderationStatus: moderation.status,
      moderationNotes: moderation.notes,
      isVerified: moderation.status === 'approved'
    };

    await this.storePhoto(updatedPhoto);

    return {
      photoId,
      status: moderation.status,
      confidence: 1.0, // Manual moderation has full confidence
      flags: moderation.status === 'approved' ? [] : ['manual_review'],
      moderatorNotes: moderation.notes
    };
  }

  /**
   * Analyze photo quality and content
   */
  async analyzePhoto(imageData: string): Promise<PhotoAnalysisResult> {
    // In real implementation, this would use AI/ML services
    // For now, return mock analysis
    return {
      quality: 0.85,
      lighting: 0.8,
      clarity: 0.9,
      faceDetected: true,
      inappropriateContent: false,
      suggestedCategory: 'primary'
    };
  }

  /**
   * Validate photo upload request
   */
  private async validatePhotoUpload(profile: UserProfile, request: UploadPhotoRequest): Promise<void> {
    const errors: ProfileError[] = [];

    // Check photo count limit
    if (profile.photos.length >= this.MAX_PHOTOS) {
      errors.push({
        code: 'MAX_PHOTOS_EXCEEDED',
        message: `Maximum ${this.MAX_PHOTOS} photos allowed`,
        field: 'photos'
      });
    }

    // Validate image data
    if (!request.imageData) {
      errors.push({
        code: 'IMAGE_DATA_REQUIRED',
        message: 'Image data is required',
        field: 'imageData'
      });
    } else {
      // Basic base64 validation
      if (!request.imageData.match(/^data:image\/(jpeg|jpg|png|webp);base64,/)) {
        errors.push({
          code: 'INVALID_IMAGE_FORMAT',
          message: 'Invalid image format. Supported formats: JPEG, PNG, WebP',
          field: 'imageData'
        });
      }

      // Estimate file size from base64
      const base64Data = request.imageData.split(',')[1];
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > this.MAX_FILE_SIZE) {
        errors.push({
          code: 'FILE_TOO_LARGE',
          message: `File size must not exceed ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
          field: 'imageData'
        });
      }
    }

    // Validate order
    if (request.order !== undefined) {
      if (request.order < 1 || request.order > this.MAX_PHOTOS) {
        errors.push({
          code: 'INVALID_PHOTO_ORDER',
          message: `Photo order must be between 1 and ${this.MAX_PHOTOS}`,
          field: 'order'
        });
      }
    }

    if (errors.length > 0) {
      throw new ProfileValidationError(errors);
    }
  }

  /**
   * Process photo upload (resize, optimize, generate thumbnails)
   */
  private async processPhotoUpload(request: UploadPhotoRequest): Promise<{
    url: string;
    thumbnailUrl: string;
    metadata: {
      width: number;
      height: number;
      fileSize: number;
      format: string;
    };
  }> {
    // In real implementation, this would:
    // 1. Decode base64 image
    // 2. Validate dimensions
    // 3. Resize if needed
    // 4. Generate thumbnail
    // 5. Upload to cloud storage
    // 6. Return URLs

    // Mock implementation
    const photoId = this.generatePhotoId();
    
    return {
      url: `https://storage.shagme.app/photos/${photoId}.jpg`,
      thumbnailUrl: `https://storage.shagme.app/photos/thumbs/${photoId}.jpg`,
      metadata: {
        width: 800,
        height: 800,
        fileSize: 150000, // ~150KB
        format: 'jpeg'
      }
    };
  }

  /**
   * Trigger photo moderation process
   */
  private async triggerPhotoModeration(photoId: string): Promise<void> {
    // In real implementation, this would:
    // 1. Queue photo for AI moderation
    // 2. Check for inappropriate content
    // 3. Verify photo quality
    // 4. Update moderation status
    
    console.log(`Photo moderation triggered for: ${photoId}`);
  }

  /**
   * Generate unique photo ID
   */
  private generatePhotoId(): string {
    return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods (mock implementations)
  private async storePhoto(photo: ProfilePhoto): Promise<void> {
    console.log('Photo stored:', photo.id);
  }

  private async retrievePhoto(photoId: string): Promise<ProfilePhoto | null> {
    // Mock retrieval
    return null;
  }

  private async retrieveUserPhotos(userId: string): Promise<ProfilePhoto[]> {
    // Mock retrieval
    return [];
  }

  private async deletePhotoRecord(photoId: string): Promise<void> {
    console.log('Photo record deleted:', photoId);
  }

  private async deletePhotoFromStorage(url: string): Promise<void> {
    console.log('Photo deleted from storage:', url);
  }
}
