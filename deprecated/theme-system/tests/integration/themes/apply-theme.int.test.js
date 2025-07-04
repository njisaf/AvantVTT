/**
 * Integration tests for ThemeManager DOM operations
 * 
 * Tests theme application to DOM elements and theme export functionality
 * using jsdom environment for realistic DOM manipulation testing.
 */

import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';
import '../../env/foundry-shim.js';

// Import theme manager after setting up environment
import { AvantThemeManager } from '../../../scripts/themes/theme-manager.js';

describe('ThemeManager DOM Integration', () => {
    let dom, document, window;
    
    beforeEach(() => {
        // Create fresh JSDOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <head></head>
                <body>
                    <div class="avant" id="test-element">
                        <div class="character-sheet">Test Content</div>
                    </div>
                </body>
            </html>
        `, { 
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });
        
        document = dom.window.document;
        window = dom.window;
        
        // Setup global environment
        global.document = document;
        global.window = window;
        global.HTMLElement = window.HTMLElement;
        global.Element = window.Element;
        
        // Mock game settings
        global.game = {
            settings: {
                get: jest.fn().mockReturnValue('light')
            }
        };
    });
    
    afterEach(() => {
        dom.window.close();
        jest.restoreAllMocks();
    });
    
    test('theme manager class can be instantiated', async () => {
        // ACT: Create theme manager instance
        const themeManager = new AvantThemeManager();
        
        // ASSERT: Instance should be created successfully
        expect(themeManager).toBeDefined();
        expect(typeof themeManager.init).toBe('function');
        expect(typeof themeManager.applyTheme).toBe('function');
    });
    
    test('theme manager initialization completes without errors', async () => {
        // ARRANGE: Create theme manager instance
        const themeManager = new AvantThemeManager();
        
        // ACT & ASSERT: Initialization should not throw
        await expect(themeManager.init()).resolves.not.toThrow();
    });
    
    test('theme manager can handle DOM operations', async () => {
        // ARRANGE: Create theme manager and test element
        const themeManager = new AvantThemeManager();
        const testElement = document.querySelector('.avant');
        expect(testElement).toBeTruthy();
        
        // ACT & ASSERT: Basic operations should not throw
        expect(() => themeManager.applyTheme('dark')).not.toThrow();
        expect(() => themeManager.applyTheme('light')).not.toThrow();
    });
}); 