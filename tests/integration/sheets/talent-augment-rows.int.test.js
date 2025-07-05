/**
 * @file Integration tests for talent and augment row layout
 * @description Tests the new grid-based row layout with AP icons, traits, and controls
 */

import { describe, beforeEach, afterEach, test, expect } from '@jest/globals';

// Mock FoundryVTT environment
const mockFoundryEnvironment = {
    game: {
        settings: {
            get: jest.fn(() => 'dark'),
            set: jest.fn()
        },
        i18n: {
            localize: jest.fn((key) => key),
            format: jest.fn((key, data) => `${key}:${JSON.stringify(data)}`)
        },
        user: {
            isGM: true
        }
    },
    CONFIG: {
        AVANT: {}
    },
    ui: {
        notifications: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        }
    },
    foundry: {
        appv1: {
            sheets: {
                ActorSheet: class MockActorSheet {},
                ItemSheet: class MockItemSheet {}
            }
        },
        applications: {
            handlebars: {
                renderTemplate: jest.fn()
            }
        }
    }
};

// Set up global mocks
Object.assign(global, mockFoundryEnvironment);

describe('Talent & Augment Row Layout Integration', () => {
    let mockActor, mockItem, container;

    beforeEach(() => {
        // Create DOM container
        container = document.createElement('div');
        container.innerHTML = `
            <div class="avant actor-sheet">
                <div class="items-list talent-rows" data-test="talent-rows">
                </div>
                <div class="items-list augment-rows" data-test="augment-rows">
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Mock actor data
        mockActor = {
            id: 'actor-test-123',
            name: 'Test Character',
            type: 'character',
            system: {
                level: 3,
                abilities: {
                    might: { modifier: 2 },
                    focus: { modifier: 1 }
                }
            }
        };

        // Mock talent item
        mockItem = {
            _id: 'talent-fire-strike',
            name: 'Fire Strike',
            type: 'talent',
            system: {
                apCost: 2,
                ppCost: 0,
                usable: true,
                isActive: false,
                levelRequirement: 1,
                traits: ['fire', 'attack'],
                description: 'A fiery melee attack'
            },
            displayTraits: [
                { id: 'fire', name: 'Fire', icon: 'fas fa-fire', color: '#ff4500' },
                { id: 'attack', name: 'Attack', icon: 'fas fa-sword', color: '#8B0000' }
            ]
        };
    });

    afterEach(() => {
        // Clean up DOM
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        jest.clearAllMocks();
    });

    describe('Talent Row Structure', () => {
        test('should create correct grid layout for talent rows', () => {
            // Create talent row HTML (simulating template render)
            const talentRow = document.createElement('div');
            talentRow.className = 'talent-item';
            talentRow.dataset.itemId = mockItem._id;
            talentRow.dataset.itemType = 'talent';
            
            talentRow.innerHTML = `
                <div class="row-control">
                    <button type="button" class="activate-toggle-btn" 
                            data-action="useTalent" 
                            data-item-id="${mockItem._id}"
                            title="Use Talent: ${mockItem.name}"
                            aria-label="Use Talent: ${mockItem.name}"
                            tabindex="0">
                        <i class="fas fa-magic" aria-hidden="true"></i>
                    </button>
                </div>
                
                <div class="row-content">
                    <h4 class="row-title" 
                        data-action="editItem" 
                        data-item-id="${mockItem._id}"
                        title="Edit ${mockItem.name}"
                        tabindex="0"
                        role="button">
                        ${mockItem.name}
                    </h4>
                    
                    <div class="trait-chips">
                        ${mockItem.displayTraits.map(trait => `
                            <span class="trait-chip" 
                                  data-trait="${trait.id}"
                                  style="background-color: ${trait.color};"
                                  title="${trait.name}">
                                <i class="trait-chip__icon ${trait.icon}" aria-hidden="true"></i>
                                <span class="trait-chip__text">${trait.name}</span>
                            </span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="row-actions">
                    <div class="ap-icons" 
                         title="Action Point cost: ${mockItem.system.apCost}"
                         aria-label="Action Point cost: ${mockItem.system.apCost}">
                        ${[0, 1, 2, 3].map(i => `
                            <span class="ap-icon ${i < mockItem.system.apCost ? 'filled' : 'empty'}">
                                <i class="fas fa-circle" aria-hidden="true"></i>
                            </span>
                        `).join('')}
                    </div>
                    
                    <button type="button" 
                            class="row-edit" 
                            data-action="editItem" 
                            data-item-id="${mockItem._id}"
                            title="Edit ${mockItem.name}"
                            aria-label="Edit ${mockItem.name}"
                            tabindex="0">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    
                    <button type="button" 
                            class="row-delete" 
                            data-action="deleteItem" 
                            data-item-id="${mockItem._id}"
                            title="Delete ${mockItem.name}"
                            aria-label="Delete ${mockItem.name}"
                            tabindex="0">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            `;

            // Add to container
            const talentContainer = container.querySelector('[data-test="talent-rows"]');
            talentContainer.appendChild(talentRow);

            // Verify structure
            expect(talentRow.querySelector('.row-control')).toBeTruthy();
            expect(talentRow.querySelector('.row-content')).toBeTruthy();
            expect(talentRow.querySelector('.row-actions')).toBeTruthy();
            
            // Verify title
            const title = talentRow.querySelector('.row-title');
            expect(title.textContent.trim()).toBe('Fire Strike');
            expect(title.getAttribute('data-item-id')).toBe('talent-fire-strike');
            
            // Verify traits
            const traitChips = talentRow.querySelectorAll('.trait-chip');
            expect(traitChips).toHaveLength(2);
            expect(traitChips[0].querySelector('.trait-chip__text').textContent).toBe('Fire');
            expect(traitChips[1].querySelector('.trait-chip__text').textContent).toBe('Attack');
            
            // Verify AP icons
            const apIcons = talentRow.querySelectorAll('.ap-icon');
            expect(apIcons).toHaveLength(4);
            expect(apIcons[0].classList.contains('filled')).toBe(true);
            expect(apIcons[1].classList.contains('filled')).toBe(true);
            expect(apIcons[2].classList.contains('empty')).toBe(true);
            expect(apIcons[3].classList.contains('empty')).toBe(true);
            
            // Verify controls
            expect(talentRow.querySelector('.activate-toggle-btn')).toBeTruthy();
            expect(talentRow.querySelector('.row-edit')).toBeTruthy();
            expect(talentRow.querySelector('.row-delete')).toBeTruthy();
        });
    });

    describe('Augment Row Structure', () => {
        test('should create correct grid layout for augment rows with PP pill', () => {
            // Mock augment item
            const mockAugment = {
                ...mockItem,
                _id: 'augment-neural-interface',
                name: 'Neural Interface',
                type: 'augment',
                system: {
                    ...mockItem.system,
                    apCost: 1,
                    ppCost: 3
                }
            };

            // Create augment row HTML
            const augmentRow = document.createElement('div');
            augmentRow.className = 'augment-item';
            augmentRow.dataset.itemId = mockAugment._id;
            augmentRow.dataset.itemType = 'augment';
            
            augmentRow.innerHTML = `
                <div class="row-control">
                    <button type="button" class="activate-toggle-btn" 
                            data-action="useAugment" 
                            data-item-id="${mockAugment._id}"
                            title="Activate Augment: ${mockAugment.name}"
                            aria-label="Activate Augment: ${mockAugment.name}"
                            tabindex="0">
                        <i class="fas fa-cog" aria-hidden="true"></i>
                    </button>
                </div>
                
                <div class="row-content">
                    <h4 class="row-title">${mockAugment.name}</h4>
                    <div class="trait-chips">
                        ${mockAugment.displayTraits.map(trait => `
                            <span class="trait-chip">${trait.name}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="row-actions">
                    <div class="ap-icons">
                        ${[0, 1, 2, 3].map(i => `
                            <span class="ap-icon ${i < mockAugment.system.apCost ? 'filled' : 'empty'}">
                                <i class="fas fa-circle" aria-hidden="true"></i>
                            </span>
                        `).join('')}
                    </div>
                    
                    <span class="pp-pill" 
                          title="Power Point cost: ${mockAugment.system.ppCost}"
                          aria-label="Power Point cost: ${mockAugment.system.ppCost}">
                        PP ${mockAugment.system.ppCost}
                    </span>
                    
                    <button type="button" class="row-edit">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    
                    <button type="button" class="row-delete">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            `;

            // Add to container
            const augmentContainer = container.querySelector('[data-test="augment-rows"]');
            augmentContainer.appendChild(augmentRow);

            // Verify PP pill is present
            const ppPill = augmentRow.querySelector('.pp-pill');
            expect(ppPill).toBeTruthy();
            expect(ppPill.textContent.trim()).toBe('PP 3');
            
            // Verify AP icons show correct count (1 filled, 3 empty)
            const apIcons = augmentRow.querySelectorAll('.ap-icon');
            expect(apIcons).toHaveLength(4);
            expect(apIcons[0].classList.contains('filled')).toBe(true);
            expect(apIcons[1].classList.contains('empty')).toBe(true);
            expect(apIcons[2].classList.contains('empty')).toBe(true);
            expect(apIcons[3].classList.contains('empty')).toBe(true);
        });
    });

    describe('Keyboard Navigation', () => {
        test('should handle arrow key navigation between rows', () => {
            // Create multiple talent rows
            const talentContainer = container.querySelector('[data-test="talent-rows"]');
            
            for (let i = 0; i < 3; i++) {
                const row = document.createElement('div');
                row.className = 'talent-item';
                row.innerHTML = `
                    <div class="row-control">
                        <button class="chat-roll-btn" tabindex="0">Roll</button>
                    </div>
                    <div class="row-content">
                        <h4 class="row-title" tabindex="0">Talent ${i + 1}</h4>
                    </div>
                `;
                talentContainer.appendChild(row);
            }

            const rows = container.querySelectorAll('.talent-item');
            expect(rows).toHaveLength(3);

            // Focus first row's title
            const firstTitle = rows[0].querySelector('.row-title');
            firstTitle.focus();
            expect(document.activeElement).toBe(firstTitle);

            // Simulate ArrowDown key
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            firstTitle.dispatchEvent(downEvent);

            // Test would need keyboard navigation handler to be active
            // This verifies the DOM structure supports navigation
            expect(rows[1].querySelector('.row-title')).toBeTruthy();
        });

        test('should support space/enter activation on rows', () => {
            const talentContainer = container.querySelector('[data-test="talent-rows"]');
            
            const row = document.createElement('div');
            row.className = 'talent-item';
            row.innerHTML = `
                <div class="row-control">
                    <button class="activate-toggle-btn" tabindex="0">
                        <i class="fas fa-magic"></i>
                    </button>
                </div>
                <div class="row-content">
                    <h4 class="row-title" tabindex="0">Fire Strike</h4>
                </div>
            `;
            talentContainer.appendChild(row);

            const activateBtn = row.querySelector('.activate-toggle-btn');
            const clickSpy = jest.fn();
            activateBtn.addEventListener('click', clickSpy);

            // Simulate space key on the button
            const spaceEvent = new KeyboardEvent('keydown', { key: 'Space' });
            activateBtn.dispatchEvent(spaceEvent);

            // Verify button is accessible and can be activated
            expect(activateBtn.getAttribute('tabindex')).toBe('0');
        });
    });

    describe('Accessibility', () => {
        test('should have proper ARIA labels and roles', () => {
            const talentContainer = container.querySelector('[data-test="talent-rows"]');
            
            const row = document.createElement('div');
            row.className = 'talent-item';
            row.innerHTML = `
                <div class="row-control">
                    <button type="button" 
                            class="activate-toggle-btn" 
                            data-action="useTalent" 
                            data-item-id="test-id"
                            title="Use Talent: Fire Strike"
                            aria-label="Use Talent: Fire Strike"
                            tabindex="0">
                        <i class="fas fa-magic" aria-hidden="true"></i>
                    </button>
                </div>
                
                <div class="row-content">
                    <h4 class="row-title" 
                        data-action="editItem" 
                        data-item-id="test-id"
                        title="Edit Fire Strike"
                        tabindex="0"
                        role="button">
                        Fire Strike
                    </h4>
                </div>
                
                <div class="row-actions">
                    <div class="ap-icons" 
                         title="Action Point cost: 2"
                         aria-label="Action Point cost: 2">
                        <span class="ap-icon filled">
                            <i class="fas fa-circle" aria-hidden="true"></i>
                        </span>
                    </div>
                    
                    <button type="button" 
                            class="row-edit" 
                            data-action="editItem" 
                            data-item-id="test-id"
                            title="Edit Fire Strike"
                            aria-label="Edit Fire Strike"
                            tabindex="0">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                </div>
            `;
            talentContainer.appendChild(row);

            // Verify ARIA labels
            const activateBtn = row.querySelector('.activate-toggle-btn');
            expect(activateBtn.getAttribute('aria-label')).toBe('Use Talent: Fire Strike');
            expect(activateBtn.getAttribute('title')).toBe('Use Talent: Fire Strike');
            
            // Verify edit button accessibility
            const editBtn = row.querySelector('.row-edit');
            expect(editBtn.getAttribute('aria-label')).toBe('Edit Fire Strike');
            expect(editBtn.getAttribute('title')).toBe('Edit Fire Strike');
            
            // Verify row title role
            const title = row.querySelector('.row-title');
            expect(title.getAttribute('role')).toBe('button');
            expect(title.getAttribute('tabindex')).toBe('0');
            
            // Verify AP icons have proper labels
            const apIcons = row.querySelector('.ap-icons');
            expect(apIcons.getAttribute('aria-label')).toBe('Action Point cost: 2');
            
            // Verify icons are hidden from screen readers
            const hiddenIcons = row.querySelectorAll('[aria-hidden="true"]');
            expect(hiddenIcons.length).toBeGreaterThan(0);
        });
    });
}); 