#!/usr/bin/env node

/**
 * Test script to add Custom Traits to the world pack
 * This helps us verify that the autocomplete system loads both system and custom traits
 */

// This script would normally run in the FoundryVTT environment
// For manual testing, we'll create it as documentation

const customTraitsToAdd = [
    {
        name: "Custom Fire",
        type: "feature",
        system: {
            color: "#FF4444",
            icon: "fas fa-flame",
            localKey: "CUSTOM.Trait.CustomFire",
            description: "A custom fire trait created by the user",
            traitMetadata: {
                categories: ["custom", "elemental"],
                tags: ["fire", "custom", "test"],
                appliesToActors: true,
                appliesToItems: true
            }
        },
        img: "icons/magic/fire/flame-burning-creature-hand.webp",
        sort: 1000
    },
    {
        name: "Custom Darkness",
        type: "feature",
        system: {
            color: "#330033",
            icon: "fas fa-moon",
            localKey: "CUSTOM.Trait.CustomDarkness",
            description: "A custom darkness trait created by the user",
            traitMetadata: {
                categories: ["custom", "shadow"],
                tags: ["darkness", "shadow", "custom", "test"],
                appliesToActors: true,
                appliesToItems: true
            }
        },
        img: "icons/magic/darkness/dark-energy-shadow.webp",
        sort: 1001
    },
    {
        name: "Custom Speed",
        type: "feature",
        system: {
            color: "#00AAFF",
            icon: "fas fa-running",
            localKey: "CUSTOM.Trait.CustomSpeed",
            description: "A custom speed enhancement trait",
            traitMetadata: {
                categories: ["custom", "enhancement"],
                tags: ["speed", "movement", "custom", "test"],
                appliesToActors: true,
                appliesToItems: true
            }
        },
        img: "icons/magic/movement/trail-streak-impact-blue.webp",
        sort: 1002
    }
];

console.log('Custom Traits to Add:', JSON.stringify(customTraitsToAdd, null, 2));

// Manual instructions for adding these through the UI:
console.log(`
MANUAL TESTING INSTRUCTIONS:
=============================

1. Open FoundryVTT at http://localhost:30000
2. Create a world using the Avant system
3. Go to Compendium Packs
4. Create a new compendium pack called "custom-traits" (type: Items)
5. Add the above custom traits as Feature items with the specified system data
6. Test the autocomplete in any item sheet to verify both system and custom traits appear

EXPECTED BEHAVIOR:
==================
- Typing "fire" should show both "Fire" (system) and "Custom Fire" (custom)
- Typing "custom" should show "Custom Fire", "Custom Darkness", and "Custom Speed"
- All traits should appear with proper colors and icons in the dropdown

DEBUGGING:
==========
- Check browser console for 🏷️ TRAIT DEBUG messages
- Look for logs showing both system and world pack loading
- Verify that world pack exists and contains custom traits
`); 