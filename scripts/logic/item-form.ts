/**
 * @fileoverview Item Form Data Handling Module
 * @version 1.0.0
 * @description Pure functions for ApplicationV2 form data extraction and validation
 * 
 * This module handles the complex ApplicationV2 form data extraction that was previously
 * embedded in the item sheet. It provides pure functions for processing nested forms,
 * extracting form data from multiple sources, and validating critical fields.
 * 
 * DESIGN PRINCIPLES:
 * - Pure functions with no side effects
 * - Type-safe interfaces for all data structures
 * - Comprehensive error handling with Result types
 * - Extensive logging for debugging ApplicationV2 issues
 */

import { logger } from '../utils/logger.js';
import { ValidationUtils } from '../utils/validation.js';
import { extractItemFormData } from './item-sheet-utils.js';
import type { Result } from '../types/core/result.js';

/**
 * ApplicationV2 Form Data Sources
 * 
 * ApplicationV2 can provide form data in multiple formats depending on the
 * form structure and submission method. This enum defines the possible sources.
 */
export enum FormDataSource {
    FORM_DATA_EXTENDED = 'FormDataExtended',
    NATIVE_FORM_DATA = 'FormData',
    PLAIN_OBJECT = 'PlainObject',
    MANUAL_EXTRACTION = 'ManualExtraction',
    FALLBACK = 'Fallback'
}

/**
 * ApplicationV2 Form Detection Result
 * 
 * Results from detecting whether we're dealing with a nested form situation
 * where the outer form is just header controls and the inner form has content.
 */
export interface FormDetectionResult {
    /** Whether this is a nested form scenario */
    isNestedForm: boolean;
    /** The actual form element to extract data from */
    actualForm: HTMLElement;
    /** The detected form type for logging */
    formType: 'frame' | 'content' | 'unknown';
    /** Number of form elements found */
    elementCount: number;
    /** Whether header controls were detected */
    hasHeaderControls: boolean;
}

/**
 * Form Data Extraction Configuration
 * 
 * Configuration options for form data extraction behavior.
 */
export interface FormExtractionConfig {
    /** Whether to enable manual DOM extraction as fallback */
    enableManualExtraction: boolean;
    /** Whether to enable validation of critical fields */
    enableValidation: boolean;
    /** Item type for type-specific validation */
    itemType?: string;
    /** Maximum number of form elements to process */
    maxElements: number;
    /** Debug logging level */
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default form extraction configuration
 */
export const DEFAULT_FORM_CONFIG: FormExtractionConfig = {
    enableManualExtraction: true,
    enableValidation: true,
    maxElements: 100,
    logLevel: 'debug'
};

/**
 * Raw Form Data Input
 * 
 * Represents the various types of form data that ApplicationV2 might provide.
 */
export type RawFormData = 
    | { object: Record<string, any> }  // FormDataExtended
    | FormData                         // Native FormData
    | Record<string, any>              // Plain object
    | null                             // No data
    | undefined;                       // Undefined

/**
 * Form Data Extraction Result
 * 
 * Result of extracting and processing form data from ApplicationV2 forms.
 */
export interface FormExtractionResult {
    /** Whether the extraction was successful */
    success: boolean;
    /** The extracted form data */
    data?: Record<string, any>;
    /** How the data was extracted */
    source: FormDataSource;
    /** Any error that occurred */
    error?: string;
    /** Validation results if enabled */
    validation?: ValidationResult;
    /** Metadata about the extraction process */
    metadata: {
        originalDataType: string;
        extractedFieldCount: number;
        processingTimeMs: number;
        wasNestedForm: boolean;
    };
}

/**
 * Validation Result
 * 
 * Result of validating form data for critical fields.
 */
export interface ValidationResult {
    /** Whether validation passed */
    isValid: boolean;
    /** List of validation errors */
    errors: string[];
    /** List of validation warnings */
    warnings: string[];
    /** Fields that were validated */
    validatedFields: string[];
}

/**
 * Critical Field Validation Rules
 * 
 * Rules for validating critical fields by item type.
 */
export interface ValidationRules {
    /** Required fields that must be present */
    requiredFields: string[];
    /** Optional fields with validation rules */
    optionalFields: { [key: string]: (value: any) => boolean };
    /** Custom validation function */
    customValidator?: (data: Record<string, any>) => ValidationResult;
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Detect whether we're dealing with ApplicationV2 nested forms
 * 
 * ApplicationV2 creates nested forms where the outer form contains only
 * header controls and the inner form contains the actual content inputs.
 * This function detects this scenario and returns the correct form to use.
 * 
 * @param form - The form element from ApplicationV2
 * @param element - The application element to search within
 * @returns Detection result with the actual form to use
 */
export function detectNestedForm(
    form: HTMLElement, 
    element: HTMLElement
): FormDetectionResult {
    try {
        // Get form elements for analysis
        const formElements = Array.from((form as any).elements) as HTMLFormElement[];
        
        // Check if this form only has header control buttons (outer frame form)
        const hasOnlyHeaderButtons = formElements.length > 0 && formElements.every((el: any) =>
            el.tagName === 'BUTTON' &&
            el.className &&
            el.className.includes('header-control') &&
            !el.name
        );

        if (hasOnlyHeaderButtons) {
            logger.debug('ItemForm | Detected outer frame form, searching for content form');
            
            // Find the actual content form with input fields
            const contentForm = element.querySelector('div[data-application-part="form"]') as HTMLElement;
            if (contentForm) {
                const inputCount = contentForm.querySelectorAll('input, select, textarea').length;
                logger.debug('ItemForm | Found content form', {
                    hasInputs: inputCount,
                    className: contentForm.className
                });
                
                return {
                    isNestedForm: true,
                    actualForm: contentForm,
                    formType: 'content',
                    elementCount: inputCount,
                    hasHeaderControls: true
                };
            } else {
                logger.warn('ItemForm | Could not find content form, using original form');
                return {
                    isNestedForm: true,
                    actualForm: form,
                    formType: 'frame',
                    elementCount: formElements.length,
                    hasHeaderControls: true
                };
            }
        }

        // This is a regular form, not nested
        return {
            isNestedForm: false,
            actualForm: form,
            formType: 'content',
            elementCount: formElements.length,
            hasHeaderControls: false
        };
    } catch (error) {
        logger.error('ItemForm | Error detecting nested form:', error);
        return {
            isNestedForm: false,
            actualForm: form,
            formType: 'unknown',
            elementCount: 0,
            hasHeaderControls: false
        };
    }
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Extract form data from ApplicationV2 forms with comprehensive fallback handling
 * 
 * This function handles all the different ways ApplicationV2 can provide form data
 * and provides robust fallback mechanisms for when the standard approaches fail.
 * 
 * @param event - The form submission event
 * @param form - The form element (may be nested)
 * @param formData - Raw form data from ApplicationV2
 * @param element - The application element for manual extraction
 * @param config - Configuration for extraction behavior
 * @returns Extraction result with processed data
 */
export function extractFormData(
    event: Event,
    form: HTMLElement,
    formData: RawFormData,
    element: HTMLElement,
    config: FormExtractionConfig = DEFAULT_FORM_CONFIG
): Result<FormExtractionResult, string> {
    const startTime = Date.now();
    
    try {
        logger.debug('ItemForm | _extractFormData called', {
            eventType: event?.type || 'unknown',
            formElementType: form?.tagName || 'unknown',
            formDataType: typeof formData,
            formDataConstructor: formData?.constructor?.name,
            hasObjectProperty: !!(formData && typeof formData === 'object' && 'object' in formData)
        });

        // Step 1: Detect nested form structure
        const formDetection = detectNestedForm(form, element);
        const actualForm = formDetection.actualForm;

        // Step 2: Determine form data source
        const dataSource = determineFormDataSource(formData);
        logger.debug('ItemForm | Form data source determined:', dataSource);

        // Step 3: Extract form data based on source
        let rawFormData: Record<string, any> = {};

        switch (dataSource) {
            case FormDataSource.FORM_DATA_EXTENDED:
                // FormDataExtended with .object property
                rawFormData = (formData as any).object;
                logger.debug('ItemForm | Using FormDataExtended.object pattern');
                break;

            case FormDataSource.NATIVE_FORM_DATA:
                // Native FormData - convert to object
                rawFormData = {};
                const formDataEntries = Array.from((formData as FormData).entries());
                for (const [key, value] of formDataEntries) {
                    rawFormData[key] = value;
                }
                logger.debug('ItemForm | Converted FormData to object', {
                    fieldCount: Object.keys(rawFormData).length
                });
                break;

            case FormDataSource.PLAIN_OBJECT:
                // Plain object - use directly
                rawFormData = formData as Record<string, any>;
                logger.debug('ItemForm | Using plain object form data');
                break;

            case FormDataSource.FALLBACK:
            default:
                // Manual extraction fallback
                if (config.enableManualExtraction) {
                    rawFormData = extractManualFormData(actualForm, config);
                    logger.debug('ItemForm | Used manual extraction fallback');
                } else {
                    logger.warn('ItemForm | No valid form data source found and manual extraction disabled');
                    rawFormData = {};
                }
                break;
        }

        // Step 4: If we still have no data, try manual extraction as last resort
        if ((!rawFormData || Object.keys(rawFormData).length === 0) && config.enableManualExtraction) {
            rawFormData = extractManualFormData(actualForm, config);
            logger.debug('ItemForm | Used manual extraction as last resort');
        }

        // Step 5: Process form data for FoundryVTT
        const processedData = processFormDataForFoundry(rawFormData);

        const processingTime = Date.now() - startTime;

        const result: FormExtractionResult = {
            success: true,
            data: processedData,
            source: dataSource,
            metadata: {
                originalDataType: typeof formData,
                extractedFieldCount: Object.keys(rawFormData).length,
                processingTimeMs: processingTime,
                wasNestedForm: formDetection.isNestedForm
            }
        };

        logger.debug('ItemForm | Form data extraction completed', {
            source: dataSource,
            fieldCount: Object.keys(rawFormData).length,
            processingTime,
            wasNestedForm: formDetection.isNestedForm
        });

        return { success: true, value: result };

    } catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = `Form data extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
        logger.error('ItemForm | Error in form data extraction:', error);

        const result: FormExtractionResult = {
            success: false,
            error: errorMessage,
            source: FormDataSource.FALLBACK,
            metadata: {
                originalDataType: typeof formData,
                extractedFieldCount: 0,
                processingTimeMs: processingTime,
                wasNestedForm: false
            }
        };

        return { success: false, error: errorMessage };
    }
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Validate critical fields for specific item types
 * 
 * Performs type-specific validation to ensure required fields are present
 * and meet the necessary criteria for the item type.
 * 
 * @param data - The form data to validate
 * @param itemType - The item type (talent, augment, etc.)
 * @param customRules - Optional custom validation rules
 * @returns Validation result
 */
export function validateCriticalFields(
    data: Record<string, any>,
    itemType: string,
    customRules?: ValidationRules
): ValidationResult {
    const rules = customRules || getValidationRules(itemType);
    const errors: string[] = [];
    const warnings: string[] = [];
    const validatedFields: string[] = [];

    // Check if system data exists
    if (!data.system) {
        errors.push(`No system data found for ${itemType}`);
        return {
            isValid: false,
            errors,
            warnings,
            validatedFields
        };
    }

    const system = data.system;

    // Validate required fields
    for (const field of rules.requiredFields) {
        validatedFields.push(field);
        const value = system[field];
        
        if (value === undefined || value === null || value === '') {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Validate optional fields with custom validators
    for (const [field, validator] of Object.entries(rules.optionalFields)) {
        if (system[field] !== undefined) {
            validatedFields.push(field);
            if (!validator(system[field])) {
                warnings.push(`Invalid value for field: ${field}`);
            }
        }
    }

    // Run custom validation if provided
    if (rules.customValidator) {
        const customResult = rules.customValidator(data);
        errors.push(...customResult.errors);
        warnings.push(...customResult.warnings);
        validatedFields.push(...customResult.validatedFields);
    }

    const isValid = errors.length === 0;

    if (!isValid) {
        logger.warn(`ItemForm | Validation failed for ${itemType}:`, errors);
    } else {
        logger.debug(`ItemForm | Validation passed for ${itemType}`, {
            validatedFields,
            warnings: warnings.length > 0 ? warnings : undefined
        });
    }

    return {
        isValid,
        errors,
        warnings,
        validatedFields
    };
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Get validation rules for a specific item type
 * 
 * Returns the validation rules that should be applied to the given item type.
 * This allows for easy extension of validation rules for new item types.
 * 
 * @param itemType - The item type to get rules for
 * @returns Validation rules for the item type
 */
export function getValidationRules(itemType: string): ValidationRules {
    const baseRules: ValidationRules = {
        requiredFields: ['description'],
        optionalFields: {},
    };

    // Add item-type specific required fields
    if (itemType === 'talent') {
        baseRules.requiredFields.push('requirements', 'levelRequirement', 'apCost');
    } else if (itemType === 'augment') {
        baseRules.requiredFields.push('requirements', 'levelRequirement', 'apCost', 'ppCost');
    }

    // Add validation functions for optional fields
    baseRules.optionalFields = {
        'levelRequirement': (value: any) => {
            if (value === null || value === undefined) return true;
            const num = Number(value);
            return !isNaN(num) && num >= 0;
        },
        'apCost': (value: any) => {
            if (value === null || value === undefined) return true;
            const num = Number(value);
            return !isNaN(num) && num >= 0;
        },
        'ppCost': (value: any) => {
            if (value === null || value === undefined) return true;
            const num = Number(value);
            return !isNaN(num) && num >= 0;
        }
    };

    return baseRules;
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Check if form submission should be blocked
 * 
 * Determines whether automatic form submission should be blocked based on
 * the current application state (e.g., during trait operations).
 * 
 * @param blockAutoSubmit - Whether auto-submit is currently blocked
 * @param reason - Optional reason for blocking (for logging)
 * @returns Whether to block the submission
 */
export function shouldBlockSubmission(
    blockAutoSubmit: boolean,
    reason?: string
): boolean {
    if (blockAutoSubmit) {
        logger.debug('ItemForm | Blocking automatic form submission', { reason });
        return true;
    }
    return false;
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Process raw form data into FoundryVTT format
 * 
 * Converts flat form data (e.g., "system.description") into nested objects
 * that FoundryVTT expects (e.g., {system: {description: "value"}}).
 * 
 * @param rawData - Raw form data with potentially flat keys
 * @returns Processed data in FoundryVTT nested format
 */
export function processFormDataForFoundry(
    rawData: Record<string, any>
): Record<string, any> {
    try {
        // Use the existing extractItemFormData function from item-sheet-utils
        return extractItemFormData(rawData);
    } catch (error) {
        logger.error('ItemForm | Error processing form data for FoundryVTT:', error);
        // Return the raw data as a fallback
        return rawData || {};
    }
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Extract form data manually from DOM elements
 * 
 * Fallback method that manually extracts form data from DOM elements when
 * the standard ApplicationV2 methods fail to provide data.
 * 
 * @param form - The form element to extract from
 * @param config - Configuration for extraction
 * @returns Extracted data from DOM elements
 */
export function extractManualFormData(
    form: HTMLElement,
    config: FormExtractionConfig
): Record<string, any> {
    try {
        logger.debug('ItemForm | Extracting form data from content form');

        // Find all form inputs in the content form
        const inputs = form.querySelectorAll('input, select, textarea') as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
        const extractedData: Record<string, any> = {};
        
        let processedCount = 0;

        inputs.forEach((input: any) => {
            // Respect maximum element limit
            if (processedCount >= config.maxElements) {
                logger.warn('ItemForm | Reached maximum element limit, stopping extraction');
                return;
            }

            // Skip disabled elements and elements without names
            if (input.name && !input.disabled) {
                // Handle different input types
                if (input.type === 'checkbox' || input.type === 'radio') {
                    // For checkboxes and radios, only include if checked
                    if (input.checked) {
                        extractedData[input.name] = input.value || true;
                    }
                } else if (input.type === 'number') {
                    // Convert number inputs to numbers
                    const numberValue = parseFloat(input.value);
                    extractedData[input.name] = isNaN(numberValue) ? input.value : numberValue;
                } else {
                    // Regular text inputs, selects, textareas
                    extractedData[input.name] = input.value;
                }
                processedCount++;
            }
        });

        logger.debug('ItemForm | Manual extraction result:', {
            inputCount: inputs.length,
            processedCount,
            extractedKeys: Object.keys(extractedData)
        });

        return extractedData;
    } catch (error) {
        logger.error('ItemForm | Error in manual form data extraction:', error);
        return {};
    }
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Determine the source of form data
 * 
 * Analyzes the provided form data to determine how it was structured
 * and what extraction method should be used.
 * 
 * @param formData - The form data to analyze
 * @returns The detected form data source
 */
export function determineFormDataSource(formData: RawFormData): FormDataSource {
    if (!formData) {
        return FormDataSource.FALLBACK;
    }

    // Check for FormDataExtended with .object property
    if (formData && typeof formData === 'object' && 'object' in formData && typeof formData.object === 'object') {
        return FormDataSource.FORM_DATA_EXTENDED;
    }

    // Check for native FormData
    if (formData && typeof formData === 'object' && formData.constructor?.name === 'FormData') {
        return FormDataSource.NATIVE_FORM_DATA;
    }

    // Check for plain object
    if (formData && typeof formData === 'object' && formData.constructor === Object) {
        return FormDataSource.PLAIN_OBJECT;
    }

    // Unknown or invalid format
    return FormDataSource.FALLBACK;
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Create a safe fallback form data object
 * 
 * Creates a safe fallback object when form data extraction fails completely.
 * This prevents complete failure of the form submission process.
 * 
 * @param originalData - The original form data that failed
 * @param errorMessage - The error message that occurred
 * @returns Safe fallback data object
 */
export function createFallbackFormData(
    originalData: RawFormData,
    errorMessage: string
): Record<string, any> {
    logger.warn('ItemForm | Creating fallback form data', { errorMessage });
    
    // Try to extract any usable data from the original
    if (originalData && typeof originalData === 'object') {
        if ('object' in originalData && originalData.object) {
            return originalData.object;
        }
        if (originalData.constructor === Object) {
            return originalData;
        }
    }
    
    // Return minimal safe object
    return {};
}

// Export type-only interfaces for external use
// Note: These are already exported above as part of the interface definitions