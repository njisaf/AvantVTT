/**
 * Simple verification test for talent data structure compatibility
 */

// Import the talent data
import { readFileSync } from 'fs';
const talentData = JSON.parse(readFileSync('./packs/avant-talents/talents.json', 'utf-8'));

console.log('🔍 Testing talent data structure compatibility...\n');

// Test a few sample talents
const testTalents = talentData.slice(0, 3);

testTalents.forEach((talent, index) => {
    console.log(`Talent ${index + 1}: "${talent.name}"`);
    console.log('✓ Has action structure:', !!talent.system.action);
    console.log('✓ Action mode:', talent.system.action?.mode || 'undefined');
    console.log('✓ Action cost:', talent.system.action?.cost ?? 'null');
    console.log('✓ Has level field:', !!talent.system.level);
    console.log('✓ Has range field:', !!talent.system.range);
    console.log('✓ Has duration field:', talent.system.duration !== undefined);
    console.log('✓ Has damage field:', talent.system.damage !== undefined);
    console.log('✓ Has traits array:', Array.isArray(talent.system.traits));
    console.log('---');
});

// Check data consistency
const allHaveActions = talentData.every(t => t.system.action && t.system.action.mode);
const allHaveLevel = talentData.every(t => typeof t.system.level === 'number');
const variableCostTalents = talentData.filter(t => t.system.action?.mode === 'variable');

console.log(`\n📊 Summary:`);
console.log(`✓ Total talents: ${talentData.length}`);
console.log(`✓ All have action structure: ${allHaveActions}`);
console.log(`✓ All have level field: ${allHaveLevel}`);
console.log(`✓ Variable cost talents: ${variableCostTalents.length}`);

if (variableCostTalents.length > 0) {
    console.log('Variable cost examples:');
    variableCostTalents.forEach(t => {
        console.log(`  - ${t.name}: ${t.system.action.minCost}-${t.system.action.maxCost} cost`);
    });
}

console.log('\n✅ Talent data structure verification complete!');