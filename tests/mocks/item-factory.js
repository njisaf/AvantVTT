/**
 * Item Factory for Tests
 * 
 * Creates plain objects that implement the basic interface expected by
 * wrapper methods, avoiding constructor issues in unit tests.
 */

/**
 * Creates a mock item with minimal required properties
 * @param {Object} options - Item configuration
 * @returns {Object} Mock item object
 */
export function createMockItem(options = {}) {
    const defaults = {
        name: 'Test Item',
        type: 'gear',
        system: {
            description: 'A test item',
            quantity: 1,
            weight: 0
        },
        actor: null,
        flags: {}
    };

    const item = {
        ...defaults,
        ...options,
        system: { ...defaults.system, ...(options.system || {}) }
    };

    // Add methods that wrapper classes expect
    item.prepareData = () => {};
    item.getRollData = () => ({
        item: item.system,
        actor: item.actor?.system || {}
    });
    item.roll = () => Promise.resolve({
        result: 'rolled',
        formula: '1d20'
    });
    item.update = () => Promise.resolve(item);
    item.toObject = () => item;

    return item;
}

/**
 * Creates a mock weapon item for testing
 * @param {Object} options - Weapon configuration
 * @returns {Object} Mock weapon item
 */
export function createMockWeapon(options = {}) {
    const defaults = {
        type: 'weapon',
        system: {
            damage: '1d6',
            weaponType: 'melee',
            range: 'close'
        }
    };

    return createMockItem({
        ...defaults,
        ...options,
        system: { ...defaults.system, ...(options.system || {}) }
    });
}

/**
 * Creates a mock item with an actor for testing
 * @param {Object} itemOptions - Item configuration
 * @param {Object} actorOptions - Actor configuration  
 * @returns {Object} Mock item with attached actor
 */
export function createMockItemWithActor(itemOptions = {}, actorOptions = {}) {
    const mockActor = {
        name: 'Test Actor',
        system: {
            level: 1,
            abilities: {
                might: { modifier: 0 }
            }
        },
        ...actorOptions
    };

    const item = createMockItem(itemOptions);
    item.actor = mockActor;
    
    // Update getRollData to include actor data
    item.getRollData = jest.fn().mockReturnValue({
        item: item.system,
        actor: mockActor.system
    });

    return item;
} 