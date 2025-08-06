/**
 * @fileoverview Avant Native System - Main System File
 * @version 2.0.0 - FoundryVTT v13+ Only
 * @author Avant Development Team
 * @description Main entry point for the Avant Native FoundryVTT system for v13-only implementation
 */

// FoundryVTT Types from our local library
import type { Actor, Item, ActorData, ItemData } from './types/foundry/index';
import type { HooksInterface } from './types/foundry/ui';

// Core imports - Component-based architecture
import { ValidationUtils } from './utils/validation.js';

// Logic utilities
import { registerSheets, setupConfigDebug, setupDataModels } from './logic/avant-init-utils.js';

// Data models
import { AvantActorData } from './data/actor-data.ts';
import { AvantActionData, AvantFeatureData, AvantTalentData, AvantAugmentData, AvantWeaponData, AvantArmorData, AvantGearData, AvantTraitData } from './data/item-data.js';

// Sheet classes are now created by factory functions in the initialization manager
// No direct imports needed - classes are created when Foundry is ready

// Dialog classes
import { AvantRerollDialog } from './dialogs/reroll-dialog';

// Chat functionality
import { AvantChatContextMenu } from './chat/context-menu.ts';
import { initializeChatIntegration } from './logic/chat/chat-integration.js';

// Unified actions system
import { registerUnifiedActionsHooks } from './logic/unified-actions-hooks.js';

// Commands module
import { initializeAvantCommands } from './commands/index.ts';

// Services
import { TraitProvider } from './services/trait-provider.js';

// Initialization manager
import { InitializationManager, FoundryInitializationHelper } from './utils/initialization-manager.ts';

// Extend global types for FoundryVTT (avoiding redeclaration)
declare global {
    interface Window {
        Hooks: HooksInterface;
        game: any; // Will be properly typed as we extend coverage
        ui: any;   // Will be properly typed as we extend coverage
        foundry: any; // Will be properly typed as we extend coverage
        CONFIG: any;  // Will be properly typed as we extend coverage
        ChatMessage: any; // Will be properly typed as we extend coverage
        Roll: any; // Will be properly typed as we extend coverage
        Actor: any; // FoundryVTT Actor class
        Item: any;  // FoundryVTT Item class
    }
}

// Access globals safely
const { Hooks, game, ui, foundry, CONFIG, ChatMessage, Roll } = globalThis as any;

console.log("Avant | Loading Avant Native System...");

/**
 * System initialization options interface
 */
interface AvantSystemInitOptions {
    /** Actor collections reference */
    actors: any;
    /** Items collections reference */
    items: any;
    /** Actor data model configurations */
    actorDataModels: Record<string, any>;
    /** Item data model configurations */
    itemDataModels: Record<string, any>;
}

/**
 * Result interface for utility functions
 */
interface UtilityResult {
    success: boolean;
    error?: string;
}

/**
 * Initialize the Avant Native system
 * This is the main entry point for system setup using robust initialization manager
 */
Hooks.once('init', async function (): Promise<void> {
    console.log("Avant | Initializing Avant Native system with robust initialization manager");



    // Create and expose initialization manager immediately
    const initManager = InitializationManager.getInstance();
    console.log("🔧 Avant | InitializationManager exposed to game.avant during init phase");

    // Add extensive debug logging for game.avant assignment
    const game = (globalThis as any).game;
    console.log("🔧 AVANT DEBUG | Assigning InitializationManager to game.avant...");
    console.log("🔧 AVANT DEBUG | game object exists:", !!game);
    console.log("🔧 AVANT DEBUG | game.avant before assignment:", game?.avant);

    game.avant = game.avant || {};
    game.avant.initializationManager = initManager;

    console.log("🔧 AVANT DEBUG | game.avant after assignment:", game?.avant);
    console.log("🔧 AVANT DEBUG | game.avant.initializationManager exists:", !!game?.avant?.initializationManager);
    console.log("🔧 AVANT DEBUG | InitializationManager assigned successfully");

    // Register all services with dependency management
    FoundryInitializationHelper.registerFoundryServices(initManager);

    // Execute init phase with proper dependency management
    const initResult = await initManager.initializePhase('init');

    if (initResult.success) {
        console.log('Avant | System initialization complete - all services initialized successfully');

        // Debug: Show initialization status
        const status = initManager.getStatusReport();
        console.log('Avant | Initialization Status:', status);
    } else {
        console.error('Avant | System initialization failed:', initResult.error);
    }
});

/**
 * Once the entire VTT framework is initialized, set up additional features
 */
Hooks.once('ready', async function (): Promise<void> {
    console.log("Avant | System ready - setting up additional features with initialization manager");

    // Add debug logging to check if game.avant persists
    const game = (globalThis as any).game;
    console.log("🔧 AVANT DEBUG | During ready hook - game.avant exists:", !!game?.avant);
    console.log("🔧 AVANT DEBUG | During ready hook - initializationManager exists:", !!game?.avant?.initializationManager);
    console.log("🔧 AVANT DEBUG | game object properties:", Object.keys(game || {}));
    console.log("🔧 AVANT DEBUG | game.avant properties:", Object.keys(game?.avant || {}));

    try {
        // Get initialization manager instance (already exposed during init)
        const initManager = InitializationManager.getInstance();

        // Execute ready phase with proper dependency management
        const readyResult = await initManager.initializePhase('ready');

        if (readyResult.success) {
            console.log('Avant | System ready and fully configured - all ready services initialized');

            // Final status report
            const finalStatus = initManager.getStatusReport();
            console.log('Avant | Final Initialization Status:', finalStatus);


        } else {
            console.error('Avant | Ready phase failed:', readyResult.error);
        }

        // Set up Custom Traits compendium auto-creation
        setupCustomTraitsCompendiumBehavior();

        // Initialize commands module (chat commands and macros)
        const commandsModule = await initializeAvantCommands();

        // Attempt to create world-level trait macros (may fail in v13 due to timing)
        await commandsModule.createWorldMacros();

        // Initialize chat integration for talents and augments
        console.log("Avant | Initializing chat integration for talents and augments");
        const chatResult = initializeChatIntegration(game) as { success: boolean; api?: any; error?: string };
        if (chatResult.success) {
            console.log("✅ Avant | Chat integration initialized successfully");
            console.log("✅ Avant | Available chat API:", Object.keys(chatResult.api || {}));
            
            // Register unified actions hooks
            registerUnifiedActionsHooks();
            console.log("✅ Avant | Unified actions hooks registered successfully");
        } else {
            console.error("❌ Avant | Chat integration failed:", chatResult.error);
        }

        // CRITICAL DEBUG: Add comprehensive sheet opening tracking
        console.log('🚨 ACTOR SHEET DEBUG | Adding comprehensive sheet tracking hooks...');

        // Track ALL sheet attempts
        Hooks.on('renderActorSheet', (sheet: any, html: any, data: any) => {
            console.log('🚨 ACTOR SHEET DEBUG | renderActorSheet hook fired!');
            console.log('🚨 ACTOR SHEET DEBUG | Sheet class:', sheet.constructor.name);
            console.log('🚨 ACTOR SHEET DEBUG | Sheet instance:', sheet);
            console.log('🚨 ACTOR SHEET DEBUG | HTML element:', html);
            console.log('🚨 ACTOR SHEET DEBUG | Data:', data);
        });

        Hooks.on('preRenderActorSheet', (sheet: any, html: any, data: any) => {
            console.log('🚨 ACTOR SHEET DEBUG | preRenderActorSheet hook fired!');
            console.log('🚨 ACTOR SHEET DEBUG | Sheet class:', sheet.constructor.name);
            console.log('🚨 ACTOR SHEET DEBUG | Sheet instance:', sheet);
        });

        // Track sheet creation attempts
        Hooks.on('getActorSheetClass', (actor: any, options: any) => {
            console.log('🚨 SHEET CLASS DEBUG | getActorSheetClass fired!');
            console.log('🚨 SHEET CLASS DEBUG | Actor:', actor.name);
            console.log('🚨 SHEET CLASS DEBUG | Options:', options);
        });

        // Track when specific actors are clicked
        Hooks.on('renderApplication', (app: any, html: any, data: any) => {
            if (app?.document?.documentName === 'Actor') {
                console.log('🚨 ACTOR CLICK DEBUG | Actor application rendered!');
                console.log('🚨 ACTOR CLICK DEBUG | App constructor:', app?.constructor?.name);
                console.log('🚨 ACTOR CLICK DEBUG | Actor name:', app?.document?.name);
                console.log('🚨 ACTOR CLICK DEBUG | Actor type:', app?.document?.type);
                console.log('🚨 ACTOR CLICK DEBUG | HTML content present:', !!html && html.length > 0);
                console.log('🚨 ACTOR CLICK DEBUG | Sheet options:', app?.options);
            }
        });

        // Track when actors are clicked
        Hooks.on('renderActorDirectory', (app: any, html: any, data: any) => {
            console.log('🚨 DIRECTORY DEBUG | ActorDirectory rendered, adding click tracking...');
            html.find('.document-name').on('click', (event: any) => {
                console.log('🚨 DIRECTORY DEBUG | Actor clicked in directory!');
                console.log('🚨 DIRECTORY DEBUG | Target:', event.target);
                console.log('🚨 DIRECTORY DEBUG | Event:', event);
            });
        });

        // Provide fallback method accessible via console
        setupMacroFallback();

    } catch (error) {
        console.error('Avant | Error during ready phase:', error);
    }
});

/**
 * Set up custom behavior for the Custom Traits compendium
 * Automatically creates trait items without showing type selection dialog
 */
function setupCustomTraitsCompendiumBehavior(): void {
    console.log('🏷️ Avant | Setting up Custom Traits compendium auto-creation behavior');

    // Store reference to the active compendium for cross-hook communication
    let activeCustomTraitsCompendium: any = null;

    // Track when Custom Traits compendium is opened
    Hooks.on('renderCompendium', (app: any, html: any, data: any) => {
        if (app.collection?.metadata?.name === 'custom-traits') {
            console.log('🏷️ Avant | Custom Traits compendium opened - tracking for auto-creation');
            activeCustomTraitsCompendium = app.collection;

            // Add click listener to the Create Item button for debugging
            setTimeout(() => {
                try {
                    // Ensure html is a jQuery object
                    const $html = html.jquery ? html : $(html);

                    const createButton = $html.find('[data-action="create"], .create-entity, .item-create, .header-button.create').first();
                    if (createButton.length > 0) {
                        console.log('🏷️ Avant | Found Create Item button, adding debug listener');
                        createButton.off('click.avant-debug').on('click.avant-debug', (event: any) => {
                            console.log('🏷️ Avant | Create Item button clicked!', {
                                target: event.target,
                                currentTarget: event.currentTarget,
                                activeCompendium: !!activeCustomTraitsCompendium,
                                timestamp: new Date().toISOString()
                            });
                        });
                    } else {
                        console.log('🏷️ Avant | Could not find Create Item button in compendium');
                        console.log('🏷️ Available buttons:', $html.find('button, [data-action], .header-button').map((i: number, el: any) => ({
                            text: el.textContent,
                            classes: el.className,
                            dataAction: el.getAttribute('data-action')
                        })).get());
                    }
                } catch (error) {
                    console.warn('🏷️ Avant | Error setting up Create button listener:', error);
                }
            }, 100);
        } else {
            activeCustomTraitsCompendium = null;
        }
    });

    // Track ALL dialog renders for debugging
    Hooks.on('renderDialog', (dialog: any, html: any, data: any) => {
        try {
            // Ensure html is a jQuery object
            const $html = html.jquery ? html : $(html);

            console.log('🏷️ Avant | Dialog rendered:', {
                title: dialog?.data?.title,
                content: dialog?.data?.content?.substring(0, 100) + '...',
                hasActiveCompendium: !!activeCustomTraitsCompendium,
                compendiumName: activeCustomTraitsCompendium?.metadata?.name,
                dialogConstructor: dialog?.constructor?.name,
                htmlContent: $html?.html()?.substring(0, 200) + '...'
            });

            // Check if this is the item creation type selection dialog AND we're in Custom Traits
            if ((dialog?.data?.title?.includes('Create Item') || dialog?.data?.title?.includes('Item Type')) && activeCustomTraitsCompendium) {
                console.log('🏷️ Avant | Auto-handling trait creation dialog for Custom Traits compendium (v1 Dialog)');

                setTimeout(() => {
                    handleTraitCreationDialog($html);
                }, 10);
            }
        } catch (error) {
            console.warn('🏷️ Avant | Error in renderDialog hook:', error);
        }
    });

    // Also hook into ALL application renders for debugging
    Hooks.on('renderApplication', (app: any, html: any, data: any) => {
        if (activeCustomTraitsCompendium && (
            app?.constructor?.name?.includes('Dialog') ||
            app?.constructor?.name?.includes('Form') ||
            app?.constructor?.name?.includes('Create')
        )) {
            try {
                const $html = html.jquery ? html : $(html);
                console.log('🏷️ Avant | Application rendered (potential dialog):', {
                    constructorName: app?.constructor?.name,
                    title: app?.title || app?.data?.title,
                    hasActiveCompendium: !!activeCustomTraitsCompendium,
                    elementCount: $html?.length || 0,
                    htmlSnippet: $html?.html()?.substring(0, 150) + '...'
                });
            } catch (error) {
                console.warn('🏷️ Avant | Error in renderApplication hook:', error);
            }
        }
    });

    // Hook into FormApplication specifically 
    Hooks.on('renderFormApplication', (app: any, html: any, data: any) => {
        if (activeCustomTraitsCompendium) {
            try {
                const $html = html.jquery ? html : $(html);
                console.log('🏷️ Avant | FormApplication rendered:', {
                    constructorName: app?.constructor?.name,
                    title: app?.title || app?.data?.title,
                    hasActiveCompendium: !!activeCustomTraitsCompendium,
                    htmlSnippet: $html?.html()?.substring(0, 150) + '...'
                });
            } catch (error) {
                console.warn('🏷️ Avant | Error in renderFormApplication hook:', error);
            }
        }
    });

    // Hook into FoundryVTT v13 ApplicationV2 system
    Hooks.on('renderApplicationV2', (app: any, html: any, data: any) => {
        if (activeCustomTraitsCompendium) {
            try {
                const $html = html.jquery ? html : $(html);
                console.log('🏷️ Avant | ApplicationV2 rendered (v13):', {
                    constructorName: app?.constructor?.name,
                    title: app?.title || app?.options?.title,
                    hasActiveCompendium: !!activeCustomTraitsCompendium,
                    htmlSnippet: $html?.html()?.substring(0, 150) + '...'
                });

                // Check if this is a document creation dialog
                if (app?.constructor?.name?.includes('DocumentCreate') ||
                    app?.title?.includes('Create') ||
                    $html?.find('[name="type"]').length > 0) {

                    console.log('🏷️ Avant | Detected ApplicationV2 item creation dialog');

                    // Handle v13 item creation
                    setTimeout(() => {
                        handleTraitCreationDialog($html);
                    }, 10);
                }
            } catch (error) {
                console.warn('🏷️ Avant | Error in renderApplicationV2 hook:', error);
            }
        }
    });

    // Also try the specific v13 dialog hooks
    Hooks.on('renderDocumentCreate', (app: any, html: any, data: any) => {
        if (activeCustomTraitsCompendium) {
            try {
                const $html = html.jquery ? html : $(html);
                console.log('🏷️ Avant | DocumentCreate dialog rendered (v13):', {
                    constructorName: app?.constructor?.name,
                    documentType: app?.document?.documentName,
                    hasActiveCompendium: !!activeCustomTraitsCompendium
                });

                if (app?.document?.documentName === 'Item') {
                    console.log('🏷️ Avant | Item creation dialog detected via DocumentCreate hook');
                    setTimeout(() => {
                        handleTraitCreationDialog($html);
                    }, 10);
                }
            } catch (error) {
                console.warn('🏷️ Avant | Error in renderDocumentCreate hook:', error);
            }
        }
    });

    // Try some other specific v13 dialog hooks
    Hooks.on('renderDocumentSheetConfig', (app: any, html: any, data: any) => {
        if (activeCustomTraitsCompendium) {
            console.log('🏷️ Avant | DocumentSheetConfig rendered - might be item creation');
            try {
                const $html = html.jquery ? html : $(html);
                if ($html.find('[name="type"]').length > 0) {
                    setTimeout(() => handleTraitCreationDialog($html), 10);
                }
            } catch (error) {
                console.warn('🏷️ Avant | Error in renderDocumentSheetConfig hook:', error);
            }
        }
    });

    // Watch for any window/application that might be a creation dialog
    Hooks.on('renderWindow', (app: any, html: any, data: any) => {
        if (activeCustomTraitsCompendium) {
            try {
                const $html = html.jquery ? html : $(html);
                const hasTypeSelector = $html.find('[name="type"], select[name="documentType"]').length > 0;

                if (hasTypeSelector) {
                    console.log('🏷️ Avant | Window rendered with type selector - potential creation dialog:', {
                        constructorName: app?.constructor?.name,
                        title: app?.title
                    });

                    setTimeout(() => {
                        handleTraitCreationDialog($html);
                    }, 10);
                }
            } catch (error) {
                // Ignore errors in generic hook
            }
        }
    });

    /**
     * Handle trait creation dialog auto-selection
     */
    function handleTraitCreationDialog($html: any): void {
        try {
            // Find trait type selection elements
            const selectElement = $html.find('select[name="type"], select[name="documentType"]');
            const radioInputs = $html.find('input[name="type"], input[name="documentType"]');

            console.log('🏷️ Avant | Attempting to auto-select trait type:', {
                selectElements: selectElement.length,
                radioInputs: radioInputs.length,
                allSelects: $html.find('select').length,
                allInputs: $html.find('input').length
            });

            let traitSelected = false;

            // Try to select trait from dropdown
            if (selectElement.length > 0) {
                const traitOption = selectElement.find('option[value="trait"]');
                if (traitOption.length > 0) {
                    selectElement.val('trait').trigger('change');
                    traitSelected = true;
                    console.log('🏷️ Avant | Auto-selected trait from dropdown');
                } else {
                    console.log('🏷️ Avant | No trait option found in dropdown. Available options:',
                        selectElement.find('option').map((i: number, opt: any) => opt.value).get());
                }
            }

            // Try to select trait from radio buttons
            if (!traitSelected && radioInputs.length > 0) {
                const traitRadio = radioInputs.filter('[value="trait"]');
                if (traitRadio.length > 0) {
                    traitRadio.prop('checked', true).trigger('change');
                    traitSelected = true;
                    console.log('🏷️ Avant | Auto-selected trait from radio buttons');
                } else {
                    console.log('🏷️ Avant | No trait radio button found. Available values:',
                        radioInputs.map((i: number, input: any) => input.value).get());
                }
            }

            // Auto-submit if trait was selected
            if (traitSelected) {
                setTimeout(() => {
                    const submitButton = $html.find('button[data-action="create"], button[type="submit"], .dialog-button.ok, button:contains("Create")').first();
                    if (submitButton.length > 0) {
                        console.log('🏷️ Avant | Auto-submitting trait creation dialog');
                        submitButton.click();
                    } else {
                        console.warn('🏷️ Avant | Could not find submit button');
                        console.log('🏷️ Available buttons:', $html.find('button').map((i: number, btn: any) => btn.textContent?.trim()).get());
                    }
                }, 25);
            } else {
                console.warn('🏷️ Avant | Could not auto-select trait type - trait option not available');
            }
        } catch (error) {
            console.error('🏷️ Avant | Error in handleTraitCreationDialog:', error);
        }
    }

    // Global click listener for debugging
    setTimeout(() => {
        document.addEventListener('click', (event: any) => {
            if (activeCustomTraitsCompendium && event.target) {
                const target = event.target;
                const isCreateButton = target.textContent?.includes('Create') ||
                    target.getAttribute('data-action') === 'create' ||
                    target.getAttribute('data-action') === 'createEntry' ||
                    target.classList?.contains('create') ||
                    target.classList?.contains('item-create') ||
                    target.classList?.contains('create-entry');

                if (isCreateButton) {
                    console.log('🏷️ Avant | Global click listener - Create button detected:', {
                        text: target.textContent,
                        classes: target.className,
                        dataAction: target.getAttribute('data-action'),
                        parentElement: target.parentElement?.className,
                        hasActiveCompendium: !!activeCustomTraitsCompendium
                    });

                    // Enhanced debugging - watch for what happens next
                    setTimeout(() => {
                        console.log('🏷️ Avant | Checking for dialogs 100ms after create click...');

                        // Check for any visible dialogs or applications
                        const visibleWindows = document.querySelectorAll('.app.window-app:not([style*="display: none"])');
                        const dialogs = document.querySelectorAll('.dialog, .application');

                        console.log('🏷️ Avant | Post-click state:', {
                            visibleWindows: visibleWindows.length,
                            dialogs: dialogs.length,
                            windowApps: Array.from(visibleWindows).map(w => ({
                                id: w.id,
                                classes: w.className,
                                title: w.querySelector('.window-title')?.textContent
                            }))
                        });

                        // Check if any new applications were registered in FoundryVTT
                        const game = (globalThis as any).game;
                        if (game?.ui?.windows) {
                            console.log('🏷️ Avant | Active UI windows count:', Object.keys(game.ui.windows).length);
                        }
                    }, 100);

                    // Also check after a longer delay
                    setTimeout(() => {
                        console.log('🏷️ Avant | Checking for dialogs 500ms after create click...');

                        const newDialogs = document.querySelectorAll('.app.window-app:not([style*="display: none"])');
                        console.log('🏷️ Avant | Delayed check - visible windows:', newDialogs.length);

                        // Try to find any element with type selection
                        const typeSelectors = document.querySelectorAll('[name="type"], select[name="documentType"]');
                        if (typeSelectors.length > 0) {
                            console.log('🏷️ Avant | Found type selectors after delay! Count:', typeSelectors.length);
                            typeSelectors.forEach((selector, index) => {
                                console.log(`🏷️ Avant | Type selector ${index}:`, {
                                    name: selector.getAttribute('name'),
                                    value: (selector as any).value,
                                    parent: selector.parentElement?.className
                                });
                            });

                            // Try to handle the dialog we found
                            const $parent = $(typeSelectors[0]).closest('.app, .dialog, .window-app');
                            if ($parent.length > 0) {
                                console.log('🏷️ Avant | Attempting delayed trait selection...');
                                handleTraitCreationDialog($parent);
                            }
                        }
                    }, 500);
                }
            }
        }, true); // Use capture phase
    }, 1000);

    // Hook into the document creation workflow  
    Hooks.on('preCreateItem', (document: any, data: any, options: any, userId: string) => {
        console.log('🏷️ Avant | preCreateItem hook triggered:', {
            packName: options?.pack,
            packId: document?.pack?.id,
            type: data?.type,
            hasActiveCompendium: !!activeCustomTraitsCompendium
        });

        // Check multiple ways to detect Custom Traits compendium creation
        const isCustomTraitsCreation =
            options?.pack === 'world.custom-traits' ||
            document?.pack?.id === 'world.custom-traits' ||
            document?.pack?.metadata?.name === 'custom-traits' ||
            (activeCustomTraitsCompendium && activeCustomTraitsCompendium.metadata?.name === 'custom-traits');

        if (isCustomTraitsCreation) {
            console.log('🏷️ Avant | Auto-configuring trait creation in Custom Traits compendium');

            // Force the type to be 'trait'
            if (!data.type || data.type !== 'trait') {
                data.type = 'trait';
                console.log('🏷️ Avant | Forced item type to "trait"');
            }

            // Generate smart trait name if needed
            if (!data.name || data.name === 'New Item' || data.name === 'Item' || data.name === '') {
                const pack = activeCustomTraitsCompendium || game.packs.get('world.custom-traits');
                if (pack) {
                    const existingNames = Array.from(pack.index.values()).map((item: any) => item.name);
                    let traitNumber = 1;
                    let newName = 'New Trait';

                    while (existingNames.includes(newName)) {
                        traitNumber++;
                        newName = `New Trait ${traitNumber}`;
                    }

                    data.name = newName;
                    console.log(`🏷️ Avant | Generated unique trait name: "${newName}"`);
                }
            }

            // Apply default trait system data
            if (!data.system) {
                data.system = {};
            }

            const defaultTraitSystem = {
                color: '#00E0DC',
                icon: 'fas fa-tag',
                localKey: `CUSTOM.Trait.${data.name?.replace(/\s+/g, '') || 'NewTrait'}`,
                description: '',
                tags: [],
                rarity: 'common',
                effects: ''
            };

            // Merge defaults with any existing system data
            data.system = foundry.utils.mergeObject(defaultTraitSystem, data.system);
            console.log('🏷️ Avant | Applied default trait properties');
        }
    });

    // Hook to clear TraitProvider cache when traits are created, updated, or deleted
    async function refreshTraitProviderCache(action: string, item: any, options?: any) {
        try {
            // Check if this is a trait item in the custom traits compendium
            const isTraitInCustomPack =
                item.type === 'trait' ||
                (item.pack?.id === 'world.custom-traits') ||
                (item.pack?.metadata?.name === 'custom-traits') ||
                (options?.pack === 'world.custom-traits');

            if (isTraitInCustomPack) {
                console.log(`🏷️ Avant | Trait ${action}, refreshing TraitProvider cache...`);

                // Get the trait provider service and clear its cache
                const initManager = (globalThis as any).game?.avant?.initializationManager;
                if (initManager) {
                    const traitProvider = await initManager.waitForService('traitProvider');
                    if (traitProvider) {
                        traitProvider.clearCache();
                        console.log(`🏷️ Avant | TraitProvider cache cleared after trait ${action} - changes will now appear in autocomplete`);
                    } else {
                        console.warn('🏷️ Avant | TraitProvider service not available for cache clearing');
                    }
                } else {
                    console.warn('🏷️ Avant | InitializationManager not available for cache clearing');
                }
            }
        } catch (error) {
            console.warn(`🏷️ Avant | Error clearing TraitProvider cache after trait ${action}:`, error);
        }
    }

    Hooks.on('createItem', (item: any, options: any, userId: string) => {
        refreshTraitProviderCache('created', item, options);
    });

    Hooks.on('updateItem', (item: any, changes: any, options: any, userId: string) => {
        refreshTraitProviderCache('updated', item, options);
    });

    Hooks.on('deleteItem', (item: any, options: any, userId: string) => {
        refreshTraitProviderCache('deleted', item, options);
    });

    console.log('✅ Avant | Custom Traits compendium behavior configured');
}

/**
 * Extended Actor class for Avant Native
 * @extends {Actor}
 */
class AvantActor extends (globalThis as any).Actor {
    /** Actor system data */
    declare system: any; // Use any for now to avoid validation type conflicts

    /**
     * Prepare actor data
     * Calculate derived values and ensure data consistency
     * @override
     */
    prepareData(): void {
        super.prepareData();

        // Validate actor data and properly type the result
        const validatedSystem = ValidationUtils.validateActorData(this.system);
        this.system = validatedSystem;
    }

    /**
     * Prepare derived data
     * Called after base data preparation
     * @override
     */
    prepareDerivedData(): void {
        super.prepareDerivedData();

        // Call the data model's prepare derived data if it exists
        const systemWithPrepare = this.system as any;
        if (systemWithPrepare && typeof systemWithPrepare.prepareDerivedData === 'function') {
            systemWithPrepare.prepareDerivedData();
        }
    }

    /**
     * Get roll data for this actor
     * @returns Roll data for use in roll formulas
     * @override
     */
    getRollData(): Record<string, unknown> {
        const data = super.getRollData() as Record<string, unknown>;

        // Add commonly used roll data
        const systemData = this.system as any;
        if (systemData.attributes) {
            for (const [attributeName, attributeData] of Object.entries(systemData.attributes)) {
                const attribute = attributeData as any;
                data[attributeName] = attribute.modifier;
                data[`${attributeName}Mod`] = attribute.modifier;
            }
        }

        if (systemData.skills) {
            for (const [skillName, skillValue] of Object.entries(systemData.skills)) {
                data[skillName] = skillValue;
            }
        }

        data.level = systemData.level || 1;
        data.tier = systemData.tier || 1;
        data.effort = systemData.effort || 1;

        return data;
    }
}

/**
 * Extended Item class for Avant Native
 * @extends {Item}
 */
class AvantItem extends (globalThis as any).Item {
    /** Item system data */
    declare system: any; // Use any for now to avoid validation type conflicts
    /** Item type */
    declare type: string;
    /** Owning actor if this item is owned */
    declare actor: AvantActor | null;

    /**
     * Prepare item data
     * Validate and normalize item data
     * @override
     */
    prepareData(): void {
        super.prepareData();

        // Validate item data - pass the whole item data including type
        const validatedData = ValidationUtils.validateItemData({
            type: this.type,
            system: this.system
        });

        // Update system data with validated version, handling the Object type
        const validatedSystem = (validatedData as any).system;
        if (validatedSystem) {
            this.system = validatedSystem;
        }
    }

    /**
     * Get roll data for this item
     * @returns Roll data for use in roll formulas
     * @override
     */
    getRollData(): Record<string, unknown> {
        const data = super.getRollData() as Record<string, unknown>;

        // Add actor data if this item is owned
        if (this.actor) {
            const actorData = this.actor.getRollData();
            Object.assign(data, actorData);
        }

        return data;
    }

    /**
     * Handle item rolls
     * @returns The executed roll or void
     */
    async roll(): Promise<any | void> {
        // Default item roll behavior
        const roll = new Roll("1d20", this.getRollData());
        await roll.evaluate();

        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');

        await roll.toMessage({
            speaker,
            flavor: `${this.name} Roll`,
            rollMode,
        });

        return roll;
    }
}

// Type-safe global exposure for console access and module compatibility
interface AvantGlobals {
    AvantActorData: typeof AvantActorData;
    AvantActionData: typeof AvantActionData;
    AvantFeatureData: typeof AvantFeatureData;
    AvantTalentData: typeof AvantTalentData;
    AvantAugmentData: typeof AvantAugmentData;
    AvantWeaponData: typeof AvantWeaponData;
    AvantArmorData: typeof AvantArmorData;
    AvantGearData: typeof AvantGearData;
    AvantTraitData: typeof AvantTraitData;
    // AvantActorSheet and AvantItemSheet are now created by factory functions
    // AvantActorSheet: typeof AvantActorSheet;
    // AvantItemSheet: typeof AvantItemSheet;
    AvantRerollDialog: typeof AvantRerollDialog;
    AvantChatContextMenu: typeof AvantChatContextMenu;
    ValidationUtils: typeof ValidationUtils;
}

// Expose classes globally for console access and module compatibility
const avantGlobals: AvantGlobals = {
    AvantActorData,
    AvantActionData,
    AvantFeatureData,
    AvantTalentData,
    AvantAugmentData,
    AvantWeaponData,
    AvantArmorData,
    AvantGearData,
    AvantTraitData,
    // AvantActorSheet and AvantItemSheet are now created by factory functions
    // AvantActorSheet,
    // AvantItemSheet,
    AvantRerollDialog,
    AvantChatContextMenu,
    ValidationUtils
};

// Also expose our custom document classes globally for initialization manager
(globalThis as any).AvantActor = AvantActor;
(globalThis as any).AvantItem = AvantItem;

// Safely assign to globalThis
Object.assign(globalThis, avantGlobals);

/**
 * Setup fallback method for creating macros when game.macros is not available during init
 */
function setupMacroFallback(): void {
    // Expose a function to console that users can call manually
    (globalThis as any).createAvantTraitMacros = async function () {
        console.log('🏷️ Creating Avant Trait macros...');
        try {
            const commandsModule = await initializeAvantCommands();
            await commandsModule.createWorldMacros();
            console.log('✅ Avant Trait macros created successfully!');
            ui.notifications.info('✅ Avant command macros created in your Macro Directory!');
        } catch (error) {
            console.error('❌ Failed to create macros:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            ui.notifications.error(`❌ Failed to create macros: ${errorMessage}`);
        }
    };

    // Keep the old function name for backward compatibility
    (globalThis as any).createAvantTraitMacro = (globalThis as any).createAvantTraitMacros;

    console.log('🏷️ Avant | Macro fallback available: Run `createAvantTraitMacros()` in console if needed');
}

// createWorldTraitMacros function removed - replaced by commands module

console.log("Avant | System loaded successfully - all components imported and configured");