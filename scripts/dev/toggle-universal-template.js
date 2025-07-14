/**
 * @fileoverview Development utility to toggle universal item template setting
 * @description Provides easy toggle functionality for testing Phase 1 universal template
 * 
 * Usage in FoundryVTT console:
 * - toggleUniversalTemplate()        // Toggle current setting
 * - toggleUniversalTemplate(true)    // Enable universal template
 * - toggleUniversalTemplate(false)   // Disable universal template
 * - checkUniversalTemplate()         // Check current setting
 */

/**
 * Toggle the universal item template setting
 * @param {boolean} [forceValue] - Force enable/disable instead of toggling
 * @returns {boolean} New setting value
 */
function toggleUniversalTemplate(forceValue) {
    if (!game?.settings) {
        console.error('🚫 FoundryVTT settings not available');
        return false;
    }

    const currentValue = game.settings.get('avant', 'useUniversalItemSheet') ?? false;
    const newValue = forceValue !== undefined ? forceValue : !currentValue;

    try {
        game.settings.set('avant', 'useUniversalItemSheet', newValue);
        
        console.log(`📋 Universal Item Template: ${newValue ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   Previous value: ${currentValue}`);
        console.log(`   New value: ${newValue}`);
        console.log('   💡 Tip: Refresh open item sheets to see changes');
        
        // Show notification to user
        ui.notifications.info(
            `Universal item template ${newValue ? 'enabled' : 'disabled'}. ` +
            'Refresh item sheets to see changes.',
            { permanent: false }
        );
        
        return newValue;
    } catch (error) {
        console.error('🚫 Failed to toggle universal template setting:', error);
        return currentValue;
    }
}

/**
 * Check current universal template setting
 * @returns {boolean} Current setting value
 */
function checkUniversalTemplate() {
    if (!game?.settings) {
        console.error('🚫 FoundryVTT settings not available');
        return false;
    }

    const currentValue = game.settings.get('avant', 'useUniversalItemSheet') ?? true; // Phase 2: Default changed to true
    
    console.log(`📋 Universal Item Template Status: ${currentValue ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   Setting key: avant.useUniversalItemSheet`);
    console.log(`   Current value: ${currentValue}`);
    console.log(`   📢 Phase 3: Enhanced deprecation warnings active`);
    
    if (!currentValue) {
        console.log(`   🚨 CRITICAL DEPRECATION: Per-item templates will be REMOVED in Phase 4`);
        console.log(`   ⚡ ACTION REQUIRED: Enable universal template before Phase 4`);
        console.log(`   🛠️ Run enableUniversalTemplateGuided() for assistance`);
    } else {
        console.log(`   ✅ Ready for Phase 4 - no action needed`);
    }
    
    // Phase 3: Show performance metrics if available
    const metrics = game.avant?.templateMetrics;
    if (metrics) {
        console.log(`   📊 Usage Metrics: Universal=${metrics.universal}, Per-Item=${metrics.perItem}`);
    }
    
    return currentValue;
}

/**
 * Test universal template with different item types
 * @returns {Promise<void>}
 */
async function testUniversalTemplate() {
    console.log('🧪 Testing Universal Template with all item types...');
    
    const itemTypes = ['talent', 'augment', 'weapon', 'armor', 'gear', 'action', 'feature', 'trait'];
    const testResults = [];
    
    // Test with universal template enabled
    toggleUniversalTemplate(true);
    
    for (const itemType of itemTypes) {
        try {
            // Find or create test item of this type
            let testItem = game.items?.find(item => item.type === itemType);
            
            if (!testItem) {
                console.log(`   Creating test ${itemType} item...`);
                testItem = await Item.create({
                    name: `Test ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
                    type: itemType,
                    system: {}
                });
            }
            
            // Test sheet creation
            const sheet = testItem.sheet;
            const parts = sheet.parts;
            
            testResults.push({
                itemType,
                success: true,
                template: parts.form.template,
                isUniversal: parts.form.template === 'systems/avant/templates/item-sheet.html'
            });
            
            console.log(`   ✅ ${itemType}: ${parts.form.template}`);
            
        } catch (error) {
            testResults.push({
                itemType,
                success: false,
                error: error.message
            });
            
            console.log(`   ❌ ${itemType}: ${error.message}`);
        }
    }
    
    // Summary
    const successful = testResults.filter(r => r.success);
    const universal = successful.filter(r => r.isUniversal);
    
    console.log(`\\n📊 Test Results:`);
    console.log(`   Total item types: ${itemTypes.length}`);
    console.log(`   Successful tests: ${successful.length}`);
    console.log(`   Using universal template: ${universal.length}`);
    console.log(`   Expected universal: ${itemTypes.length}`);
    console.log(`   ✅ Universal template coverage: ${universal.length === itemTypes.length ? 'COMPLETE' : 'INCOMPLETE'}`);
    
    return testResults;
}

/**
 * Refresh all open item sheets to apply template changes
 */
function refreshItemSheets() {
    const openSheets = Object.values(ui.windows).filter(w => w.constructor.name.includes('ItemSheet'));
    
    console.log(`🔄 Refreshing ${openSheets.length} open item sheet(s)...`);
    
    for (const sheet of openSheets) {
        try {
            sheet.render();
            console.log(`   ✅ Refreshed: ${sheet.document?.name || 'Unknown Item'}`);
        } catch (error) {
            console.log(`   ❌ Failed to refresh sheet: ${error.message}`);
        }
    }
    
    if (openSheets.length === 0) {
        console.log('   💡 No item sheets currently open');
    }
}

// Export functions to global scope for console access
globalThis.toggleUniversalTemplate = toggleUniversalTemplate;
globalThis.checkUniversalTemplate = checkUniversalTemplate;
globalThis.testUniversalTemplate = testUniversalTemplate;
globalThis.refreshItemSheets = refreshItemSheets;

console.log('🛠️ Universal Template Dev Utils Loaded:');
console.log('   • toggleUniversalTemplate() - Toggle the setting');
console.log('   • checkUniversalTemplate() - Check current status');
console.log('   • testUniversalTemplate() - Test all item types');
console.log('   • refreshItemSheets() - Refresh open sheets');