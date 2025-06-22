/**
 * @fileoverview AvantActorData - Actor Data Model for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Complete actor data schema supporting abilities, skills, power points, health, and character details
 */

// Import types from FoundryVTT system
// Note: Using any types for FoundryVTT API as official types are not available

/**
 * Interface for ability data structure
 */
export interface AbilityData {
    modifier: number;
}

/**
 * Interface for health data structure
 */
export interface HealthData {
    value: number;
    max: number;
    temp: number;
}

/**
 * Interface for power points data structure
 */
export interface PowerPointsData {
    value: number;
    max: number;
    limit: number;
}

/**
 * Interface for expertise points data structure
 */
export interface ExpertisePointsData {
    total: number;
    spent: number;
    remaining: number;
}

/**
 * Interface for character details data structure
 */
export interface CharacterDetailsData {
    archetype: string;
    type: string;
    flavor: string;
    background: string;
    hometown: string;
    note: string;
}

/**
 * Interface for defense data structure
 */
export interface DefenseData {
    might: number;
    grace: number;
    intellect: number;
    focus: number;
}

/**
 * Interface for physical characteristics data structure
 */
export interface PhysicalData {
    weight: number;
    encumbrance: {
        value: number;
        max: number;
    };
}

/**
 * Interface for currency data structure
 */
export interface CurrencyData {
    gold: number;
    silver: number;
    copper: number;
}

/**
 * Interface for experience data structure
 */
export interface ExperienceData {
    value: number;
    max: number;
}

/**
 * Interface for skills data structure
 */
export interface SkillsData {
    // Might-based skills
    force: number;
    surge: number;
    command: number;
    // Grace-based skills
    finesse: number;
    hide: number;
    charm: number;
    // Intellect-based skills
    debate: number;
    inspect: number;
    recall: number;
    // Focus-based skills
    discern: number;
    endure: number;
    intuit: number;
}

/**
 * Interface for complete actor system data
 */
export interface AvantActorSystemData {
    level: number;
    tier: number;
    effort: number;
    ancestry: string;
    lineage: string;
    culture: string;
    vocation: string;
    background: string;
    languages: string;
    abilities: Record<string, AbilityData>;
    skills: SkillsData;
    character: CharacterDetailsData;
    health: HealthData;
    powerPoints: PowerPointsData;
    expertisePoints: ExpertisePointsData;
    fortunePoints: number;
    experience: ExperienceData;
    defense: DefenseData;
    defenseThreshold: number;
    physical: PhysicalData;
    currency: CurrencyData;
    biography: string;
    notes: string;
}

/**
 * Actor Data Model for Avant - v12/v13 Compatible
 * @class AvantActorData
 * @extends {foundry.abstract.DataModel}
 * @description Defines the complete data schema for Avant actors including abilities, skills, power points, and character details
 */
export class AvantActorData extends (foundry as any).abstract.DataModel {
    declare level: number;
    declare tier: number;
    declare effort: number;
    declare ancestry: string;
    declare lineage: string;
    declare culture: string;
    declare vocation: string;
    declare background: string;
    declare languages: string;
    declare abilities: Record<string, AbilityData>;
    declare skills: SkillsData;
    declare character: CharacterDetailsData;
    declare health: HealthData;
    declare powerPoints: PowerPointsData;
    declare expertisePoints: ExpertisePointsData;
    declare fortunePoints: number;
    declare experience: ExperienceData;
    declare defense: DefenseData;
    declare defenseThreshold: number;
    declare physical: PhysicalData;
    declare currency: CurrencyData;
    declare biography: string;
    declare notes: string;

    /**
     * Define the data schema for Avant actors
     * @static
     * @returns {Object} The schema definition object
     */
    static defineSchema(): Record<string, any> {
        const fields = (foundry as any).data.fields;
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
                    modifier: new fields.NumberField({ required: true, initial: 0, integer: true })
                }),
                grace: new fields.SchemaField({
                    modifier: new fields.NumberField({ required: true, initial: 0, integer: true })
                }),
                intellect: new fields.SchemaField({
                    modifier: new fields.NumberField({ required: true, initial: 0, integer: true })
                }),
                focus: new fields.SchemaField({
                    modifier: new fields.NumberField({ required: true, initial: 0, integer: true })
                })
            }),
            
            // Skills - Free input integer values (no maximum constraint)
            skills: new fields.SchemaField({
                // Might-based skills
                debate: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                force: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                
                // Grace-based skills
                finesse: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                hide: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                
                // Intellect-based skills
                command: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                inspect: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                recall: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                
                // Focus-based skills
                charm: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                discern: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                endure: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                intuit: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                surge: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 })
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
                value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                max: new fields.NumberField({ required: true, initial: 0, integer: true }),
                temp: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 })
            }),
            
            powerPoints: new fields.SchemaField({
                value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                max: new fields.NumberField({ required: true, initial: 0, integer: true }),
                limit: new fields.NumberField({ required: true, initial: 0, integer: true })
            }),
            
            expertisePoints: new fields.SchemaField({
                total: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                spent: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                remaining: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 })
            }),
            
            // Fortune Points for rerolls
            fortunePoints: new fields.NumberField({ required: true, initial: 0, integer: true }),
            
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
            
            defenseThreshold: new fields.NumberField({ required: true, initial: 0, integer: true }),
            
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
    static getSkillAbilities(): Record<string, string> {
        return {
            'debate': 'intellect',
            'inspect': 'intellect',
            'recall': 'intellect',
            'discern': 'focus',
            'intuit': 'focus',
            'endure': 'focus',
            'finesse': 'grace',
            'charm': 'grace',
            'hide': 'grace',
            'force': 'might',
            'command': 'might',
            'surge': 'might'
        };
    }
    
    /**
     * Get the ability that governs a specific skill
     * @static
     * @param {string} skillName - The name of the skill
     * @returns {string|null} The governing ability name or null if not found
     */
    static getSkillAbility(skillName: string): string | null {
        const skillAbilities = this.getSkillAbilities();
        return skillAbilities[skillName] || null;
    }
    
    /**
     * Get all skills governed by a specific ability
     * @static
     * @param {string} abilityName - The name of the ability
     * @returns {Array<string>} Array of skill names governed by this ability
     */
    static getAbilitySkills(abilityName: string): string[] {
        const skillAbilities = this.getSkillAbilities();
        const skills: string[] = [];
        
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
    prepareDerivedData(): void {
        // Note: DataModel doesn't have prepareDerivedData, so no super call needed
        
        // No need to calculate ability modifiers - they are direct values now
        
        // Calculate defense values (base 11 + tier + ability modifier)
        for (const [abilityName, abilityData] of Object.entries(this.abilities)) {
            this.defense[abilityName as keyof DefenseData] = 11 + this.tier + (abilityData.modifier || 0);
        }
        
        // Ensure current health doesn't exceed max (only constraint we keep)
        if (this.health.max > 0 && this.health.value > this.health.max) {
            this.health.value = this.health.max;
        }
        
        // Power point limit is now user input - no automatic calculation
        
        // Ensure current power points don't exceed max
        if (this.powerPoints.value > this.powerPoints.max) {
            this.powerPoints.value = this.powerPoints.max;
        }
        
        // Calculate expertise points remaining
        this.expertisePoints.remaining = Math.max(0, this.expertisePoints.total - this.expertisePoints.spent);
        
        // Calculate encumbrance max based on might modifier + base value
        const mightModifier = this.abilities.might?.modifier || 0;
        const baseEncumbrance = 100; // Base carrying capacity
        this.physical.encumbrance.max = baseEncumbrance + (mightModifier * 10); // Simple encumbrance calculation
    }
} 