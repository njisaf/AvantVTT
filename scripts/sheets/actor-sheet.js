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

/**
 * Actor Sheet for Avant Native System - FoundryVTT v13+
 * @class AvantActorSheet
 * @extends {foundry.appv1.sheets.ActorSheet}
 * @description Handles actor sheet functionality including tabs, rolls, and item management
 */
export class AvantActorSheet extends foundry.appv1.sheets.ActorSheet {
    /**
     * Define default options for the actor sheet
     * @static
     * @returns {Object} Sheet configuration options
     * @override
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
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
    }

    /**
     * Prepare data for rendering the actor sheet
     * @returns {Object} The context data for template rendering
     * @override
     */
    getData() {
        const context = super.getData();
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
     * @param {jQuery} html - The rendered HTML
     * @override
     */
    _activateCoreListeners(html) {
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
     * @param {jQuery} html - The rendered HTML
     * @override
     */
    activateListeners(html) {
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
     * @param {Event} event - The triggering event
     * @returns {Promise<Item|void>} The created item or void
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = foundry.utils.duplicate(header.dataset);
        
        // Use pure function to prepare item data
        const itemData = prepareItemData(type, data);
        if (!itemData) {
            logger.warn('Avant | Invalid item type for creation');
            ui.notifications.warn('Invalid item type');
            return;
        }
        
        try {
            const createdItem = await Item.create(itemData, {parent: this.actor});
            logger.log(`Avant | Created ${type} item: ${createdItem.name}`);
            return createdItem;
        } catch (error) {
            logger.error('Avant | Error creating item:', error);
            ui.notifications.error(`Failed to create ${type}: ${error.message}`);
        }
    }

    /**
     * Handle item editing
     * @param {Event} event - The triggering event
     * @private
     */
    _onItemEdit(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        
        // Use pure function to extract item ID
        const itemId = extractItemIdFromElement(li);
        if (!itemId) {
            logger.warn('Avant | No item element found for edit');
            return;
        }
        
        const item = this.actor.items.get(itemId);
        if (!item) {
            logger.warn(`Avant | Item with ID '${itemId}' not found`);
            ui.notifications.warn('Item not found');
            return;
        }
        
        item.sheet.render(true);
    }

    /**
     * Handle item deletion
     * @param {Event} event - The triggering event
     * @returns {Promise<void>}
     * @private
     */
    async _onItemDelete(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        
        // Use pure function to extract item ID
        const itemId = extractItemIdFromElement(li);
        if (!itemId) {
            logger.warn('Avant | No item element found for delete');
            return;
        }
        
        const item = this.actor.items.get(itemId);
        if (!item) {
            logger.warn(`Avant | Item with ID '${itemId}' not found`);
            ui.notifications.warn('Item not found');
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
            ui.notifications.error(`Failed to delete item: ${error.message}`);
        }
    }

    /**
     * Handle generic rolls
     * @param {Event} event - The triggering event
     * @returns {Promise<Roll|void>} The executed roll or void
     * @private
     */
    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
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
                ui.notifications.error(`Roll failed: ${error.message}`);
            }
        }
    }

    /**
     * Handle ability rolls (checks only - no more score generation)
     * @param {Event} event - The triggering event
     * @returns {Promise<Roll|void>} The executed roll or void
     * @private
     */
    async _onAbilityRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
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
        const validation = validateAbilityRollData(ability, abilityData, level);
        if (!validation.valid) {
            logger.warn(`Avant | ${validation.error}`);
            return;
        }

        try {
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
            ui.notifications.error(`Failed to roll ${ability} check: ${error.message}`);
        }
    }

    /**
     * Handle skill rolls
     * @param {Event} event - The triggering event
     * @returns {Promise<Roll|void>} The executed roll or void
     * @private
     */
    async _onSkillRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const skill = dataset.skill;
        
        if (!skill) {
            logger.warn('Avant | No skill specified for roll');
            return;
        }
        
        const actor = this.actor;
        const skillValue = actor.system.skills[skill];
        const skillAbilities = AvantActorData.getSkillAbilities();
        const abilityKey = skillAbilities[skill];
        const abilityData = actor.system.abilities[abilityKey];
        const level = actor.system.level;
        
        // Validate roll data using pure function
        const validation = validateSkillRollData(skill, skillValue, abilityData, level);
        if (!validation.valid) {
            logger.warn(`Avant | ${validation.error}`);
            return;
        }
        
        try {
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
            ui.notifications.error(`Failed to roll ${skill} check: ${error.message}`);
        }
    }

    /**
     * Handle power point usage
     * @param {Event} event - The triggering event
     * @returns {Promise<void>}
     * @private
     */
    async _onPowerPointsRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const cost = parseInt(dataset.cost) || 1;
        
        const actor = this.actor;
        const currentPP = actor.system.powerPoints.value;
        
        // Use pure function to validate power point usage
        const validation = validatePowerPointUsage(currentPP, cost);
        if (!validation.valid) {
            ui.notifications.warn(validation.error);
            return;
        }
        
        // Deduct power points
        await actor.update({
            "system.powerPoints.value": validation.remaining
        });
        
        ui.notifications.info(`Spent ${cost} Power Point${cost > 1 ? 's' : ''}. Remaining: ${validation.remaining}`);
    }

    /**
     * Handle weapon attack rolls
     * @param {Event} event - The triggering event
     * @returns {Promise<Roll|void>} The executed roll or void
     * @private
     */
    async _onAttackRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const itemId = dataset.itemId;
        
        if (!itemId) {
            logger.warn('Avant | No item ID found for attack roll');
            return;
        }
        
        const weapon = this.actor.items.get(itemId);
        if (!weapon) {
            logger.warn(`Avant | Weapon with ID '${itemId}' not found`);
            ui.notifications.warn('Weapon not found');
            return;
        }

        try {
            // Use pure function to prepare weapon attack roll
            const rollConfig = prepareWeaponAttackRoll(weapon, this.actor);
            if (!rollConfig) {
                logger.warn('Avant | Invalid weapon or actor data for attack roll');
                return;
            }
            
            const roll = new Roll(rollConfig.rollExpression, rollConfig.rollData);
            await roll.evaluate();
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: rollConfig.flavor,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            return roll;
        } catch (error) {
            logger.error('Avant | Error in weapon attack roll:', error);
            ui.notifications.error(`Failed to roll weapon attack: ${error.message}`);
        }
    }

    /**
     * Handle weapon damage rolls
     * @param {Event} event - The triggering event
     * @returns {Promise<Roll|void>} The executed roll or void
     * @private
     */
    async _onDamageRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const itemId = dataset.itemId;
        
        if (!itemId) {
            logger.warn('Avant | No item ID found for damage roll');
            return;
        }
        
        const weapon = this.actor.items.get(itemId);
        if (!weapon) {
            logger.warn(`Avant | Weapon with ID '${itemId}' not found`);
            ui.notifications.warn('Weapon not found');
            return;
        }

        try {
            // Use pure function to prepare weapon damage roll
            const rollConfig = prepareWeaponDamageRoll(weapon, this.actor);
            if (!rollConfig) {
                logger.warn('Avant | Invalid weapon or actor data for damage roll');
                return;
            }
            
            const roll = new Roll(rollConfig.rollExpression, rollConfig.rollData);
            await roll.evaluate();
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: rollConfig.flavor,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            return roll;
        } catch (error) {
            logger.error('Avant | Error in weapon damage roll:', error);
            ui.notifications.error(`Failed to roll weapon damage: ${error.message}`);
        }
    }

    /**
     * Handle armor rolls
     * @param {Event} event - The triggering event
     * @returns {Promise<Roll|void>} The executed roll or void
     * @private
     */
    async _onArmorRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const itemId = dataset.itemId;
        
        if (!itemId) {
            logger.warn('Avant | No item ID found for armor roll');
            return;
        }
        
        const armor = this.actor.items.get(itemId);
        
        if (!armor) {
            logger.warn(`Avant | Armor with ID '${itemId}' not found`);
            ui.notifications.warn('Armor not found');
            return;
        }
        
        try {
            // Use pure function to prepare armor roll
            const rollConfig = prepareArmorRoll(armor, this.actor);
            if (!rollConfig) {
                logger.warn('Avant | Invalid armor or actor data for armor roll');
                return;
            }
            
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
            ui.notifications.error(`Failed to roll armor check: ${error.message}`);
        }
    }
} 