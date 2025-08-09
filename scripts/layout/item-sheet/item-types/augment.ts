/**
 * @fileoverview Augment Item Layout Definition
 * @description Declarative layout for augment item sheets
 * @version 1.0.0
 * @author Avant Development Team
 */

import { field, when, fullWidth, sideBy, filterFields, commonFields } from '../../shared/helpers';
import type { Field } from '../../shared/types';
import type { LayoutItemData, AugmentSystemData } from '../../shared/types';
import { formatTalentAP, getActionIcon } from '../../../utils/formatTalentAP';

/**
 * Custom field for action display
 */
function actionDisplayField(action: any, itemType: string): Field | null {
  // Handle undefined action (e.g., for new items)
  if (!action) {
    return {
      type: 'text',
      name: 'system.action.display',
      value: 'AP: — (set later)',
      label: 'Action',
      readonly: true,
      class: `${itemType}-action-display muted`
    };
  }
  
  const apString = formatTalentAP(action);
  const iconClass = getActionIcon(action);
  
  return {
    type: 'text',
    name: 'system.action.display',
    value: apString,
    label: 'Action',
    icon: iconClass,
    readonly: true,
    class: `${itemType}-action-display`
  };
}

/**
 * Header layout for augment items
 * Image and name side-by-side, then AP cost and PP cost
 */
export function header(item: LayoutItemData): Field[] {
    const system = item.system as AugmentSystemData;

    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'augment'),
            commonFields.name(item.name, 'augment')
        )
    ]);
}

/**
 * Body layout for augment items
 * Order: AP cost, PP cost, description, level requirement, requirements, active status, rarity, type, traits
 */
export function body(item: LayoutItemData): Field[] {
    const system = item.system as AugmentSystemData;

    return filterFields([
        // 1. Meta fields first
        sideBy(
            actionDisplayField(system.action, 'augment'),
            commonFields.ppCost(system.ppCost, 'augment'),
        ),

        commonFields.requirements(system.requirements, 'augment'),
        commonFields.description(system.description, 'augment'),

        // 3. Level and requirements
        commonFields.levelRequirement(system.levelRequirement, 'augment'),

        // 4. Active status
        // when(system.isActive !== undefined, () => field({
        //     type: 'checkbox',
        //     name: 'system.isActive',
        //     checked: system.isActive || false,
        //     label: 'Active',
        //     hint: 'Whether this augment is currently active',
        //     class: 'augment-active'
        // })),

        // // 5. Rarity selection
        // when(system.rarity !== undefined, () => field({
        //     type: 'select',
        //     name: 'system.rarity',
        //     value: system.rarity || 'common',
        //     label: 'Rarity',
        //     options: [
        //         { value: 'common', label: 'Common' },
        //         { value: 'uncommon', label: 'Uncommon' },
        //         { value: 'rare', label: 'Rare' },
        //         { value: 'legendary', label: 'Legendary' }
        //     ],
        //     hint: 'How rare this augment is',
        //     class: 'augment-rarity'
        // })),

        // 6. Augment type selection
        when(system.augmentType !== undefined, () => field({
            type: 'select',
            name: 'system.augmentType',
            value: system.augmentType || 'enhancement',
            label: 'Augment Type',
            options: [
                { value: 'enhancement', label: 'Enhancement' },
                { value: 'cybernetic', label: 'Cybernetic' },
                { value: 'biological', label: 'Biological' },
                { value: 'neural', label: 'Neural' }
            ],
            hint: 'Type of augmentation technology',
            class: 'augment-type'
        })),

        commonFields.traits(system.traits, 'augment')
    ]);
}