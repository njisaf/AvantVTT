// Avant Context Menu Hook Verification Script
// Paste this into the browser console after loading FoundryVTT

console.log("🔍 Avant Hook Verification Script");
console.log("==================================");

// Check if Avant system is loaded
if (window.AVANT) {
    console.log("✅ Avant system is loaded");
    console.log("Version:", window.AVANT.version);
} else {
    console.log("❌ Avant system NOT loaded");
}

// Check registered hooks
console.log("\n📋 Registered Hooks:");
const hooks = Object.keys(Hooks._hooks || {});
const contextHooks = hooks.filter(h => h.toLowerCase().includes('context'));
console.log("All context-related hooks:", contextHooks);

// Check specific hooks we're using
const requiredHooks = [
    'getChatMessageContextOptions',  // v13 native
    'getChatLogEntryContext',        // v12 compatibility
    'getDocumentContextOptions',     // alternative
    'renderChatLog',                 // fallback setup
    'renderChatMessageHTML',         // message detection
    'createChatMessage'              // auto-attachment
];

console.log("\n🎯 Avant Required Hooks Status:");
requiredHooks.forEach(hookName => {
    const isRegistered = hooks.includes(hookName);
    const count = Hooks._hooks[hookName]?.length || 0;
    console.log(`${isRegistered ? '✅' : '❌'} ${hookName}: ${count} callback(s)`);
});

// Check if AvantChatContextMenu exists
if (window.AVANT?.AvantChatContextMenu) {
    console.log("\n✅ AvantChatContextMenu class is available");
} else {
    console.log("\n❌ AvantChatContextMenu class NOT available");
}

// Test hook firing by simulating right-click on chat messages
console.log("\n🧪 To test hook firing:");
console.log("1. Make an ability roll (click +2 next to any ability)");
console.log("2. Right-click on the chat message");
console.log("3. Watch for these console messages:");
console.log("   - 'Avant | getChatMessageContextOptions hook fired' (v13)");
console.log("   - 'Avant | getChatLogEntryContext hook fired' (v12)");
console.log("   - 'Avant | Direct contextmenu event triggered' (fallback)");

console.log("\n📊 Test Results Summary:");
console.log("========================");
console.log("System loaded:", !!window.AVANT);
console.log("Context menu class:", !!window.AVANT?.AvantChatContextMenu);
console.log("v13 hook registered:", hooks.includes('getChatMessageContextOptions'));
console.log("v12 hook registered:", hooks.includes('getChatLogEntryContext'));
console.log("Total context hooks:", contextHooks.length);

if (window.AVANT && contextHooks.length > 0) {
    console.log("\n🎉 System appears ready for testing!");
} else {
    console.log("\n⚠️ System may have issues - check setup");
} 