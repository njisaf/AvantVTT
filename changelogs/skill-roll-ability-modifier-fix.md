# Skill Roll Ability Modifier Fix

**Date:** June 7, 2024  
**Version:** 0.1.4  
**Type:** Bug Fix  

## Issue Description

Skill checks were not correctly applying ability modifiers to the roll formula. The rules specify that skill checks should use the formula `2d10 + Level + Ability Modifier + Skill Value`, but the ability modifier component was showing as 0 instead of the calculated modifier from the relevant ability score.

**Example:**
- Character: Level 3, Might 18 (modifier +4), Command skill 5
- Expected formula: `2d10 + 3 + 4 + 5` 
- Actual formula: `2d10 + 3 + 0 + 5`

## Root Cause

The `_onSkillRoll` method was reading the stored `mod` value from `actor.system.abilities[abilityKey]?.mod`, which was not being dynamically updated when ability scores changed. The ability modifier calculation was only happening in the `getData()` method for display purposes, but not persisted to the actor data.

## Solution

Modified the `_onSkillRoll` method in `scripts/avant.js` to calculate ability modifiers dynamically using the same formula used elsewhere in the system:

```javascript
// OLD CODE
const abilityMod = actor.system.abilities[abilityKey]?.mod || 0;

// NEW CODE  
const abilityData = actor.system.abilities[abilityKey];
// Calculate ability modifier dynamically from ability score (standard D&D-style: (score-10)/2)
const abilityMod = abilityData ? Math.floor((abilityData.value - 10) / 2) : 0;
```

This ensures consistency with the ability roll method (`_onAbilityRoll`) which already calculates modifiers dynamically.

## Files Changed

- `scripts/avant.js`: Updated `_onSkillRoll` method (lines ~1141-1144)
- `system.json`: Version bump to 0.1.4

## Testing

The fix was deployed to both FoundryVTT v12 and v13 containers and tested to ensure:

1. Skill rolls now correctly include ability modifiers
2. The formula displays properly in chat (e.g., `2d10 + 3 + 4 + 5`)
3. Backwards compatibility maintained across both Foundry versions
4. Skill-to-ability mapping works correctly (Command → Might, etc.)

## Deployment

- **v13 Container:** http://localhost:30000 (FoundryVTT 13.344)
- **v12 Container:** http://localhost:30001 (FoundryVTT 12.331)
- **Files deployed successfully to both containers**

## Impact

This fix resolves a critical gameplay issue where character abilities were not affecting skill check outcomes, making the game significantly more balanced and functional for actual play. 