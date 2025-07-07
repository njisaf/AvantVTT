/**
 * @fileoverview AvantActorData - Actor Data Model for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Complete actor data schema supporting abilities, skills, power points, health, and character details
 */

/**
 * Actor Data Model for Avant - v12/v13 Compatible
 * @class AvantActorData
 * @extends {foundry.abstract.DataModel}
 * @description Defines the complete data schema for Avant actors including abilities, skills, power points, and character details
 */
export class AvantActorData extends foundry.abstract.DataModel {
    /**
     * Define the data schema for Avant actors
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            // Basic Info
            level: new fields.NumberField({ required: true, initial: 1, integer: true, min: 1, max: 20 }),
            tier: new fields.NumberField({ required: true, initial: 1, integer: true, min: 1, max: 6 }),
            effort: new fields.NumberField({ required: true, initial: 1, integer: true, min: 1, max: 6 }),
            
            // Character Background
            ancestry: new fields.StringField({ required: true, initial: "", blank: true }),
            lineage: new fields.StringField({ required: true, initial: "", blank: true }),
            culture: new fields.StringField({ required: true, initial: "", blank: true }),
            vocation: new fields.StringField({ required: true, initial: "", blank: true }),
            background: new fields.StringField({ required: true, initial: "", blank: true }),
            languages: new fields.StringField({ required: true, initial: "", blank: true }),
            
            // Core Abilities - Direct modifiers (not D&D-style scores)
            abilities: new fields.SchemaField({
                might: new fields.SchemaField({
                    modifier: new fields.NumberField({ required: true, initial: 0, integer: true, min: -10, max: 10 })
                }),
                grace: new fields.SchemaField({
                    modifier: new fields.NumberField({ required: true, initial: 0, integer: true, min: -10, max: 10 })
                }),
                intellect: new fields.SchemaField({
                    modifier: new fields.NumberField({ required: true, initial: 0, integer: true, min: -10, max: 10 })
                }),
                focus: new fields.SchemaField({
                    modifier: new fields.NumberField({ required: true, initial: 0, integer: true, min: -10, max: 10 })
                })
            }),
            
            // Skills (1-point system for Avant)
            skills: new fields.SchemaField({
                // Might-based skills
                debate: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                force: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                
                // Grace-based skills
                finesse: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                hide: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                
                // Intellect-based skills
                command: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                inspect: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                recall: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                
                // Focus-based skills
                charm: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                discern: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                endure: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                intuit: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 }),
                surge: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0, max: 6 })
            }),
            
            // Character Details
            character: new fields.SchemaField({
                archetype: new fields.StringField({ required: true, initial: "", blank: true }),
                type: new fields.StringField({ required: true, initial: "", blank: true }),
                flavor: new fields.StringField({ required: true, initial: "", blank: true }),
                background: new fields.StringField({ required: true, initial: "", blank: true }),
                hometown: new fields.StringField({ required: true, initial: "", blank: true }),
                note: new fields.HTMLField({ required: true, initial: "", blank: true })
            }),
            
            // Health & Resources
            health: new fields.SchemaField({
                value: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 }),
                max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 1 }),
                temp: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 })
            }),
            
            powerPoints: new fields.SchemaField({
                value: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0 }),
                max: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0 }),
                limit: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 })
            }),
            
            expertisePoints: new fields.SchemaField({
                total: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                spent: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                remaining: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 })
            }),
            
            // Fortune Points for rerolls
            fortunePoints: new fields.NumberField({ required: true, initial: 3, integer: true, min: 0, max: 10 }),
            
            // Advancement
            experience: new fields.SchemaField({
                value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                max: new fields.NumberField({ required: true, initial: 1000, integer: true, min: 1 })
            }),
            
            // Combat Stats
            defense: new fields.SchemaField({
                might: new fields.NumberField({ required: true, initial: 11, integer: true, min: 0 }),
                grace: new fields.NumberField({ required: true, initial: 11, integer: true, min: 0 }),
                intellect: new fields.NumberField({ required: true, initial: 11, integer: true, min: 0 }),
                focus: new fields.NumberField({ required: true, initial: 11, integer: true, min: 0 })
            }),
            
            defenseThreshold: new fields.NumberField({ required: true, initial: 11, integer: true, min: 0 }),
            
            // Physical Characteristics
            physical: new fields.SchemaField({
                weight: new fields.NumberField({ required: true, initial: 0, min: 0 }),
                encumbrance: new fields.SchemaField({
                    value: new fields.NumberField({ required: true, initial: 0, min: 0 }),
                    max: new fields.NumberField({ required: true, initial: 100, min: 1 })
                })
            }),
            
            // Currencies
            currency: new fields.SchemaField({
                gold: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                silver: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                copper: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 })
            }),
            
            // Biography
            biography: new fields.HTMLField({ required: true, initial: "", blank: true }),
            
            // Notes
            notes: new fields.HTMLField({ required: true, initial: "", blank: true })
        };
    }
    
    /**
     * Map skills to their governing abilities
     * @static
     * @returns {Object} Mapping of skill names to ability names
     */
    static getSkillAbilities() {
        return {
            'debate': 'intellect',
            'discern': 'focus',
            'endure': 'focus',
            'finesse': 'grace',
            'force': 'might',
            'command': 'might',
            'charm': 'grace',
            'hide': 'grace',
            'inspect': 'intellect',
            'intuit': 'focus',
            'recall': 'intellect',
            'surge': 'might'
        };
    }
    
    /**
     * Get the ability that governs a specific skill
     * @static
     * @param {string} skillName - The name of the skill
     * @returns {string|null} The governing ability name or null if not found
     */
    static getSkillAbility(skillName) {
        const skillAbilities = this.getSkillAbilities();
        return skillAbilities[skillName] || null;
    }
    
    /**
     * Get all skills governed by a specific ability
     * @static
     * @param {string} abilityName - The name of the ability
     * @returns {Array<string>} Array of skill names governed by this ability
     */
    static getAbilitySkills(abilityName) {
        const skillAbilities = this.getSkillAbilities();
        const skills = [];
        
        for (const [skill, ability] of Object.entries(skillAbilities)) {
            if (ability === abilityName) {
                skills.push(skill);
            }
        }
        
        return skills.sort();
    }
    
    /**
     * Prepare derived data for the actor
     * Called automatically when actor data changes
     */
    prepareDerivedData() {
        // Note: DataModel doesn't have prepareDerivedData, so no super call needed
        
        // No need to calculate ability modifiers - they are direct values now
        
        // Calculate defense values (base 11 + tier + ability modifier)
        for (const [abilityName, abilityData] of Object.entries(this.abilities)) {
            this.defense[abilityName] = 11 + this.tier + (abilityData.modifier || 0);
        }
        
        // Calculate max health based on tier and might modifier
        const baseHealth = 20;
        const tierBonus = (this.tier - 1) * 5;
        const mightBonus = this.abilities.might.modifier || 0;
        this.health.max = Math.max(1, baseHealth + tierBonus + mightBonus);
        
        // Ensure current health doesn't exceed max
        if (this.health.value > this.health.max) {
            this.health.value = this.health.max;
        }
        
        // Calculate max power points based on tier and intellect modifier
        const basePP = 10;
        const tierPPBonus = (this.tier - 1) * 5;
        const intellectBonus = this.abilities.intellect.modifier || 0;
        this.powerPoints.max = Math.max(0, basePP + tierPPBonus + intellectBonus);
        
        // Calculate power point limit (can be spent at once) - typically 1/3 of max
        this.powerPoints.limit = Math.max(1, Math.floor(this.powerPoints.max / 3));
        
        // Ensure current power points don't exceed max
        if (this.powerPoints.value > this.powerPoints.max) {
            this.powerPoints.value = this.powerPoints.max;
        }
        
        // Calculate expertise points remaining
        this.expertisePoints.remaining = Math.max(0, this.expertisePoints.total - this.expertisePoints.spent);
        
        // Calculate defense threshold - use the highest defense value as the primary threshold
        this.defenseThreshold = Math.max(
            this.defense.might,
            this.defense.grace,
            this.defense.intellect,
            this.defense.focus
        );
        
        // Calculate encumbrance max based on might modifier + base value
        const mightModifier = this.abilities.might.modifier || 0;
        const baseEncumbrance = 100; // Base carrying capacity
        this.physical.encumbrance.max = baseEncumbrance + (mightModifier * 10); // Simple encumbrance calculation
    }
} 