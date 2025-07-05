/**
 * Item Validation Utilities Tests
 * 
 * Comprehensive test suite for item form validation functions.
 * Ensures all validation rules work correctly with various inputs.
 * 
 * @author Avant VTT Team
 * @version 2.0.0
 * @since Phase 2
 */

import {
  ValidationResult,
  ValidationOptions,
  RARITY_VALUES,
  ABILITY_VALUES,
  validateRequiredString,
  validateStringLength,
  validateNumberRange,
  validateApCost,
  validatePpCost,
  validateLevelRequirement,
  validateRarity,
  validateAbility,
  validateUsesCounter,
  validateHexColor,
  validateFontAwesomeIcon,
  validateItemByType,
  combineValidationResults
} from '../../../scripts/logic/item-validation';

describe('Item Validation Utilities', () => {
  
  describe('validateRequiredString', () => {
    test('should validate non-empty strings as valid', () => {
      const result = validateRequiredString('test value', 'Test Field', { required: true });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should invalidate empty required strings', () => {
      const result = validateRequiredString('', 'Test Field', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test Field is required and cannot be empty.');
    });

    test('should validate empty non-required strings', () => {
      const result = validateRequiredString('', 'Test Field', { required: false });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle null and undefined values', () => {
      const nullResult = validateRequiredString(null, 'Test Field', { required: true });
      const undefinedResult = validateRequiredString(undefined, 'Test Field', { required: true });
      
      expect(nullResult.isValid).toBe(false);
      expect(undefinedResult.isValid).toBe(false);
    });

    test('should use custom error messages', () => {
      const result = validateRequiredString('', 'Test Field', { 
        required: true, 
        customMessage: 'Custom error message' 
      });
      expect(result.errors).toContain('Custom error message');
    });

    test('should trim whitespace', () => {
      const result = validateRequiredString('   ', 'Test Field', { required: true });
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateStringLength', () => {
    test('should validate strings within length limits', () => {
      const result = validateStringLength('test', 'Test Field', 1, 10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should invalidate strings below minimum length', () => {
      const result = validateStringLength('ab', 'Test Field', 5, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test Field must be at least 5 characters long.');
    });

    test('should invalidate strings above maximum length', () => {
      const result = validateStringLength('very long string', 'Test Field', 1, 5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test Field cannot exceed 5 characters.');
    });

    test('should warn for very short content', () => {
      const result = validateStringLength('ab', 'Test Field', 0, 100);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Test Field is quite short. Consider adding more detail.');
    });
  });

  describe('validateNumberRange', () => {
    test('should validate numbers within range', () => {
      const result = validateNumberRange(5, 'Test Number', 1, 10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should invalidate numbers below minimum', () => {
      const result = validateNumberRange(-5, 'Test Number', 0, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test Number must be at least 0.');
    });

    test('should invalidate numbers above maximum', () => {
      const result = validateNumberRange(15, 'Test Number', 0, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test Number cannot exceed 10.');
    });

    test('should handle string numbers', () => {
      const result = validateNumberRange('5', 'Test Number', 1, 10);
      expect(result.isValid).toBe(true);
    });

    test('should invalidate non-numeric strings', () => {
      const result = validateNumberRange('not a number', 'Test Number', 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Test Number must be a valid number.');
    });

    test('should handle empty values based on required option', () => {
      const requiredResult = validateNumberRange(null, 'Test Number', 1, 10, { required: true });
      const optionalResult = validateNumberRange(null, 'Test Number', 1, 10, { required: false });
      
      expect(requiredResult.isValid).toBe(false);
      expect(optionalResult.isValid).toBe(true);
    });

    test('should warn for non-integer values when integers expected', () => {
      const result = validateNumberRange(5.5, 'Test Number', 1, 10);
      expect(result.warnings).toContain('Test Number should be a whole number.');
    });
  });

  describe('validateApCost', () => {
    test('should validate AP costs within 0-3 range', () => {
      expect(validateApCost(0).isValid).toBe(true);
      expect(validateApCost(1).isValid).toBe(true);
      expect(validateApCost(2).isValid).toBe(true);
      expect(validateApCost(3).isValid).toBe(true);
    });

    test('should invalidate AP costs outside 0-3 range', () => {
      expect(validateApCost(-1).isValid).toBe(false);
      expect(validateApCost(4).isValid).toBe(false);
    });

    test('should handle string AP costs', () => {
      expect(validateApCost('2').isValid).toBe(true);
      expect(validateApCost('invalid').isValid).toBe(false);
    });
  });

  describe('validatePpCost', () => {
    test('should validate PP costs within 0-100 range', () => {
      expect(validatePpCost(0).isValid).toBe(true);
      expect(validatePpCost(50).isValid).toBe(true);
      expect(validatePpCost(100).isValid).toBe(true);
    });

    test('should invalidate PP costs outside 0-100 range', () => {
      expect(validatePpCost(-1).isValid).toBe(false);
      expect(validatePpCost(101).isValid).toBe(false);
    });
  });

  describe('validateLevelRequirement', () => {
    test('should validate level requirements within 1-20 range', () => {
      expect(validateLevelRequirement(1).isValid).toBe(true);
      expect(validateLevelRequirement(10).isValid).toBe(true);
      expect(validateLevelRequirement(20).isValid).toBe(true);
    });

    test('should invalidate level requirements outside 1-20 range', () => {
      expect(validateLevelRequirement(0).isValid).toBe(false);
      expect(validateLevelRequirement(21).isValid).toBe(false);
    });
  });

  describe('validateRarity', () => {
    test('should validate all defined rarity values', () => {
      RARITY_VALUES.forEach(rarity => {
        const result = validateRarity(rarity);
        expect(result.isValid).toBe(true);
      });
    });

    test('should invalidate undefined rarity values', () => {
      const result = validateRarity('invalid-rarity');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must be one of:');
    });

    test('should handle empty values based on required option', () => {
      const requiredResult = validateRarity(null, { required: true });
      const optionalResult = validateRarity(null, { required: false });
      
      expect(requiredResult.isValid).toBe(false);
      expect(optionalResult.isValid).toBe(true);
    });
  });

  describe('validateAbility', () => {
    test('should validate all defined ability values', () => {
      ABILITY_VALUES.forEach(ability => {
        const result = validateAbility(ability);
        expect(result.isValid).toBe(true);
      });
    });

    test('should invalidate undefined ability values', () => {
      const result = validateAbility('invalid-ability');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must be one of:');
    });
  });

  describe('validateUsesCounter', () => {
    test('should validate when current uses is within max uses', () => {
      const result = validateUsesCounter(3, 5);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should invalidate when current uses exceeds max uses', () => {
      const result = validateUsesCounter(7, 5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Current uses cannot exceed maximum uses.');
    });

    test('should warn when current uses is set but max uses is 0', () => {
      const result = validateUsesCounter(2, 0);
      expect(result.warnings).toContain('Current uses is set but maximum uses is 0.');
    });

    test('should handle negative values', () => {
      const result = validateUsesCounter(-1, 5);
      expect(result.isValid).toBe(false);
    });

    test('should handle string values', () => {
      const result = validateUsesCounter('3', '5');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateHexColor', () => {
    test('should validate proper hex color codes', () => {
      expect(validateHexColor('#FF5733').isValid).toBe(true);
      expect(validateHexColor('#abc').isValid).toBe(true);
      expect(validateHexColor('#123456').isValid).toBe(true);
    });

    test('should invalidate malformed hex codes', () => {
      expect(validateHexColor('FF5733').isValid).toBe(false); // Missing #
      expect(validateHexColor('#GG5733').isValid).toBe(false); // Invalid characters
      expect(validateHexColor('#12345').isValid).toBe(false); // Wrong length
      expect(validateHexColor('#1234567').isValid).toBe(false); // Too long
    });

    test('should handle empty values based on required option', () => {
      const requiredResult = validateHexColor(null, 'Color', { required: true });
      const optionalResult = validateHexColor(null, 'Color', { required: false });
      
      expect(requiredResult.isValid).toBe(false);
      expect(optionalResult.isValid).toBe(true);
    });

    test('should use custom field names in error messages', () => {
      const result = validateHexColor('invalid', 'Background Color');
      expect(result.errors[0]).toContain('Background Color');
    });
  });

  describe('validateFontAwesomeIcon', () => {
    test('should validate proper FontAwesome class formats', () => {
      expect(validateFontAwesomeIcon('fas fa-fire').isValid).toBe(true);
      expect(validateFontAwesomeIcon('far fa-star').isValid).toBe(true);
      expect(validateFontAwesomeIcon('fab fa-github').isValid).toBe(true);
      expect(validateFontAwesomeIcon('fal fa-home').isValid).toBe(true);
    });

    test('should invalidate malformed icon classes', () => {
      expect(validateFontAwesomeIcon('fa-fire').isValid).toBe(false); // Missing prefix
      expect(validateFontAwesomeIcon('fas fire').isValid).toBe(false); // Missing fa-
      expect(validateFontAwesomeIcon('invalid fa-fire').isValid).toBe(false); // Wrong prefix
    });

    test('should handle empty values based on required option', () => {
      const requiredResult = validateFontAwesomeIcon(null, { required: true });
      const optionalResult = validateFontAwesomeIcon(null, { required: false });
      
      expect(requiredResult.isValid).toBe(false);
      expect(optionalResult.isValid).toBe(true);
    });
  });

  describe('validateItemByType', () => {
    test('should validate basic item with name', () => {
      const itemData = { name: 'Test Item' };
      const result = validateItemByType(itemData, 'basic');
      expect(result.isValid).toBe(true);
    });

    test('should invalidate item without name', () => {
      const itemData = {};
      const result = validateItemByType(itemData, 'basic');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required and cannot be empty.');
    });

    test('should validate talent-specific fields', () => {
      const itemData = {
        name: 'Test Talent',
        system: {
          apCost: 2,
          levelRequirement: 5
        }
      };
      const result = validateItemByType(itemData, 'talent');
      expect(result.isValid).toBe(true);
    });

    test('should invalidate talent with invalid AP cost', () => {
      const itemData = {
        name: 'Test Talent',
        system: {
          apCost: 5 // Invalid - should be 0-3
        }
      };
      const result = validateItemByType(itemData, 'talent');
      expect(result.isValid).toBe(false);
    });

    test('should validate augment-specific fields', () => {
      const itemData = {
        name: 'Test Augment',
        system: {
          apCost: 1,
          ppCost: 10,
          rarity: 'rare',
          augmentType: 'enhancement',
          uses: { value: 2, max: 5 }
        }
      };
      const result = validateItemByType(itemData, 'augment');
      expect(result.isValid).toBe(true);
    });
  });

  describe('combineValidationResults', () => {
    test('should combine multiple valid results as valid', () => {
      const result1: ValidationResult = { isValid: true, errors: [], warnings: ['Warning 1'] };
      const result2: ValidationResult = { isValid: true, errors: [], warnings: ['Warning 2'] };
      
      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
      expect(combined.warnings).toHaveLength(2);
    });

    test('should combine results with errors as invalid', () => {
      const result1: ValidationResult = { isValid: true, errors: [], warnings: [] };
      const result2: ValidationResult = { isValid: false, errors: ['Error 1'], warnings: [] };
      
      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toContain('Error 1');
    });

    test('should aggregate all errors and warnings', () => {
      const result1: ValidationResult = { 
        isValid: false, 
        errors: ['Error 1'], 
        warnings: ['Warning 1'] 
      };
      const result2: ValidationResult = { 
        isValid: false, 
        errors: ['Error 2'], 
        warnings: ['Warning 2'] 
      };
      
      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toEqual(['Error 1', 'Error 2']);
      expect(combined.warnings).toEqual(['Warning 1', 'Warning 2']);
    });

    test('should handle empty results', () => {
      const combined = combineValidationResults();
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
      expect(combined.warnings).toHaveLength(0);
    });
  });

  describe('edge cases and error conditions', () => {
    test('should handle extremely large numbers', () => {
      const result = validateNumberRange(Number.MAX_SAFE_INTEGER, 'Test', 0, Number.MAX_SAFE_INTEGER);
      expect(result.isValid).toBe(true);
    });

    test('should handle very long strings', () => {
      const longString = 'a'.repeat(2000);
      const result = validateStringLength(longString, 'Test', 0, 1000);
      expect(result.isValid).toBe(false);
    });

    test('should handle special characters in validation', () => {
      const specialText = '🎮🎲⚔️🛡️';
      const result = validateRequiredString(specialText, 'Test', { required: true });
      expect(result.isValid).toBe(true);
    });

    test('should handle mixed case hex colors', () => {
      expect(validateHexColor('#AbCdEf').isValid).toBe(true);
      expect(validateHexColor('#ABCDEF').isValid).toBe(true);
      expect(validateHexColor('#abcdef').isValid).toBe(true);
    });
  });
}); 