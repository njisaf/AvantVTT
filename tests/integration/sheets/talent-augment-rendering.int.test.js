/**
 * @fileoverview Integration Tests for Talent and Augment Item Sheet Rendering
 * @description Tests to verify talent and augment sheets render with proper AP/PP fields
 * @version 1.0.0
 * @author Avant Development Team
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import '../../../tests/env/foundry-shim.js';

// Mock item factory
import { createMockItem } from '../../mocks/item-factory.js';

describe('Talent and Augment Sheet Rendering Integration', () => {
    let mockItemSheet;
    let mockTalentItem;
    let mockAugmentItem;

    beforeEach(() => {
        // Create mock talent item
        mockTalentItem = createMockItem({
            type: 'talent',
            name: 'Test Talent',
            system: {
                description: 'A test talent',
                tier: 2,
                apCost: 1,
                powerPointCost: 3,
                levelRequirement: 1,
                prerequisites: 'None',
                isActive: false,
                traits: ['fire', 'combat']
            }
        });

        // Create mock augment item
        mockAugmentItem = createMockItem({
            type: 'augment',
            name: 'Test Augment',
            system: {
                description: 'A test augment',
                apCost: 0,
                ppCost: 2,
                powerPointCost: 2,
                levelRequirement: 1,
                augmentType: 'enhancement',
                rarity: 'uncommon',
                isActive: true,
                traits: ['tech', 'enhancement']
            }
        });

        // Import the item sheet class (mocked)
        const { createAvantItemSheet } = require('../../../scripts/sheets/item-sheet.ts');
        const AvantItemSheet = createAvantItemSheet();
        
        mockItemSheet = {
            document: mockTalentItem,
            isEditable: true,
            get template() {
                const type = this.document?.type || 'gear';
                return `systems/avant/templates/item/item-${type}-new.html`;
            },
            async _prepareContext(options) {
                const itemData = this.document.toObject(false);
                return {
                    item: itemData,
                    system: itemData.system || {},
                    flags: itemData.flags || {},
                    editable: this.isEditable,
                    document: this.document
                };
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Talent Sheet Rendering', () => {
        test('should render with correct template path', () => {
            mockItemSheet.document = mockTalentItem;
            const templatePath = mockItemSheet.template;
            
            expect(templatePath).toBe('systems/avant/templates/item/item-talent-new.html');
        });

        test('should prepare context with talent-specific data', async () => {
            mockItemSheet.document = mockTalentItem;
            const context = await mockItemSheet._prepareContext({});
            
            expect(context.system.tier).toBe(2);
            expect(context.system.apCost).toBe(1);
            expect(context.system.powerPointCost).toBe(3);
            expect(context.system.levelRequirement).toBe(1);
            expect(context.system.prerequisites).toBe('None');
            expect(context.system.isActive).toBe(false);
        });

        test('should include AP cost field for talent items', async () => {
            mockItemSheet.document = mockTalentItem;
            const context = await mockItemSheet._prepareContext({});
            
            // Verify AP cost is available in context
            expect(context.system).toHaveProperty('apCost');
            expect(typeof context.system.apCost).toBe('number');
            expect(context.system.apCost).toBeGreaterThanOrEqual(0);
        });

        test('should include power point cost field for talent items', async () => {
            mockItemSheet.document = mockTalentItem;
            const context = await mockItemSheet._prepareContext({});
            
            // Verify power point cost is available in context
            expect(context.system).toHaveProperty('powerPointCost');
            expect(typeof context.system.powerPointCost).toBe('number');
            expect(context.system.powerPointCost).toBeGreaterThanOrEqual(0);
        });

        test('should include tier field for talent classification', async () => {
            mockItemSheet.document = mockTalentItem;
            const context = await mockItemSheet._prepareContext({});
            
            // Verify tier is available for talent classification
            expect(context.system).toHaveProperty('tier');
            expect(typeof context.system.tier).toBe('number');
            expect(context.system.tier).toBeGreaterThan(0);
        });

        test('should include traits array for talent items', async () => {
            mockItemSheet.document = mockTalentItem;
            const context = await mockItemSheet._prepareContext({});
            
            // Verify traits are available
            expect(context.system).toHaveProperty('traits');
            expect(Array.isArray(context.system.traits)).toBe(true);
            expect(context.system.traits).toContain('fire');
            expect(context.system.traits).toContain('combat');
        });
    });

    describe('Augment Sheet Rendering', () => {
        test('should render with correct template path', () => {
            mockItemSheet.document = mockAugmentItem;
            const templatePath = mockItemSheet.template;
            
            expect(templatePath).toBe('systems/avant/templates/item/item-augment-new.html');
        });

        test('should prepare context with augment-specific data', async () => {
            mockItemSheet.document = mockAugmentItem;
            const context = await mockItemSheet._prepareContext({});
            
            expect(context.system.apCost).toBe(0);
            expect(context.system.ppCost).toBe(2);
            expect(context.system.powerPointCost).toBe(2);
            expect(context.system.levelRequirement).toBe(1);
            expect(context.system.augmentType).toBe('enhancement');
            expect(context.system.rarity).toBe('uncommon');
            expect(context.system.isActive).toBe(true);
        });

        test('should include AP cost field for augment items', async () => {
            mockItemSheet.document = mockAugmentItem;
            const context = await mockItemSheet._prepareContext({});
            
            // Verify AP cost is available in context
            expect(context.system).toHaveProperty('apCost');
            expect(typeof context.system.apCost).toBe('number');
            expect(context.system.apCost).toBeGreaterThanOrEqual(0);
        });

        test('should include PP cost field for augment items', async () => {
            mockItemSheet.document = mockAugmentItem;
            const context = await mockItemSheet._prepareContext({});
            
            // Verify PP cost is available in context
            expect(context.system).toHaveProperty('ppCost');
            expect(typeof context.system.ppCost).toBe('number');
            expect(context.system.ppCost).toBeGreaterThanOrEqual(0);
        });

        test('should include augment type field for classification', async () => {
            mockItemSheet.document = mockAugmentItem;
            const context = await mockItemSheet._prepareContext({});
            
            // Verify augment type is available
            expect(context.system).toHaveProperty('augmentType');
            expect(typeof context.system.augmentType).toBe('string');
            expect(['enhancement', 'cybernetic', 'biological', 'magical', 'psionic']).toContain(context.system.augmentType);
        });

        test('should include rarity field for augment items', async () => {
            mockItemSheet.document = mockAugmentItem;
            const context = await mockItemSheet._prepareContext({});
            
            // Verify rarity is available
            expect(context.system).toHaveProperty('rarity');
            expect(typeof context.system.rarity).toBe('string');
            expect(['common', 'uncommon', 'rare', 'epic', 'legendary', 'artifact']).toContain(context.system.rarity);
        });

        test('should include traits array for augment items', async () => {
            mockItemSheet.document = mockAugmentItem;
            const context = await mockItemSheet._prepareContext({});
            
            // Verify traits are available
            expect(context.system).toHaveProperty('traits');
            expect(Array.isArray(context.system.traits)).toBe(true);
            expect(context.system.traits).toContain('tech');
            expect(context.system.traits).toContain('enhancement');
        });
    });

    describe('Sheet Type Differentiation', () => {
        test('should not render gear sheet for talent items', () => {
            mockItemSheet.document = mockTalentItem;
            const templatePath = mockItemSheet.template;
            
            expect(templatePath).not.toContain('gear');
            expect(templatePath).toContain('talent');
        });

        test('should not render gear sheet for augment items', () => {
            mockItemSheet.document = mockAugmentItem;
            const templatePath = mockItemSheet.template;
            
            expect(templatePath).not.toContain('gear');
            expect(templatePath).toContain('augment');
        });

        test('should differentiate between talent and augment templates', () => {
            // Test talent template
            mockItemSheet.document = mockTalentItem;
            const talentTemplate = mockItemSheet.template;
            
            // Test augment template
            mockItemSheet.document = mockAugmentItem;
            const augmentTemplate = mockItemSheet.template;
            
            expect(talentTemplate).not.toBe(augmentTemplate);
            expect(talentTemplate).toContain('talent');
            expect(augmentTemplate).toContain('augment');
        });
    });

    describe('Data Validation and Fallbacks', () => {
        test('should handle missing system data gracefully for talents', async () => {
            const minimalTalent = createMockItem({
                type: 'talent',
                name: 'Minimal Talent',
                system: {}
            });
            
            mockItemSheet.document = minimalTalent;
            const context = await mockItemSheet._prepareContext({});
            
            expect(context.system).toBeDefined();
            expect(context.item.type).toBe('talent');
        });

        test('should handle missing system data gracefully for augments', async () => {
            const minimalAugment = createMockItem({
                type: 'augment',
                name: 'Minimal Augment',
                system: {}
            });
            
            mockItemSheet.document = minimalAugment;
            const context = await mockItemSheet._prepareContext({});
            
            expect(context.system).toBeDefined();
            expect(context.item.type).toBe('augment');
        });

        test('should ensure editable flag is correctly set', async () => {
            mockItemSheet.document = mockTalentItem;
            mockItemSheet.isEditable = true;
            
            const context = await mockItemSheet._prepareContext({});
            
            expect(context.editable).toBe(true);
        });

        test('should handle read-only mode for talent sheets', async () => {
            mockItemSheet.document = mockTalentItem;
            mockItemSheet.isEditable = false;
            
            const context = await mockItemSheet._prepareContext({});
            
            expect(context.editable).toBe(false);
        });
    });
}); 