/**
 * @fileoverview Actor Sheet for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Actor sheet handling for character management with v12/v13 compatibility
 */

import { CompatibilityUtils } from '../utils/compatibility.js';
import { AvantActorData } from '../data/actor-data.js';
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

/**
 * Actor Sheet for Avant Native System - v12/v13 Compatible
 * @class AvantActorSheet
 * @extends {ActorSheet}
 * @description Handles actor sheet functionality including tabs, rolls, and item management
 */
export class AvantActorSheet extends CompatibilityUtils.getActorSheetClass() {
    /**
     * Define default options for the actor sheet
     * @static
     * @returns {Object} Sheet configuration options
     * @override
     */
    static get defaultOptions() {
        const mergeFunction = foundry?.utils?.mergeObject || ((a, b) => ({ ...a, ...b }));
        return mergeFunction(super.defaultOptions, {
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
     * Activate core listeners with v12/v13 compatibility
     * @param {jQuery|HTMLElement|DocumentFragment} html - The rendered HTML
     * @override
     * @private
     */
    _activateCoreListeners(html) {
        CompatibilityUtils.safeActivateListeners(this, html, super._activateCoreListeners);
    }

    /**
     * Activate event listeners for the actor sheet
     * @param {jQuery|HTMLElement|DocumentFragment} html - The rendered HTML
     * @override
     */
    activateListeners(html) {
        CompatibilityUtils.safeActivateListeners(this, html, super.activateListeners);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Get normalized DOM element for event handling
        const element = CompatibilityUtils.normalizeHtmlForListeners(html);
        if (!element) {
            CompatibilityUtils.log('Failed to normalize HTML for listeners', 'error');
            return;
        }

        // Use pure DOM methods instead of jQuery for v13 compatibility
        // Add Inventory Item
        element.querySelectorAll('.item-create').forEach(el => {
            el.addEventListener('click', this._onItemCreate.bind(this));
        });

        // Update Inventory Item
        element.querySelectorAll('.item-edit').forEach(el => {
            el.addEventListener('click', this._onItemEdit.bind(this));
        });

        // Delete Inventory Item
        element.querySelectorAll('.item-delete').forEach(el => {
            el.addEventListener('click', this._onItemDelete.bind(this));
        });

        // Rollable abilities
        element.querySelectorAll('.rollable').forEach(el => {
            el.addEventListener('click', this._onRoll.bind(this));
        });

        // Skill rolls
        element.querySelectorAll('.skill-roll').forEach(el => {
            el.addEventListener('click', this._onSkillRoll.bind(this));
        });

        // Power point usage
        element.querySelectorAll('.power-point-use').forEach(el => {
            el.addEventListener('click', this._onPowerPointsRoll.bind(this));
        });

        // Weapon attack rolls
        element.querySelectorAll('.attack-roll').forEach(el => {
            el.addEventListener('click', this._onAttackRoll.bind(this));
        });

        // Weapon damage rolls
        element.querySelectorAll('.damage-roll').forEach(el => {
            el.addEventListener('click', this._onDamageRoll.bind(this));
        });

        // Armor rolls
        element.querySelectorAll('.armor-roll').forEach(el => {
            el.addEventListener('click', this._onArmorRoll.bind(this));
        });
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
        const name = `New ${type.capitalize()}`;
        const itemData = {
            name: name,
            type: type,
            system: data
        };
        delete itemData.system["type"];
        
        // Handle specific item type defaults
        if (type === "feature" && data.category) {
            itemData.system.category = data.category;
        }
        if (type === "action" && !itemData.system.ability) {
            itemData.system.ability = "might";
        }
        if (type === "augment" && !itemData.system.augmentType) {
            itemData.system.augmentType = "enhancement";
        }
        
        try {
            return await Item.create(itemData, {parent: this.actor});
        } catch (error) {
            console.error('Avant | Error creating item:', error);
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
        if (!li) {
            console.warn('Avant | No item element found for edit');
            return;
        }
        
        const itemId = li.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            console.warn(`Avant | Item with ID '${itemId}' not found`);
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
        if (!li) {
            console.warn('Avant | No item element found for delete');
            return;
        }
        
        const itemId = li.dataset.itemId;
        const item = this.actor.items.get(itemId);
        
        if (!item) {
            console.warn(`Avant | Item with ID '${itemId}' not found`);
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
            console.error('Avant | Error deleting item:', error);
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
                const roll = new Roll(dataset.roll, this.actor.getRollData());
                await roll.evaluate();
                
                const label = dataset.label ? `${dataset.label}` : '';
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    rollMode: game.settings.get('core', 'rollMode'),
                });
                return roll;
            } catch (error) {
                console.error('Avant | Error in generic roll:', error);
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
            console.warn('Avant | No ability specified for roll');
            return;
        }
        
        const actor = this.actor;
        const abilityData = actor.system.abilities[ability];
        const level = actor.system.level;
        
        // Validate roll data using pure function
        const validation = validateAbilityRollData(ability, abilityData, level);
        if (!validation.valid) {
            console.warn(`Avant | ${validation.error}`);
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
            console.error('Avant | Error in ability roll:', error);
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
            console.warn('Avant | No skill specified for roll');
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
            console.warn(`Avant | ${validation.error}`);
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
            console.error('Avant | Error in skill roll:', error);
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
        
        if (currentPP < cost) {
            ui.notifications.warn(`Not enough Power Points! Need ${cost}, have ${currentPP}`);
            return;
        }
        
        // Deduct power points
        await actor.update({
            "system.powerPoints.value": Math.max(0, currentPP - cost)
        });
        
        ui.notifications.info(`Spent ${cost} Power Point${cost > 1 ? 's' : ''}. Remaining: ${currentPP - cost}`);
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
            console.warn('Avant | No item ID found for attack roll');
            return;
        }
        
        const weapon = this.actor.items.get(itemId);
        
        if (!weapon) {
            console.warn(`Avant | Weapon with ID '${itemId}' not found`);
            ui.notifications.warn('Weapon not found');
            return;
        }
        
        try {
            // Use weapon's ability and modifier for attack rolls
            const weaponAbility = weapon.system.ability || 'might';
            const abilityMod = this.actor.system.abilities[weaponAbility]?.mod || 0;
            const weaponModifier = weapon.system.modifier || 0;
            
            const roll = new Roll("2d10 + @level + @abilityMod + @weaponMod", {
                level: this.actor.system.level,
                abilityMod: abilityMod,
                weaponMod: weaponModifier
            });
            await roll.evaluate();
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `${weapon.name} Attack`,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            return roll;
        } catch (error) {
            console.error('Avant | Error in weapon attack roll:', error);
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
            console.warn('Avant | No item ID found for damage roll');
            return;
        }
        
        const weapon = this.actor.items.get(itemId);
        
        if (!weapon) {
            console.warn(`Avant | Weapon with ID '${itemId}' not found`);
            ui.notifications.warn('Weapon not found');
            return;
        }
        
        try {
            // Use the weapon's damage dice and ability modifier
            const damageRoll = weapon.system.damageDie || "1d6";
            const weaponAbility = weapon.system.ability || 'might';
            const abilityMod = this.actor.system.abilities[weaponAbility]?.mod || 0;
            const damageType = weapon.system.damageType || "";
            
            const roll = new Roll(`${damageRoll} + @abilityMod`, {
                abilityMod: abilityMod
            });
            await roll.evaluate();
            
            const flavorText = damageType ? 
                `${weapon.name} Damage (${damageType})` : 
                `${weapon.name} Damage`;
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: flavorText,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            return roll;
        } catch (error) {
            console.error('Avant | Error in weapon damage roll:', error);
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
            console.warn('Avant | No item ID found for armor roll');
            return;
        }
        
        const armor = this.actor.items.get(itemId);
        
        if (!armor) {
            console.warn(`Avant | Armor with ID '${itemId}' not found`);
            ui.notifications.warn('Armor not found');
            return;
        }
        
        try {
            // Use armor's ability and modifier for armor rolls
            const armorAbility = armor.system.ability || 'grace';
            const abilityMod = this.actor.system.abilities[armorAbility]?.mod || 0;
            const armorModifier = armor.system.modifier || 0;
            
            const roll = new Roll("2d10 + @level + @abilityMod + @armorMod", {
                level: this.actor.system.level,
                abilityMod: abilityMod,
                armorMod: armorModifier
            });
            await roll.evaluate();
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `${armor.name} Armor Check`,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            return roll;
        } catch (error) {
            console.error('Avant | Error in armor roll:', error);
            ui.notifications.error(`Failed to roll armor check: ${error.message}`);
        }
    }
} 