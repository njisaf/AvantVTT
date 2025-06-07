# Avant System Rules Reference

This document summarizes the core mechanics, rolling rules, and data conventions of the Avant RPG system as implemented in this codebase. It is intended for both developers and system designers working on the AvantVTT FoundryVTT system.

---

## 🎲 Dice Rolling Rules

### **Ability Checks**
- **Formula:** `2d10 + Level + Ability Modifier`
- **How to Roll:** Click the modifier (e.g., `+2`) next to an ability in the character sheet sidebar.
- **Ability Modifier Calculation:**
  - `modifier = floor((ability score - 10) / 2)`
  - Example: Ability score 14 → modifier +2
- **Chat Output:** The result is posted to chat as "[Ability] Check" (e.g., "Might Check").

### **Ability Score Generation**
- **Formula:** `4d6kh3` (roll 4d6, keep the highest 3)
- **How to Roll:** Shift+Click the modifier next to an ability in the sidebar.
- **Effect:** The ability score is updated to the new value, and the modifier recalculates automatically.
- **Chat Output:** The result is posted to chat as "[Ability] Score Generation" (e.g., "Grace Score Generation").

### **Skill Checks**
- **Formula:** `2d10 + Level + Ability Modifier + Skill Value`
- **How to Roll:** (In skill section, if implemented) Click the skill's roll button.
- **Skill-Ability Mapping:** Each skill is associated with a primary ability (see below).
- **Chat Output:** The result is posted to chat as "[Skill] Check ([Ability])" (e.g., "Finesse Check (Grace)").

---

## 🧑‍💻 Data Model

### **Abilities**
- **Core Abilities:**
  - Might
  - Grace
  - Intellect
  - Focus
- **Each ability has:**
  - `value` (the score, e.g., 14)
  - `mod` (the calculated modifier, e.g., +2)

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
- **Modifier Calculation:**
  - Modifiers are always recalculated from the current ability score.
- **Roll API:**
  - Uses FoundryVTT's `Roll` class for all dice rolls (see [FoundryVTT Roll API](https://foundryvtt.com/api/classes/foundry.dice.Roll.html)).

---

## 🛡️ Error Handling & Validation

- All numeric fields are validated and coerced to numbers.
- Safe property access patterns are used throughout the codebase.
- Errors in rolling or data updates are logged and shown to the user via notifications.

---

## 📚 Example: Ability Check Flow

1. User clicks the `+2` next to "Might" in the sidebar.
2. System calculates: `2d10 + Level + Might Modifier`.
3. Result is posted to chat as "Might Check".

## 📚 Example: Ability Score Generation Flow

1. User shift+clicks the `+2` next to "Grace" in the sidebar.
2. System rolls `4d6kh3` and updates the Grace score.
3. Modifier recalculates and UI updates.
4. Result is posted to chat as "Grace Score Generation".

---

## 🔗 References
- [FoundryVTT Roll API Documentation](https://foundryvtt.com/api/classes/foundry.dice.Roll.html)
- See `avant.js` for implementation details
- See `template.json` for data structure
- See `actor-sheet.html` for UI conventions

---

**This document will be updated as the system evolves.** 