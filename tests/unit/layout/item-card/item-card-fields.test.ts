/**
 * @fileoverview Item Card Field Verification Tests
 * @description Tests that item-card layouts include all fields from their corresponding item-sheet layouts
 * @version 1.0.0
 * @author Avant Development Team
 */

import { expect, describe, it } from 'vitest';
import { 
  getActionCardLayout, 
  getFeatureCardLayout, 
  getTraitCardLayout 
} from '../../../scripts/layout/item-card/index.ts';

// Mock item data for testing
const mockActionItem = {
  _id: 'action-1',
  name: 'Power Strike',
  img: 'icons/skills/melee/sword-strike-red.webp',
  type: 'action',
  system: {
    ability: 'might',
    difficulty: 13,
    apCost: 2,
    ppCost: 1,
    description: 'A powerful melee attack.'
  }
};

const mockFeatureItem = {
  _id: 'feature-1',
  name: 'Energy Shield',
  img: 'icons/magic/defensive/shield-barrier-blue.webp',
  type: 'feature',
  system: {
    powerPointCost: 3,
    isActive: true,
    category: 'combat',
    source: 'Psionic Training',
    description: 'Creates a protective energy barrier.'
  }
};

const mockTraitItem = {
  _id: 'trait-1',
  name: 'Military Training',
  img: 'icons/equipment/hand/gauntlet-armored-leather-grey.webp',
  type: 'trait',
  system: {
    color: '#4a90e2',
    icon: 'fas fa-shield-alt',
    rarity: 'uncommon',
    description: 'Extensive combat experience.'
  }
};

describe('Item Card Field Verification', () => {
  it('should include all Action sheet fields in Action card', () => {
    const layout = getActionCardLayout(mockActionItem);
    const fieldNames = layout.center.map(f => f.name);
    
    // Check for key fields that should be present
    expect(fieldNames).toContain('actionName');
    expect(fieldNames).toContain('ability');
    expect(fieldNames).toContain('difficulty');
    expect(fieldNames).toContain('actionCosts');
    expect(fieldNames).toContain('description');
  });

  it('should include all Feature sheet fields in Feature card', () => {
    const layout = getFeatureCardLayout(mockFeatureItem);
    const fieldNames = layout.center.map(f => f.name);
    
    // Check for key fields that should be present
    expect(fieldNames).toContain('featureName');
    expect(fieldNames).toContain('meta'); // PP cost + active status combined
    expect(fieldNames).toContain('category');
    expect(fieldNames).toContain('description');
  });

  it('should include all Trait sheet fields in Trait card', () => {
    const layout = getTraitCardLayout(mockTraitItem);
    const fieldNames = layout.center.map(f => f.name);
    
    // Check for key fields that should be present
    expect(fieldNames).toContain('traitName');
    expect(fieldNames).toContain('preview');
    expect(fieldNames).toContain('description');
    expect(fieldNames).toContain('rarity');
  });
});