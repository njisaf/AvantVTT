/**
 * @fileoverview Actor Sheet for Avant Native System
 * @version 2.0.0 - FoundryVTT v13+ Only
 * @author Avant Development Team
 * @description Actor sheet handling for character management with v13-only implementation
 */

import { AvantActorData } from '../data/actor-data.js';
import { logger } from '../utils/logger.js';
import {
    calculateAbilityTotalModifiers,
    calculateSkillTotalModifiers,
    calculateDefenseValues,
    calculateDefenseThreshold,
    calculateRemainingExpertisePoints,
    calculatePowerPointLimit,
    organizeSkillsByAbility,
    organizeItemsByType,
    validateAbilityRollData,
    validateSkillRollData
} from '../logic/actor-sheet.js';
import {
    prepareItemData,
    validatePowerPointUsage,
    prepareWeaponAttackRoll,
    prepareWeaponDamageRoll,
    prepareArmorRoll,
    prepareGenericRoll,
    extractItemIdFromElement,
    formatFlavorText
} from '../logic/actor-sheet-utils.js';

// Import local foundry UI adapter for safe notifications
import { FoundryUI } from '../types/adapters/foundry-ui.ts';

// Access FoundryVTT ActorSheet class - prioritize v13 namespaced class
const ActorSheetBase = (globalThis as any).foundry?.appv1?.sheets?.ActorSheet || 
                       (globalThis as any).ActorSheet ||
                       class {
                           static get defaultOptions() { return {}; }
                           _renderHTML() { throw new Error('ActorSheet base class not available'); }
                           _replaceHTML() { throw new Error('ActorSheet base class not available'); }
                       };

/**
 * Actor Sheet Context interface for template rendering
 */
interface ActorSheetContext {
    actor: any;
    system: any;
    flags: any;
    abilityTotalModifiers: Record<string, number>;
    skillTotalModifiers: Record<string, number>;
    skillsByAbility: Record<string, any[]>;
    items: Record<string, any[]>;
}

/**
 * Actor Sheet for Avant Native System - FoundryVTT v13+
 * @class AvantActorSheet
 * @extends {ActorSheetBase}
 * @description Handles actor sheet functionality including tabs, rolls, and item management
 */
export class AvantActorSheet extends ActorSheetBase {
    /** The actor document associated with this sheet */
    declare actor: any;
    
    /**
     * Define default options for the actor sheet
     * @static
     * @returns Sheet configuration options
     * @override
     */
    static get defaultOptions(): any {
        const foundryUtils = (globalThis as any).foundry?.utils;
        const mergeObject = foundryUtils?.mergeObject || Object.assign;
        
        const options = mergeObject(super.defaultOptions, {
            classes: ["avant", "sheet", "actor"],
            template: "systems/avant/templates/actor-sheet.html",
            width: 900,
            height: 630,
            tabs: [{ 
                navSelector: ".sheet-tabs", 
                contentSelector: ".sheet-body", 
                initial: "core"
            }]
        });
        
        return options;
    }

    /**
     * Override isEditable to ensure proper sheet behavior
     * @returns Whether the sheet is editable
     * @override
     */
    get isEditable(): boolean {
        return (this as any).options?.editable !== false;
    }
    
    /**
     * Allow setting isEditable property for FoundryVTT compatibility
     * @param value - Whether the sheet should be editable
     */
    set isEditable(value: boolean) {
        if (this.options) {
            this.options.editable = value;
        }
    }

    /**
     * Prepare data for rendering the actor sheet
     * @returns The context data for template rendering
     * @override
     */
    getData(): ActorSheetContext {
        const context = super.getData() as any;
        const actorData = this.actor.toObject(false);
        
        // Deep copy system data to avoid modifying original with null safety
        try {
            context.system = actorData.system ? JSON.parse(JSON.stringify(actorData.system)) : {};
        } catch (e) {
            context.system = {};
        }
        context.flags = actorData.flags;
        
        // Ensure system exists
        if (!context.system) {
            context.system = {};
        }
        
        // Extract basic character data
        const level = (context.system && context.system.level) || 1;
        const tier = (context.system && context.system.tier) || 1;
        const abilities = context.system.abilities || {};
        const skills = context.system.skills || {};
        const skillAbilities = AvantActorData.getSkillAbilities() || {};
        
        // Calculate total modifiers using pure functions
        context.abilityTotalModifiers = calculateAbilityTotalModifiers(abilities, level);
        context.skillTotalModifiers = calculateSkillTotalModifiers(skills, abilities, skillAbilities, level);
        
        // Calculate defense values using pure functions
        const defenseValues = calculateDefenseValues(abilities, tier);
        if (!context.system.defense) {
            context.system.defense = {};
        }
        Object.assign(context.system.defense, defenseValues);
        
        // Calculate defense threshold using pure function
        context.system.defenseThreshold = calculateDefenseThreshold(defenseValues);
        
        // Calculate remaining expertise points using pure function
        if (context.system && context.system.expertisePoints) {
            const total = context.system.expertisePoints.total || 0;
            const spent = context.system.expertisePoints.spent || 0;
            context.system.expertisePoints.remaining = calculateRemainingExpertisePoints(total, spent);
        }
        
        // Calculate power point limit using pure function
        if (context.system && context.system.powerPoints) {
            const maxPower = context.system.powerPoints.max || 10;
            context.system.powerPoints.limit = calculatePowerPointLimit(maxPower);
        }
        
        // Organize skills by abilities using pure function
        context.skillsByAbility = organizeSkillsByAbility(skills, abilities, skillAbilities, level);
        
        // Organize items by type using pure function
        const itemsArray = this.actor.items ? Array.from(this.actor.items) : [];
        context.items = organizeItemsByType(itemsArray);
        
        return context;
    }

    /**
     * Handle core listener activation for v13 compatibility
     * @param html - The rendered HTML
     * @override
     */
    _activateCoreListeners(html: any): void {
        // FoundryVTT v13 compatibility fix for core listeners
        // Handle various types of HTML input that FoundryVTT might pass
        let element = html;
        
        // Handle jQuery objects by extracting the DOM element
        if (html instanceof jQuery) {
            if (html.length > 0) {
                element = html[0];
            } else {
                console.error('AvantActorSheet._activateCoreListeners: Empty jQuery object received', html);
                return;
            }
        }
        
        // Handle comment nodes or other non-element nodes
        if (element && element.nodeType === Node.COMMENT_NODE) {
            console.warn('AvantActorSheet._activateCoreListeners: Received comment node, looking for next element');
            // Try to find the next element sibling
            element = element.nextElementSibling;
        }
        
        // Handle document fragments or other container types
        if (element && element.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            // Look for the first element child
            element = element.querySelector('form') || element.firstElementChild;
        }
        
        // Final validation - ensure we have a valid DOM element
        if (!element || !element.querySelectorAll || typeof element.querySelectorAll !== 'function') {
            console.error('AvantActorSheet._activateCoreListeners: Could not find valid DOM element', html);
            return;
        }
        
        // FoundryVTT core expects jQuery objects, so wrap the DOM element back into jQuery
        const jQueryElement = $(element);
        
        // Call parent with jQuery-wrapped element
        super._activateCoreListeners(jQueryElement);
    }

    /**
     * Activate event listeners for the actor sheet
     * @param html - The rendered HTML
     * @override
     */
    activateListeners(html: any): void {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(this._onItemEdit.bind(this));

        // Delete Inventory Item
        html.find('.item-delete').click(this._onItemDelete.bind(this));

        // Rollable abilities
        html.find('.rollable').click(this._onRoll.bind(this));

        // Skill rolls
        html.find('.skill-roll').click(this._onSkillRoll.bind(this));

        // Power point usage
        html.find('.power-point-use').click(this._onPowerPointsRoll.bind(this));

        // Weapon attack rolls
        html.find('.attack-roll').click(this._onAttackRoll.bind(this));

        // Weapon damage rolls
        html.find('.damage-roll').click(this._onDamageRoll.bind(this));

        // Armor rolls
        html.find('.armor-roll').click(this._onArmorRoll.bind(this));
    }

    /**
     * Handle item creation
     * @param event - The triggering event
     * @returns The created item or void
     * @private
     */
    async _onItemCreate(event: Event): Promise<any | void> {
        event.preventDefault();
        const header = event.currentTarget as HTMLElement;
        const type = header.dataset.type;
        const foundryUtils = (globalThis as any).foundry?.utils;
        const data = foundryUtils?.duplicate(header.dataset) || {...header.dataset};
        
        // Use pure function to prepare item data
        const itemData = prepareItemData(type || '', data);
        if (!itemData) {
            logger.warn('Avant | Invalid item type for creation');
            FoundryUI.notify('Invalid item type', 'warn');
            return;
        }
        
        try {
            const Item = (globalThis as any).Item;
            const createdItem = await Item.create(itemData, {parent: this.actor});
            logger.log(`Avant | Created ${type} item: ${createdItem.name}`);
            return createdItem;
        } catch (error) {
            logger.error('Avant | Error creating item:', error);
            FoundryUI.notify(`Failed to create ${type}: ${(error as Error).message}`, 'error');
        }
    }

    /**
     * Handle item editing
     * @param event - The triggering event
     * @private
     */
    _onItemEdit(event: Event): void {
        event.preventDefault();
        const li = (event.currentTarget as HTMLElement).closest(".item") as HTMLElement;
        
        // Use pure function to extract item ID
        const itemId = extractItemIdFromElement(li);
        if (!itemId) {
            logger.warn('Avant | No item element found for edit');
            return;
        }
        
        const item = this.actor.items.get(itemId);
        if (!item) {
            logger.warn(`Avant | Item with ID '${itemId}' not found`);
            FoundryUI.notify('Item not found', 'warn');
            return;
        }
        
        item.sheet.render(true);
    }

    /**
     * Handle item deletion
     * @param event - The triggering event
     * @returns Promise for deletion completion
     * @private
     */
    async _onItemDelete(event: Event): Promise<void> {
        event.preventDefault();
        const li = (event.currentTarget as HTMLElement).closest(".item") as HTMLElement;
        
        // Use pure function to extract item ID
        const itemId = extractItemIdFromElement(li);
        if (!itemId) {
            logger.warn('Avant | No item element found for delete');
            return;
        }
        
        const item = this.actor.items.get(itemId);
        if (!item) {
            logger.warn(`Avant | Item with ID '${itemId}' not found`);
            FoundryUI.notify('Item not found', 'warn');
            return;
        }

        try {
            await item.delete();
            // FoundryVTT v13 compatibility: Convert DOM element to jQuery object for slideUp
            const $li = $(li);
            if (typeof $li.slideUp === 'function') {
                $li.slideUp(200, () => this.render(false));
            } else {
                // Fallback: Remove element immediately and re-render
                li.remove();
                this.render(false);
            }
        } catch (error) {
            logger.error('Avant | Error deleting item:', error);
            FoundryUI.notify(`Failed to delete item: ${(error as Error).message}`, 'error');
        }
    }

    /**
     * Handle generic rolls
     * @param event - The triggering event
     * @returns The executed roll or void
     * @private
     */
    async _onRoll(event: Event): Promise<any | void> {
        event.preventDefault();
        const element = event.currentTarget as HTMLElement;
        const dataset = element.dataset;

        // Handle different types of rolls
        if (dataset.rollType) {
            if (dataset.rollType === 'ability') {
                return await this._onAbilityRoll(event);
            }
            if (dataset.rollType === 'item') {
                return await this._onItemRoll(event);
            }
        }

        // Handle generic rolls
        if (dataset.roll) {
            try {
                // Use pure function to prepare generic roll
                const rollConfig = prepareGenericRoll(dataset);
                if (!rollConfig) {
                    logger.warn('Avant | Invalid roll data for generic roll');
                    return;
                }
                
                const Roll = (globalThis as any).Roll;
                const ChatMessage = (globalThis as any).ChatMessage;
                const game = (globalThis as any).game;
                
                const roll = new Roll(rollConfig.rollExpression, this.actor.getRollData());
                await roll.evaluate();
                
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: rollConfig.flavor,
                    rollMode: game.settings.get('core', 'rollMode'),
                });
                return roll;
            } catch (error) {
                logger.error('Avant | Error in generic roll:', error);
                FoundryUI.notify(`Roll failed: ${(error as Error).message}`, 'error');
            }
        }
    }

    /**
     * Handle ability rolls (checks only - no more score generation)
     * @param event - The triggering event
     * @returns The executed roll or void
     * @private
     */
    async _onAbilityRoll(event: Event): Promise<any | void> {
        event.preventDefault();
        const element = event.currentTarget as HTMLElement;
        const dataset = element.dataset;
        const ability = dataset.ability;
        
        if (!ability) {
            logger.warn('Avant | No ability specified for roll');
            return;
        }
        
        const actor = this.actor;
        const abilityData = actor.system.abilities[ability];
        const level = actor.system.level;
        
        // Validate roll data using pure function
        const validation = validateAbilityRollData(ability, abilityData, level) as any;
        if (!validation.valid) {
            logger.warn(`Avant | ${validation.error}`);
            return;
        }

        try {
            const Roll = (globalThis as any).Roll;
            const ChatMessage = (globalThis as any).ChatMessage;
            const game = (globalThis as any).game;
            
            // Ability Check: 2d10 + Level + Ability Modifier (Avant system)
            const roll = new Roll("2d10 + @level + @abilityMod", { 
                level: validation.level,
                abilityMod: validation.abilityMod
            });
            await roll.evaluate();
            
            const flavorText = `${ability.charAt(0).toUpperCase() + ability.slice(1)} Check`;
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: flavorText,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            
            return roll;
        } catch (error) {
            logger.error('Avant | Error in ability roll:', error);
            FoundryUI.notify(`Failed to roll ${ability} check: ${(error as Error).message}`, 'error');
        }
    }

    /**
     * Handle skill rolls
     * @param event - The triggering event
     * @returns The executed roll or void
     * @private
     */
    async _onSkillRoll(event: Event): Promise<any | void> {
        event.preventDefault();
        const element = event.currentTarget as HTMLElement;
        const dataset = element.dataset;
        const skill = dataset.skill;
        
        if (!skill) {
            logger.warn('Avant | No skill specified for roll');
            return;
        }
        
        const actor = this.actor;
        const skillValue = actor.system.skills[skill];
        const skillAbilities = AvantActorData.getSkillAbilities() as any;
        const abilityKey = skillAbilities[skill];
        const abilityData = actor.system.abilities[abilityKey];
        const level = actor.system.level;
        
        // Validate roll data using pure function
        const validation = validateSkillRollData(skill, skillValue, abilityData, level) as any;
        if (!validation.valid) {
            logger.warn(`Avant | ${validation.error}`);
            return;
        }
        
        try {
            const Roll = (globalThis as any).Roll;
            const ChatMessage = (globalThis as any).ChatMessage;
            const game = (globalThis as any).game;
            
            // Avant uses 2d10 + Level + Ability Modifier + Skill Modifier
            const roll = new Roll("2d10 + @level + @abilityMod + @skillMod", {
                level: validation.level,
                abilityMod: validation.abilityMod,
                skillMod: validation.skillMod
            });
            await roll.evaluate();
            
            const skillName = skill.charAt(0).toUpperCase() + skill.slice(1);
            const abilityName = abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1);
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: `${skillName} Check (${abilityName})`,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            
            return roll;
        } catch (error) {
            logger.error('Avant | Error in skill roll:', error);
            FoundryUI.notify(`Failed to roll ${skill} check: ${(error as Error).message}`, 'error');
        }
    }

    /**
     * Handle power point usage
     * @param event - The triggering event
     * @returns Promise for completion
     * @private
     */
    async _onPowerPointsRoll(event: Event): Promise<void> {
        event.preventDefault();
        const element = event.currentTarget as HTMLElement;
        const dataset = element.dataset;
        const cost = parseInt(dataset.cost || '1') || 1;
        
        const actor = this.actor;
        const currentPP = actor.system.powerPoints.value;
        
        // Use pure function to validate power point usage
        const validation = validatePowerPointUsage(currentPP, cost) as any;
        if (!validation.valid) {
            FoundryUI.notify(validation.error || 'Power point validation failed', 'warn');
            return;
        }
        
        // Deduct power points
        await actor.update({
            "system.powerPoints.value": validation.remaining
        });
        
        FoundryUI.notify(`Spent ${cost} Power Point${cost > 1 ? 's' : ''}. Remaining: ${validation.remaining}`, 'info');
    }

    /**
     * Handle weapon attack rolls
     * @param event - The triggering event
     * @returns The executed roll or void
     * @private
     */
    async _onAttackRoll(event: Event): Promise<any | void> {
        event.preventDefault();
        const element = event.currentTarget as HTMLElement;
        const li = element.closest(".item") as HTMLElement;
        
        // Use pure function to extract item ID
        const itemId = extractItemIdFromElement(li);
        if (!itemId) {
            logger.warn('Avant | No item element found for attack roll');
            return;
        }
        
        const item = this.actor.items.get(itemId);
        if (!item) {
            logger.warn(`Avant | Item with ID '${itemId}' not found`);
            FoundryUI.notify('Item not found', 'warn');
            return;
        }
        
        try {
            // Use pure function to prepare weapon attack roll
            const rollConfig = prepareWeaponAttackRoll(item, this.actor.getRollData());
            if (!rollConfig) {
                logger.warn('Avant | Invalid weapon data for attack roll');
                return;
            }
            
            const Roll = (globalThis as any).Roll;
            const ChatMessage = (globalThis as any).ChatMessage;
            const game = (globalThis as any).game;
            
            const roll = new Roll(rollConfig.rollExpression, rollConfig.rollData);
            await roll.evaluate();
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: rollConfig.flavor,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            
            return roll;
        } catch (error) {
            logger.error('Avant | Error in attack roll:', error);
            FoundryUI.notify(`Attack roll failed: ${(error as Error).message}`, 'error');
        }
    }

    /**
     * Handle weapon damage rolls
     * @param event - The triggering event
     * @returns The executed roll or void
     * @private
     */
    async _onDamageRoll(event: Event): Promise<any | void> {
        event.preventDefault();
        const element = event.currentTarget as HTMLElement;
        const li = element.closest(".item") as HTMLElement;
        
        // Use pure function to extract item ID
        const itemId = extractItemIdFromElement(li);
        if (!itemId) {
            logger.warn('Avant | No item element found for damage roll');
            return;
        }
        
        const item = this.actor.items.get(itemId);
        if (!item) {
            logger.warn(`Avant | Item with ID '${itemId}' not found`);
            FoundryUI.notify('Item not found', 'warn');
            return;
        }
        
        try {
            // Use pure function to prepare weapon damage roll
            const rollConfig = prepareWeaponDamageRoll(item, this.actor.getRollData());
            if (!rollConfig) {
                logger.warn('Avant | Invalid weapon data for damage roll');
                return;
            }
            
            const Roll = (globalThis as any).Roll;
            const ChatMessage = (globalThis as any).ChatMessage;
            const game = (globalThis as any).game;
            
            const roll = new Roll(rollConfig.rollExpression, rollConfig.rollData);
            await roll.evaluate();
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: rollConfig.flavor,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            
            return roll;
        } catch (error) {
            logger.error('Avant | Error in damage roll:', error);
            FoundryUI.notify(`Damage roll failed: ${(error as Error).message}`, 'error');
        }
    }

    /**
     * Handle armor rolls
     * @param event - The triggering event
     * @returns The executed roll or void
     * @private
     */
    async _onArmorRoll(event: Event): Promise<any | void> {
        event.preventDefault();
        const element = event.currentTarget as HTMLElement;
        const li = element.closest(".item") as HTMLElement;
        
        // Use pure function to extract item ID
        const itemId = extractItemIdFromElement(li);
        if (!itemId) {
            logger.warn('Avant | No item element found for armor roll');
            return;
        }
        
        const item = this.actor.items.get(itemId);
        if (!item) {
            logger.warn(`Avant | Item with ID '${itemId}' not found`);
            FoundryUI.notify('Item not found', 'warn');
            return;
        }
        
        try {
            // Use pure function to prepare armor roll
            const rollConfig = prepareArmorRoll(item, this.actor.getRollData());
            if (!rollConfig) {
                logger.warn('Avant | Invalid armor data for roll');
                return;
            }
            
            const Roll = (globalThis as any).Roll;
            const ChatMessage = (globalThis as any).ChatMessage;
            const game = (globalThis as any).game;
            
            const roll = new Roll(rollConfig.rollExpression, rollConfig.rollData);
            await roll.evaluate();
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: rollConfig.flavor,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            
            return roll;
        } catch (error) {
            logger.error('Avant | Error in armor roll:', error);
            FoundryUI.notify(`Armor roll failed: ${(error as Error).message}`, 'error');
        }
    }

    /**
     * Handle item rolls from the sheet
     * @param event - The triggering event
     * @returns The executed roll or void
     * @private
     */
    async _onItemRoll(event: Event): Promise<any | void> {
        event.preventDefault();
        const element = event.currentTarget as HTMLElement;
        const li = element.closest(".item") as HTMLElement;
        
        // Use pure function to extract item ID
        const itemId = extractItemIdFromElement(li);
        if (!itemId) {
            logger.warn('Avant | No item element found for item roll');
            return;
        }
        
        const item = this.actor.items.get(itemId);
        if (!item) {
            logger.warn(`Avant | Item with ID '${itemId}' not found`);
            FoundryUI.notify('Item not found', 'warn');
            return;
        }
        
        return item.roll();
    }

    /**
     * Apply the correct theme immediately and forcefully
     */
    _applyTheme(): void {
        const observer = new MutationObserver(() => {
            console.log('🔍 Theme MutationObserver triggered');
            this.render(false);
        });
        observer.observe(document.body, { attributes: true });
        (this as any)._themeObserver = observer;
        console.log('🔍 Theme MutationObserver set up for actor sheet');
    }

    /**
     * Override _renderHTML to debug the rendering process
     */
    _renderHTML(): void {
        console.log('🔍 AvantActorSheet._renderHTML called');
        super._renderHTML();
    }
} 