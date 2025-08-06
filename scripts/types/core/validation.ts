/**
 * @fileoverview Core Validation Types
 * @description Type definitions for validation utilities and error handling
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Standard result type for validation operations.
 * Represents either success with data or failure with an error.
 */
export interface ValidationResult<T = unknown> {
  /** Whether the validation succeeded */
  success: boolean;
  /** The validated data (only present if success is true) */
  data?: T;
  /** Error message (only present if success is false) */
  error?: string;
  /** Additional context about the validation */
  warnings?: string[];
}

/**
 * Represents a validation error with context.
 * Used for detailed error reporting in complex validation scenarios.
 */
export interface ValidationError {
  /** The field that failed validation */
  field: string;
  /** The attempted value */
  value: unknown;
  /** Human-readable error message */
  message: string;
  /** Error code for programmatic handling */
  code?: string;
}

/**
 * Configuration for field validation.
 * Defines rules and constraints for validating individual fields.
 */
export interface FieldValidator<T = unknown> {
  /** Whether the field is required */
  required?: boolean;
  /** Custom validation function */
  validate?: (value: unknown) => ValidationResult<T>;
  /** Default value if validation fails */
  defaultValue?: T;
  /** Human-readable field name for error messages */
  label?: string;
}

/**
 * Configuration object for validating multiple fields.
 * Maps field names to their validation rules.
 */
export interface ValidationConfig {
  [fieldName: string]: FieldValidator;
}

// New types for actor validation results

/**
 * Result of validating actor abilities data
 */
export interface ValidatedActorAbilities {
  [attributeName: string]: {
    value?: number;
    mod?: number;
    [key: string]: unknown;
  };
}

/**
 * Result of validating actor skills data
 */
export interface ValidatedActorSkills {
  [skillName: string]: number;
}

/**
 * Result of validating health data
 */
export interface ValidatedHealthData {
  value?: number;
  max?: number;
  temp?: number;
  [key: string]: unknown;
}

/**
 * Result of validating power points data
 */
export interface ValidatedPowerPointsData {
  value?: number;
  max?: number;
  [key: string]: unknown;
}

/**
 * Result of validating uses data
 */
export interface ValidatedUsesData {
  value?: number;
  max?: number;
  [key: string]: unknown;
} 