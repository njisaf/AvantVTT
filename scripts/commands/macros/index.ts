/**
 * @fileoverview Macros Index
 * @version 1.0.0
 * @description Central export point for all macro commands
 * @author Avant VTT Team
 */

import type { MacroCommand, MacroSeed } from '../base/types';
import { createCustomTraitMacro } from './create-custom-trait';
import { exportCustomTraitsMacro } from './export-custom-traits';
import { importTraitsMacro } from './import-traits';

/**
 * All available macro commands
 * Add new macros to this array for automatic registration
 */
export const macroCommands: MacroCommand[] = [
    createCustomTraitMacro,
    exportCustomTraitsMacro,
    importTraitsMacro
    // Add new macro commands here as they are created
];

/**
 * Get macro command by name
 * 
 * @param name - Macro name to find
 * @returns Macro command or undefined if not found
 */
export function getMacroCommand(name: string): MacroCommand | undefined {
    return macroCommands.find(macro => macro.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get all macro command names
 * 
 * @returns Array of macro names
 */
export function getMacroCommandNames(): string[] {
    return macroCommands.map(macro => macro.name);
}

/**
 * Convert all macros to seeds for build process
 * 
 * @returns Array of macro seeds ready for compendium generation
 */
export function getMacroSeeds(): MacroSeed[] {
    const timestamp = Date.now();
    
    return macroCommands.map((macro, index) => {
        // Generate unique ID for each macro
        const id = `macro_${macro.name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}_${index}`;
        
        return {
            id,
            name: macro.name,
            type: macro.type,
            scope: macro.scope || 'global',
            command: macro.command,
            img: macro.img || 'icons/svg/dice-target.svg',
            folder: null,
            sort: macro.sort || (index * 100),
            ownership: { default: 3 }, // Accessible to all by default
            flags: macro.flags || {}
        };
    });
}

/**
 * Export individual macros for direct import
 */
export { createCustomTraitMacro } from './create-custom-trait';
export { exportCustomTraitsMacro } from './export-custom-traits';
export { importTraitsMacro } from './import-traits';

/**
 * Export macro count for reporting
 */
export const macroCommandCount = macroCommands.length; 