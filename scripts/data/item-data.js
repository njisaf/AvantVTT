/**
 * @fileoverview Item Data Models for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Complete item data schemas for all item types: Actions, Features, Talents, Augments, Weapons, Armor, and Gear
 */

/**
 * Action Item Data Model
 * @class AvantActionData
 * @extends {foundry.abstract.DataModel}
 * @description Data model for action items with attribute requirements and difficulty thresholds
 */
export class AvantActionData extends foundry.abstract.DataModel {
    /**
     * Define the data schema for action items
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                initial: "",
                blank: true
            }),
            attribute: new fields.StringField({
                required: true,
                initial: "might",
                choices: ["might", "grace", "intellect", "focus"]
            }),
            difficulty: new fields.NumberField({
                required: true,
                initial: 11,
                integer: true,
                min: 5,
                max: 30
            }),
            powerPointCost: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: 0
            }),
            uses: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                })
            }),
            // Trait assignment for actions
            traits: new fields.ArrayField(new fields.StringField({
                required: false,
                blank: false
            }), {
                required: false,
                initial: []
            })
        };
    }
}

/**
 * Feature Item Data Model
 * @class AvantFeatureData
 * @extends {foundry.abstract.DataModel}
 * @description Data model for character features and special abilities
 */
export class AvantFeatureData extends foundry.abstract.DataModel {
    /**
     * Define the data schema for feature items
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                initial: "",
                blank: true
            }),
            category: new fields.StringField({
                required: true,
                initial: "general",
                choices: ["racial", "class", "background", "general", "special"]
            }),
            isActive: new fields.BooleanField({
                required: true,
                initial: false
            }),
            powerPointCost: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: 0
            }),
            uses: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                })
            }),
            // Trait-specific properties for features used as traits
            color: new fields.StringField({
                required: false,
                initial: "",
                blank: true
            }),
            icon: new fields.StringField({
                required: false,
                initial: "",
                blank: true
            }),
            localKey: new fields.StringField({
                required: false,
                initial: "",
                blank: true
            }),
            // Trait assignment for features
            traits: new fields.ArrayField(new fields.StringField({
                required: false,
                blank: false
            }), {
                required: false,
                initial: []
            })
        };
    }
}

/**
 * Talent Item Data Model
 * @class AvantTalentData
 * @extends {foundry.abstract.DataModel}
 * @description Data model for talents with action point costs and level requirements
 */
export class AvantTalentData extends foundry.abstract.DataModel {
    /**
     * Define the data schema for talent items
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                initial: "",
                blank: true
            }),
            apCost: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                min: 0,
                max: 3
            }),
            levelRequirement: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                min: 1
            }),
            tier: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                min: 1,
                max: 6
            }),
            isActive: new fields.BooleanField({
                required: true,
                initial: false
            }),
            requirements: new fields.StringField({
                required: false,
                initial: "",
                blank: true
            }),
            // Legacy field for backwards compatibility
            prerequisites: new fields.StringField({
                required: false,
                initial: "",
                blank: true
            }),
            uses: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                })
            }),
            // Trait assignment for talents
            traits: new fields.ArrayField(new fields.StringField({
                required: false,
                blank: false
            }), {
                required: false,
                initial: []
            })
        };
    }
}

/**
 * Augment Item Data Model
 * @class AvantAugmentData
 * @extends {foundry.abstract.DataModel}
 * @description Data model for character augmentations and enhancements
 */
export class AvantAugmentData extends foundry.abstract.DataModel {
    /**
     * Define the data schema for augment items
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                initial: "",
                blank: true
            }),
            apCost: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: 0,
                max: 3
            }),
            ppCost: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: 0
            }),
            levelRequirement: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                min: 1
            }),
            augmentType: new fields.StringField({
                required: true,
                initial: "enhancement",
                choices: ["enhancement", "cybernetic", "biological", "magical", "psionic"]
            }),
            // Legacy field for backwards compatibility
            powerPointCost: new fields.NumberField({
                required: false,
                initial: 0,
                integer: true,
                min: 0
            }),
            isActive: new fields.BooleanField({
                required: true,
                initial: false
            }),
            rarity: new fields.StringField({
                required: true,
                initial: "common",
                choices: ["common", "uncommon", "rare", "epic", "legendary", "artifact"]
            }),
            requirements: new fields.StringField({
                required: false,
                initial: "",
                blank: true
            }),
            uses: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                })
            }),
            // Trait assignment for augments
            traits: new fields.ArrayField(new fields.StringField({
                required: false,
                blank: false
            }), {
                required: false,
                initial: []
            })
        };
    }
}

/**
 * Weapon Item Data Model
 * @class AvantWeaponData
 * @extends {foundry.abstract.DataModel}
 * @description Data model for weapons with attack and damage properties
 */
export class AvantWeaponData extends foundry.abstract.DataModel {
    /**
     * Define the data schema for weapon items
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                initial: "",
                blank: true
            }),
            attribute: new fields.StringField({
                required: true,
                initial: "might",
                choices: ["might", "grace", "intellect", "focus"]
            }),
            modifier: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: -10,
                max: 10
            }),
            damageDie: new fields.StringField({
                required: true,
                initial: "1d6",
                blank: false
            }),
            damageType: new fields.StringField({
                required: true,
                initial: "",
                blank: true
            }),
            threshold: new fields.NumberField({
                required: true,
                initial: 11,
                integer: true,
                min: 5,
                max: 30
            }),
            range: new fields.StringField({
                required: true,
                initial: "Melee",
                choices: ["Melee", "Short", "Medium", "Long", "Extreme"]
            }),
            weight: new fields.NumberField({
                required: true,
                initial: 1,
                min: 0
            }),
            cost: new fields.NumberField({
                required: true,
                initial: 0,
                min: 0
            }),
            quantity: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                min: 0
            }),
            equipped: new fields.BooleanField({
                required: true,
                initial: false
            }),
            properties: new fields.StringField({
                required: true,
                initial: "",
                blank: true
            }),
            expertise: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: 0
            }),
            // Trait assignment for weapons
            traits: new fields.ArrayField(new fields.StringField({
                required: false,
                blank: false
            }), {
                required: false,
                initial: []
            })
        };
    }
}

/**
 * Armor Item Data Model
 * @class AvantArmorData
 * @extends {foundry.abstract.DataModel}
 * @description Data model for armor with defensive properties
 */
export class AvantArmorData extends foundry.abstract.DataModel {
    /**
     * Define the data schema for armor items
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                initial: "",
                blank: true
            }),
            attribute: new fields.StringField({
                required: true,
                initial: "grace",
                choices: ["might", "grace", "intellect", "focus"]
            }),
            modifier: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: -10,
                max: 10
            }),
            threshold: new fields.NumberField({
                required: true,
                initial: 11,
                integer: true,
                min: 5,
                max: 30
            }),
            damageReduction: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: 0,
                max: 10
            }),
            armorType: new fields.StringField({
                required: true,
                initial: "light",
                choices: ["light", "medium", "heavy", "shield"]
            }),
            weight: new fields.NumberField({
                required: true,
                initial: 5,
                min: 0
            }),
            cost: new fields.NumberField({
                required: true,
                initial: 0,
                min: 0
            }),
            quantity: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                min: 0
            }),
            equipped: new fields.BooleanField({
                required: true,
                initial: false
            }),
            properties: new fields.StringField({
                required: true,
                initial: "",
                blank: true
            }),
            expertise: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: 0
            }),
            // Trait assignment for armor
            traits: new fields.ArrayField(new fields.StringField({
                required: false,
                blank: false
            }), {
                required: false,
                initial: []
            })
        };
    }
}

/**
 * Gear Item Data Model
 * @class AvantGearData
 * @extends {foundry.abstract.DataModel}
 * @description Data model for general equipment and items
 */
export class AvantGearData extends foundry.abstract.DataModel {
    /**
     * Define the data schema for gear items
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                initial: "",
                blank: true
            }),
            weight: new fields.NumberField({
                required: true,
                initial: 1,
                min: 0
            }),
            cost: new fields.NumberField({
                required: true,
                initial: 0,
                min: 0
            }),
            quantity: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                min: 0
            }),
            rarity: new fields.StringField({
                required: true,
                initial: "common",
                choices: ["common", "uncommon", "rare", "epic", "legendary", "artifact"]
            }),
            category: new fields.StringField({
                required: true,
                initial: "miscellaneous",
                choices: [
                    "miscellaneous",
                    "tool",
                    "container",
                    "consumable",
                    "treasure",
                    "component",
                    "ammunition",
                    "trade good"
                ]
            }),
            isConsumable: new fields.BooleanField({
                required: true,
                initial: false
            }),
            uses: new fields.SchemaField({
                value: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                }),
                max: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    min: 0
                })
            }),
            expertise: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: 0
            }),
            // Trait assignment for gear
            traits: new fields.ArrayField(new fields.StringField({
                required: false,
                blank: false
            }), {
                required: false,
                initial: []
            })
        };
    }
}

/**
 * Trait Definition Data Model
 * @class AvantTraitData
 * @extends {foundry.abstract.DataModel}
 * @description Data model for trait definitions that can be applied to items
 */
export class AvantTraitData extends foundry.abstract.DataModel {
    /**
     * Define the data schema for trait items
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({
                required: true,
                initial: "",
                blank: true
            }),
            // Visual appearance properties
            color: new fields.StringField({
                required: true,
                initial: "#00E0DC",
                blank: false,
                validate: (value) => {
                    if (!value || typeof value !== 'string') return false;
                    // Accept hex colors with or without #
                    const hexPattern = /^#?[0-9A-Fa-f]{6}$/;
                    return hexPattern.test(value);
                },
                validationError: "Color must be a valid hex color code (e.g., #FF5733 or FF5733)"
            }),
            textColor: new fields.StringField({
                required: true,
                initial: "#000000",
                blank: false,
                validate: (value) => {
                    if (!value || typeof value !== 'string') return false;
                    // Accept hex colors with or without #
                    const hexPattern = /^#?[0-9A-Fa-f]{6}$/;
                    return hexPattern.test(value);
                },
                validationError: "Text color must be a valid hex color code (e.g., #000000 or 000000)"
            }),
            icon: new fields.StringField({
                required: true,
                initial: "fas fa-tag",
                blank: false
            }),
            // Categorization and identification
            tags: new fields.ArrayField(new fields.StringField({
                required: false,
                blank: false
            }), {
                required: false,
                initial: []
            }),
            localKey: new fields.StringField({
                required: false,
                initial: "",
                blank: true
            }),
            // Rarity for special traits
            rarity: new fields.StringField({
                required: true,
                initial: "common",
                choices: ["common", "uncommon", "rare", "epic", "legendary", "artifact"]
            }),
            // Game mechanical effects (optional)
            effects: new fields.StringField({
                required: true,
                initial: "",
                blank: true
            })
        };
    }
} 