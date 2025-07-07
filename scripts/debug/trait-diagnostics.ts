/**
 * Trait Loading Diagnostics Script
 * 
 * Run this script in the FoundryVTT console to diagnose why custom traits
 * aren't appearing in autocomplete suggestions.
 * 
 * Usage: Copy and paste this entire script into the browser console
 */

export async function runTraitDiagnostics() {
    console.log('🔍 TRAIT DIAGNOSTICS | Starting comprehensive trait system analysis...');
    
    try {
        // 1. Check if game is ready
        console.log('🔍 1. Checking FoundryVTT game state...');
        const game = (globalThis as any).game;
        if (!game?.ready) {
            console.error('❌ Game is not ready yet. Wait for FoundryVTT to fully load.');
            return;
        }
        console.log('✅ Game is ready');
        
        // 2. Check initialization manager
        console.log('🔍 2. Checking initialization manager...');
        const initManager = game?.avant?.initializationManager;
        if (!initManager) {
            console.error('❌ InitializationManager not found on game.avant');
            console.log('🔍 Available on game.avant:', Object.keys(game?.avant || {}));
            return;
        }
        console.log('✅ InitializationManager found');
        
        // 3. Check trait provider service
        console.log('🔍 3. Checking TraitProvider service...');
        const traitProvider = await initManager.waitForService('traitProvider');
        if (!traitProvider) {
            console.error('❌ TraitProvider service not available');
            console.log('🔍 Service status:', initManager.getStatusReport());
            return;
        }
        console.log('✅ TraitProvider service available');
        
        // 4. Check compendium packs
        console.log('🔍 4. Checking compendium pack availability...');
        const packInfo = await traitProvider.getPackInfo();
        console.log('📦 Pack info result:', packInfo);
        
        if (packInfo.success && packInfo.data) {
            console.log('📦 System pack info:', packInfo.data.system);
            console.log('📦 World pack info:', packInfo.data.world);
            
            if (!packInfo.data.system.exists) {
                console.warn('⚠️ System pack "avant.avant-traits" does not exist');
            } else {
                console.log('✅ System pack exists');
            }
            
            if (!packInfo.data.world.exists) {
                console.warn('⚠️ World pack "custom-traits" does not exist');
            } else {
                console.log('✅ World pack exists');
            }
        } else {
            console.error('❌ Failed to get pack info:', packInfo.error);
        }
        
        // 5. Load traits and show breakdown
        console.log('🔍 5. Loading traits from both packs...');
        
        // Load system traits only
        console.log('🔍 5a. Loading system traits only...');
        const systemTraitsResult = await traitProvider.getAll({ 
            includeSystem: true, 
            includeWorld: false,
            forceRefresh: true 
        });
        console.log('🔧 System traits result:', systemTraitsResult);
        if (systemTraitsResult.success && systemTraitsResult.data) {
            console.log(`✅ System traits loaded: ${systemTraitsResult.data.length}`);
            console.log('🔧 System trait names:', systemTraitsResult.data.map((t: any) => t.name));
        } else {
            console.error('❌ Failed to load system traits:', systemTraitsResult.error);
        }
        
        // Load world traits only
        console.log('🔍 5b. Loading world/custom traits only...');
        const worldTraitsResult = await traitProvider.getAll({ 
            includeSystem: false, 
            includeWorld: true,
            forceRefresh: true 
        });
        console.log('🔧 World traits result:', worldTraitsResult);
        if (worldTraitsResult.success && worldTraitsResult.data) {
            console.log(`✅ World/custom traits loaded: ${worldTraitsResult.data.length}`);
            console.log('🔧 World trait names:', worldTraitsResult.data.map((t: any) => t.name));
            
            if (worldTraitsResult.data.length === 0) {
                console.warn('⚠️ ISSUE IDENTIFIED: World pack exists but contains no traits!');
                console.warn('💡 This is why custom traits don\'t appear in autocomplete');
                console.warn('💡 Solution: Create custom traits in the "custom-traits" compendium pack');
            }
        } else {
            console.error('❌ Failed to load world traits:', worldTraitsResult.error);
        }
        
        // Load all traits together
        console.log('🔍 5c. Loading all traits (combined)...');
        const allTraitsResult = await traitProvider.getAll({ 
            includeSystem: true, 
            includeWorld: true,
            forceRefresh: true 
        });
        console.log('🔧 All traits result:', allTraitsResult);
        if (allTraitsResult.success && allTraitsResult.data) {
            console.log(`✅ Total traits loaded: ${allTraitsResult.data.length}`);
            console.log('🔧 All trait names:', allTraitsResult.data.map((t: any) => `${t.name} (${t.source})`));
            
            // Group by source
            const systemCount = allTraitsResult.data.filter((t: any) => t.source === 'system').length;
            const worldCount = allTraitsResult.data.filter((t: any) => t.source === 'world').length;
            console.log(`📊 Breakdown: ${systemCount} system traits, ${worldCount} world traits`);
        } else {
            console.error('❌ Failed to load all traits:', allTraitsResult.error);
        }
        
        // 6. Test autocomplete generation
        console.log('🔍 6. Testing autocomplete suggestion generation...');
        const { generateTraitSuggestions } = await import('../logic/trait-utils.ts');
        
        if (allTraitsResult.success && allTraitsResult.data) {
            const testQueries = ['fire', 'custom', 'ice', 'heal'];
            
            for (const query of testQueries) {
                console.log(`🔍 Testing query: "${query}"`);
                const suggestions = generateTraitSuggestions(allTraitsResult.data, query, 10);
                console.log(`  ➡️ Suggestions for "${query}":`, suggestions.map(s => s.name));
            }
        }
        
        // 7. Summary and recommendations
        console.log('🔍 7. SUMMARY AND RECOMMENDATIONS');
        console.log('================================================');
        
        if (systemTraitsResult.success && systemTraitsResult.data?.length > 0) {
            console.log('✅ System traits are loading correctly');
        } else {
            console.error('❌ Problem with system traits');
        }
        
        if (worldTraitsResult.success && worldTraitsResult.data?.length > 0) {
            console.log('✅ Custom traits are loading correctly');
        } else if (worldTraitsResult.success && worldTraitsResult.data?.length === 0) {
            console.warn('⚠️ Custom traits pack is empty');
            console.warn('💡 SOLUTION: Create custom traits in the "custom-traits" compendium pack');
            console.warn('💡 Steps:');
            console.warn('   1. Go to Compendium Packs');
            console.warn('   2. Create/open "custom-traits" pack');
            console.warn('   3. Add Feature items with trait metadata');
            console.warn('   4. Refresh autocomplete to see both system and custom traits');
        } else {
            console.error('❌ Problem loading custom traits:', worldTraitsResult.error);
        }
        
        console.log('================================================');
        console.log('🔍 TRAIT DIAGNOSTICS | Analysis complete!');
        
    } catch (error) {
        console.error('❌ TRAIT DIAGNOSTICS | Error during analysis:', error);
        console.error('❌ Stack trace:', (error as Error)?.stack);
    }
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
    console.log('🔍 TRAIT DIAGNOSTICS | Run runTraitDiagnostics() to start analysis');
    (window as any).runTraitDiagnostics = runTraitDiagnostics;
}

// For manual execution in console:
console.log(`
🔍 TRAIT DIAGNOSTICS SCRIPT LOADED
==================================

To run diagnostics, execute:
runTraitDiagnostics()

This will check:
- FoundryVTT initialization status
- Trait provider service availability
- System and world compendium pack status
- Trait loading from both sources
- Autocomplete suggestion generation
- Provide specific solutions for any issues found
`); 