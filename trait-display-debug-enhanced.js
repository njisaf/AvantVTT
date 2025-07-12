/**
 * Enhanced Debug Script for Trait Display Investigation
 * 
 * This script provides comprehensive debugging for the trait display system
 * to identify exactly where the enhancement process is failing.
 */

(async function enhancedTraitDebug() {
    console.log('🔍 ENHANCED TRAIT DEBUG | Starting comprehensive investigation...');
    
    // Helper function to format objects for logging
    const formatObject = (obj, name = 'Object') => {
        if (!obj) return `${name}: null/undefined`;
        if (typeof obj === 'string') return `${name}: "${obj}"`;
        if (Array.isArray(obj)) return `${name}: Array[${obj.length}] = ${JSON.stringify(obj)}`;
        return `${name}: ${JSON.stringify(obj, null, 2)}`;
    };
    
    // 1. Check basic system availability
    console.log('📋 STEP 1: System Availability Check');
    console.log('- Game ready:', !!game);
    console.log('- Avant system:', !!game?.avant);
    console.log('- InitializationManager:', !!game?.avant?.initializationManager);
    
    if (!game?.avant?.initializationManager) {
        console.error('❌ Cannot proceed - InitializationManager not available');
        return;
    }
    
    const initManager = game.avant.initializationManager;
    
    // 2. Check TraitProvider service availability
    console.log('\\n📋 STEP 2: TraitProvider Service Check');
    
    let traitProvider = null;
    try {
        // Try immediate access first
        traitProvider = initManager.getService('traitProvider');
        console.log('✅ TraitProvider immediate access:', !!traitProvider);
    } catch (error) {
        console.log('⚠️ TraitProvider immediate access failed:', error.message);
    }
    
    // Try waiting for service
    if (!traitProvider) {
        try {
            console.log('⏳ Waiting for TraitProvider service...');
            traitProvider = await initManager.waitForService('traitProvider', 5000);
            console.log('✅ TraitProvider wait succeeded:', !!traitProvider);
        } catch (error) {
            console.error('❌ TraitProvider wait failed:', error.message);
            return;
        }
    }
    
    // 3. Test trait provider functionality
    console.log('\\n📋 STEP 3: TraitProvider Functionality Test');
    
    // Test getting all traits
    try {
        const allTraitsResult = await traitProvider.getAll();
        console.log('🏷️ All traits result:', {
            success: allTraitsResult.success,
            count: allTraitsResult.data?.length || 0,
            error: allTraitsResult.error
        });
        
        if (allTraitsResult.success && allTraitsResult.data?.length > 0) {
            console.log('🏷️ Sample traits:', allTraitsResult.data.slice(0, 3).map(t => ({
                id: t.id,
                name: t.name,
                color: t.color,
                icon: t.icon
            })));
        }
    } catch (error) {
        console.error('❌ Error getting all traits:', error);
    }
    
    // Test individual trait lookups
    const testTraits = ['Fire', 'fire', 'Water', 'water', 'fROYGUX93Sy3aqgM'];
    
    for (const traitId of testTraits) {
        try {
            const result = await traitProvider.findByReference(traitId);
            console.log(`🔍 Trait "${traitId}":`, {
                success: result.success,
                found: !!result.data,
                name: result.data?.name,
                color: result.data?.color,
                icon: result.data?.icon,
                matchType: result.metadata?.matchType
            });
        } catch (error) {
            console.error(`❌ Error looking up "${traitId}":`, error);
        }
    }
    
    // 4. Test trait data preparation module
    console.log('\\n📋 STEP 4: Trait Data Preparation Module Test');
    
    try {
        const traitDataPrep = await import('./scripts/logic/trait-data-preparation.ts');
        const { prepareTraitDisplayData, DEFAULT_TRAIT_DATA_CONFIG } = traitDataPrep;
        
        console.log('✅ Trait data preparation module loaded');
        
        // Test the preparation function
        const testContext = {
            id: 'test-item-debug',
            name: 'Debug Test Item',
            type: 'weapon',
            traitIds: ['Fire', 'Water', 'fROYGUX93Sy3aqgM', 'invalid-trait-id']
        };
        
        console.log('🔍 Testing trait data preparation with context:', testContext);
        
        const preparationResult = await prepareTraitDisplayData(testContext, {
            ...DEFAULT_TRAIT_DATA_CONFIG,
            enableDebugLogging: true
        });
        
        console.log('🏷️ Preparation result:', {
            success: preparationResult.success,
            traitsCount: preparationResult.traits.length,
            error: preparationResult.error,
            metadata: preparationResult.metadata
        });
        
        // Log each trait in detail
        preparationResult.traits.forEach((trait, index) => {
            console.log(`🏷️ Trait ${index + 1}:`, {
                id: trait.id,
                name: trait.name,
                color: trait.color,
                textColor: trait.textColor,
                icon: trait.icon,
                source: trait.source,
                isFallback: trait.isFallback,
                displayId: trait.displayId
            });
        });
        
    } catch (error) {
        console.error('❌ Error testing trait data preparation:', error);
    }
    
    // 5. Test context preparation
    console.log('\\n📋 STEP 5: Context Preparation Test');
    
    try {
        const contextPrep = await import('./scripts/logic/context-preparation.ts');
        const { prepareTraitDisplayContext, DEFAULT_CONTEXT_CONFIG } = contextPrep;
        
        console.log('✅ Context preparation module loaded');
        
        // Create mock context
        const mockContext = {
            system: {
                traits: ['Fire', 'Water', 'fROYGUX93Sy3aqgM']
            }
        };
        
        // Create mock display traits
        const mockDisplayTraits = [
            {
                id: 'fire',
                name: 'Fire',
                color: '#FF4444',
                textColor: '#FFFFFF',
                icon: 'fas fa-fire',
                source: 'service',
                isFallback: false
            },
            {
                id: 'water',
                name: 'Water',
                color: '#4444FF',
                textColor: '#FFFFFF',
                icon: 'fas fa-water',
                source: 'service',
                isFallback: false
            }
        ];
        
        console.log('🔍 Testing context preparation...');
        console.log('- Mock context:', mockContext);
        console.log('- Mock display traits:', mockDisplayTraits);
        
        const contextResult = prepareTraitDisplayContext(mockContext, mockDisplayTraits, {
            ...DEFAULT_CONTEXT_CONFIG,
            enableDebugLogging: true
        });
        
        console.log('🏷️ Context preparation result:', {
            success: contextResult.success,
            error: contextResult.error
        });
        
        if (contextResult.success) {
            console.log('🏷️ Enhanced context:', {
                'system.traits': contextResult.value.system.traits,
                displayTraits: contextResult.value.displayTraits,
                originalTraits: contextResult.value.originalTraits
            });
        }
        
    } catch (error) {
        console.error('❌ Error testing context preparation:', error);
    }
    
    // 6. Find and test actual item sheets
    console.log('\\n📋 STEP 6: Live Item Sheet Test');
    
    try {
        // Find an item with traits
        const itemsWithTraits = game.items?.filter(item => 
            item.system?.traits && Array.isArray(item.system.traits) && item.system.traits.length > 0
        );
        
        if (itemsWithTraits?.length > 0) {
            const testItem = itemsWithTraits[0];
            console.log('🔍 Found test item:', {
                id: testItem.id,
                name: testItem.name,
                type: testItem.type,
                traits: testItem.system.traits
            });
            
            // Test the item sheet preparation
            const testSheet = testItem.sheet;
            if (testSheet) {
                console.log('📄 Item sheet available:', testSheet.constructor.name);
                
                // Try to access the sheet's context preparation
                if (testSheet._prepareTraitDisplayData) {
                    try {
                        const sheetTraitData = await testSheet._prepareTraitDisplayData();
                        console.log('🏷️ Sheet trait data:', sheetTraitData);
                    } catch (error) {
                        console.error('❌ Error calling sheet trait data preparation:', error);
                    }
                }
            }
        } else {
            console.log('⚠️ No items with traits found in world');
        }
        
    } catch (error) {
        console.error('❌ Error testing live item sheets:', error);
    }
    
    console.log('\\n🔍 ENHANCED TRAIT DEBUG | Investigation complete');
    console.log('📋 Next steps:');
    console.log('1. Check if TraitProvider service is available when item sheets render');
    console.log('2. Verify trait data preparation is being called with correct context');
    console.log('3. Confirm enhanced trait objects are being passed to templates');
    console.log('4. Check template rendering logic for trait display');
    
})();