/**
 * @fileoverview Trait Item Card Layout Configuration
 * @description Card layout for Trait items using ICLS – new implementation
 * @version 0.1.0
 * @author Avant
 */

import { field, when, filterFields } from '../../shared/helpers';
import type { CardSection } from '../types';
import type { LayoutItemData, TraitSystemData } from '../../shared/types';

/**
 * Generate card layout for Trait items
 *
 * Structure: trait-item container with:
 * - Left: Item icon only (traits are not rollable)
 * - Center: Name, trait preview, description
 * - Right: Edit / Delete buttons
 */
export function getTraitCardLayout(item: any): CardSection {
  const system = item.system as TraitSystemData;

  // Left zone – icon only for consistency with other cards
  const leftFields = [
    field({
      type: 'item-icon',
      name: 'icon',
      img: item.img,
      itemId: item._id,
      class: 'item-icon'
    })
  ];

  // Center zone – main content
  const centerFields = filterFields([
    // Name
    field({
      type: 'trait-name',
      name: 'traitName',
      title: item.name,
      itemId: item._id,
      class: 'trait-name'
    }),

    // Trait preview chip (color + icon)
    when(!!system.color, () =>
      field({
        type: 'trait-preview',
        name: 'preview',
        trait: system,
        itemName: item.name,
        class: 'trait-preview'
      })
    ),

    // Description
    when(!!system.description, () =>
      field({
        type: 'trait-description',
        name: 'description',
        value: system.description,
        class: 'trait-description'
      })
    ),

    // Rarity (text display)
    when(!!system.rarity, () =>
      field({
        type: 'trait-rarity',
        name: 'rarity',
        value: system.rarity,
        class: 'trait-rarity'
      })
    )
  ]);

  // Right zone – edit / delete
  const rightFields = [
    field({
      type: 'trait-edit-button',
      name: 'editItem',
      itemId: item._id,
      itemName: item.name,
      class: 'row-edit'
    }),
    field({
      type: 'trait-delete-button',
      name: 'deleteItem',
      itemId: item._id,
      itemName: item.name,
      class: 'row-delete'
    })
  ];

  return {
    left: leftFields,
    center: centerFields,
    right: rightFields,
    containerClass: 'trait-item',
    containerData: {
      'data-item-id': item._id,
      'data-item-type': 'trait'
    }
  };
}