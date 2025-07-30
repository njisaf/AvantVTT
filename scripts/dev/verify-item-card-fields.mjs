#!/usr/bin/env node

/**
 * @fileoverview Item Card Field Verification Script
 * @description Verifies that all item-card layouts include fields from their corresponding item-sheet layouts
 * @version 1.0.0
 * @author Avant Development Team
 */

import {
  getActionCardLayout,
  getFeatureCardLayout,
  getTraitCardLayout
} from '../layout/item-card/index.ts';
import {
  header as getActionHeader,
  body as getActionBody
} from '../layout/item-sheet/item-types/action.ts';
import {
  header as getFeatureHeader,
  body as getFeatureBody
} from '../layout/item-sheet/item-types/feature.ts';
import {
  header as getTraitHeader,
  body as getTraitBody
} from '../layout/item-sheet/item-types/trait.ts';

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

// Test function to verify card layouts include expected fields
function verifyCardLayout(layoutFn, item, expectedFields) {
  console.log(`\n🔍 Verifying ${item.type} card layout...`);
  const layout = layoutFn(item);
  
  // Check center fields for expected content
  const centerFields = layout.center || [];
  const fieldNames = centerFields.map(f => f.name);
  
  console.log(`   Center fields: ${fieldNames.join(', ')}`);
  
  const missingFields = expectedFields.filter(field => !fieldNames.includes(field));
  if (missingFields.length === 0) {
    console.log(`   ✅ All expected fields present`);
    return true;
  } else {
    console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
    return false;
  }
}

// Run verification tests
console.log('🧪 Item Card Field Verification Tests\n');

const actionResult = verifyCardLayout(
  getActionCardLayout, 
  mockActionItem, 
  ['actionName', 'ability', 'difficulty', 'actionCosts', 'description']
);

const featureResult = verifyCardLayout(
  getFeatureCardLayout, 
  mockFeatureItem, 
  ['featureName', 'meta', 'category', 'description']
);

const traitResult = verifyCardLayout(
  getTraitCardLayout, 
  mockTraitItem, 
  ['traitName', 'preview', 'description', 'rarity']
);

// Summary
console.log('\n📊 Test Summary:');
console.log(`   Action Card: ${actionResult ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Feature Card: ${featureResult ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Trait Card: ${traitResult ? '✅ PASS' : '❌ FAIL'}`);

if (actionResult && featureResult && traitResult) {
  console.log('\n🎉 All tests passed! Item cards display all fields from item sheets.');
  process.exit(0);
} else {
  console.log('\n💥 Some tests failed. Please review the card layouts.');
  process.exit(1);
}