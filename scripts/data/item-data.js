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
 * @description Data model for action items with ability requirements and difficulty thresholds
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
            ability: new fields.StringField({
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
            })
        };
    }
}

/**
 * Talent Item Data Model
 * @class AvantTalentData
 * @extends {foundry.abstract.DataModel}
 * @description Data model for talents with power point costs and tiers
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
            tier: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                min: 1,
                max: 6
            }),
            powerPointCost: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                min: 0
            }),
            isActive: new fields.BooleanField({
                required: true,
                initial: false
            }),
            prerequisites: new fields.StringField({
                required: true,
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
            augmentType: new fields.StringField({
                required: true,
                initial: "enhancement",
                choices: ["enhancement", "cybernetic", "biological", "magical", "psionic"]
            }),
            powerPointCost: new fields.NumberField({
                required: true,
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
            ability: new fields.StringField({
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
            ability: new fields.StringField({
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
            })
        };
    }
} 