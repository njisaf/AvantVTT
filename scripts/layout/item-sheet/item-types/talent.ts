/**
 * @fileoverview Talent Item Layout Definition
 * @description Declarative layout for talent item sheets
 * @version 1.0.0
 * @author Avant Development Team
 */

import { sideBy, filterFields, commonFields } from '../../shared/helpers';
import type { Field } from '../../shared/types';
import type { LayoutItemData, TalentSystemData } from '../../shared/types';
import { formatAPLabel, getAPIcon, getAPTooltip } from '../../shared/apDisplay';
import type { TalentAction } from '../../../types/domain/talent';

/**
 * Creates a read-only action field for displaying talent action information
 *
 * @param action - The talent action object
 * @param itemType - The item type (should be 'talent')
 * @returns Field object for the action display
 */
function actionField(action: TalentAction | undefined, itemType: string): Field | null {
  const label = formatAPLabel(action as any);
  const iconClass = getAPIcon(action as any);
  const tooltip = getAPTooltip(action as any);

  // Normalize numeric sources for icon dots
  const cost = typeof action?.cost === 'number' ? action.cost : null;
  const minCost = typeof (action as any)?.minCost === 'number' ? (action as any).minCost : null;
  const maxCost = typeof (action as any)?.maxCost === 'number' ? (action as any).maxCost : null;

  // Return the specialized read-only display field handled by the template
  return {
    type: 'talent-action-display',
    name: 'system.action.display',
    value: label,
    label: 'Action',
    tooltip,
    icon: iconClass,
    mode: action?.mode || 'immediate',
    cost,
    minCost,
    maxCost,
    readonly: true,
    class: `${itemType}-action-display`
  };
}

/**
 * Header layout for talent items
 * Image and name side-by-side
 */
export function header(item: LayoutItemData): Field[] {
    const system = item.system as TalentSystemData;

    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'talent'),
            commonFields.name(item.name, 'talent')
        )
    ]);
}

/**
 * Body layout for talent items
 * Order: Action display, description, level requirement, requirements, traits
 */
export function body(item: LayoutItemData): Field[] {
    const system = item.system as TalentSystemData;

    // Debug snapshot for AP sheet rendering
    try {
        // Avoid circular/huge logs by picking the essentials
        console.log('[AP SHEET] action and item snapshot', {
            itemId: (item as any)?._id,
            name: item?.name,
            type: item?.type,
            systemAction: (system as any)?.action,
            hasAction: !!(system as any)?.action,
            levelRequirement: (system as any)?.levelRequirement
        });
    } catch (e) {
        console.warn('[AP SHEET] failed to log snapshot', e);
    }

    return filterFields([
        sideBy(
            actionField(system.action, 'talent'),
            commonFields.levelRequirement(system.level || system.levelRequirement, 'talent'),
        ),
        commonFields.requirements(system.requirements, 'talent'),
        commonFields.description(system.description, 'talent'),
        commonFields.traits(system.traits, 'talent')
    ]);
}