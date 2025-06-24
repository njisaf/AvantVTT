describe('Combat Rolls with Trait Display', () => {
    let mockItem, mockActor, mockManager, mockTraitProvider, mockRoll, mockChatMessage;
    
    beforeEach(() => {
        // Mock item with traits
        mockItem = {
            _id: 'test-weapon-id',
            name: 'Fire Sword',
            system: {
                traits: ['fire', 'magic'],
                ability: 'might',
                modifier: 2,
                damageDie: '1d8',
                damageType: 'slashing'
            }
        };
        
        // Mock actor
        mockActor = {
            system: {
                level: 3,
                abilities: {
                    might: { modifier: 2 }
                }
            },
            items: {
                get: jest.fn(() => mockItem)
            }
        };
        
        // Mock trait provider
        mockTraitProvider = {
            getAll: jest.fn(() => Promise.resolve({
                success: true,
                data: [
                    { id: 'fire', name: 'Fire', color: '#FF0000', icon: 'fas fa-fire' },
                    { id: 'magic', name: 'Magic', color: '#0000FF', icon: 'fas fa-star' }
                ]
            }))
        };
        
        // Mock initialization manager
        mockManager = {
            getService: jest.fn(() => mockTraitProvider)
        };
        
        // Mock FoundryVTT classes
        mockRoll = {
            evaluate: jest.fn(() => Promise.resolve()),
            toMessage: jest.fn(() => Promise.resolve())
        };
        
        mockChatMessage = {
            getSpeaker: jest.fn(() => ({ actor: 'test-actor' }))
        };
        
        global.globalThis = {
            Roll: jest.fn(() => mockRoll),
            ChatMessage: mockChatMessage
        };
    });
    
    test('should include trait display in weapon attack rolls', async () => {
        // Mock the required modules
        jest.doMock('../../../scripts/utils/initialization-manager.js', () => ({
            getInitializationManager: () => mockManager
        }));
        
        jest.doMock('../../../scripts/logic/chat/trait-resolver.js', () => ({
            itemHasTraits: () => true,
            createTraitHtmlForChat: () => Promise.resolve('<div class="trait-chips-wrapper">Fire, Magic</div>')
        }));
        
        jest.doMock('../../../scripts/logic/actor-sheet-utils.js', () => ({
            extractCombatItemId: () => 'test-weapon-id',
            prepareWeaponAttackRoll: () => ({
                rollExpression: '2d10 + @level + @abilityMod + @weaponMod',
                rollData: { level: 3, abilityMod: 2, weaponMod: 2 },
                flavor: 'Fire Sword Attack'
            })
        }));
        
        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: { itemId: 'test-weapon-id' } }
        };
        
        await sheet._onAttackRoll(mockEvent);
        
        expect(mockRoll.toMessage).toHaveBeenCalled();
        
        const callArgs = mockRoll.toMessage.mock.calls[0][0];
        expect(callArgs.speaker).toEqual({ actor: 'test-actor' });
        expect(callArgs.flavor).toContain('Fire Sword Attack');
    });
    
    test('should include trait display in weapon damage rolls', async () => {
        // Mock the required modules
        jest.doMock('../../../scripts/logic/actor-sheet-utils.js', () => ({
            extractCombatItemId: () => 'test-weapon-id',
            prepareWeaponDamageRoll: () => ({
                rollExpression: '1d8 + @abilityMod',
                rollData: { abilityMod: 2 },
                flavor: 'Fire Sword Damage (slashing)'
            })
        }));
        
        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: { itemId: 'test-weapon-id' } }
        };
        
        await sheet._onDamageRoll(mockEvent);
        
        expect(mockRoll.toMessage).toHaveBeenCalled();
        
        const callArgs = mockRoll.toMessage.mock.calls[0][0];
        expect(callArgs.speaker).toEqual({ actor: 'test-actor' });
        expect(callArgs.flavor).toContain('Fire Sword Damage (slashing)');
    });
    
    test('should handle missing item ID gracefully', async () => {
        jest.doMock('../../../scripts/logic/actor-sheet-utils.js', () => ({
            extractCombatItemId: () => null
        }));
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: {} }
        };
        
        const result = await sheet._onAttackRoll(mockEvent);
        
        expect(result).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith('Could not find item ID for attack roll');
        expect(mockRoll.toMessage).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
    
    test('should handle missing item gracefully', async () => {
        jest.doMock('../../../scripts/logic/actor-sheet-utils.js', () => ({
            extractCombatItemId: () => 'missing-item-id'
        }));
        
        mockActor.items.get = jest.fn(() => null);
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: { itemId: 'missing-item-id' } }
        };
        
        const result = await sheet._onDamageRoll(mockEvent);
        
        expect(result).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith('Item with ID missing-item-id not found');
        expect(mockRoll.toMessage).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
    
    test('should handle invalid roll configuration gracefully', async () => {
        jest.doMock('../../../scripts/logic/actor-sheet-utils.js', () => ({
            extractCombatItemId: () => 'test-weapon-id',
            prepareWeaponAttackRoll: () => null
        }));
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: { itemId: 'test-weapon-id' } }
        };
        
        const result = await sheet._onAttackRoll(mockEvent);
        
        expect(result).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith('Invalid weapon data for attack roll');
        expect(mockRoll.toMessage).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
}); 