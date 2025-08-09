/**
 * @fileoverview Integration Tests - Talent Action System
 * @description Tests for talent card rendering with new action system
 * @version 0.1.0
 * @author Avant Development Team
 */

import { JSDOM } from 'jsdom';
import { getTalentCardLayout } from '../../../../scripts/layout/item-card/item-types/talent.js';

// Mock FoundryVTT environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
// @ts-ignore
global.window = dom.window;

describe('Talent Action System Integration', () => {
    
    let mockTalentItem: any;
    
    beforeEach(() => {
        // Mock talent item data with new action system
        mockTalentItem = {
            _id: 'test-talent-1',
            type: 'talent',
            name: 'Combat Expertise',
            img: 'icons/svg/talent.svg',
            system: {
                description: 'Provides combat bonuses',
                traits: ['combat', 'expertise'],
                action: {
                    mode: 'immediate',
                    cost: 2,
                    minCost: null,
                    maxCost: null,
                    free: false
                },
                levelRequirement: 2,
                tier: 2,
                requirements: 'Combat training',
                prerequisites: 'Basic Combat',
                uses: { value: 1, max: 1 },
                isActive: true
            }
        };
    });
    
    describe('Talent Card Layout Generation with Action System', () => {
        it('should generate complete three-zone layout for talent with action', () => {
            const layout = getTalentCardLayout(mockTalentItem);
            
            // Verify structure
            expect(layout).toHaveProperty('left');
            expect(layout).toHaveProperty('center');
            expect(layout).toHaveProperty('right');
            
            // Left zone should have chat button
            expect(layout.left).toHaveLength(1);
            expect(layout.left[0]).toMatchObject({
                type: 'talent-chat-button',
                name: 'useTalent'
            });
        });
        
        it('should include action display in center zone for talent', () => {
            const layout = getTalentCardLayout(mockTalentItem);
            
            // Should have action display field
            const actionField = layout.center.find(f => f.name === 'actionDisplay');
            expect(actionField).toBeDefined();
            if (actionField) {
                expect(actionField).toMatchObject({
                    type: 'talent-action-display',
                    value: '2 AP',
                    icon: 'fa-regular fa-circle-dot'
                });
            }
        });
        
        it('should handle free action correctly', () => {
            const freeTalent = {
                ...mockTalentItem,
                system: {
                    ...mockTalentItem.system,
                    action: {
                        mode: 'immediate',
                        cost: 0,
                        minCost: null,
                        maxCost: null,
                        free: true
                    }
                }
            };
            
            const layout = getTalentCardLayout(freeTalent);
            
            // Should show 0 AP for free action
            const actionField = layout.center.find(f => f.name === 'actionDisplay');
            if (actionField) {
                expect(actionField.value).toBe('0 AP');
            }
        });
        
        it('should handle variable action with min/max costs', () => {
            const variableTalent = {
                ...mockTalentItem,
                system: {
                    ...mockTalentItem.system,
                    action: {
                        mode: 'variable',
                        cost: null,
                        minCost: 1,
                        maxCost: 3,
                        free: false
                    }
                }
            };
            
            const layout = getTalentCardLayout(variableTalent);
            
            // Should show AP range for variable action
            const actionField = layout.center.find(f => f.name === 'actionDisplay');
            if (actionField) {
                expect(actionField.value).toBe('AP: 1–3');
            }
        });
        
        it('should handle simultaneous action mode', () => {
            const simultaneousTalent = {
                ...mockTalentItem,
                system: {
                    ...mockTalentItem.system,
                    action: {
                        mode: 'simultaneous',
                        cost: 1,
                        minCost: null,
                        maxCost: null,
                        free: false
                    }
                }
            };
            
            const layout = getTalentCardLayout(simultaneousTalent);
            
            // Should show appropriate icon for simultaneous action
            const actionField = layout.center.find(f => f.name === 'actionDisplay');
            if (actionField) {
                expect(actionField.icon).toBe('fa-solid fa-clone');
            }
        });
        
        it('should include relevant fields in center zone for talent', () => {
            const layout = getTalentCardLayout(mockTalentItem);
            
            // Should have title line field
            const titleField = layout.center.find(f => f.name === 'titleLine');
            expect(titleField).toBeDefined();
            if (titleField) {
                expect(titleField.title).toBe('Combat Expertise');
            }
            
            // Should have requirements field
            const reqField = layout.center.find(f => f.name === 'requirements');
            expect(reqField).toBeDefined();
            if (reqField) {
                expect(reqField.value).toBe('Combat training');
            }
            
            // Should have description field
            const descField = layout.center.find(f => f.name === 'description');
            expect(descField).toBeDefined();
            if (descField) {
                expect(descField.value).toBe('Provides combat bonuses');
            }
        });
        
        it('should handle talent with no action data gracefully', () => {
            const talentNoAction = {
                ...mockTalentItem,
                system: {
                    ...mockTalentItem.system,
                    action: undefined
                }
            };
            
            expect(() => getTalentCardLayout(talentNoAction)).not.toThrow();
            const layout = getTalentCardLayout(talentNoAction);
            expect(layout).toHaveProperty('left');
            expect(layout).toHaveProperty('center');
            expect(layout).toHaveProperty('right');
            
            // Should show unknown AP for undefined action
            const actionField = layout.center.find(f => f.name === 'actionDisplay');
            if (actionField) {
                expect(actionField.value).toBe('AP: ?');
            }
        });
        
        it('should handle talent with null action values', () => {
            const talentNullAction = {
                ...mockTalentItem,
                system: {
                    ...mockTalentItem.system,
                    action: {
                        mode: 'immediate',
                        cost: null,
                        minCost: null,
                        maxCost: null,
                        free: false
                    }
                }
            };
            
            const layout = getTalentCardLayout(talentNullAction);
            
            // Should show unknown AP for null cost
            const actionField = layout.center.find(f => f.name === 'actionDisplay');
            if (actionField) {
                expect(actionField.value).toBe('AP: ?');
            }
        });
    });
    
    describe('Card Template Data Structure with Action System', () => {
        it('should produce template-compatible data structure', () => {
            const layout = getTalentCardLayout(mockTalentItem);
            
            // Check that all fields have required template properties
            [...layout.left, ...layout.center, ...layout.right].forEach(field => {
                expect(field).toHaveProperty('type');
                expect(field).toHaveProperty('name');
                expect(typeof field.type).toBe('string');
                expect(typeof field.name).toBe('string');
            });
        });
        
        it('should include CSS classes for styling', () => {
            const layout = getTalentCardLayout(mockTalentItem);
            
            // Check that action display has appropriate class
            const actionField = layout.center.find(f => f.name === 'actionDisplay');
            expect(actionField).toBeDefined();
            if (actionField) {
                expect(actionField).toHaveProperty('class');
                expect(typeof actionField.class).toBe('string');
            }
        });
        
        it('should include proper action attributes for buttons', () => {
            const layout = getTalentCardLayout(mockTalentItem);
            
            // Check chat button
            const chatButton = layout.left.find(f => f.name === 'useTalent');
            expect(chatButton).toBeDefined();
            if (chatButton) {
                expect(chatButton.itemId).toBe('test-talent-1');
            }
            
            // Check edit button
            const editButton = layout.right.find(f => f.name === 'editItem');
            expect(editButton).toBeDefined();
            if (editButton) {
                expect(editButton.itemId).toBe('test-talent-1');
            }
            
            // Check delete button
            const deleteButton = layout.right.find(f => f.name === 'deleteItem');
            expect(deleteButton).toBeDefined();
            if (deleteButton) {
                expect(deleteButton.itemId).toBe('test-talent-1');
            }
        });
    });
});