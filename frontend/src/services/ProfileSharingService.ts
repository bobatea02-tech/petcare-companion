/**
 * ProfileSharingService - Manages shareable pet profiles with QR codes
 * 
 * Features:
 * - Generate shareable profiles with section selection
 * - Create unique QR codes for profiles
 * - Retrieve profiles by QR code data
 * - Update privacy settings for section control
 * - Revoke profile access
 * - Persistent storage using IndexedDB
 * - Generate unique profile URLs
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Profile section types as per requirements
export type ProfileSection = 
  | 'basic_info'
  | 'medical_history'
  | 'allergies'
  | 'emergency_contacts'
  | 'feeding_schedule'
  | 'medications';

export interface ShareableProfile {
  id: string;
  petId: string;
  userId: string;
  qrCodeData: string; // JSON string containing profile ID and metadata
  shareUrl: string;
  includedSections: ProfileSection[];
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  revoked: boolean;
}

export interface QRCodeData {
  type: 'pet_profile';
  profileId: string;
  version: '1.0';
}

interface ProfileSharingDB extends DBSchema {
  shareableProfiles: {
    key: string;
    value: ShareableProfile;
    indexes: { 'petId': string; 'createdAt': Date };
  };
}

class ProfileSharingService {
  private dbName = 'PetCareDB';
  private dbVersion = 2;
  private db: IDBPDatabase<ProfileSharingDB> | null = null;
  private appDomain = window.location.origin; // Use current origin for profile URLs

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<IDBPDatabase<ProfileSharingDB>> {
    if (this.db) return this.db;

    this.db = await openDB<ProfileSharingDB>(this.dbName, this.dbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create shareableProfiles object store if it doesn't exist
        if (!db.objectStoreNames.contains('shareableProfiles')) {
          const profileStore = db.createObjectStore('shareableProfiles', { keyPath: 'id' });
          profileStore.createIndex('petId', 'petId', { unique: false });
          profileStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      },
    });

    return this.db;
  }

  /**
   * Validate profile sections
   */
  private isValidSection(section: string): section is ProfileSection {
    const validSections: ProfileSection[] = [
      'basic_info',
      'medical_history',
      'allergies',
      'emergency_contacts',
      'feeding_schedule',
      'medications'
    ];
    return validSections.includes(section as ProfileSection);
  }

  /**
   * Generate a unique profile ID
   */
  private generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate QR code data string
   * Requirements: 8.2
   */
  private generateQRCodeData(profileId: string): string {
    const qrData: QRCodeData = {
      type: 'pet_profile',
      profileId,
      version: '1.0'
    };
    return JSON.stringify(qrData);
  }

  /**
   * Generate shareable profile URL
   * Requirements: 8.2
   */
  private generateShareUrl(profileId: string): string {
    return `${this.appDomain}/shared-profile/${profileId}`;
  }

  /**
   * Generate shareable profile with section selection
   * Requirements: 8.1, 8.2, 8.3
   */
  async generateShareableProfile(
    petId: string,
    userId: string,
    sections: ProfileSection[],
    expiresAt?: Date
  ): Promise<ShareableProfile> {
    // Validate sections
    const invalidSections = sections.filter(s => !this.isValidSection(s));
    if (invalidSections.length > 0) {
      throw new Error(`Invalid sections: ${invalidSections.join(', ')}`);
    }

    // Ensure at least one section is selected
    if (sections.length === 0) {
      throw new Error('At least one section must be selected');
    }

    const db = await this.initDB();
    const profileId = this.generateProfileId();
    const qrCodeData = this.generateQRCodeData(profileId);
    const shareUrl = this.generateShareUrl(profileId);

    const newProfile: ShareableProfile = {
      id: profileId,
      petId,
      userId,
      qrCodeData,
      shareUrl,
      includedSections: sections,
      createdAt: new Date(),
      expiresAt,
      accessCount: 0,
      revoked: false,
    };

    await db.add('shareableProfiles', newProfile);
    return newProfile;
  }

  /**
   * Get profile by QR code data
   * Requirements: 8.2
   */
  async getProfileByQRCode(qrData: string): Promise<ShareableProfile | null> {
    try {
      const parsedData: QRCodeData = JSON.parse(qrData);
      
      // Validate QR code format
      if (parsedData.type !== 'pet_profile' || !parsedData.profileId) {
        throw new Error('Invalid QR code format');
      }

      const db = await this.initDB();
      const profile = await db.get('shareableProfiles', parsedData.profileId);

      if (!profile) {
        return null;
      }

      // Check if profile is revoked
      if (profile.revoked) {
        return null;
      }

      // Check if profile is expired
      if (profile.expiresAt && new Date() > new Date(profile.expiresAt)) {
        return null;
      }

      // Increment access count
      profile.accessCount += 1;
      profile.lastAccessedAt = new Date();
      await db.put('shareableProfiles', profile);

      return profile;
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      return null;
    }
  }

  /**
   * Get profile by ID
   * Requirements: 8.7
   */
  async getProfileById(profileId: string): Promise<ShareableProfile | null> {
    const db = await this.initDB();
    const profile = await db.get('shareableProfiles', profileId);

    if (!profile) {
      return null;
    }

    // Check if profile is revoked
    if (profile.revoked) {
      return null;
    }

    // Check if profile is expired
    if (profile.expiresAt && new Date() > new Date(profile.expiresAt)) {
      return null;
    }

    // Increment access count
    profile.accessCount += 1;
    profile.lastAccessedAt = new Date();
    await db.put('shareableProfiles', profile);

    return profile;
  }

  /**
   * Update privacy settings for a profile
   * Requirements: 8.3, 8.5
   */
  async updatePrivacySettings(profileId: string, sections: ProfileSection[]): Promise<ShareableProfile> {
    // Validate sections
    const invalidSections = sections.filter(s => !this.isValidSection(s));
    if (invalidSections.length > 0) {
      throw new Error(`Invalid sections: ${invalidSections.join(', ')}`);
    }

    // Ensure at least one section is selected
    if (sections.length === 0) {
      throw new Error('At least one section must be selected');
    }

    const db = await this.initDB();
    const profile = await db.get('shareableProfiles', profileId);

    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.includedSections = sections;
    await db.put('shareableProfiles', profile);

    return profile;
  }

  /**
   * Revoke profile access
   * Requirements: 8.5
   */
  async revokeProfile(profileId: string): Promise<void> {
    const db = await this.initDB();
    const profile = await db.get('shareableProfiles', profileId);

    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.revoked = true;
    await db.put('shareableProfiles', profile);
  }

  /**
   * Get all profiles for a pet
   */
  async getProfilesForPet(petId: string): Promise<ShareableProfile[]> {
    const db = await this.initDB();
    const profiles = await db.getAllFromIndex('shareableProfiles', 'petId', petId);

    // Filter out expired profiles
    return profiles.filter(profile => {
      if (profile.expiresAt && new Date() > new Date(profile.expiresAt)) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    const db = await this.initDB();
    await db.delete('shareableProfiles', profileId);
  }

  /**
   * Generate QR code (returns the data to be used with qrcode.react)
   * Requirements: 8.2
   */
  generateQRCode(profileId: string): string {
    return this.generateQRCodeData(profileId);
  }
}

// Export singleton instance
export const profileSharingService = new ProfileSharingService();
export default profileSharingService;
