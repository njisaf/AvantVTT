/**
 * @fileoverview Core Result Types
 * @description Generic success/failure pattern types for error handling
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Generic result type that represents either success with a value or failure with an error.
 * This is used throughout the system for operations that can fail gracefully.
 * 
 * @template T - The type of the success value
 * @template E - The type of the error value
 * 
 * @example
 * ```typescript
 * // Function that might fail
 * function parseNumber(input: string): Result<number, string> {
 *   const num = parseFloat(input);
 *   if (isNaN(num)) {
 *     return { success: false, error: 'Invalid number format' };
 *   }
 *   return { success: true, value: num };
 * }
 * 
 * // Using the result
 * const result = parseNumber("42");
 * if (result.success) {
 *   console.log("Number:", result.value); // TypeScript knows this is a number
 * } else {
 *   console.log("Error:", result.error); // TypeScript knows this is a string
 * }
 * ```
 */
export type Result<T, E> = 
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Helper function to create a successful result.
 * Makes code more readable when creating success results.
 * 
 * @param value - The success value
 * @returns A successful result containing the value
 */
export function success<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * Helper function to create a failed result.
 * Makes code more readable when creating error results.
 * 
 * @param error - The error value
 * @returns A failed result containing the error
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard to check if a result is successful.
 * Narrows the TypeScript type so you can safely access the value.
 * 
 * @param result - The result to check
 * @returns True if the result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success;
}

/**
 * Type guard to check if a result is a failure.
 * Narrows the TypeScript type so you can safely access the error.
 * 
 * @param result - The result to check
 * @returns True if the result is a failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
} 