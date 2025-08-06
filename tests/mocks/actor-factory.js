/**
 * Actor Factory for Tests
 * 
 * Creates plain objects that implement the basic interface expected by
 * wrapper methods, avoiding constructor issues in unit tests.
 */

/**
 * Creates a mock actor with minimal required properties
 * @param {Object} options - Actor configuration
 * @returns {Object} Mock actor object
 */
export function createMockActor(options = {}) {
    const baseActor = {
        prepareData: () => {},
        prepareDerivedData: () => {},
        getRollData: function() {
            return {
                level: this.system.level,
                attributes: this.system.attributes
            };
        },
        update: function() { return Promise.resolve(this); },
        toObject: function() { return this; }
    };

    const actor = Object.create(baseActor);
    
    const defaults = {
        name: 'Test Actor',
        type: 'character',
        system: {
            level: 1,
            attributes: {
                might: { modifier: 0 },
                agility: { modifier: 0 },
                intellect: { modifier: 0 }
            },
            skills: {},
            health: { value: 10, max: 10 }
        },
        items: [],
        flags: {}
    };

    Object.assign(actor, {
        ...defaults,
        ...options,
        system: { ...defaults.system, ...(options.system || {}) }
    });

    return actor;
}

/**
 * Creates a mock actor with abilities for testing
 * @param {Object} abilities - Ability scores
 * @returns {Object} Mock actor with abilities
 */
export function createMockActorWithAbilities(abilities = {}) {
    const defaultAbilities = {
        might: { modifier: 2 },
        agility: { modifier: 1 },
        intellect: { modifier: 0 }
    };

    return createMockActor({
        system: {
            abilities: { ...defaultAbilities, ...abilities }
        }
    });
}

/**
 * Creates a mock actor with skills for testing
 * @param {Object} skills - Skill values
 * @returns {Object} Mock actor with skills
 */
export function createMockActorWithSkills(skills = {}) {
    return createMockActor({
        system: {
            skills: skills
        }
    });
} 