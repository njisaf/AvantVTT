/**
 * @fileoverview AvantActorData - Actor Data Model for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Complete actor data schema supporting attributes, skills, power points, health, and character details
 */

/**
 * Actor Data Model for Avant - v12/v13 Compatible
 * @class AvantActorData
 * @extends {foundry.abstract.DataModel}
 * @description Defines the complete data schema for Avant actors including attributes, skills, power points, and character details
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
            
            // Core Attributes - Direct modifiers (not D&D-style scores)
            attributes: new fields.SchemaField({
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
                value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
                max: new fields.NumberField({ required: true, initial: 0, integer: true }),
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
     * Map skills to their governing attributes
     * @static
     * @returns {Object} Mapping of skill names to attribute names
     */
    static getSkillAttributes() {
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
     * Get skill display labels
     * @static
     * @returns {Object} Mapping of skill names to display labels
     */
    static getSkillLabels() {
        return {
            'debate': 'Debate',
            'discern': 'Discern',
            'endure': 'Endure',
            'finesse': 'Finesse',
            'force': 'Force',
            'command': 'Command',
            'charm': 'Charm',
            'hide': 'Hide',
            'inspect': 'Inspect',
            'intuit': 'Intuit',
            'recall': 'Recall',
            'surge': 'Surge'
        };
    }
    
    /**
     * Get the attribute that governs a specific skill
     * @static
     * @param {string} skillName - The name of the skill
     * @returns {string|null} The governing attribute name or null if not found
     */
    static getSkillAttribute(skillName) {
        const skillAttributes = this.getSkillAttributes();
        return skillAttributes[skillName] || null;
    }
    
    /**
     * Get all skills governed by a specific attribute
     * @static
     * @param {string} attributeName - The name of the attribute
     * @returns {Array<string>} Array of skill names governed by this attribute
     */
    static getAttributeSkills(attributeName) {
        const skillAttributes = this.getSkillAttributes();
        const skills = [];
        
        for (const [skill, attribute] of Object.entries(skillAttributes)) {
            if (attribute === attributeName) {
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
        
        // No need to calculate attribute modifiers - they are direct values now
        
        // Calculate defense values (base 11 + tier + attribute modifier)
        for (const [attributeName, attributeData] of Object.entries(this.attributes)) {
            this.defense[attributeName] = 11 + this.tier + (attributeData.modifier || 0);
        }
        
        // Ensure current health doesn't exceed max (only constraint we keep)
        if (this.health.max > 0 && this.health.value > this.health.max) {
            this.health.value = this.health.max;
        }
        
        // Calculate power point limit (can be spent at once) - typically 1/3 of max
        this.powerPoints.limit = Math.max(1, Math.floor(this.powerPoints.max / 3));
        
        // Ensure current power points don't exceed max
        if (this.powerPoints.value > this.powerPoints.max) {
            this.powerPoints.value = this.powerPoints.max;
        }
        
        // Calculate expertise points remaining
        this.expertisePoints.remaining = Math.max(0, this.expertisePoints.total - this.expertisePoints.spent);
        
        // Calculate encumbrance max based on might modifier + base value
        const mightModifier = this.attributes.might.modifier || 0;
        const baseEncumbrance = 100; // Base carrying capacity
        this.physical.encumbrance.max = baseEncumbrance + (mightModifier * 10); // Simple encumbrance calculation
    }
} 