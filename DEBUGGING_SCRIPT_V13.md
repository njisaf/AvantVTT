# FoundryVTT v13 Context Menu Debugging Script

This script can be pasted into the browser console on FoundryVTT v13 to debug exactly what the `getChatMessageContextOptions` hook is receiving.

## Debugging Script

```javascript
// Clear any existing hooks
Hooks.off('getChatMessageContextOptions');

// Add comprehensive debugging hook
Hooks.on('getChatMessageContextOptions', (...args) => {
    console.log('=== getChatMessageContextOptions DEBUG ===');
    console.log('Arguments received:', args);
    console.log('Number of arguments:', args.length);
    
    args.forEach((arg, index) => {
        console.log(`Argument ${index}:`, {
            value: arg,
            type: typeof arg,
            constructor: arg?.constructor?.name,
            isArray: Array.isArray(arg),
            hasId: !!arg?.id,
            hasRolls: !!arg?.rolls,
            length: arg?.length
        });
        
        if (arg?.id) {
            console.log(`  - ID: ${arg.id}`);
        }
        if (arg?.rolls) {
            console.log(`  - Rolls: ${arg.rolls.length} rolls`);
        }
        if (Array.isArray(arg)) {
            console.log(`  - Array length: ${arg.length}`);
            console.log(`  - Array contents:`, arg);
        }
    });
    
    console.log('=== END DEBUG ===');
});

console.log('Debugging hook installed. Right-click on chat messages to see debug output.');
```

## Testing Instructions

1. Paste the above script into the browser console while on FoundryVTT v13
2. Create a character with fortune points
3. Make a 2d10 roll from the character sheet
4. Right-click on the chat message to trigger the context menu
5. Check the console output for detailed information about what the hook receives

## Expected Behavior

The hook should receive:
- First argument: A ChatMessage object with `.id` and `.rolls` properties
- Second argument: An array of context menu options

If this pattern doesn't match, the debugging output will help identify the actual structure. 