/**
 * Item Validation Utilities
 * 
 * Pure functions for validating item form fields and cross-field logic.
 * All functions are stateless and have no side effects.
 * 
 * @author Avant VTT Team
 * @version 2.0.0
 * @since Phase 2
 */

/**
 * Validation result for form fields
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation options for customizing validation behavior
 */
export interface ValidationOptions {
  required?: boolean;
  allowEmpty?: boolean;
  customMessage?: string;
}

/**
 * Valid rarity values for items
 */
export const RARITY_VALUES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'artifact'] as const;
export type RarityValue = typeof RARITY_VALUES[number];

/**
 * Valid attribute values for items
 */
export const ATTRIBUTE_VALUES = ['might', 'grace', 'intellect', 'focus'] as const;
export type AttributeValue = typeof ATTRIBUTE_VALUES[number];

/**
 * Valid augment type values
 */
export const AUGMENT_TYPE_VALUES = ['enhancement', 'modification', 'implant', 'symbiotic'] as const;
export type AugmentTypeValue = typeof AUGMENT_TYPE_VALUES[number];

/**
 * Validates that a string is not empty and meets basic requirements
 */
export function validateRequiredString(
  value: string | undefined | null,
  fieldName: string,
  options: ValidationOptions = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const trimmedValue = String(value || '').trim();
  
  if (options.required && !trimmedValue) {
    result.isValid = false;
    result.errors.push(
      options.customMessage || `${fieldName} is required and cannot be empty.`
    );
  }

  return result;
}

/**
 * Validates that a string meets length requirements
 */
export function validateStringLength(
  value: string | undefined | null,
  fieldName: string,
  minLength: number = 0,
  maxLength: number = 1000,
  options: ValidationOptions = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const trimmedValue = String(value || '').trim();
  
  if (trimmedValue.length < minLength) {
    result.isValid = false;
    result.errors.push(`${fieldName} must be at least ${minLength} characters long.`);
  }
  
  if (trimmedValue.length > maxLength) {
    result.isValid = false;
    result.errors.push(`${fieldName} cannot exceed ${maxLength} characters.`);
  }

  // Warning for very short content (but above minimum)
  if (trimmedValue.length > 0 && trimmedValue.length < 10 && minLength < 10) {
    result.warnings.push(`${fieldName} is quite short. Consider adding more detail.`);
  }

  return result;
}

/**
 * Validates that a number is within acceptable range
 */
export function validateNumberRange(
  value: number | string | undefined | null,
  fieldName: string,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER,
  options: ValidationOptions = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Handle empty values
  if (value === undefined || value === null || value === '') {
    if (options.required) {
      result.isValid = false;
      result.errors.push(`${fieldName} is required.`);
    }
    return result;
  }

  // Convert to number
  const numericValue = Number(value);
  
  if (isNaN(numericValue)) {
    result.isValid = false;
    result.errors.push(`${fieldName} must be a valid number.`);
    return result;
  }

  if (numericValue < min) {
    result.isValid = false;
    result.errors.push(`${fieldName} must be at least ${min}.`);
  }
  
  if (numericValue > max) {
    result.isValid = false;
    result.errors.push(`${fieldName} cannot exceed ${max}.`);
  }

  // Check for non-integer values where integers are expected
  if (Number.isInteger(min) && Number.isInteger(max) && !Number.isInteger(numericValue)) {
    result.warnings.push(`${fieldName} should be a whole number.`);
  }

  return result;
}

/**
 * Validates AP (Action Point) cost values
 */
export function validateApCost(
  value: number | string | undefined | null,
  options: ValidationOptions = {}
): ValidationResult {
  return validateNumberRange(value, 'AP Cost', 0, 3, {
    ...options,
    customMessage: 'AP Cost must be between 0 and 3.'
  });
}

/**
 * Validates PP (Power Point) cost values
 */
export function validatePpCost(
  value: number | string | undefined | null,
  options: ValidationOptions = {}
): ValidationResult {
  return validateNumberRange(value, 'PP Cost', 0, 100, {
    ...options,
    customMessage: 'PP Cost must be between 0 and 100.'
  });
}

/**
 * Validates level requirement values
 */
export function validateLevelRequirement(
  value: number | string | undefined | null,
  options: ValidationOptions = {}
): ValidationResult {
  return validateNumberRange(value, 'Level Requirement', 1, 20, {
    ...options,
    customMessage: 'Level Requirement must be between 1 and 20.'
  });
}

/**
 * Validates that a rarity value is from the allowed set
 */
export function validateRarity(
  value: string | undefined | null,
  options: ValidationOptions = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!value) {
    if (options.required) {
      result.isValid = false;
      result.errors.push('Rarity is required.');
    }
    return result;
  }

  if (!RARITY_VALUES.includes(value as RarityValue)) {
    result.isValid = false;
    result.errors.push(`Rarity must be one of: ${RARITY_VALUES.join(', ')}.`);
  }

  return result;
}

/**
 * Validates that an attribute value is from the allowed set
 */
export function validateAttribute(
  value: string | undefined | null,
  options: ValidationOptions = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!value) {
    if (options.required) {
      result.isValid = false;
      result.errors.push('Attribute is required.');
    }
    return result;
  }

  if (!ATTRIBUTE_VALUES.includes(value as AttributeValue)) {
    result.isValid = false;
    result.errors.push(`Attribute must be one of: ${ATTRIBUTE_VALUES.join(', ')}.`);
  }

  return result;
}

/**
 * Validates that an augment type value is from the allowed set
 */
export function validateAugmentType(
  value: string | undefined | null,
  options: ValidationOptions = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!value) {
    if (options.required) {
      result.isValid = false;
      result.errors.push('Augment Type is required.');
    }
    return result;
  }

  if (!AUGMENT_TYPE_VALUES.includes(value as AugmentTypeValue)) {
    result.isValid = false;
    result.errors.push(`Augment Type must be one of: ${AUGMENT_TYPE_VALUES.join(', ')}.`);
  }

  return result;
}

/**
 * Validates uses counter (current/max relationship)
 */
export function validateUsesCounter(
  currentUses: number | string | undefined | null,
  maxUses: number | string | undefined | null,
  options: ValidationOptions = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const current = Number(currentUses || 0);
  const max = Number(maxUses || 0);

  // Validate individual numbers
  const currentValidation = validateNumberRange(current, 'Current Uses', 0, 1000);
  const maxValidation = validateNumberRange(max, 'Maximum Uses', 0, 1000);

  result.errors.push(...currentValidation.errors, ...maxValidation.errors);
  result.warnings.push(...currentValidation.warnings, ...maxValidation.warnings);

  if (!currentValidation.isValid || !maxValidation.isValid) {
    result.isValid = false;
    return result;
  }

  // Cross-field validation: current should not exceed max
  if (max > 0 && current > max) {
    result.isValid = false;
    result.errors.push('Current uses cannot exceed maximum uses.');
  }

  // Warning for unusual patterns
  if (max === 0 && current > 0) {
    result.warnings.push('Current uses is set but maximum uses is 0.');
  }

  return result;
}

/**
 * Validates a hex color code
 */
export function validateHexColor(
  value: string | undefined | null,
  fieldName: string = 'Color',
  options: ValidationOptions = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!value) {
    if (options.required) {
      result.isValid = false;
      result.errors.push(`${fieldName} is required.`);
    }
    return result;
  }

  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  
  if (!hexPattern.test(value)) {
    result.isValid = false;
    result.errors.push(`${fieldName} must be a valid hex color code (e.g., #FF5733 or #F53).`);
  }

  return result;
}

/**
 * Validates a FontAwesome icon class
 */
export function validateFontAwesomeIcon(
  value: string | undefined | null,
  options: ValidationOptions = {}
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!value) {
    if (options.required) {
      result.isValid = false;
      result.errors.push('Icon class is required.');
    }
    return result;
  }

  // Basic pattern for FontAwesome classes
  const iconPattern = /^(fa[bsrl]?|fas|far|fal|fab)\s+fa-[\w-]+$/;
  
  if (!iconPattern.test(value.trim())) {
    result.isValid = false;
    result.errors.push('Icon must be a valid FontAwesome class (e.g., fas fa-fire, far fa-star).');
  }

  return result;
}

/**
 * Validates a complete item based on its type
 */
export function validateItemByType(
  itemData: any,
  itemType: string
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Always validate name (required for all items)
  const nameValidation = validateRequiredString(itemData.name, 'Name', { required: true });
  result.errors.push(...nameValidation.errors);
  result.warnings.push(...nameValidation.warnings);
  if (!nameValidation.isValid) result.isValid = false;

  // Type-specific validation
  switch (itemType) {
    case 'talent':
      result.errors.push(...validateTalentFields(itemData).errors);
      break;
      
    case 'augment':
      result.errors.push(...validateAugmentFields(itemData).errors);
      break;
      
    case 'weapon':
      result.errors.push(...validateWeaponFields(itemData).errors);
      break;
      
    case 'armor':
      result.errors.push(...validateArmorFields(itemData).errors);
      break;
      
    case 'feature':
      result.errors.push(...validateFeatureFields(itemData).errors);
      break;
      
    case 'trait':
      result.errors.push(...validateTraitFields(itemData).errors);
      break;
  }

  if (result.errors.length > 0) {
    result.isValid = false;
  }

  return result;
}

/**
 * Validates talent-specific fields
 */
function validateTalentFields(itemData: any): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // AP Cost validation
  const apValidation = validateApCost(itemData.system?.apCost);
  result.errors.push(...apValidation.errors);
  if (!apValidation.isValid) result.isValid = false;

  // Level requirement validation
  if (itemData.system?.levelRequirement) {
    const levelValidation = validateLevelRequirement(itemData.system.levelRequirement);
    result.errors.push(...levelValidation.errors);
    if (!levelValidation.isValid) result.isValid = false;
  }

  return result;
}

/**
 * Validates augment-specific fields
 */
function validateAugmentFields(itemData: any): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // AP Cost validation
  const apValidation = validateApCost(itemData.system?.apCost);
  result.errors.push(...apValidation.errors);
  if (!apValidation.isValid) result.isValid = false;

  // PP Cost validation
  if (itemData.system?.ppCost) {
    const ppValidation = validatePpCost(itemData.system.ppCost);
    result.errors.push(...ppValidation.errors);
    if (!ppValidation.isValid) result.isValid = false;
  }

  // Rarity validation
  if (itemData.system?.rarity) {
    const rarityValidation = validateRarity(itemData.system.rarity);
    result.errors.push(...rarityValidation.errors);
    if (!rarityValidation.isValid) result.isValid = false;
  }

  // Augment type validation
  if (itemData.system?.augmentType) {
    const typeValidation = validateAugmentType(itemData.system.augmentType);
    result.errors.push(...typeValidation.errors);
    if (!typeValidation.isValid) result.isValid = false;
  }

  // Uses validation
  if (itemData.system?.uses) {
    const usesValidation = validateUsesCounter(
      itemData.system.uses.value,
      itemData.system.uses.max
    );
    result.errors.push(...usesValidation.errors);
    if (!usesValidation.isValid) result.isValid = false;
  }

  return result;
}

/**
 * Validates weapon-specific fields
 */
function validateWeaponFields(itemData: any): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Attribute validation
  if (itemData.system?.attribute) {
    const attributeValidation = validateAttribute(itemData.system.attribute);
    result.errors.push(...attributeValidation.errors);
    if (!attributeValidation.isValid) result.isValid = false;
  }

  // Modifier validation
  if (itemData.system?.modifier !== undefined) {
    const modifierValidation = validateNumberRange(itemData.system.modifier, 'Modifier', -10, 20);
    result.errors.push(...modifierValidation.errors);
    if (!modifierValidation.isValid) result.isValid = false;
  }

  return result;
}

/**
 * Validates armor-specific fields
 */
function validateArmorFields(itemData: any): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Attribute validation
  if (itemData.system?.attribute) {
    const attributeValidation = validateAttribute(itemData.system.attribute);
    result.errors.push(...attributeValidation.errors);
    if (!attributeValidation.isValid) result.isValid = false;
  }

  // Armor Class validation
  if (itemData.system?.armorClass !== undefined) {
    const acValidation = validateNumberRange(itemData.system.armorClass, 'Armor Class', 10, 25);
    result.errors.push(...acValidation.errors);
    if (!acValidation.isValid) result.isValid = false;
  }

  return result;
}

/**
 * Validates feature-specific fields
 */
function validateFeatureFields(itemData: any): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // PP Cost validation
  if (itemData.system?.powerPointCost) {
    const ppValidation = validatePpCost(itemData.system.powerPointCost);
    result.errors.push(...ppValidation.errors);
    if (!ppValidation.isValid) result.isValid = false;
  }

  // Uses validation
  if (itemData.system?.uses) {
    const usesValidation = validateUsesCounter(
      itemData.system.uses.value,
      itemData.system.uses.max
    );
    result.errors.push(...usesValidation.errors);
    if (!usesValidation.isValid) result.isValid = false;
  }

  // Color validation (for trait features)
  if (itemData.system?.color) {
    const colorValidation = validateHexColor(itemData.system.color, 'Trait Color');
    result.errors.push(...colorValidation.errors);
    if (!colorValidation.isValid) result.isValid = false;
  }

  // Icon validation (for trait features)
  if (itemData.system?.icon) {
    const iconValidation = validateFontAwesomeIcon(itemData.system.icon);
    result.errors.push(...iconValidation.errors);
    if (!iconValidation.isValid) result.isValid = false;
  }

  return result;
}

/**
 * Validates trait-specific fields
 */
function validateTraitFields(itemData: any): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Color validation (required for traits)
  const colorValidation = validateHexColor(itemData.system?.color, 'Trait Color', { required: true });
  result.errors.push(...colorValidation.errors);
  if (!colorValidation.isValid) result.isValid = false;

  // Text color validation
  if (itemData.system?.textColor) {
    const textColorValidation = validateHexColor(itemData.system.textColor, 'Text Color');
    result.errors.push(...textColorValidation.errors);
    if (!textColorValidation.isValid) result.isValid = false;
  }

  // Icon validation (recommended for traits)
  if (itemData.system?.icon) {
    const iconValidation = validateFontAwesomeIcon(itemData.system.icon);
    result.errors.push(...iconValidation.errors);
    if (!iconValidation.isValid) result.isValid = false;
  }

  // Rarity validation
  if (itemData.system?.rarity) {
    const rarityValidation = validateRarity(itemData.system.rarity);
    result.errors.push(...rarityValidation.errors);
    if (!rarityValidation.isValid) result.isValid = false;
  }

  return result;
}

/**
 * Combines multiple validation results into a single result
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const combined: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  for (const result of results) {
    if (!result.isValid) {
      combined.isValid = false;
    }
    combined.errors.push(...result.errors);
    combined.warnings.push(...result.warnings);
  }

  return combined;
} 