/**
 * Debug script to test PP field compatibility fix
 * Run this in the browser console at localhost:30000
 */

console.log('🔋 PP Field Debug Test Starting...');

// Test function to check augment PP costs
async function testAugmentPPCosts() {
    console.log('🧪 Testing augment PP cost detection...');
    
    // Get all augments from the world
    const augments = game.items.filter(item => item.type === 'augment');
    console.log(`Found ${augments.length} augments in world:`, augments.map(a => a.name));
    
    // Test each augment
    for (const augment of augments) {
        const system = augment.system;
        const ppCost = system?.ppCost || system?.powerPointCost || 0;
        
        console.log(`🔹 Augment: ${augment.name}`, {
            type: augment.type,
            ppCost_field: system?.ppCost,
            powerPointCost_field: system?.powerPointCost,
            finalPPCost: ppCost,
            rawSystemData: system
        });
    }
    
    // Test creating a feature card for an augment with PP cost
    const testAugment = augments.find(a => {
        const system = a.system;
        const ppCost = system?.ppCost || system?.powerPointCost || 0;
        return ppCost > 0;
    });
    
    if (testAugment) {
        console.log(`🧪 Testing feature card for: ${testAugment.name}`);
        
        // Get an actor to test with
        const testActor = game.actors.find(a => a.type === 'character');
        if (testActor) {
            console.log(`🎭 Using actor: ${testActor.name}`, {
                currentPP: testActor.system?.powerPoints?.value,
                maxPP: testActor.system?.powerPoints?.max
            });
            
            // Test the chat API
            try {
                const result = await game.avant.chat.buildFeatureCardHtml(testAugment.id, testActor.id);
                console.log('🃏 Feature card build result:', result);
                
                if (result.success) {
                    console.log('✅ Feature card HTML generated successfully');
                    console.log('🔍 Checking for PP button...');
                    
                    // Parse HTML to check for PP button
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(result.html, 'text/html');
                    const ppButton = doc.querySelector('.pp-spend');
                    
                    if (ppButton) {
                        console.log('✅ PP button found!', {
                            buttonText: ppButton.textContent,
                            dataPP: ppButton.getAttribute('data-pp'),
                            disabled: ppButton.disabled,
                            outerHTML: ppButton.outerHTML
                        });
                    } else {
                        console.log('❌ PP button NOT found in feature card');
                        console.log('🔍 Card HTML:', result.html);
                    }
                } else {
                    console.log('❌ Feature card build failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error testing feature card:', error);
            }
        } else {
            console.log('⚠️ No character actors found for testing');
        }
    } else {
        console.log('⚠️ No augments with PP cost found for testing');
    }
}

// Test function to check talent cards (for comparison)
async function testTalentPPCosts() {
    console.log('🧪 Testing talent PP cost detection...');
    
    const talents = game.items.filter(item => item.type === 'talent');
    console.log(`Found ${talents.length} talents in world:`, talents.map(t => t.name));
    
    for (const talent of talents) {
        const system = talent.system;
        const ppCost = system?.ppCost || system?.powerPointCost || 0;
        
        console.log(`🔸 Talent: ${talent.name}`, {
            type: talent.type,
            ppCost_field: system?.ppCost,
            powerPointCost_field: system?.powerPointCost,
            finalPPCost: ppCost,
            rawSystemData: system
        });
    }
}

// Run the tests
testAugmentPPCosts().then(() => {
    console.log('🔋 Augment PP test completed');
    return testTalentPPCosts();
}).then(() => {
    console.log('🔋 Talent PP test completed');
    console.log('🎉 All PP field debug tests completed!');
}).catch(error => {
    console.error('❌ PP field debug test failed:', error);
}); 