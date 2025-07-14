#!/usr/bin/env node

/**
 * @fileoverview Compendium Integration - Phase 3 Enhanced Logging
 * @description Shows how CompendiumLoader integrates with existing build system
 * @author Avant VTT Team
 */

import { CompendiumLoader } from './compendium-loader.js';

// Environment-based logging configuration
const DEBUG_MODE = process.env.AVANT_DEBUG === 'true' || process.env.NODE_ENV === 'development';
const LOG_LEVEL = process.env.AVANT_LOG_LEVEL || 'info'; // error, warn, info, debug

/**
 * Enhanced logger with multiple levels and debugging support
 */
class CompendiumLogger {
  constructor(component = 'CompendiumIntegration') {
    this.component = component;
    this.levels = {
      error: 0,
      warn: 1, 
      info: 2,
      debug: 3
    };
    this.currentLevel = this.levels[LOG_LEVEL] || this.levels.info;
  }

  _shouldLog(level) {
    return this.levels[level] <= this.currentLevel;
  }

  _formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍'
    }[level] || 'ℹ️';

    let formatted = `${prefix} [${timestamp}] ${this.component}: ${message}`;
    
    if (data && DEBUG_MODE) {
      formatted += `\n   📊 Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    return formatted;
  }

  error(message, data = null) {
    if (this._shouldLog('error')) {
      console.error(this._formatMessage('error', message, data));
    }
  }

  warn(message, data = null) {
    if (this._shouldLog('warn')) {
      console.warn(this._formatMessage('warn', message, data));
    }
  }

  info(message, data = null) {
    if (this._shouldLog('info')) {
      console.log(this._formatMessage('info', message, data));
    }
  }

  debug(message, data = null) {
    if (this._shouldLog('debug')) {
      console.log(this._formatMessage('debug', message, data));
    }
  }

  performance(label, operation) {
    if (!this._shouldLog('debug')) return operation;
    
    console.time(`⏱️ ${this.component}: ${label}`);
    const result = operation();
    console.timeEnd(`⏱️ ${this.component}: ${label}`);
    return result;
  }

  async performanceAsync(label, operation) {
    if (!this._shouldLog('debug')) return await operation();
    
    console.time(`⏱️ ${this.component}: ${label}`);
    const result = await operation();
    console.timeEnd(`⏱️ ${this.component}: ${label}`);
    return result;
  }
}

const logger = new CompendiumLogger();

/**
 * Load compendium data using the new JSON-first approach
 * This function can replace the hard-coded seed arrays in build-packs.js
 * 
 * @returns {Promise<{traits: Array, talents: Array, augments: Array, macros: Array}>}
 */
export async function loadCompendiumData() {
  return await logger.performanceAsync('JSON Compendium Load', async () => {
    logger.debug('Initializing CompendiumLoader...');
    const loader = new CompendiumLoader();
    
    logger.info('Starting compendium data load...');
    const result = await loader.loadAll();
    
    // Enhanced logging with detailed statistics
    const stats = loader.getStats();
    logger.debug('Load statistics', stats);
    
    if (!result.success) {
      logger.error('Failed to load compendium data', {
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        errors: result.errors.slice(0, 5) // Limit to first 5 errors for readability
      });
      throw new Error(`Failed to load compendium data: ${result.errors.join(', ')}`);
    }
    
    // Log successful load with details
    logger.info('Successfully loaded compendium data', {
      totalItems: stats.totalItems,
      itemsByType: stats.itemsByType,
      warningCount: stats.warningCount
    });
    
    if (result.warnings.length > 0) {
      logger.warn(`Load completed with ${result.warnings.length} warnings`);
      logger.debug('Warning details', result.warnings.slice(0, 10));
    }
    
    // Return data in the format expected by existing build system
    const data = {
      traits: loader.getItemsByType('traits'),
      talents: loader.getItemsByType('talents'),
      augments: loader.getItemsByType('augments'),
      macros: loader.getItemsByType('macros')
    };
    
    logger.debug('Returning formatted data structure', {
      traits: data.traits.length,
      talents: data.talents.length,
      augments: data.augments.length,
      macros: data.macros.length
    });
    
    return data;
  });
}

/**
 * Get fallback seed data for backward compatibility
 * This ensures the build system works even if JSON files aren't ready
 */
export function getFallbackSeedData() {
  logger.warn('Using fallback seed data - JSON files not available');
  logger.debug('Fallback triggered - check JSON file availability and permissions');
  
  return {
    traits: [
      {
        name: "Fire",
        type: "trait",
        system: {
          color: "#FF6B6B",
          icon: "fas fa-fire",
          localKey: "AVANT.Trait.Fire",
          description: "Represents fire-based abilities, damage types, or elemental affinities",
          category: "general",
          isActive: false,
          powerPointCost: 0,
          uses: { value: 0, max: 0 }
        },
        img: "icons/svg/item-bag.svg",
        sort: 100
      }
    ],
    talents: [],
    augments: [],
    macros: []
  };
}

/**
 * Hybrid loader that tries JSON first, falls back to hardcoded data
 * This provides a safe migration path for Phase 1
 */
export async function loadCompendiumDataWithFallback() {
  return await logger.performanceAsync('Compendium Load with Fallback', async () => {
    try {
      logger.info('Attempting to load from JSON files...');
      const data = await loadCompendiumData();
      logger.info('Successfully loaded from JSON files');
      return data;
    } catch (error) {
      logger.error('JSON loading failed, falling back to hardcoded data', {
        errorMessage: error.message,
        errorStack: DEBUG_MODE ? error.stack : undefined
      });
      
      logger.info('Falling back to hardcoded seed data...');
      const fallbackData = getFallbackSeedData();
      
      logger.warn('Operating in fallback mode - some features may be limited', {
        fallbackItems: {
          traits: fallbackData.traits.length,
          talents: fallbackData.talents.length,
          augments: fallbackData.augments.length,
          macros: fallbackData.macros.length
        }
      });
      
      return fallbackData;
    }
  });
}

/**
 * Integration example for build-packs.js
 * Shows how to replace the existing TRAIT_SEEDS, TALENT_SEEDS arrays
 */
export async function demonstrateIntegration() {
  console.log('🔧 CompendiumLoader Integration Demo\n');
  
  // This is what build-packs.js would call instead of using hardcoded arrays
  const data = await loadCompendiumDataWithFallback();
  
  console.log('📦 Loaded compendium data:');
  console.log(`  Traits: ${data.traits.length} items`);
  console.log(`  Talents: ${data.talents.length} items`);
  console.log(`  Augments: ${data.augments.length} items`);
  console.log(`  Macros: ${data.macros.length} items`);
  
  // Show how this data would be used (same as existing build-packs.js)
  console.log('\n🔨 Integration points for build-packs.js:');
  console.log('  // Replace this:');
  console.log('  // const TRAIT_SEEDS = [hardcoded array];');
  console.log('  // const TALENT_SEEDS = [hardcoded array];');
  console.log('');
  console.log('  // With this:');
  console.log('  const { traits: TRAIT_SEEDS, talents: TALENT_SEEDS,');
  console.log('          augments: AUGMENT_SEEDS, macros: MACRO_SEEDS } = ');
  console.log('    await loadCompendiumDataWithFallback();');
  
  return data;
}

/**
 * Enable debug mode for detailed logging
 * Usage: setDebugMode(true) or process.env.AVANT_DEBUG=true
 */
export function setDebugMode(enabled) {
  logger.currentLevel = enabled ? logger.levels.debug : logger.levels.info;
  logger.info(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Get comprehensive diagnostic information
 * Useful for troubleshooting and support
 */
export async function getDiagnostics() {
  logger.info('Collecting diagnostic information...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      debugMode: DEBUG_MODE,
      logLevel: LOG_LEVEL
    },
    configuration: {
      packsDirectory: null,
      compendiumStatus: 'unknown'
    },
    performance: {},
    lastLoadResult: null
  };

  try {
    // Test compendium loading
    const startTime = Date.now();
    const loader = new CompendiumLoader();
    const result = await loader.loadAll();
    const loadTime = Date.now() - startTime;
    
    diagnostics.configuration.packsDirectory = loader.packsDirectory;
    diagnostics.configuration.compendiumStatus = result.success ? 'healthy' : 'degraded';
    diagnostics.performance.loadTimeMs = loadTime;
    diagnostics.lastLoadResult = {
      success: result.success,
      stats: loader.getStats(),
      errorCount: result.errors?.length || 0,
      warningCount: result.warnings?.length || 0
    };
    
    logger.info('Diagnostics collected successfully');
    
  } catch (error) {
    diagnostics.configuration.compendiumStatus = 'failed';
    diagnostics.lastLoadResult = {
      error: error.message,
      stack: DEBUG_MODE ? error.stack : undefined
    };
    
    logger.warn('Error during diagnostics collection', error);
  }
  
  return diagnostics;
}

/**
 * Validate system health and report any issues
 */
export async function validateSystemHealth() {
  logger.info('Running system health validation...');
  
  const issues = [];
  const warnings = [];
  
  try {
    // Test basic loading
    const loader = new CompendiumLoader();
    const result = await loader.loadAll();
    
    if (!result.success) {
      issues.push(`Compendium loading failed: ${result.errors?.[0] || 'Unknown error'}`);
    }
    
    const stats = loader.getStats();
    
    // Check for minimum content requirements
    if (stats.itemsByType.traits < 20) {
      warnings.push(`Low trait count: ${stats.itemsByType.traits} (recommended: ≥20)`);
    }
    
    if (stats.itemsByType.talents < 15) {
      warnings.push(`Low talent count: ${stats.itemsByType.talents} (recommended: ≥15)`);
    }
    
    if (stats.itemsByType.augments < 15) {
      warnings.push(`Low augment count: ${stats.itemsByType.augments} (recommended: ≥15)`);
    }
    
    if (stats.itemsByType.macros < 10) {
      warnings.push(`Low macro count: ${stats.itemsByType.macros} (recommended: ≥10)`);
    }
    
    // Check error/warning ratios
    const errorRate = stats.errorCount / stats.totalItems;
    if (errorRate > 0.1) { // More than 10% error rate
      issues.push(`High error rate: ${Math.round(errorRate * 100)}%`);
    }
    
    logger.info(`Health validation complete: ${issues.length} issues, ${warnings.length} warnings`);
    
    return {
      healthy: issues.length === 0,
      issues,
      warnings,
      stats
    };
    
  } catch (error) {
    logger.error('Health validation failed', error);
    return {
      healthy: false,
      issues: [`System validation failed: ${error.message}`],
      warnings: [],
      stats: null
    };
  }
}

export default {
  loadCompendiumData,
  loadCompendiumDataWithFallback,
  demonstrateIntegration,
  setDebugMode,
  getDiagnostics,
  validateSystemHealth,
  CompendiumLogger
};