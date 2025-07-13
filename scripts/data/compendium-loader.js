#!/usr/bin/env node

/**
 * @fileoverview Compendium Loader - JSON-First Architecture
 * @version 1.3.0 - Phase C Folder Support
 * @description Generic loader supporting both monolithic and split JSON formats with folder metadata
 * @author Avant VTT Team
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CompendiumLoader - Loads and validates JSON compendium sources
 */
export class CompendiumLoader {
  constructor(packsDirectory = null) {
    // Default to project root packs/ directory
    this.packsDirectory = packsDirectory || path.join(__dirname, '../../packs');
    this.loadedData = new Map();
    this.folders = new Map(); // Phase C: Store folder metadata
    this.errors = [];
    this.warnings = [];
    this.validationSummary = {
      totalFiles: 0,
      successfulFiles: 0,
      errorFiles: 0,
      warningFiles: 0
    };
  }

  /**
   * Load all compendium data from the packs directory
   * @returns {Promise<{success: boolean, data: Map, errors: Array}>}
   */
  async loadAll() {
    this.loadedData.clear();
    this.folders.clear(); // Phase C: Clear folder metadata
    this.errors = [];
    this.warnings = [];
    this.validationSummary = {
      totalFiles: 0,
      successfulFiles: 0,
      errorFiles: 0,
      warningFiles: 0
    };

    console.log('🔄 CompendiumLoader: Starting JSON compendium load...');
    console.log(`📁 Packs directory: ${this.packsDirectory}`);

    try {
      // Verify packs directory exists
      if (!fs.existsSync(this.packsDirectory)) {
        throw new Error(`Packs directory not found: ${this.packsDirectory}`);
      }

      // Get all subdirectories (traits, talents, augments, macros)
      const subdirs = fs.readdirSync(this.packsDirectory, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      console.log(`📋 Found compendium types: ${subdirs.join(', ')}`);

      // Load each type
      for (const subdir of subdirs) {
        await this.loadCompendiumType(subdir);
      }

      const totalItems = Array.from(this.loadedData.values())
        .reduce((sum, items) => sum + items.length, 0);

      // Enhanced reporting
      this.printValidationSummary();

      if (this.errors.length > 0) {
        console.warn(`⚠️ CompendiumLoader: Loaded ${totalItems} items with ${this.errors.length} errors and ${this.warnings.length} warnings`);
        return {
          success: false,
          data: this.loadedData,
          folders: this.folders, // Phase C: Include folder metadata
          errors: this.errors,
          warnings: this.warnings,
          summary: this.validationSummary
        };
      }

      console.log(`✅ CompendiumLoader: Successfully loaded ${totalItems} items with ${this.warnings.length} warnings`);
      return {
        success: true,
        data: this.loadedData,
        folders: this.folders, // Phase C: Include folder metadata
        errors: [],
        warnings: this.warnings,
        summary: this.validationSummary
      };

    } catch (error) {
      const errorMessage = `Failed to load compendium data: ${error.message}`;
      this.errors.push(errorMessage);
      console.error(`❌ CompendiumLoader: ${errorMessage}`);
      return { success: false, data: this.loadedData, folders: this.folders, errors: this.errors };
    }
  }

  /**
   * Load all JSON files from a specific compendium type directory
   * Supports both monolithic arrays and individual file formats (Phase B)
   * Also loads folder metadata (Phase C)
   * @param {string} typeName - The compendium type (traits, talents, etc.)
   */
  async loadCompendiumType(typeName) {
    const typeDir = path.join(this.packsDirectory, typeName);

    try {
      // Phase C: Load folder metadata first
      await this.loadFolderMetadata(typeName, typeDir);
      // Get all JSON files in the directory (excluding metadata files)
      const files = fs.readdirSync(typeDir)
        .filter(file => file.endsWith('.json'))
        .filter(file => !file.startsWith('_')) // Skip _folders.json etc. (Phase C support)
        .sort(); // Sort for consistent ordering

      console.log(`📄 Loading ${typeName}: ${files.length} JSON files`);

      const items = [];

      for (const file of files) {
        const filePath = path.join(typeDir, file);
        this.validationSummary.totalFiles++;

        try {
          const loadedItems = await this.loadJsonFile(filePath, typeName);
          if (loadedItems) {
            // Handle both single items and arrays (hybrid support)
            if (Array.isArray(loadedItems)) {
              // Monolithic format: array of items
              items.push(...loadedItems);
              this.validationSummary.successfulFiles++;
              console.log(`  ✅ Loaded: ${file} (${loadedItems.length} items from monolithic file)`);
            } else {
              // Split format: single item per file
              items.push(loadedItems);
              this.validationSummary.successfulFiles++;
              console.log(`  ✅ Loaded: ${file} (${loadedItems.name})`);
            }
          }
        } catch (error) {
          this.validationSummary.errorFiles++;
          const errorMessage = `Error loading ${file}: ${error.message}`;
          this.errors.push(errorMessage);
          console.error(`  ❌ ${errorMessage}`);

          // Add detailed error context for debugging
          this.errors.push(`    📍 File: ${filePath}`);
          this.errors.push(`    🔍 Error Type: ${error.name || 'Unknown'}`);
        }
      }

      // Store loaded items for this type
      this.loadedData.set(typeName, items);
      console.log(`📦 ${typeName}: ${items.length} items loaded successfully`);

    } catch (error) {
      const errorMessage = `Failed to read directory ${typeDir}: ${error.message}`;
      this.errors.push(errorMessage);
      console.error(`❌ ${errorMessage}`);
    }
  }

  /**
   * Load folder metadata for a compendium type (Phase C)
   * @param {string} typeName - The compendium type (traits, talents, etc.)
   * @param {string} typeDir - Directory path for the type
   */
  async loadFolderMetadata(typeName, typeDir) {
    const foldersPath = path.join(typeDir, '_folders.json');

    try {
      if (fs.existsSync(foldersPath)) {
        const folderContent = fs.readFileSync(foldersPath, 'utf8');
        const folders = JSON.parse(folderContent);

        if (Array.isArray(folders)) {
          this.folders.set(typeName, folders);
          console.log(`📁 Loaded ${folders.length} folder(s) for ${typeName}`);
        } else {
          this.addWarning(`Invalid _folders.json format for ${typeName}: expected array`);
        }
      } else {
        console.log(`📁 No folder metadata found for ${typeName} (using flat structure)`);
        this.folders.set(typeName, []);
      }
    } catch (error) {
      this.addWarning(`Failed to load folder metadata for ${typeName}: ${error.message}`);
      this.folders.set(typeName, []);
    }
  }

  /**
   * Load and validate a single JSON file
   * @param {string} filePath - Path to the JSON file
   * @param {string} expectedType - Expected compendium type
   * @returns {Promise<Object|null>} Parsed and validated item data
   */
  async loadJsonFile(filePath, expectedType) {
    const fileName = path.basename(filePath);

    try {
      // Check file size (warn if unusually large)
      const stats = fs.statSync(filePath);
      if (stats.size > 50000) { // 50KB threshold
        this.addWarning(`Large file detected: ${fileName} (${Math.round(stats.size / 1024)}KB)`);
      }

      // Read and parse JSON
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Check for empty files
      if (!fileContent.trim()) {
        throw new Error(`Empty file: ${fileName}`);
      }

      const itemData = JSON.parse(fileContent);

      // Handle both array and single document formats
      if (Array.isArray(itemData)) {
        // Array format: validate each item in the array
        for (let i = 0; i < itemData.length; i++) {
          const item = itemData[i];
          const itemContext = `${fileName}[${i}]`;

          // Enhanced validation for each item
          this.validateItemStructure(item, filePath, expectedType, itemContext);
          this.performSemanticValidation(item, itemContext, expectedType);
        }
      } else {
        // Single item format: validate the single item
        this.validateItemStructure(itemData, filePath, expectedType);
        this.performSemanticValidation(itemData, fileName, expectedType);
      }

      return itemData;

    } catch (error) {
      if (error.name === 'SyntaxError') {
        throw new Error(`Invalid JSON syntax in ${fileName}: ${error.message}`);
      } else if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${fileName}`);
      } else if (error.code === 'EACCES') {
        throw new Error(`Permission denied reading: ${fileName}`);
      }
      throw error;
    }
  }

  /**
   * Validate basic item structure
   * @param {Object} item - Item data to validate
   * @param {string} filePath - File path for error reporting
   * @param {string} expectedType - Expected compendium type
   * @param {string} itemContext - Optional context for error reporting (e.g., "file.json[0]")
   */
  validateItemStructure(item, filePath, expectedType, itemContext = null) {
    const fileName = itemContext || path.basename(filePath);

    // Required fields for all items (except macros don't have 'system')
    const baseRequiredFields = ['name', 'type'];
    for (const field of baseRequiredFields) {
      if (!item[field]) {
        throw new Error(`Missing required field '${field}' in ${fileName}`);
      }
    }

    // Non-macro items require 'system' field
    const expectedItemType = this.getExpectedItemType(expectedType);
    if (expectedItemType !== 'script' && !item.system) {
      throw new Error(`Missing required field 'system' in ${fileName}`);
    }

    // Validate type consistency  
    if (item.type !== expectedItemType) {
      throw new Error(`Type mismatch in ${fileName}: expected '${expectedItemType}', got '${item.type}'`);
    }

    // Type-specific validation
    this.validateTypeSpecificFields(item, fileName, expectedType);
  }

  /**
   * Get expected item type from directory name
   * @param {string} dirName - Directory name (traits, talents, etc.)
   * @returns {string} Expected item type
   */
  getExpectedItemType(dirName) {
    const typeMap = {
      'traits': 'trait',
      'talents': 'talent',
      'augments': 'augment',
      'macros': 'script'
    };
    return typeMap[dirName] || dirName.slice(0, -1); // Remove 's' as fallback
  }

  /**
   * Validate type-specific required fields
   * @param {Object} item - Item data
   * @param {string} fileName - File name for error reporting
   * @param {string} compendiumType - Compendium type
   */
  validateTypeSpecificFields(item, fileName, compendiumType) {
    switch (compendiumType) {
      case 'traits':
        this.validateTraitFields(item, fileName);
        break;
      case 'talents':
      case 'augments':
        this.validateTalentAugmentFields(item, fileName);
        break;
      case 'macros':
        this.validateMacroFields(item, fileName);
        break;
    }
  }

  /**
   * Validate trait-specific fields
   */
  validateTraitFields(item, fileName) {
    const required = ['color', 'icon'];
    for (const field of required) {
      if (!item.system[field]) {
        throw new Error(`Missing required trait field 'system.${field}' in ${fileName}`);
      }
    }

    // Description is optional for Phase 2 traits
    if (item.system.description !== undefined && typeof item.system.description !== 'string') {
      throw new Error(`Invalid trait field 'system.description' in ${fileName}: must be a string`);
    }

    // Validate color format (hex color)
    if (!/^#[0-9A-Fa-f]{6}$/.test(item.system.color)) {
      throw new Error(`Invalid color format in ${fileName}: expected hex color like #FF6B6B`);
    }
  }

  /**
   * Validate talent/augment-specific fields
   */
  validateTalentAugmentFields(item, fileName) {
    const required = ['description'];
    for (const field of required) {
      if (!item.system[field]) {
        throw new Error(`Missing required field 'system.${field}' in ${fileName}`);
      }
    }

    // Validate traits array if present
    if (item.system.traits && !Array.isArray(item.system.traits)) {
      throw new Error(`Field 'system.traits' must be an array in ${fileName}`);
    }
  }

  /**
   * Validate macro-specific fields
   */
  validateMacroFields(item, fileName) {
    if (!item.command) {
      throw new Error(`Missing required field 'command' in ${fileName}`);
    }
  }

  /**
   * Get all items of a specific type
   * @param {string} typeName - Type name (traits, talents, etc.)
   * @returns {Array} Array of items
   */
  getItemsByType(typeName) {
    return this.loadedData.get(typeName) || [];
  }

  /**
   * Get folder metadata for a specific type (Phase C)
   * @param {string} typeName - Type name (traits, talents, etc.)
   * @returns {Array} Array of folder metadata
   */
  getFoldersByType(typeName) {
    return this.folders.get(typeName) || [];
  }

  /**
   * Get all loaded items as a flat array
   * @returns {Array} All items
   */
  getAllItems() {
    const allItems = [];
    for (const items of this.loadedData.values()) {
      allItems.push(...items);
    }
    return allItems;
  }

  /**
   * Get loading statistics
   * @returns {Object} Loading statistics
   */
  getStats() {
    const stats = {
      totalTypes: this.loadedData.size,
      totalItems: 0,
      totalFolders: 0, // Phase C: Include folder count
      itemsByType: {},
      foldersByType: {}, // Phase C: Include folder breakdown
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      validationSummary: this.validationSummary
    };

    for (const [type, items] of this.loadedData.entries()) {
      stats.itemsByType[type] = items.length;
      stats.totalItems += items.length;
    }

    // Phase C: Add folder statistics
    for (const [type, folders] of this.folders.entries()) {
      stats.foldersByType[type] = folders.length;
      stats.totalFolders += folders.length;
    }

    return stats;
  }

  /**
   * Add a warning message
   * @param {string} message - Warning message
   */
  addWarning(message) {
    this.warnings.push(message);
    this.validationSummary.warningFiles++;
    console.warn(`⚠️ Warning: ${message}`);
  }

  /**
   * Perform semantic validation on item data
   * @param {Object} item - Item data
   * @param {string} fileName - File name for error reporting
   * @param {string} expectedType - Expected compendium type
   */
  performSemanticValidation(item, fileName, expectedType) {
    // Check for reasonable field lengths
    if (item.name && item.name.length > 100) {
      this.addWarning(`Long name in ${fileName}: "${item.name.substring(0, 50)}..."`);
    }

    // Check for missing descriptions
    if (expectedType !== 'macros' && item.system && !item.system.description) {
      this.addWarning(`Missing description in ${fileName}`);
    }

    // Type-specific semantic validation
    switch (expectedType) {
      case 'traits':
        this.validateTraitSemantics(item, fileName);
        break;
      case 'talents':
      case 'augments':
        this.validateTalentAugmentSemantics(item, fileName);
        break;
      case 'macros':
        this.validateMacroSemantics(item, fileName);
        break;
    }
  }

  /**
   * Validate trait semantic correctness
   */
  validateTraitSemantics(item, fileName) {
    if (item.system.description && item.system.description.length < 10) {
      this.addWarning(`Very short description in trait ${fileName}`);
    }

    // Check for common icon paths
    if (item.system.icon && !item.system.icon.includes('/')) {
      this.addWarning(`Icon path may be incomplete in ${fileName}: ${item.system.icon}`);
    }
  }

  /**
   * Validate talent/augment semantic correctness
   */
  validateTalentAugmentSemantics(item, fileName) {
    if (item.system.description && item.system.description.length < 20) {
      this.addWarning(`Very short description in ${fileName}`);
    }

    // Check traits array
    if (item.system.traits && item.system.traits.length === 0) {
      this.addWarning(`Empty traits array in ${fileName}`);
    }

    // Check for power point costs
    if (item.system.powerPointCost && (item.system.powerPointCost < 0 || item.system.powerPointCost > 20)) {
      this.addWarning(`Unusual power point cost in ${fileName}: ${item.system.powerPointCost}`);
    }
  }

  /**
   * Validate macro semantic correctness
   */
  validateMacroSemantics(item, fileName) {
    if (item.command && item.command.length < 50) {
      this.addWarning(`Very short macro command in ${fileName}`);
    }

    // Check for potential security issues (basic check)
    if (item.command && item.command.includes('eval(')) {
      this.addWarning(`Potential security concern: eval() found in ${fileName}`);
    }

    // Check scope
    if (item.scope && !['global', 'actor', 'chat'].includes(item.scope)) {
      this.addWarning(`Unusual scope in ${fileName}: ${item.scope}`);
    }
  }

  /**
   * Print a comprehensive validation summary
   */
  printValidationSummary() {
    console.log('\n📊 Validation Summary:');
    console.log(`   📁 Total Files: ${this.validationSummary.totalFiles}`);
    console.log(`   ✅ Successful: ${this.validationSummary.successfulFiles}`);
    console.log(`   ❌ Errors: ${this.validationSummary.errorFiles}`);
    console.log(`   ⚠️  Warnings: ${this.validationSummary.warningFiles}`);

    const successRate = this.validationSummary.totalFiles > 0
      ? Math.round((this.validationSummary.successfulFiles / this.validationSummary.totalFiles) * 100)
      : 0;
    console.log(`   📈 Success Rate: ${successRate}%`);

    // Print error details if any
    if (this.errors.length > 0) {
      console.log('\n❌ Error Details:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Print warning details if any
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warning Details:');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    console.log(''); // Empty line for spacing
  }
}

export default CompendiumLoader;