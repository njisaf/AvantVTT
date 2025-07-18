# Combat Tab Baseline Audit - Phase 0

**Date:** 2025-07-17  
**Purpose:** Baseline capture before unified actions tab implementation

## Current Combat Tab Implementation

### Tab Navigation
- **Location:** `templates/shared/tabs.hbs:4`
- **HTML:** `<a class="item" data-tab="combat" data-group="sheet">Combat</a>`
- **Position:** Second tab after Core

### Template Structure
- **Location:** `templates/actor-sheet.html:284-378`
- **Container:** `<div class="tab" data-group="sheet" data-tab="combat">`
- **Sections:**
  - Weapons (lines 286-339)
  - Armor (lines 341-377)

### Roll Handlers
- **Location:** `scripts/sheets/actor-sheet.ts`
- **Registered Actions:**
  - `rollAttack: AvantActorSheet._onRollAttack` (line 183)
  - `rollDamage: AvantActorSheet._onRollDamage` (line 184)
  - `rollArmor: AvantActorSheet._onRollArmor` (line 185)

### Implementation Details

#### Weapon Combat Items
- **Container:** `.combat-item` with `data-item-id`
- **Buttons:**
  - Attack: `combat-action-btn attack-roll` → `rollAttack`
  - Damage: `combat-action-btn damage-roll` → `rollDamage`
- **Data:** threshold, damageDie, damageType, range

#### Armor Combat Items
- **Container:** `.combat-item` with `data-item-id`
- **Buttons:**
  - Roll: `combat-action-btn armor-roll` → `rollArmor`
- **Data:** threshold, armorClass

### Current Actions Tab
- **Location:** `templates/actor-sheet.html:514-529`
- **Implementation:** Uses item-card layout system
- **Current Content:** Standalone action items only

## Migration Requirements

### Files to Modify
1. `templates/shared/tabs.hbs` - Remove combat tab, reorder
2. `templates/actor-sheet.html` - Remove combat tab section
3. `scripts/sheets/actor-sheet.ts` - Preserve roll handlers for backward compatibility
4. Create new unified actions logic

### Roll Handler Preservation
- `_onRollAttack` (lines 1019-1045) - Keep for backward compatibility
- `_onRollDamage` (lines 1053-1078) - Keep for backward compatibility  
- `_onRollArmor` (lines 1086-1099) - Keep for backward compatibility

### Data Structure
- Weapons: `items.weapon` array
- Armor: `items.armor` array
- Actions: `items.action` array + `cardLayouts.action`

## Test Fixtures Required
- Actor with weapons (attack/damage buttons)
- Actor with armor (armor roll button)
- Actor with standalone actions
- Mixed scenario with all item types

## Risk Assessment
- **High Risk:** External macros calling `rollAttack`/`rollDamage`/`rollArmor`
- **Medium Risk:** CSS styling dependencies on `.combat-item` classes
- **Low Risk:** Tab navigation muscle memory (mitigated by keeping Actions in same position)

## Next Steps
1. Create test fixture world with all item types
2. Document current roll mechanics
3. Implement unified actions dispatcher
4. Preserve backward compatibility for external macros