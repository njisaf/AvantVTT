/**
 * @fileoverview Role Utility Framework - Core Functions
 * @description Unified utility for managing all role calculations in Avant VTT
 * @version 1.0.0
 * @author Avant Development Team
 */

import {
  RollModifier,
  RollOptions,
  RollPayload,
  RollValidationResult,
  RollMetrics,
  RollSystemConfig,
  DEFAULT_ROLL_CONFIG,
  DiceValidationResult,
  isRollModifier
} from '../types/roll-types.js';

/**
 * Global configuration for the roll system
 */
let rollSystemConfig: RollSystemConfig = { ...DEFAULT_ROLL_CONFIG };

/**
 * Updates the global roll system configuration
 * 
 * @param config - Partial configuration to merge with defaults
 */
export function configureRollSystem(config: Partial<RollSystemConfig>): void {
  rollSystemConfig = { ...rollSystemConfig, ...config };
}

/**
 * Gets the current roll system configuration
 * 
 * @returns Current configuration
 */
export function getRollSystemConfig(): RollSystemConfig {
  return { ...rollSystemConfig };
}

/**
 * Validates a dice expression for basic syntax
 * 
 * @param diceExpression - The dice expression to validate
 * @returns Validation result with error details
 */
export function validateDiceExpression(diceExpression: string): DiceValidationResult {
  if (!diceExpression || typeof diceExpression !== 'string') {
    return {
      valid: false,
      error: 'Dice expression must be a non-empty string'
    };
  }

  const trimmed = diceExpression.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Dice expression cannot be empty'
    };
  }

  // Basic pattern validation - allows dice notation like "2d10", "1d20", "d6"
  const dicePattern = /^(\d*d\d+|\d+)(\s*[+\-]\s*(\d*d\d+|\d+))*$/i;
  if (!dicePattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid dice expression format'
    };
  }

  return { valid: true };
}

/**
 * Validates an array of roll modifiers
 * 
 * @param modifiers - Array of modifiers to validate
 * @returns Validation result with error details
 */
export function validateModifiers(modifiers: RollModifier[]): RollValidationResult {
  if (!Array.isArray(modifiers)) {
    return {
      valid: false,
      error: 'Modifiers must be an array'
    };
  }

  const warnings: string[] = [];
  
  for (let i = 0; i < modifiers.length; i++) {
    const modifier = modifiers[i];
    
    if (!isRollModifier(modifier)) {
      return {
        valid: false,
        error: `Invalid modifier at index ${i}: must have 'label' (string) and 'value' (number)`
      };
    }

    if (modifier.label.trim() === '') {
      warnings.push(`Modifier at index ${i} has empty label`);
    }

    if (typeof modifier.value !== 'number' || !isFinite(modifier.value)) {
      return {
        valid: false,
        error: `Invalid modifier value at index ${i}: must be a finite number`
      };
    }

    if (Math.abs(modifier.value) > 100) {
      warnings.push(`Modifier at index ${i} has unusually large value: ${modifier.value}`);
    }
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validates a complete roll configuration
 * 
 * @param baseDice - Base dice expression
 * @param modifiers - Array of modifiers
 * @returns Validation result
 */
export function validateRollConfiguration(
  baseDice: string,
  modifiers: RollModifier[]
): RollValidationResult {
  const diceValidation = validateDiceExpression(baseDice);
  if (!diceValidation.valid) {
    return {
      valid: false,
      error: `Invalid dice expression: ${diceValidation.error}`
    };
  }

  const modifierValidation = validateModifiers(modifiers);
  if (!modifierValidation.valid) {
    return {
      valid: false,
      error: `Invalid modifiers: ${modifierValidation.error}`
    };
  }

  return {
    valid: true,
    warnings: modifierValidation.warnings
  };
}

/**
 * Calculates the total modifier value from an array of modifiers
 * 
 * @param modifiers - Array of modifiers
 * @returns Total modifier value
 */
export function calculateTotalModifier(modifiers: RollModifier[]): number {
  return modifiers.reduce((total, modifier) => total + modifier.value, 0);
}

/**
 * Formats an array of modifiers into a human-readable breakdown
 * 
 * @param modifiers - Array of modifiers
 * @returns Formatted modifier breakdown string
 */
export function formatModifierBreakdown(modifiers: RollModifier[]): string {
  if (!modifiers || modifiers.length === 0) {
    return '';
  }

  return modifiers
    .map(modifier => {
      const value = modifier.value >= 0 ? `+${modifier.value}` : `${modifier.value}`;
      return `${value} (${modifier.label})`;
    })
    .join(' ');
}

/**
 * Generates a complete dice formula string from base dice and modifiers
 * 
 * @param baseDice - Base dice expression
 * @param modifiers - Array of modifiers
 * @returns Complete formula string
 */
export function generateRollFormula(baseDice: string, modifiers: RollModifier[]): string {
  const totalModifier = calculateTotalModifier(modifiers);
  
  if (totalModifier === 0) {
    return baseDice;
  }

  const modifierString = totalModifier >= 0 ? ` + ${totalModifier}` : ` - ${Math.abs(totalModifier)}`;
  return `${baseDice}${modifierString}`;
}

/**
 * Generates a tooltip string with modifier breakdown
 * 
 * @param baseDice - Base dice expression
 * @param modifiers - Array of modifiers
 * @param showBreakdown - Whether to show individual modifiers
 * @returns Tooltip string
 */
export function generateTooltip(
  baseDice: string,
  modifiers: RollModifier[],
  showBreakdown: boolean = true
): string {
  if (!showBreakdown || modifiers.length === 0) {
    return generateRollFormula(baseDice, modifiers);
  }

  const breakdown = formatModifierBreakdown(modifiers);
  return `${baseDice} ${breakdown}`;
}

/**
 * Creates a chat message posting function
 * 
 * @param roll - The Roll object to post
 * @param options - Roll options including flavor and speaker
 * @returns Function that posts the roll to chat
 */
function createChatHandler(roll: any, options: RollOptions): () => Promise<void> {
  return async () => {
    try {
      const ChatMessage = (globalThis as any).ChatMessage;
      const messageData: any = {
        flavor: options.flavor || 'Roll',
        ...options.rollData
      };

      if (options.speaker) {
        messageData.speaker = options.speaker;
      }

      await roll.toMessage(messageData);
    } catch (error) {
      console.error('Avant VTT | Failed to post roll to chat:', error);
      
      if (rollSystemConfig.errorHandling.chatFailure === 'retry') {
        // Simple retry logic - in production, this would be more sophisticated
        setTimeout(() => {
          console.log('Avant VTT | Retrying chat message...');
          roll.toMessage({ flavor: options.flavor || 'Roll' });
        }, 1000);
      }
    }
  };
}

/**
 * Creates a Roll object creation function
 * 
 * @param formula - The dice formula
 * @param rollData - Data for roll evaluation
 * @returns Function that creates a Roll object
 */
function createRollFactory(formula: string, rollData: any): () => any {
  return () => {
    try {
      const Roll = (globalThis as any).Roll;
      return new Roll(formula, rollData);
    } catch (error) {
      console.error('Avant VTT | Failed to create roll:', error);
      
      if (rollSystemConfig.errorHandling.invalidDice === 'fallback') {
        // Fallback to simple d20 roll
        const Roll = (globalThis as any).Roll;
        return new Roll('1d20', {});
      }
      
      throw error;
    }
  };
}

/**
 * Measures the performance of a roll operation
 * 
 * @param operation - The operation to measure
 * @returns Result and performance metrics
 */
export function measureRollPerformance<T>(
  operation: () => T
): { result: T; metrics: RollMetrics } {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  const result = operation();
  
  const endTime = performance.now();
  const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  const metrics: RollMetrics = {
    buildTime: endTime - startTime,
    executeTime: 0, // Set by caller if needed
    memoryUsage: endMemory - startMemory,
    modifierCount: 0 // Set by caller if needed
  };

  return { result, metrics };
}

/**
 * Builds a complete roll payload from base dice and modifiers
 * 
 * This is the primary function of the Role Utility Framework. It takes a base
 * dice expression and an array of modifiers, validates the configuration,
 * generates the formula and tooltip strings, and returns a complete payload
 * ready for execution and display.
 * 
 * @param baseDice - Base dice expression (e.g., "2d10", "1d20")
 * @param modifiers - Array of modifiers to apply
 * @param options - Additional configuration options
 * @returns Complete roll payload ready for execution
 * 
 * @example
 * ```typescript
 * const payload = buildRollPayload("2d10", [
 *   { label: "Ability", value: 3 },
 *   { label: "Level", value: 2 }
 * ]);
 * // payload.formula = "2d10 + 5"
 * // payload.tooltip = "2d10 +3 (Ability) +2 (Level)"
 * await payload.sendToChat();
 * ```
 */
export function buildRollPayload(
  baseDice: string,
  modifiers: RollModifier[],
  options: RollOptions = {}
): RollPayload {
  // Validate configuration
  const validation = validateRollConfiguration(baseDice, modifiers);
  if (!validation.valid) {
    throw new Error(`Invalid roll configuration: ${validation.error}`);
  }

  // Log warnings if present
  if (validation.warnings && rollSystemConfig.debug) {
    console.warn('Avant VTT | Roll configuration warnings:', validation.warnings);
  }

  // Generate formula and tooltip
  const formula = generateRollFormula(baseDice, modifiers);
  const tooltip = generateTooltip(baseDice, modifiers, options.showModifierBreakdown ?? true);
  const total = calculateTotalModifier(modifiers);

  // Create roll data
  const rollData = { ...options.rollData };
  
  // Create Roll factory and chat handler
  const createRoll = createRollFactory(formula, rollData);
  
  // Create chat handler that evaluates the roll
  const sendToChat = async () => {
    const roll = createRoll();
    if (options.evaluateRoll !== false) {
      await roll.evaluate();
    }
    
    // Create enhanced options with tooltip included in flavor
    const enhancedOptions = {
      ...options,
      flavor: `${options.flavor || 'Roll'} - ${tooltip}`
    };
    
    const chatHandler = createChatHandler(roll, enhancedOptions);
    await chatHandler();
  };

  return {
    formula,
    tooltip,
    total,
    baseDice,
    modifiers: [...modifiers], // Create a copy to prevent mutation
    sendToChat,
    createRoll
  };
}

/**
 * Builds ability roll payload from actor data
 * 
 * @param abilityName - Name of the ability to roll
 * @param actorData - Actor document data
 * @param options - Additional roll options
 * @returns Roll payload for ability check
 */
export function buildAbilityRoll(
  abilityName: string,
  actorData: any,
  options: RollOptions = {}
): RollPayload {
  const ability = actorData.system?.abilities?.[abilityName];
  if (!ability) {
    throw new Error(`Ability '${abilityName}' not found on actor`);
  }

  const level = actorData.system?.level || 1;

  const modifiers: RollModifier[] = [
    { label: 'Level', value: level },
    { label: 'Ability', value: ability.modifier || 0 }
  ];

  const mergedOptions: RollOptions = {
    flavor: `${abilityName.charAt(0).toUpperCase() + abilityName.slice(1)} Roll`,
    ...options
  };

  return buildRollPayload('2d10', modifiers, mergedOptions);
}

/**
 * Builds skill roll payload from actor data
 * 
 * @param skillName - Name of the skill to roll
 * @param actorData - Actor document data
 * @param options - Additional roll options
 * @returns Roll payload for skill check
 */
export function buildSkillRoll(
  skillName: string,
  actorData: any,
  options: RollOptions = {}
): RollPayload {
  const skillValue = actorData.system?.skills?.[skillName];
  if (skillValue === undefined) {
    throw new Error(`Skill '${skillName}' not found on actor`);
  }

  // Get the governing ability for this skill
  const skillAbilityMap: Record<string, string> = {
    'debate': 'intellect',
    'inspect': 'intellect', 
    'recall': 'intellect',
    'discern': 'focus',
    'intuit': 'focus',
    'endure': 'focus',
    'finesse': 'grace',
    'charm': 'grace',
    'hide': 'grace',
    'force': 'might',
    'command': 'might',
    'surge': 'might'
  };

  const governingAbility = skillAbilityMap[skillName] || 'intellect';
  const abilityModifier = actorData.system?.abilities?.[governingAbility]?.modifier || 0;
  const level = actorData.system?.level || 1;

  const modifiers: RollModifier[] = [
    { label: 'Level', value: level },
    { label: 'Ability', value: abilityModifier },
    { label: 'Skill', value: skillValue }
  ];

  const mergedOptions: RollOptions = {
    flavor: `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} Skill Roll`,
    ...options
  };

  return buildRollPayload('2d10', modifiers, mergedOptions);
}

/**
 * Builds weapon attack roll payload
 * 
 * @param weaponItem - Weapon item document
 * @param actorData - Actor document data
 * @param options - Additional roll options
 * @returns Roll payload for weapon attack
 */
export function buildWeaponAttackRoll(
  weaponItem: any,
  actorData: any,
  options: RollOptions = {}
): RollPayload {
  const weaponAbility = weaponItem.system?.ability || 'might';
  const abilityMod = actorData.system?.abilities?.[weaponAbility]?.mod || 0;
  const weaponModifier = weaponItem.system?.modifier || 0;
  const level = actorData.system?.level || 1;

  const modifiers: RollModifier[] = [
    { label: 'Level', value: level },
    { label: 'Ability', value: abilityMod },
    { label: 'Weapon', value: weaponModifier }
  ];

  const mergedOptions: RollOptions = {
    flavor: `${weaponItem.name} Attack`,
    ...options
  };

  return buildRollPayload('2d10', modifiers, mergedOptions);
}

/**
 * Builds weapon damage roll payload
 * 
 * @param weaponItem - Weapon item document
 * @param actorData - Actor document data
 * @param options - Additional roll options
 * @returns Roll payload for weapon damage
 */
export function buildWeaponDamageRoll(
  weaponItem: any,
  actorData: any,
  options: RollOptions = {}
): RollPayload {
  const damageRoll = weaponItem.system?.damageDie || '1d6';
  const weaponAbility = weaponItem.system?.ability || 'might';
  const abilityMod = actorData.system?.abilities?.[weaponAbility]?.mod || 0;
  const damageType = weaponItem.system?.damageType || '';

  const modifiers: RollModifier[] = [
    { label: 'Ability', value: abilityMod }
  ];

  const flavorText = damageType ? 
    `${weaponItem.name} Damage (${damageType})` : 
    `${weaponItem.name} Damage`;

  const mergedOptions: RollOptions = {
    flavor: flavorText,
    ...options
  };

  return buildRollPayload(damageRoll, modifiers, mergedOptions);
}

/**
 * Builds armor check roll payload
 * 
 * @param armorItem - Armor item document
 * @param actorData - Actor document data
 * @param options - Additional roll options
 * @returns Roll payload for armor check
 */
export function buildArmorRoll(
  armorItem: any,
  actorData: any,
  options: RollOptions = {}
): RollPayload {
  const armorAbility = armorItem.system?.ability || 'grace';
  const abilityMod = actorData.system?.abilities?.[armorAbility]?.mod || 0;
  const armorModifier = armorItem.system?.modifier || 0;
  const level = actorData.system?.level || 1;

  const modifiers: RollModifier[] = [
    { label: 'Level', value: level },
    { label: 'Ability', value: abilityMod },
    { label: 'Armor', value: armorModifier }
  ];

  const mergedOptions: RollOptions = {
    flavor: `${armorItem.name} Armor Check`,
    ...options
  };

  return buildRollPayload('2d10', modifiers, mergedOptions);
}

/**
 * Builds a generic roll payload from a dataset
 * 
 * @param dataset - Dataset containing roll information
 * @param options - Additional roll options
 * @returns Roll payload for generic roll
 */
export function buildGenericRoll(
  dataset: any,
  options: RollOptions = {}
): RollPayload {
  const rollExpression = dataset.roll?.trim();
  if (!rollExpression) {
    throw new Error('No roll expression found in dataset');
  }

  const flavor = dataset.label || 'Roll';
  
  const mergedOptions: RollOptions = {
    flavor,
    ...options
  };

  return buildRollPayload(rollExpression, [], mergedOptions);
}