/**
 * @fileoverview Core type definitions barrel exports
 * @description Central exports for all core utility types
 * @author Avant VTT Team
 * @version 1.0.0
 */

// Export initialization types
export type {
    InitializationPhase,
    ServiceStatus,
    ServiceOptions,
    ServiceConfiguration,
    InitializationResult,
    InitializationError,
    InitializationStatusReport,
    ServiceStatusInfo,
    RequiresServicesOptions,
    ServiceInitializer,
    DependencyGraph,
    ServiceRegistry
} from './initialization.js';

export {
    isStandardPhase,
    isServiceAvailable,
    isServiceFailed
} from './initialization.js';

// Export dice types (if they exist)
// export type { DiceRoll, DiceResult } from './dice.js';

// Export validation types (if they exist)
// export type { ValidationError, ValidationResult } from './validation.js';

// Re-export all result pattern types  
export type {
  Result
} from './result';

export {
  success,
  failure,
  isSuccess,
  isFailure
} from './result';

// Re-export all dice types
export type {
  DieResult,
  DiceRollResult,
  RollConfig,
  RerollData
} from './dice'; 