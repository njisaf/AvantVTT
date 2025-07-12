/**
 * Debug script to test trait display functionality
 * Run this in the browser console when the system is loaded
 */

(async function debugTraitDisplay() {
    console.log('🔍 Starting trait display debug...');
    
    // Check if the game is ready
    if (!game || !game.avant) {
        console.error('❌ Game or avant system not ready');
        return;
    }
    
    // Check if InitializationManager is available
    const initManager = game.avant.initializationManager;
    if (!initManager) {
        console.error('❌ InitializationManager not available');
        return;
    }
    
    console.log('✅ InitializationManager available');
    
    // Check if TraitProvider service is available
    let traitProvider;
    try {
        traitProvider = await initManager.waitForService('traitProvider', 5000);
        console.log('✅ TraitProvider service available:', traitProvider);
    } catch (error) {
        console.error('❌ TraitProvider service not available:', error);
        return;
    }
    
    // Test trait lookup
    console.log('🔍 Testing trait lookup...');
    
    const testTraitIds = ['Fire', 'Water', 'Earth', 'Air', 'fROYGUX93Sy3aqgM'];
    
    for (const traitId of testTraitIds) {
        try {
            const result = await traitProvider.findByReference(traitId);
            console.log(`🏷️ Trait lookup for "${traitId}":`, {
                success: result.success,
                found: !!result.data,
                name: result.data?.name,
                color: result.data?.color,
                icon: result.data?.icon,
                metadata: result.metadata
            });
        } catch (error) {
            console.error(`❌ Error looking up trait "${traitId}":`, error);
        }
    }
    
    // Test the trait data preparation module
    console.log('🔍 Testing trait data preparation...');
    
    try {
        const { prepareTraitDisplayData, DEFAULT_TRAIT_DATA_CONFIG } = await import('./scripts/logic/trait-data-preparation.ts');
        
        const testContext = {
            id: 'test-item',
            name: 'Test Item',
            type: 'weapon',
            traitIds: ['Fire', 'Water', 'fROYGUX93Sy3aqgM']
        };
        
        const result = await prepareTraitDisplayData(testContext, DEFAULT_TRAIT_DATA_CONFIG);
        console.log('🏷️ Trait data preparation result:', {
            success: result.success,
            traitsCount: result.traits.length,
            traits: result.traits.map(t => ({
                id: t.id,
                name: t.name,
                color: t.color,
                source: t.source,
                isFallback: t.isFallback
            })),
            metadata: result.metadata
        });
        
    } catch (error) {
        console.error('❌ Error testing trait data preparation:', error);
    }
    
    console.log('🔍 Debug complete');
})();