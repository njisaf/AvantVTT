# Avant System Rules Reference

This document summarizes the core mechanics, rolling rules, and data conventions of the Avant RPG system as implemented in this codebase. It is intended for both developers and system designers working on the AvantVTT FoundryVTT system.

---

## 🎲 Dice Rolling Rules

### **Ability Checks**
- **Formula:** `2d10 + Level + Ability Modifier`
- **How to Roll:** Click the "Roll" button next to an ability in the character sheet sidebar.
- **Ability Modifier System:** Direct modifiers (not D&D-style scores)
  - Abilities are entered as direct modifiers (e.g., Might 5 means +5 to rolls)
  - No calculation needed - the number you enter IS the modifier
  - Example: Might 3 → rolls get +3, Grace -1 → rolls get -1
- **Chat Output:** The result is posted to chat as "[Ability] Check" (e.g., "Might Check").

### **Skill Checks**
- **Formula:** `2d10 + Level + Ability Modifier + Skill Value`
- **How to Roll:** (In skill section, if implemented) Click the skill's roll button.
- **Skill-Ability Mapping:** Each skill is associated with a primary ability (see below).
- **Chat Output:** The result is posted to chat as "[Skill] Check ([Ability])" (e.g., "Finesse Check (Grace)").

### **Fortune Point Rerolls**
- **Eligibility:** Any roll that uses 2d10 (Ability Checks, Skill Checks, Attack Rolls, etc.) can be rerolled.
- **How to Access:** Right-click on any 2d10 roll result in the chat window and select "Reroll with Fortune Points".
- **Reroll Mechanics:**
  - Opens a dialog showing both d10 dice results as selectable dice graphics.
  - Players can select which individual d10(s) to reroll by clicking on them.
  - Selected dice highlight to show they will be rerolled.
  - Unselected dice retain their original values.
  - All modifiers (Level, Ability Modifier, Skill Value, etc.) are preserved.
- **Fortune Point Costs:**
  - 1 Fortune Point per die rerolled.
  - Players can only select as many dice as they have Fortune Points available.
  - If a player has 0 Fortune Points, the reroll button is disabled.
- **Process:**
  1. Right-click on a 2d10 roll result in chat.
  2. Select "Reroll with Fortune Points" from the context menu.
  3. In the dialog, click on the d10(s) you want to reroll (they will highlight).
  4. Click "Reroll Selected Dice" to confirm.
  5. Fortune Points are deducted and a new roll is posted to chat.
- **Chat Output:** New roll shows "[Original Roll Name] (Rerolled with X Fortune Point(s))".
- **Limitations:** Only works with rolls that contain exactly 2d10 dice.

---

## 🧑‍💻 Data Model

### **Abilities**
- **Core Abilities:**
  - Might
  - Grace
  - Intellect
  - Focus
- **Each ability has:**
  - `modifier` (the direct modifier, e.g., 3 for +3, -1 for -1)

### **Skills**
- **Skill List:**
  - debate, discern, endure, finesse, force, command, charm, hide, inspect, intuit, recall, surge
- **Each skill has:**
  - `value` (the skill rank, e.g., 3)
- **Skill-Ability Mapping:**
  - Each skill is mapped to a primary ability (see `AvantActorData.getSkillAbilities()` in code).

### **Other Attributes**
- **Level:** Used in all checks as a flat bonus.
- **Fortune Points:** Resource for narrative or mechanical effects.
- **Power Points, Expertise Points, Health, Defense Threshold:** Additional resources and stats tracked on the actor.

---

## 📝 Sheet & UI Conventions

- **Sidebar:**
  - Shows current and max hit points, power points, expertise points, and all four abilities.
  - Ability modifiers are clickable for checks, shift+clickable for score generation.
- **Tabs:**
  - Core, Combat, Gear, Skills, Actions, Features, Talents & Powers.
- **Skills Section:**
  - Skills are grouped by their associated ability.
  - Each skill displays its value and can be rolled (if roll button present).

---

## ⚙️ System Patterns & Conventions

- **Dynamic Data:**
  - Abilities and skills are dynamically loaded from the actor's data structure.
  - No hardcoded lists in templates; all lists are rendered via Handlebars `each` blocks.
- **Version Compatibility:**
  - System is compatible with both FoundryVTT v12 and v13.
  - Uses only APIs and patterns supported in both versions.
- **Direct Modifiers:**
  - Ability values are direct modifiers - no calculation needed.
- **Roll API:**
  - Uses FoundryVTT's `Roll` class for all dice rolls (see [FoundryVTT Roll API](https://foundryvtt.com/api/classes/foundry.dice.Roll.html)).

---

## 🛡️ Error Handling & Validation

- All numeric fields are validated and coerced to numbers.
- Safe property access patterns are used throughout the codebase.
- Errors in rolling or data updates are logged and shown to the user via notifications.

---

## 📚 Example: Ability Check Flow

1. User clicks the "Roll" button next to "Might" in the sidebar.
2. System calculates: `2d10 + Level + Might Modifier` (where Might Modifier is the direct value entered).
3. Result is posted to chat as "Might Check".

## 📚 Example: Fortune Point Reroll Flow

1. Player makes a Skill Check and rolls poorly (e.g., rolls 2 and 3 on the d10s).
2. Player right-clicks on the roll result in chat.
3. Selects "Reroll with Fortune Points" from the context menu.
4. Dialog opens showing two d10 dice: one showing "2" and one showing "3".
5. Player clicks on the die showing "2" to select it for reroll (it highlights).
6. Player clicks "Reroll Selected Dice" button.
7. System deducts 1 Fortune Point and rerolls only the selected die.
8. New result is posted to chat: e.g., "Finesse Check (Grace) (Rerolled with 1 Fortune Point)" with the new total.

---

## 🔗 References
- [FoundryVTT Roll API Documentation](https://foundryvtt.com/api/classes/foundry.dice.Roll.html)
- See `avant.js` for implementation details
- See `template.json` for data structure
- See `actor-sheet.html` for UI conventions

---

**This document will be updated as the system evolves.** 