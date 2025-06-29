import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AvantActorSheet } from '../../../scripts/sheets/actor-sheet.ts';

// Mock dependencies
jest.mock('../../../scripts/utils/initialization-manager.ts', () => ({
  getInitializationManager: jest.fn(),
}));
import { getInitializationManager } from '../../../scripts/utils/initialization-manager.ts';

jest.mock('../../../scripts/logic/chat/trait-resolver.ts', () => ({
  itemHasTraits: jest.fn(),
  createTraitHtmlForChat: jest.fn(),
}));
import { itemHasTraits, createTraitHtmlForChat } from '../../../scripts/logic/chat/trait-resolver.ts';

jest.mock('../../../scripts/logic/actor-sheet-utils.ts', () => ({
  extractCombatItemId: jest.fn(),
  prepareWeaponAttackRoll: jest.fn(),
  prepareWeaponDamageRoll: jest.fn(),
}));
import { extractCombatItemId, prepareWeaponAttackRoll, prepareWeaponDamageRoll } from '../../../scripts/logic/actor-sheet-utils.ts';

describe('Combat Rolls with Trait Display', () => {
    let sheet: AvantActorSheet;
    let mockActor: any;
    let mockItem: any;
    let mockRoll: any;
    let mockChatMessage: any;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

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
                get: jest.fn().mockReturnValue(mockItem)
            }
        };

        // Mock FoundryVTT classes
        mockRoll = {
            evaluate: jest.fn().mockResolvedValue(this),
            toMessage: jest.fn().mockResolvedValue({})
        };
        
        mockChatMessage = {
            getSpeaker: jest.fn(() => ({ actor: 'test-actor' }))
        };
        
        (global as any).Roll = jest.fn(() => mockRoll);
        (global as any).ChatMessage = mockChatMessage;

        // Mock TraitProvider via InitializationManager
        const mockTraitProvider = {
            getAll: jest.fn().mockResolvedValue({
                success: true,
                data: [
                    { id: 'fire', name: 'Fire', color: '#FF0000', icon: 'fas fa-fire' },
                    { id: 'magic', name: 'Magic', color: '#0000FF', icon: 'fas fa-star' }
                ]
            })
        };
        (getInitializationManager as jest.Mock).mockReturnValue({
            getService: jest.fn().mockReturnValue(mockTraitProvider)
        });
        
        // Create a new sheet instance for each test
        sheet = new AvantActorSheet(mockActor as any);
    });
    
    test('should include trait display in weapon attack rolls', async () => {
        (extractCombatItemId as jest.Mock).mockReturnValue('test-weapon-id');
        (prepareWeaponAttackRoll as jest.Mock).mockReturnValue({
            rollExpression: '2d10 + @level + @abilityMod + @weaponMod',
            rollData: { level: 3, abilityMod: 2, weaponMod: 2 },
            flavor: 'Fire Sword Attack'
        });
        (itemHasTraits as jest.Mock).mockReturnValue(true);
        (createTraitHtmlForChat as jest.Mock).mockResolvedValue('<div class="trait-chips-wrapper">Fire, Magic</div>');

        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: { itemId: 'test-weapon-id' } }
        } as unknown as Event;
        
        await sheet._onAttackRoll(mockEvent);
        
        expect(mockRoll.toMessage).toHaveBeenCalled();
        const callArgs = mockRoll.toMessage.mock.calls[0][0];
        expect(callArgs.speaker).toEqual({ actor: 'test-actor' });
        expect(callArgs.flavor).toContain('Fire Sword Attack');
        expect(callArgs.flavor).toContain('<div class="trait-chips-wrapper">Fire, Magic</div>');
    });
    
    test('should include trait display in weapon damage rolls', async () => {
        (extractCombatItemId as jest.Mock).mockReturnValue('test-weapon-id');
        (prepareWeaponDamageRoll as jest.Mock).mockReturnValue({
            rollExpression: '1d8 + @abilityMod',
            rollData: { abilityMod: 2 },
            flavor: 'Fire Sword Damage (slashing)'
        });
        (itemHasTraits as jest.Mock).mockReturnValue(true);
        (createTraitHtmlForChat as jest.Mock).mockResolvedValue('<div class="trait-chips-wrapper">Fire, Magic</div>');

        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: { itemId: 'test-weapon-id' } }
        } as unknown as Event;
        
        await sheet._onDamageRoll(mockEvent);
        
        expect(mockRoll.toMessage).toHaveBeenCalled();
        const callArgs = mockRoll.toMessage.mock.calls[0][0];
        expect(callArgs.speaker).toEqual({ actor: 'test-actor' });
        expect(callArgs.flavor).toContain('Fire Sword Damage (slashing)');
        expect(callArgs.flavor).toContain('<div class="trait-chips-wrapper">Fire, Magic</div>');
    });
    
    test('should handle missing item ID gracefully', async () => {
        (extractCombatItemId as jest.Mock).mockReturnValue(null);
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: {} }
        } as unknown as Event;
        
        await sheet._onAttackRoll(mockEvent);
        
        expect(consoleSpy).toHaveBeenCalledWith('Could not find item ID for attack roll');
        expect(mockRoll.toMessage).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
    
    test('should handle missing item gracefully', async () => {
        (extractCombatItemId as jest.Mock).mockReturnValue('missing-item-id');
        mockActor.items.get.mockReturnValue(null);
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: { itemId: 'missing-item-id' } }
        } as unknown as Event;
        
        await sheet._onDamageRoll(mockEvent);
        
        expect(consoleSpy).toHaveBeenCalledWith('Item with ID missing-item-id not found for damage roll');
        expect(mockRoll.toMessage).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
    
    test('should handle invalid roll configuration gracefully', async () => {
        (extractCombatItemId as jest.Mock).mockReturnValue('test-weapon-id');
        (prepareWeaponAttackRoll as jest.Mock).mockReturnValue(null);
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: { dataset: { itemId: 'test-weapon-id' } }
        } as unknown as Event;
        
        await sheet._onAttackRoll(mockEvent);
        
        expect(consoleSpy).toHaveBeenCalledWith('Invalid roll configuration for item test-weapon-id');
        expect(mockRoll.toMessage).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
}); 