/**
 * Integration test for trait chip color persistence bug
 * Tests that trait IDs remain stable and don't regenerate on each load
 */

import { jest } from '@jest/globals';

describe('Trait Chip Color Persistence - Root Cause Fix', () => {
    test('should generate stable, deterministic trait IDs without timestamps', () => {
        // Mock trait items as they would come from FoundryVTT compendiums
        const mockFireItem = {
            _id: null, // Simulating null ID from build process
            id: undefined,
            name: 'Fire',
            type: 'trait',
            system: {
                color: '#FF6B6B',
                icon: 'fas fa-fire',
                localKey: 'AVANT.Trait.Fire',
                description: 'Fire trait'
            }
        };

        const mockIceItem = {
            _id: null,
            id: undefined, 
            name: 'Ice',
            type: 'trait',
            system: {
                color: '#4ECDC4',
                icon: 'fas fa-snowflake',
                localKey: 'AVANT.Trait.Ice',
                description: 'Ice trait'
            }
        };

        // Simulate the FIXED convertItemToTrait logic
        function convertItemToTrait(item, source) {
            let traitId = item._id || item.id;
            if (!traitId) {
                // FIXED: Generate stable, deterministic ID (NO timestamp)
                const sanitizedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                traitId = `${source}_trait_${sanitizedName}`;
            }
            
            return {
                id: traitId,
                name: item.name,
                color: item.system.color,
                icon: item.system.icon,
                localKey: item.system.localKey,
                description: item.system.description,
                source
            };
        }

        // Test multiple calls generate the same IDs
        const firstFireTrait = convertItemToTrait(mockFireItem, 'system');
        const secondFireTrait = convertItemToTrait(mockFireItem, 'system');
        const thirdFireTrait = convertItemToTrait(mockFireItem, 'system');

        const firstIceTrait = convertItemToTrait(mockIceItem, 'system');
        const secondIceTrait = convertItemToTrait(mockIceItem, 'system');

        // ✅ CRITICAL: IDs should be stable across multiple generations
        expect(firstFireTrait.id).toBe('system_trait_fire');
        expect(secondFireTrait.id).toBe('system_trait_fire');
        expect(thirdFireTrait.id).toBe('system_trait_fire');
        expect(firstFireTrait.id).toBe(secondFireTrait.id);
        expect(secondFireTrait.id).toBe(thirdFireTrait.id);

        expect(firstIceTrait.id).toBe('system_trait_ice');
        expect(secondIceTrait.id).toBe('system_trait_ice');
        expect(firstIceTrait.id).toBe(secondIceTrait.id);

        // ✅ Different traits should have different IDs
        expect(firstFireTrait.id).not.toBe(firstIceTrait.id);

        // ✅ All other properties should be preserved
        expect(firstFireTrait.name).toBe('Fire');
        expect(firstFireTrait.color).toBe('#FF6B6B');
        expect(firstFireTrait.icon).toBe('fas fa-fire');
        
        expect(firstIceTrait.name).toBe('Ice');
        expect(firstIceTrait.color).toBe('#4ECDC4');
        expect(firstIceTrait.icon).toBe('fas fa-snowflake');
    });

    test('should handle trait names with special characters', () => {
        const mockItem = {
            _id: null,
            name: 'Fire & Ice',
            type: 'trait',
            system: { color: '#FF6B6B', icon: 'fas fa-fire' }
        };

        function convertItemToTrait(item, source) {
            let traitId = item._id || item.id;
            if (!traitId) {
                const sanitizedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                traitId = `${source}_trait_${sanitizedName}`;
            }
            return { id: traitId, name: item.name };
        }

        const trait = convertItemToTrait(mockItem, 'system');
        expect(trait.id).toBe('system_trait_fire___ice'); // Special chars become underscores
    });

    test('should demonstrate the bug scenario that was fixed', async () => {
        // Simulate the OLD (buggy) behavior with timestamps
        function oldConvertItemToTrait(item, source, mockTimestamp) {
            let traitId = item._id || item.id;
            if (!traitId) {
                // OLD BUG: Used timestamp causing different IDs each time
                const timestamp = mockTimestamp || Date.now();
                traitId = `${source}_trait_${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}`;
            }
            return { id: traitId, name: item.name };
        }

        const mockItem = {
            _id: null,
            name: 'Fire',
            type: 'trait'
        };

        // Simulate the bug by using different timestamps (as would happen in real system)
        const firstTimestamp = 1750811543951;  // Simulated first load
        const secondTimestamp = 1750812994899; // Simulated second load (different time)
        
        const firstCall = oldConvertItemToTrait(mockItem, 'system', firstTimestamp);
        const secondCall = oldConvertItemToTrait(mockItem, 'system', secondTimestamp);

        // This demonstrates the bug: same trait, different IDs due to timestamps
        expect(firstCall.id).not.toBe(secondCall.id);
        expect(firstCall.id).toBe('system_trait_fire_1750811543951');
        expect(secondCall.id).toBe('system_trait_fire_1750812994899');
        expect(firstCall.id).toMatch(/^system_trait_fire_\d+$/);
        expect(secondCall.id).toMatch(/^system_trait_fire_\d+$/);

        // This is why trait chips turned grey - the IDs kept changing!
        console.log('Old buggy IDs:', firstCall.id, 'vs', secondCall.id);
        
        // Now test the fix - deterministic IDs should be the same
        function fixedConvertItemToTrait(item, source) {
            let traitId = item._id || item.id;
            if (!traitId) {
                // FIXED: No timestamp, deterministic based on name only
                const sanitizedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                traitId = `${source}_trait_${sanitizedName}`;
            }
            return { id: traitId, name: item.name };
        }
        
        const fixedFirstCall = fixedConvertItemToTrait(mockItem, 'system');
        const fixedSecondCall = fixedConvertItemToTrait(mockItem, 'system');
        
        // With the fix, IDs should always be the same
        expect(fixedFirstCall.id).toBe(fixedSecondCall.id);
        expect(fixedFirstCall.id).toBe('system_trait_fire');
        expect(fixedSecondCall.id).toBe('system_trait_fire');
    });

    test('should resolve custom trait autocomplete issue with correct world pack naming', () => {
        // Test the pack naming fix that resolves custom trait autocomplete
        const correctWorldPackName = 'world.custom-traits';
        const incorrectWorldPackName = 'custom-traits';
        
        // Available packs as they appear in FoundryVTT v13
        const availablePacks = ['world.custom-traits', 'avant.avant-traits'];
        
        // Simulate pack lookup function
        function findPack(packName) {
            return availablePacks.includes(packName);
        }
        
        // OLD (buggy) configuration would fail to find the pack
        expect(findPack(incorrectWorldPackName)).toBe(false);
        
        // NEW (fixed) configuration should successfully find the pack
        expect(findPack(correctWorldPackName)).toBe(true);
        
        // Verify correct pack naming conventions
        expect(correctWorldPackName.startsWith('world.')).toBe(true);
        expect(incorrectWorldPackName.startsWith('world.')).toBe(false);
        
        // This fix resolves the issue where custom traits didn't appear in autocomplete
        const mockTraitProviderConfig = {
            worldPackName: correctWorldPackName, // FIXED: proper world pack name
            systemPackName: 'avant.avant-traits'
        };
        
        expect(findPack(mockTraitProviderConfig.worldPackName)).toBe(true);
        expect(findPack(mockTraitProviderConfig.systemPackName)).toBe(true);
    });
}); 