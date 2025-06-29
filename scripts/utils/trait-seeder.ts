/**
 * @fileoverview Trait Seeder Utility - DEPRECATED
 * @version 2.0.0 - FoundryVTT v13 Build-time Approach
 * @description This file is deprecated - system compendium packs should be pre-populated during build
 * @author Avant VTT Team
 */

/**
 * Result of a seeding operation
 */
export interface TraitSeedingResult {
  /** Whether seeding was successful */
  success: boolean;
  
  /** Number of traits seeded */
  seedCount?: number;
  
  /** Error message if seeding failed */
  error?: string;
  
  /** Whether seeding was skipped (pack already populated) */
  skipped?: boolean;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * DEPRECATED: Runtime trait seeding is not supported in FoundryVTT v13
 * 
 * FoundryVTT v13 system compendium packs are locked and cannot be modified at runtime.
 * System packs should be pre-populated during the build process using build tools.
 * 
 * For user-generated traits, use world compendium packs instead.
 */
export class TraitSeeder {
  
  /**
   * DEPRECATED: No longer attempts to seed system packs at runtime
   * 
   * @param worldPackName - Name of the world compendium pack to check
   * @param systemPackName - Name of the system compendium pack (read-only)
   * @returns Promise resolving to seeding result
   */
  async seedSystemPackIfNeeded(
    worldPackName: string = 'custom-traits',
    systemPackName: string = 'avant.avant-traits'
  ): Promise<TraitSeedingResult> {
    console.log('🌱 TraitSeeder | NOTICE: Runtime system pack seeding disabled in FoundryVTT v13');
    console.log('🌱 TraitSeeder | System packs are pre-populated during build process');
    console.log('🌱 TraitSeeder | For custom traits, users should create world compendium packs');
    
    return {
      success: true,
      skipped: true,
      seedCount: 0,
      metadata: {
        message: 'Runtime seeding disabled - system packs are pre-populated during build'
      }
    };
  }
}

/**
 * DEPRECATED: Static helper function 
 * 
 * @param worldPackName - Name of the world compendium pack
 * @param systemPackName - Name of the system compendium pack
 * @returns Promise resolving to seeding result
 */
export async function seedSystemPackIfNeeded(
  worldPackName?: string, 
  systemPackName?: string
): Promise<TraitSeedingResult> {
  const seeder = new TraitSeeder();
  return seeder.seedSystemPackIfNeeded(worldPackName, systemPackName);
}

/**
 * DEPRECATED: Static helper function to check if a pack needs seeding
 * 
 * @param packName - Name of the pack to check
 * @returns Promise resolving to false (no runtime seeding)
 */
export async function packNeedsSeeding(packName: string): Promise<boolean> {
  return false; // No runtime seeding in v13
} 