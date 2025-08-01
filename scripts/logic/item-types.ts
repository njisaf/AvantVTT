import type { WeaponSystemData, ArmorSystemData, GearSystemData, ItemSystemData } from '../layout/shared/types';

/**
 * A type guard to check if an item's system data can have expertise.
 * @param system The item system data to check.
 * @returns True if the system data can have expertise, false otherwise.
 */
export function
    isExpertiseItem(system: ItemSystemData): system is WeaponSystemData | ArmorSystemData | GearSystemData {
    return 'expertise' in system;
}