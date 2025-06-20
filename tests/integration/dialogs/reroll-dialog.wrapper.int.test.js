/**
 * Integration tests for RerollDialog wrapper functionality
 * 
 * Smoke tests to verify dialog wrapper handles FoundryVTT integration
 * without throwing errors. Focuses on basic delegation patterns.
 */

import { jest } from '@jest/globals';
import '../../env/foundry-shim.js';

describe('RerollDialog Wrapper Integration', () => {
    let mockActor, mockRollData;
    
    beforeEach(async () => {
        // Setup mock data
        mockActor = {
            system: { 
                fatigue: { value: 10, max: 20 },
                attributes: { wisdom: 12 }
            },
            update: jest.fn().mockResolvedValue({})
        };
        
        mockRollData = {
            dice: [{ results: [{ result: 1 }, { result: 2 }] }],
            total: 8,
            terms: []
        };
        
        // Setup global Dialog mock
        global.Dialog = class MockDialog {
            constructor(data, options) {
                this.data = data;
                this.options = options;
            }
            render() { return Promise.resolve(this); }
            static wait() { return Promise.resolve({}); }
        };
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    test('reroll dialog module loads without throwing', async () => {
        // ACT & ASSERT: Module import should not throw
        await expect(import('../../../scripts/dialogs/reroll-dialog.js')).resolves.toBeDefined();
    });
    
    test('dialog class can be instantiated with basic data', async () => {
        // ARRANGE: Import module
        const module = await import('../../../scripts/dialogs/reroll-dialog.js');
        const AvantRerollDialog = module.AvantRerollDialog;
        
        // ACT & ASSERT: Constructor should not throw
        expect(() => new AvantRerollDialog(mockActor, mockRollData, {})).not.toThrow();
    });
    
    test('dialog class exists and has expected structure', async () => {
        // ARRANGE: Import module
        const module = await import('../../../scripts/dialogs/reroll-dialog.js');
        const AvantRerollDialog = module.AvantRerollDialog;
        
        // ACT & ASSERT: Class should exist and have basic structure
        expect(AvantRerollDialog).toBeDefined();
        expect(typeof AvantRerollDialog).toBe('function');
        expect(AvantRerollDialog.prototype).toBeDefined();
    });
}); 