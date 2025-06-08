// Avant - Game System for FoundryVTT v12/v13 Compatible

console.log("Avant | Loading game system...");

// Import theme manager
import { AvantThemeManager } from './theme-manager.js';
import { ThemeConfigUtil } from './theme-config.js';

/**
 * Actor Data Model for Avant - v12/v13 Compatible
 * @extends {foundry.abstract.DataModel}
 */
class AvantActorData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            // Basic Character Info
            level: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 1,
                min: 1
            }),
            fortunePoints: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 3,
                min: 0
            }),
            ancestry: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            lineage: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            culture: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            vocation: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            background: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            languages: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            
            // Abilities (Core Stats)
            abilities: new fields.SchemaField({
                might: new fields.SchemaField({
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 1
                    }),
                    mod: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 0
                    })
                }),
                grace: new fields.SchemaField({
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 1
                    }),
                    mod: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 0
                    })
                }),
                intellect: new fields.SchemaField({
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 1
                    }),
                    mod: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 0
                    })
                }),
                focus: new fields.SchemaField({
                    value: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 10,
                        min: 1
                    }),
                    mod: new fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 0
                    })
                })
            }),
            
            // Skills System (12 skills from prototype)
            skills: new fields.SchemaField({
                debate: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                discern: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                endure: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                finesse: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                force: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                command: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                charm: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                hide: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                inspect: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                intuit: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                recall: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                }),
                surge: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0
                })
            }),
            
            // Power Points System
            powerPoints: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                }),
                limit: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                })
            }),
            
            // Expertise Points (for Gear tab)
            expertisePoints: new fields.SchemaField({
                total: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                }),
                spent: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                }),
                remaining: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                })
            }),
            
            // Combat Stats
            health: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 25,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 25,
                    min: 0
                }),
                temp: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                })
            }),
            
            defenseThreshold: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 11,
                min: 1
            }),
            
            // Character Details
            biography: new fields.HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),
            notes: new fields.HTMLField({
                required: true,
                blank: true,
                initial: ""
            })
        };
    }
    
    /**
     * Get skill ability mapping
     * @returns {Object} Mapping of skills to abilities
     */
    static getSkillAbilities() {
        return {
            debate: 'intellect',
            discern: 'focus',
            endure: 'focus',
            finesse: 'grace',
            force: 'might',
            command: 'might',
            charm: 'grace',
            hide: 'grace',
            inspect: 'intellect',
            intuit: 'focus',
            recall: 'intellect',
            surge: 'might'
        };
    }
}

/**
 * Item Data Models - v12/v13 Compatible
 */

/**
 * Action Item Data Model
 * @extends {foundry.abstract.DataModel}
 */
class AvantActionData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),
            ability: new fields.StringField({
                required: true,
                blank: false,
                initial: "might",
                choices: ["might", "grace", "intellect", "focus"]
            }),
            difficulty: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 11,
                min: 1
            })
        };
    }
}

/**
 * Feature Item Data Model
 * @extends {foundry.abstract.DataModel}
 */
class AvantFeatureData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),
            source: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            category: new fields.StringField({
                required: true,
                blank: false,
                initial: "general"
            }),
            uses: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                })
            })
        };
    }
}

/**
 * Talent Item Data Model
 * @extends {foundry.abstract.DataModel}
 */
class AvantTalentData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),
            powerPointCost: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 0,
                min: 0
            }),
            prerequisites: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            uses: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                })
            })
        };
    }
}

/**
 * Augment Item Data Model
 * @extends {foundry.abstract.DataModel}
 */
class AvantAugmentData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),
            powerPointCost: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 0,
                min: 0
            }),
            augmentType: new fields.StringField({
                required: true,
                blank: false,
                initial: "enhancement"
            }),
            prerequisites: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            uses: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    min: 0
                })
            })
        };
    }
}

/**
 * Weapon Item Data Model
 * @extends {foundry.abstract.DataModel}
 */
class AvantWeaponData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),
            ability: new fields.StringField({
                required: true,
                blank: false,
                initial: "might",
                choices: ["might", "grace", "intellect", "focus"]
            }),
            modifier: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 0
            }),
            damageDie: new fields.StringField({
                required: true,
                blank: false,
                initial: "1d6"
            }),
            damageType: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            range: new fields.StringField({
                required: true,
                blank: false,
                initial: "Melee"
            }),
            properties: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            weight: new fields.NumberField({
                required: true,
                nullable: false,
                initial: 1,
                min: 0
            }),
            cost: new fields.NumberField({
                required: true,
                nullable: false,
                initial: 0,
                min: 0
            }),
            threshold: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 11,
                min: 1
            })
        };
    }
}

/**
 * Armor Item Data Model
 * @extends {foundry.abstract.DataModel}
 */
class AvantArmorData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),
            ability: new fields.StringField({
                required: true,
                blank: false,
                initial: "grace",
                choices: ["might", "grace", "intellect", "focus"]
            }),
            modifier: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 0
            }),
            damageReduction: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 0,
                min: 0
            }),
            properties: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            }),
            weight: new fields.NumberField({
                required: true,
                nullable: false,
                initial: 1,
                min: 0
            }),
            cost: new fields.NumberField({
                required: true,
                nullable: false,
                initial: 0,
                min: 0
            }),
            threshold: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 11,
                min: 1
            })
        };
    }
}

/**
 * Gear Item Data Model
 * @extends {foundry.abstract.DataModel}
 */
class AvantGearData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),
            weight: new fields.NumberField({
                required: true,
                nullable: false,
                initial: 1,
                min: 0
            }),
            cost: new fields.NumberField({
                required: true,
                nullable: false,
                initial: 0,
                min: 0
            }),
            quantity: new fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 1,
                min: 0
            }),
            properties: new fields.StringField({
                required: true,
                blank: true,
                initial: ""
            })
        };
    }
}

/**
 * Actor Sheet
 */
class AvantActorSheet extends ActorSheet {
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

    getData() {
        const context = super.getData();
        const actorData = this.actor.toObject(false);
        
        context.system = actorData.system;
        context.flags = actorData.flags;
        
        // Calculate ability modifiers from ability scores (D&D style: (score-10)/2)
        if (context.system.abilities) {
            for (const [abilityName, abilityData] of Object.entries(context.system.abilities)) {
                if (abilityData && typeof abilityData.value === 'number') {
                    context.system.abilities[abilityName].mod = Math.floor((abilityData.value - 10) / 2);
                }
            }
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
                    value: actorData.system.skills[skillName] || 0
                });
            }
        }
        
        // Sort skills within each ability group alphabetically
        Object.keys(context.skillsByAbility).forEach(ability => {
            context.skillsByAbility[ability].sort((a, b) => a.label.localeCompare(b.label));
        });
        
        return context;
    }

    _activateCoreListeners(html) {
        // FoundryVTT v13 compatibility fix for core listeners
        // Handle various types of HTML input that FoundryVTT might pass
        let element = html;
        let originalWasJQuery = html instanceof jQuery;
        
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

    activateListeners(html) {
        // FoundryVTT v13 ApplicationV1 compatibility
        // Handle various types of HTML input that FoundryVTT might pass
        let element = html;
        
        // Handle jQuery objects by extracting the DOM element
        if (html instanceof jQuery) {
            if (html.length > 0) {
                element = html[0];
            } else {
                console.error('AvantActorSheet.activateListeners: Empty jQuery object received', html);
                return;
            }
        }
        
        // Handle comment nodes or other non-element nodes
        if (element && element.nodeType === Node.COMMENT_NODE) {
            console.warn('AvantActorSheet.activateListeners: Received comment node, looking for next element');
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
            console.error('AvantActorSheet.activateListeners: Could not find valid DOM element', html);
            return;
        }
        
        // FoundryVTT core expects jQuery objects, so wrap the DOM element back into jQuery
        const jQueryElement = $(element);
        
        // Call parent with jQuery-wrapped element
        super.activateListeners(jQueryElement);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // NOTE: Tab handling is done automatically by ApplicationV1 framework
        // via the tabs configuration in defaultOptions. No manual initialization needed.

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

    async _onItemRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.rollType) {
            if (dataset.rollType == 'item') {
                const itemElement = element.closest('.item');
                if (!itemElement) {
                    console.warn('Avant | No item element found for item roll');
                    return;
                }
                
                const itemId = itemElement.dataset.itemId;
                const item = this.actor.items.get(itemId);
                
                if (!item) {
                    console.warn(`Avant | Item with ID '${itemId}' not found`);
                    ui.notifications.warn('Item not found');
                    return;
                }
                
                // Check if item has a roll method
                if (typeof item.roll === 'function') {
                    try {
                        return await item.roll();
                    } catch (error) {
                        console.error('Avant | Error in item roll:', error);
                        ui.notifications.error(`Failed to roll item: ${error.message}`);
                    }
                } else {
                    // Create a basic roll for the item
                    try {
                        const roll = new Roll("1d20", {});
                        await roll.evaluate();
                        
                        await roll.toMessage({
                            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                            flavor: `${item.name} Roll`,
                            rollMode: game.settings.get('core', 'rollMode'),
                        });
                        return roll;
                    } catch (error) {
                        console.error('Avant | Error in basic item roll:', error);
                        ui.notifications.error(`Failed to roll item: ${error.message}`);
                    }
                }
            }
        }

        if (dataset.roll) {
            try {
                let label = dataset.label ? `[item] ${dataset.label}` : '';
                let roll = new Roll(dataset.roll, this.actor.getRollData());
                await roll.evaluate();
                
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    rollMode: game.settings.get('core', 'rollMode'),
                });
                return roll;
            } catch (error) {
                console.error('Avant | Error in dataset roll:', error);
                ui.notifications.error(`Roll failed: ${error.message}`);
            }
        }
    }

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

        // Check if this is a generation roll (Shift+Click) or a check roll (normal click)
        const isGenerationRoll = event.shiftKey;
        
        try {
            let roll, flavorText;
            
            if (isGenerationRoll) {
                // Ability Score Generation: 4d6 drop lowest
                roll = new Roll("4d6kh3");
                await roll.evaluate();
                
                // Update the actor's ability score with the new value
                const newValue = roll.total;
                const updatePath = `system.abilities.${ability}.value`;
                await actor.update({
                    [updatePath]: newValue
                });
                
                flavorText = `${ability.charAt(0).toUpperCase() + ability.slice(1)} Score Generation`;
                ui.notifications.info(`Generated ${ability} score: ${newValue}`);
            } else {
                // Ability Check: 2d10 + Level + Ability Modifier (Avant system)
                // Calculate ability modifier from ability score (standard D&D-style: (score-10)/2)
                const abilityMod = Math.floor((abilityData.value - 10) / 2);
                
                roll = new Roll("2d10 + @level + @abilityMod", { 
                    level: actor.system.level,
                    abilityMod: abilityMod
                });
                await roll.evaluate();
                
                flavorText = `${ability.charAt(0).toUpperCase() + ability.slice(1)} Check`;
            }
            
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
        
        // Calculate ability modifier dynamically from ability score (standard D&D-style: (score-10)/2)
        const abilityMod = abilityData ? Math.floor((abilityData.value - 10) / 2) : 0;
        
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

/**
 * Item Sheet
 */
class AvantItemSheet extends ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["avant", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    get template() {
        const path = "systems/avant/templates/item";
        return `${path}/item-${this.item.type}-sheet.html`;
    }

    getData() {
        const context = super.getData();
        const itemData = this.item.toObject(false);
        context.system = itemData.system;
        context.flags = itemData.flags;
        return context;
    }

    _activateCoreListeners(html) {
        // FoundryVTT v13 compatibility fix for core listeners
        // Handle various types of HTML input that FoundryVTT might pass
        let element = html;
        
        // Handle jQuery objects by extracting the DOM element
        if (html instanceof jQuery) {
            if (html.length > 0) {
                element = html[0];
            } else {
                console.error('AvantItemSheet._activateCoreListeners: Empty jQuery object received', html);
                return;
            }
        }
        
        // Handle comment nodes or other non-element nodes
        if (element && element.nodeType === Node.COMMENT_NODE) {
            console.warn('AvantItemSheet._activateCoreListeners: Received comment node, looking for next element');
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
            console.error('AvantItemSheet._activateCoreListeners: Could not find valid DOM element', html);
            return;
        }
        
        // FoundryVTT core expects jQuery objects, so wrap the DOM element back into jQuery
        const jQueryElement = $(element);
        
        // Call parent with jQuery-wrapped element
        super._activateCoreListeners(jQueryElement);
    }

    activateListeners(html) {
        // FoundryVTT v13 ApplicationV1 compatibility
        // Handle various types of HTML input that FoundryVTT might pass
        let element = html;
        
        // Handle jQuery objects by extracting the DOM element
        if (html instanceof jQuery) {
            if (html.length > 0) {
                element = html[0];
            } else {
                console.error('AvantItemSheet.activateListeners: Empty jQuery object received', html);
                return;
            }
        }
        
        // Handle comment nodes or other non-element nodes
        if (element && element.nodeType === Node.COMMENT_NODE) {
            console.warn('AvantItemSheet.activateListeners: Received comment node, looking for next element');
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
            console.error('AvantItemSheet.activateListeners: Could not find valid DOM element', html);
            return;
        }
        
        // FoundryVTT core expects jQuery objects, so wrap the DOM element back into jQuery
        const jQueryElement = $(element);
        
        // Call parent with jQuery-wrapped element
        super.activateListeners(jQueryElement);

        if (!this.isEditable) return;

        // Use pure DOM methods instead of jQuery for v13 compatibility
        // Rollable abilities
        element.querySelectorAll('.rollable').forEach(el => {
            el.addEventListener('click', this._onRoll.bind(this));
        });
    }

    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            try {
                const roll = new Roll(dataset.roll, this.item.getRollData());
                await roll.evaluate();
                
                const label = dataset.label ? `${dataset.label}` : this.item.name;
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
                    flavor: label,
                    rollMode: game.settings.get('core', 'rollMode'),
                });
                return roll;
            } catch (error) {
                console.error('Avant | Error in item sheet roll:', error);
                ui.notifications.error(`Roll failed: ${error.message}`);
            }
        }
    }

    /**
     * Override the default update object method to ensure proper data type conversion
     * @param {Event} event - The form submission event
     * @param {Object} formData - The form data to process
     * @returns {Promise<Object>} The processed update data
     */
    async _updateObject(event, formData) {
        // Convert string values to numbers for specific fields that should be integers
        const processedData = foundry.utils.expandObject(formData);
        
        // Handle talent and augment specific fields
        if (processedData.system) {
            // Convert powerPointCost to integer if present
            if (processedData.system.powerPointCost !== undefined) {
                processedData.system.powerPointCost = parseInt(processedData.system.powerPointCost) || 0;
            }
            
            // Convert uses fields to integers if present
            if (processedData.system.uses) {
                if (processedData.system.uses.value !== undefined) {
                    processedData.system.uses.value = parseInt(processedData.system.uses.value) || 0;
                }
                if (processedData.system.uses.max !== undefined) {
                    processedData.system.uses.max = parseInt(processedData.system.uses.max) || 0;
                }
            }
            
            // Handle weapon/armor specific integer fields
            if (processedData.system.modifier !== undefined) {
                processedData.system.modifier = parseInt(processedData.system.modifier) || 0;
            }
            if (processedData.system.threshold !== undefined) {
                processedData.system.threshold = parseInt(processedData.system.threshold) || 11;
            }
            if (processedData.system.armorClass !== undefined) {
                processedData.system.armorClass = parseInt(processedData.system.armorClass) || 10;
            }
            
            // Handle numeric fields that should be numbers (not necessarily integers)
            if (processedData.system.weight !== undefined) {
                processedData.system.weight = parseFloat(processedData.system.weight) || 0;
            }
            if (processedData.system.cost !== undefined) {
                processedData.system.cost = parseFloat(processedData.system.cost) || 0;
            }
        }
        
        // Convert back to flat object for FoundryVTT
        const flatData = foundry.utils.flattenObject(processedData);
        
        // Call parent method with processed data
        return super._updateObject(event, flatData);
    }
}

// CLEAN ACTOR VALIDATION APPROACH
// Simple hook to ensure type is always set for actor creation
Hooks.on('preCreateActor', (document, data, options, userId) => {
    console.log('Avant | preCreateActor hook fired');
    console.log('Avant | Actor data:', JSON.stringify(data));
    
    // Ensure type is set to a valid value
    if (!data.type || typeof data.type !== 'string' || data.type.trim() === '') {
        console.log('Avant | Setting default actor type to character');
        data.type = 'character';
    }
    
    // Validate type is supported
    const supportedTypes = ['character', 'npc', 'vehicle'];
    if (!supportedTypes.includes(data.type)) {
        console.log(`Avant | Invalid actor type '${data.type}', defaulting to character`);
        data.type = 'character';
    }
    
    // Ensure system data exists
    if (!data.system) {
        console.log('Avant | Creating empty system data object');
        data.system = {};
    }
    
    console.log(`Avant | Actor validation complete - type: ${data.type}`);
});

Hooks.once('init', async function() {
    console.log("Avant | Initializing game system");
    
    // Register theme manager settings first
    AvantThemeManager.registerSettings();
    
    // Register system settings
    game.settings.register('avant', 'systemVersion', {
        name: 'System Version',
        hint: 'The current version of the Avant system.',
        scope: 'world',
        config: false,
        type: String,
        default: '2.1.9'
    });

    // Configure system
    CONFIG.Actor.documentClass = Actor;
    CONFIG.Item.documentClass = Item;
    
    // Register data models for ALL actor types
    CONFIG.Actor.dataModels = {
        character: AvantActorData,
        npc: AvantActorData,  // Use same model for NPCs
        vehicle: AvantActorData  // And vehicles if needed
    };
    
    // Register data models for all item types
    CONFIG.Item.dataModels = {
        action: AvantActionData,
        feature: AvantFeatureData,
        talent: AvantTalentData,
        augment: AvantAugmentData,
        weapon: AvantWeaponData,
        armor: AvantArmorData,
        gear: AvantGearData
    };
    
    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("avant", AvantActorSheet, { 
        makeDefault: true,
        types: ["character", "npc", "vehicle"]  // Specify supported types
    });
    
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("avant", AvantItemSheet, { 
        makeDefault: true,
        types: ["action", "feature", "talent", "augment", "weapon", "armor", "gear"]
    });
    
    // Preload templates
    loadTemplates([
        "systems/avant/templates/actor-sheet.html",
        "systems/avant/templates/item/item-action-sheet.html",
        "systems/avant/templates/item/item-feature-sheet.html",
        "systems/avant/templates/item/item-talent-sheet.html",
        "systems/avant/templates/item/item-augment-sheet.html",
        "systems/avant/templates/item/item-weapon-sheet.html",
        "systems/avant/templates/item/item-armor-sheet.html",
        "systems/avant/templates/item/item-gear-sheet.html"
    ]);
    
    console.log("Avant | System initialization complete");
});

// System ready
Hooks.once('ready', async function() {
    console.log("Avant | System ready");
    
    // Initialize theme manager
    game.avant = game.avant || {};
    game.avant.themeManager = new AvantThemeManager();
    
    ui.notifications.info("Avant game system loaded successfully!");
});

// Item validation hook
Hooks.on('preCreateItem', (document, data, options, userId) => {
    console.log("Avant | preCreateItem called with data:", data);
    const itemType = data.type;
    if (itemType === "action" && !data.system?.ability) {
        document.updateSource({ "system.ability": "might" });
    }
    if (itemType === "feature" && !data.system?.category) {
        document.updateSource({ "system.category": "general" });
    }
    if (itemType === "augment" && !data.system?.augmentType) {
        document.updateSource({ "system.augmentType": "enhancement" });
    }
    if (itemType === "weapon") {
        if (!data.system?.ability) {
            document.updateSource({ "system.ability": "might" });
        }
        if (!data.system?.modifier) {
            document.updateSource({ "system.modifier": 0 });
        }
        if (!data.system?.damageDie) {
            document.updateSource({ "system.damageDie": "1d6" });
        }
        if (!data.system?.threshold) {
            document.updateSource({ "system.threshold": 11 });
        }
    }
    if (itemType === "armor") {
        if (!data.system?.ability) {
            document.updateSource({ "system.ability": "grace" });
        }
        if (!data.system?.modifier) {
            document.updateSource({ "system.modifier": 0 });
        }
        if (!data.system?.threshold) {
            document.updateSource({ "system.threshold": 11 });
        }
    }
    const supportedItemTypes = ["action", "feature", "talent", "augment", "weapon", "armor", "gear"];
    if (!supportedItemTypes.includes(itemType)) {
        console.log(`Avant | Unsupported item type '${itemType}', defaulting to 'gear'`);
        document.updateSource({ type: "gear" });
    }
});

// Success logging
Hooks.on('createActor', (actor, options, userId) => {
    console.log("Avant | Actor created successfully:", actor.name, "Type:", actor.type);
});

Hooks.on('createItem', (item, options, userId) => {
    console.log("Avant | Item created successfully:", item.name, "Type:", item.type);
});

// Export system API
window['AVANT'] = {
    version: '2.1.9',
    AvantActorData,
    AvantActionData,
    AvantFeatureData,
    AvantTalentData,
    AvantAugmentData,
    AvantWeaponData,
    AvantArmorData,
    AvantGearData,
    AvantActorSheet,
    AvantItemSheet,
    AvantThemeManager
};