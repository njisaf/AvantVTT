/**
 * @fileoverview Talent Domain Types
 * @description Type definitions for talent items and their action system
 * @version 1.0.0
 * @author Avant Development Team
 */

/**
 * Valid talent action modes
 */
export type TalentMode = 'immediate' | 'simultaneous' | 'variable';

/**
 * Action data for talent items
 * Replaces the legacy system.cost field with a more flexible action system
 */
export interface TalentAction {
  /** Action mode determines when and how the talent is used */
  mode: TalentMode;
  
  /**
   * Action Point cost for immediate/simultaneous modes
   * For variable mode, represents the default/base cost when applicable
   * 0 = free action
   * null = variable cost (requires minCost/maxCost)
   */
  cost: number | null;
  
  /**
   * Minimum cost for variable mode talents
   * Only applicable when mode === 'variable'
   * null when not specified
   */
  minCost: number | null;
  
  /**
   * Maximum cost for variable mode talents
   * Only applicable when mode === 'variable'
   * null when not specified
   */
  maxCost: number | null;
  
  /**
   * Convenience flag indicating if the action is free (cost === 0)
   * Derived from cost value
   */
  free: boolean;
}

/**
 * Complete talent document structure
 * Represents a talent item in the Avant system
 */
export interface TalentDocument {
  /** Item type identifier */
  type: 'talent';
  
  /** Talent-specific system data */
  system: {
    /** Action point cost and mode information */
    action: TalentAction;
    
    /** Talent description and flavor text */
    description: string;
    
    /** Range of the talent (e.g., "Self", "30 feet", "Weapon Reach") */
    range: string;
    
    /** Duration of the talent effect (if applicable) */
    duration: string | null;
    
    /** Damage dealt by the talent (if applicable) */
    damage: string | null;
    
    /** Talent level requirement */
    level: number;
    
    /** Array of trait IDs associated with this talent */
    traits: string[];
    
    // Other existing talent fields would go here
    [key: string]: unknown;
  };
  
  // Item document properties
  _id?: string;
  name: string;
  img?: string;
  sort?: number;
  folder?: string;
  flags?: Record<string, unknown>;
  [key: string]: unknown;
}