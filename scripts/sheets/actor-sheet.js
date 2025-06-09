/**
 * @fileoverview Actor Sheet for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Actor sheet handling for character management with v12/v13 compatibility
 */

import { CompatibilityUtils } from '../utils/compatibility.js';
import { AvantActorData } from '../data/actor-data.js';

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
        
        context.system = actorData.system;
        context.flags = actorData.flags;
        
        // Calculate total modifiers for display (level + ability modifier)
        context.abilityTotalModifiers = {};
        const level = context.system.level || 1;
        
        if (context.system.abilities) {
            for (const [abilityName, abilityData] of Object.entries(context.system.abilities)) {
                const abilityMod = abilityData.modifier || 0;
                context.abilityTotalModifiers[abilityName] = level + abilityMod;
            }
        }
        
        // Calculate skill total modifiers (level + ability modifier + skill value)
        context.skillTotalModifiers = {};
        const skillToAbilityMap = AvantActorData.getSkillAbilities();
        
        if (context.system.skills) {
            for (const [skillName, abilityName] of Object.entries(skillToAbilityMap)) {
                const skillValue = context.system.skills[skillName] || 0;
                const abilityMod = context.system.abilities?.[abilityName]?.modifier || 0;
                context.skillTotalModifiers[skillName] = level + abilityMod + skillValue;
            }
        }
        
        // Ensure derived values are calculated for display
        // Calculate defense values (base 11 + tier + ability modifier)
        if (context.system.defense && context.system.abilities) {
            for (const [abilityName, abilityData] of Object.entries(context.system.abilities)) {
                context.system.defense[abilityName] = 11 + (context.system.tier || 1) + (abilityData.modifier || 0);
            }
        }
        
        // Calculate defenseThreshold as the highest defense value
        if (context.system.defense) {
            context.system.defenseThreshold = Math.max(
                context.system.defense.might || 11,
                context.system.defense.grace || 11,
                context.system.defense.intellect || 11,
                context.system.defense.focus || 11
            );
        }
        
        // Calculate expertise points remaining
        if (context.system.expertisePoints) {
            context.system.expertisePoints.remaining = Math.max(0, 
                (context.system.expertisePoints.total || 0) - (context.system.expertisePoints.spent || 0)
            );
        }
        
        // Calculate power point limit
        if (context.system.powerPoints) {
            context.system.powerPoints.limit = Math.max(1, Math.floor((context.system.powerPoints.max || 10) / 3));
        }
        
        // Prepare items by type for organized tabs
        context.items = {};
        for (let item of this.actor.items) {
            const itemType = item.type;
            if (!context.items[itemType]) context.items[itemType] = [];
            context.items[itemType].push(item);
        }
        
        // Ensure all item types exist even if empty
        const itemTypes = ['action', 'feature', 'talent', 'augment', 'weapon', 'armor', 'gear'];
        itemTypes.forEach(type => {
            if (!context.items[type]) context.items[type] = [];
        });
        
        // Dynamically organize skills by ability for template rendering
        const skillAbilities = AvantActorData.getSkillAbilities();
        context.skillsByAbility = {
            might: [],
            grace: [],
            intellect: [],
            focus: []
        };
        
        // Group skills by their abilities
        for (const [skillName, abilityName] of Object.entries(skillAbilities)) {
            if (context.skillsByAbility[abilityName]) {
                context.skillsByAbility[abilityName].push({
                    name: skillName,
                    label: skillName.charAt(0).toUpperCase() + skillName.slice(1),
                    value: actorData.system.skills[skillName] || 0,
                    totalModifier: context.skillTotalModifiers[skillName] || 0
                });
            }
        }
        
        // Sort skills within each ability group alphabetically
        Object.keys(context.skillsByAbility).forEach(ability => {
            context.skillsByAbility[ability].sort((a, b) => a.label.localeCompare(b.label));
        });
        
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
        
        if (!abilityData) {
            console.warn(`Avant | Ability '${ability}' not found on actor`);
            return;
        }

        try {
            // Ability Check: 2d10 + Level + Ability Modifier (Avant system)
            // Use the direct ability modifier (no calculation needed)
            const abilityMod = abilityData.modifier || 0;
            
            const roll = new Roll("2d10 + @level + @abilityMod", { 
                level: actor.system.level,
                abilityMod: abilityMod
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
        
        // Use the direct ability modifier (no calculation needed)
        const abilityMod = abilityData ? (abilityData.modifier || 0) : 0;
        
        if (skillValue === undefined) {
            console.warn(`Avant | Skill '${skill}' not found on actor`);
            return;
        }
        
        try {
            // Avant uses 2d10 + Level + Ability Modifier + Skill Modifier
            const roll = new Roll("2d10 + @level + @abilityMod + @skillMod", {
                level: actor.system.level,
                abilityMod: abilityMod,
                skillMod: skillValue
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