/**
 * @fileoverview Import Augments Macro
 * @version 1.0.0 - Phase 2: Macro Utilities
 * @description Import augments from JSON files with file dialog interface
 * @author Avant VTT Team
 */

import type { MacroCommand } from '../base/types';

/**
 * Import Augments macro command
 */
export const importAugmentsMacro: MacroCommand = {
    name: 'Import Avant Augments',
    type: 'script',
    scope: 'global',
    command: `console.log("🔄 Starting augment import process...");`,
    img: 'icons/svg/upgrade.svg',
    sort: 102,
    flags: {
        avant: {
            description: 'Import augments from JSON file to actor inventory',
            version: '1.0.0',
            category: 'augment-management'
        }
    }
};

export default importAugmentsMacro; 