/**
 * @fileoverview Type definitions for InitializationManager system
 * @description Provides comprehensive typing for service registration and dependency management
 * @author Avant VTT Team
 * @version 1.0.0
 */

/**
 * Initialization phases for service registration
 */
export type InitializationPhase = 'init' | 'ready' | 'setup' | string;

/**
 * Service status during initialization lifecycle
 */
export type ServiceStatus = 'pending' | 'initializing' | 'ready' | 'failed';

/**
 * Options for service registration
 */
export interface ServiceOptions {
  /** Initialization phase when this service should be initialized */
  phase: InitializationPhase;
  
  /** Whether this service is critical - if false, failure won't stop initialization */
  critical: boolean;
  
  /** Number of retry attempts if initialization fails */
  retries?: number;
  
  /** Timeout in milliseconds for service initialization */
  timeout?: number;
}

/**
 * Complete service configuration after registration
 */
export interface ServiceConfiguration<T = any> {
  /** Unique name of the service */
  name: string;
  
  /** Async function that initializes and returns the service instance */
  initFunction: () => Promise<T>;
  
  /** Array of service names this service depends on */
  dependencies: string[];
  
  /** Service registration options */
  options: ServiceOptions;
  
  /** Current status of the service */
  status: ServiceStatus;
  
  /** Initialized service instance (null until ready) */
  instance: T | null;
  
  /** Last error encountered during initialization */
  error: Error | null;
  
  /** Number of initialization attempts made */
  attempts: number;
}

/**
 * Result of initialization phase execution
 */
export interface InitializationResult {
  /** Whether the phase completed successfully */
  success: boolean;
  
  /** Service instances keyed by service name */
  results: Record<string, any>;
  
  /** Non-critical errors that occurred during initialization */
  errors?: InitializationError[];
  
  /** Critical error message if initialization failed */
  error?: string;
}

/**
 * Error information from failed service initialization
 */
export interface InitializationError {
  /** Name of the service that failed */
  service: string;
  
  /** Phase during which the failure occurred */
  phase: InitializationPhase;
  
  /** Error message */
  error: string;
  
  /** Number of attempts made */
  attempts: number;
}

/**
 * Status report for all registered services
 */
export interface InitializationStatusReport {
  /** Total number of registered services */
  total: number;
  
  /** Number of services in ready state */
  ready: number;
  
  /** Number of services still pending initialization */
  pending: number;
  
  /** Number of services currently initializing */
  initializing: number;
  
  /** Number of services that failed initialization */
  failed: number;
  
  /** Detailed status for each service */
  services: ServiceStatusInfo[];
}

/**
 * Detailed status information for a single service
 */
export interface ServiceStatusInfo {
  /** Service name */
  name: string;
  
  /** Current status */
  status: ServiceStatus;
  
  /** Initialization phase */
  phase: InitializationPhase;
  
  /** Whether service is critical */
  critical: boolean;
  
  /** Number of attempts made */
  attempts: number;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Options for the requiresServices decorator
 */
export interface RequiresServicesOptions {
  /** Timeout in milliseconds for waiting for dependencies */
  timeout?: number;
  
  /** Whether missing dependencies should cause critical failure */
  critical?: boolean;
}

/**
 * Generic type for service initialization functions
 */
export type ServiceInitializer<T = any> = () => Promise<T>;

/**
 * Type for dependency resolution graph
 */
export type DependencyGraph = Map<string, string[]>;

/**
 * Type for service registry
 */
export type ServiceRegistry = Map<string, ServiceConfiguration>;

/**
 * Type guard to check if a phase is a standard initialization phase
 */
export function isStandardPhase(phase: string): phase is 'init' | 'ready' | 'setup' {
  return ['init', 'ready', 'setup'].includes(phase);
}

/**
 * Type guard to check if a status indicates the service is available
 */
export function isServiceAvailable(status: ServiceStatus): status is 'ready' {
  return status === 'ready';
}

/**
 * Type guard to check if a status indicates the service has failed
 */
export function isServiceFailed(status: ServiceStatus): status is 'failed' {
  return status === 'failed';
} 