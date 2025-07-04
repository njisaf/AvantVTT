/**
 * Avant VTT Theme Manager
 * Handles theme switching, loading, and user theme uploads
 * FoundryVTT v13+ Only with ApplicationV2 Support
 */

import { THEME_CONFIG } from './theme-config.js';
import { ThemeConfigUtil } from './theme-config-utils.js';
import { logger } from '../utils/logger.js';
import { 
    clearThemeVariables, 
    applyThemeVariables, 
    validateThemeStructure,
    getNestedProperty
} from '../logic/theme-utils.js';

export class AvantThemeManager {
    static _instance;

    static getInstance() {
        if (!AvantThemeManager._instance) {
            AvantThemeManager._instance = new AvantThemeManager();
        }
        return AvantThemeManager._instance;
    }
    
    constructor() {
        if (AvantThemeManager._instance) {
            return AvantThemeManager._instance;
        }
        AvantThemeManager._instance = this;
        
        this.currentTheme = 'dark';  // Default theme - will be overridden when settings load
        this.customThemes = new Map();
        this.themeChangeCallbacks = new Set();
        
        // v13-only version properties - fixed values since we only support v13 now
        this.foundryVersion = 13;
        this.isV13 = true;
        
        // 🎯 PERFORMANCE FIX: Add debouncing and caching to prevent cascading theme applications
        this._themeApplicationDebounce = new Map(); // Track debounced theme applications
        this._appliedThemes = new WeakMap(); // Cache applied themes to prevent re-application
        this._pendingApplications = new Set(); // Track elements pending theme application
        this._debounceDelay = 100; // 100ms debounce delay
        
        // Built-in themes
        this.builtInThemes = {
            dark: {
                name: 'Cyberpunk Dark',
                author: 'Avant VTT Team',
                version: '1.0.0',
                description: 'The original dark cyberpunk aesthetic',
                isBuiltIn: true
            },
            light: {
                name: 'Clean Light', 
                author: 'Avant VTT Team',
                version: '1.0.0',
                description: 'A clean, professional light theme',
                isBuiltIn: true
            }
        };
        
        // Initialize settings-independent components only
        this.setupThemeHooks();
        
        // Initialize non-async parts only in constructor
        logger.log('Avant Theme Manager | Constructor initialized with default theme - will load preference when settings available');
    }
    
    /**
     * Initialize theme manager with proper settings loading
     * This method should be called during the FoundryVTT 'ready' hook when settings are available
     * 
     * @returns {Promise<void>} Promise that resolves when theme manager is fully initialized
     * @description Properly loads saved theme preference and initializes the theme system
     */
    async initializeWithSettings() {
        console.log(`🎨 [THEME DEBUG] | ========== INITIALIZING THEME MANAGER WITH SETTINGS ==========`);
        logger.log('Avant Theme Manager | Initializing with settings access');
        
        try {
            // Load saved theme preference from FoundryVTT settings
            const savedTheme = await this._loadSavedThemePreference();
            console.log(`🎨 [THEME DEBUG] | Loaded saved theme preference: ${savedTheme}`);
            
            // Update current theme
            this.currentTheme = savedTheme;
            logger.log(`Avant Theme Manager | Theme preference loaded: ${savedTheme}`);
            
            // Load custom themes from settings
            await this.loadCustomThemes();
            
            // Apply the loaded theme to any existing elements
            console.log(`🎨 [THEME DEBUG] | Applying loaded theme to existing elements`);
            this.applyTheme(this.currentTheme);
            
            console.log(`🎨 [THEME DEBUG] | Theme Manager initialization with settings complete`);
            console.log(`🎨 [THEME DEBUG] | ========== THEME MANAGER READY ==========`);
            
            logger.log(`Avant Theme Manager | Fully initialized with theme: ${this.currentTheme}`);
            
        } catch (error) {
            console.error('🎨 [THEME DEBUG] | Error during theme manager initialization:', error);
            logger.error('Avant Theme Manager | Error during initialization:', error);
            
            // Fallback to default theme
            this.currentTheme = 'dark';
            this.applyTheme('dark');
            logger.log('Avant Theme Manager | Fallback to default dark theme due to initialization error');
        }
    }
    
    /**
     * Load saved theme preference from available storage
     * 
     * @returns {Promise<string>} The saved theme preference or default theme
     * @private
     * @description Loads theme preference from FoundryVTT settings with localStorage fallback
     */
    async _loadSavedThemePreference() {
        console.log(`🎨 [THEME DEBUG] | Loading saved theme preference from settings`);
        
        // Try FoundryVTT settings first (primary storage)
        try {
            if (game?.settings) {
                const settingsTheme = game.settings.get('avant', 'selectedTheme');
                if (settingsTheme && (settingsTheme === 'dark' || settingsTheme === 'light' || this.customThemes.has(settingsTheme))) {
                    console.log(`🎨 [THEME DEBUG] | Found theme in FoundryVTT settings: ${settingsTheme}`);
                    logger.log(`Avant Theme Manager | Loaded theme from settings: ${settingsTheme}`);
                    return settingsTheme;
                }
            }
        } catch (error) {
            console.warn(`🎨 [THEME DEBUG] | Could not load from FoundryVTT settings:`, error);
            logger.warn('Avant Theme Manager | Could not load from FoundryVTT settings:', error);
        }
        
        // Try localStorage as fallback
        try {
            const localStorageTheme = localStorage.getItem('avant-theme-preference');
            if (localStorageTheme && (localStorageTheme === 'dark' || localStorageTheme === 'light')) {
                console.log(`🎨 [THEME DEBUG] | Found theme in localStorage: ${localStorageTheme}`);
                logger.log(`Avant Theme Manager | Loaded theme from localStorage: ${localStorageTheme}`);
                return localStorageTheme;
            }
        } catch (error) {
            console.warn(`🎨 [THEME DEBUG] | Could not load from localStorage:`, error);
            logger.warn('Avant Theme Manager | Could not load from localStorage:', error);
        }
        
        // Default to dark theme
        console.log(`🎨 [THEME DEBUG] | No saved preference found, using default: dark`);
        logger.log('Avant Theme Manager | No saved preference found, using default theme: dark');
        return 'dark';
    }
    
    /**
     * Set up comprehensive theme hooks for both ApplicationV1 and ApplicationV2
     * This replaces the old setupEarlyThemeHooks method with better ApplicationV2 support
     */
    setupThemeHooks() {
        logger.log('Avant Theme Manager | Setting up comprehensive theme hooks for v13');
        
        // ============================================================================
        // APPLICATIONV2 THEME HOOKS (Primary for v13)
        // ============================================================================
        
        // Hook into ApplicationV2 render lifecycle - this is the main hook for v13
        Hooks.on('renderApplicationV2', (app, element, data) => {
            if (this.isAvantApplication(app, element)) {
                logger.log('Avant Theme Manager | ApplicationV2 render hook triggered for:', app?.constructor?.name);
                this.applyThemeToElement(element, this.currentTheme);
            }
        });
        
        // Additional ApplicationV2-specific hooks for specific sheet types
        Hooks.on('renderActorSheetV2', (app, element, data) => {
            if (this.isAvantApplication(app, element)) {
                logger.log('Avant Theme Manager | ActorSheetV2 render hook triggered');
                this.applyThemeToElement(element, this.currentTheme);
            }
        });
        
        Hooks.on('renderItemSheetV2', (app, element, data) => {
            if (this.isAvantApplication(app, element)) {
                logger.log('Avant Theme Manager | ItemSheetV2 render hook triggered');
                this.applyThemeToElement(element, this.currentTheme);
            }
        });
        
        Hooks.on('renderDocumentSheetV2', (app, element, data) => {
            if (this.isAvantApplication(app, element)) {
                logger.log('Avant Theme Manager | DocumentSheetV2 render hook triggered');
                this.applyThemeToElement(element, this.currentTheme);
            }
        });
        
        // ============================================================================
        // CHAT MESSAGE HOOKS (Critical for feature cards!)
        // ============================================================================
        
        // Hook into FoundryVTT v13 chat message rendering for feature cards
        Hooks.on('renderChatMessageHTML', (message, html) => {
            try {
                logger.log('Avant Theme Manager | Chat message HTML rendered, checking for feature cards');
                
                // Look for Avant feature cards within the chat message
                const featureCards = html.querySelectorAll('.avant-feature-card, .avant');
                
                if (featureCards.length > 0) {
                    logger.log(`Avant Theme Manager | Found ${featureCards.length} .avant elements in chat message`);
                    
                    featureCards.forEach((card, index) => {
                        logger.log(`Avant Theme Manager | Applying theme to chat feature card ${index + 1}/${featureCards.length}`);
                        this.applyThemeToElement(card, this.currentTheme);
                    });
                } else {
                    logger.log('Avant Theme Manager | No .avant elements found in chat message');
                }
                
            } catch (error) {
                logger.error('Avant Theme Manager | Error in renderChatMessageHTML hook:', error);
            }
        });
        
        // Hook into chat log rendering (backup for chat-related theming)
        Hooks.on('renderChatLog', (app, html, data) => {
            logger.log('Avant Theme Manager | Chat log rendered, checking for existing feature cards');
            
            try {
                // Apply themes to any existing feature cards in the chat log
                const existingCards = html.querySelectorAll('.avant-feature-card, .avant');
                if (existingCards.length > 0) {
                    logger.log(`Avant Theme Manager | Found ${existingCards.length} existing .avant elements in chat log`);
                    existingCards.forEach((card, index) => {
                        logger.log(`Avant Theme Manager | Applying theme to existing chat element ${index + 1}/${existingCards.length}`);
                        this.applyThemeToElement(card, this.currentTheme);
                    });
                }
            } catch (error) {
                logger.error('Avant Theme Manager | Error in renderChatLog hook:', error);
            }
        });
        
        // ============================================================================
        // LEGACY APPLICATION HOOKS (Fallback compatibility)
        // ============================================================================
        
        // Keep legacy hooks for any remaining ApplicationV1 components
        Hooks.on('renderApplication', (app, html, data) => {
            // Convert jQuery html to DOM element if needed
            const element = html?.[0] || html;
            if (this.isAvantApplication(app, element)) {
                logger.log('Avant Theme Manager | Legacy Application render hook triggered for:', app?.constructor?.name);
                this.applyThemeToElement(element, this.currentTheme);
            }
        });
        
        // ============================================================================
        // SPECIFIC HOOK FOR THEME MANAGER APP AND SETTINGS
        // ============================================================================
        
        // Hook specifically for AvantThemeManagerApp and AvantAccessibilitySettingsApp
        Hooks.on('renderFormApplication', (app, html, data) => {
            const element = html?.[0] || html;
            const isAvantSettingsApp = app?.constructor?.name === 'AvantThemeManagerApp' || 
                                       app?.constructor?.name === 'AvantAccessibilitySettingsApp' ||
                                       element?.classList?.contains('avant');
            
            if (isAvantSettingsApp) {
                logger.log('Avant Theme Manager | Settings application render hook triggered for:', app?.constructor?.name);
                console.log(`🎨 [THEME DEBUG] | Theming settings application: ${app?.constructor?.name}`);
                this.applyThemeToElement(element, this.currentTheme);
            }
        });
        
        Hooks.on('renderActorSheet', (app, html, data) => {
            const element = html?.[0] || html;
            if (this.isAvantApplication(app, element)) {
                logger.log('Avant Theme Manager | Legacy ActorSheet render hook triggered');
                this.applyThemeToElement(element, this.currentTheme);
            }
        });

        Hooks.on('renderItemSheet', (app, html, data) => {
            const element = html?.[0] || html;
            if (this.isAvantApplication(app, element)) {
                logger.log('Avant Theme Manager | Legacy ItemSheet render hook triggered');
                this.applyThemeToElement(element, this.currentTheme);
            }
        });
        
        // ============================================================================
        // HOOKS ONLY - Theme system setup is handled in init()
        // ============================================================================
        
        // Render hooks handle theme application when sheets actually render
        // No mutation observer or other setup needed here
        
        logger.log('Avant Theme Manager | All theme hooks registered successfully (including chat support)');
    }
    
    /**
     * Determine if an application is an Avant application that needs theming
     * Updated to be more comprehensive while still avoiding false positives
     */
    isAvantApplication(app, element = null) {
        // Get the element to check - prefer passed element, then app.element
        const targetElement = element || app?.element?.[0] || app?.element;
        
        // Check for Avant applications that need theming
        const checks = [
            // Constructor name checks - Avant sheet classes
            app?.constructor?.name === 'AvantActorSheet' || 
            app?.constructor?.name === 'AvantItemSheet',
            
            // Constructor name checks - Avant settings applications
            app?.constructor?.name === 'AvantThemeManagerApp' ||
            app?.constructor?.name === 'AvantAccessibilitySettingsApp',
            
            // Class-based checks for ApplicationV2 - look for specific Avant sheet classes
            app?.constructor?.DEFAULT_OPTIONS?.classes?.includes('avant') &&
            (app?.constructor?.DEFAULT_OPTIONS?.classes?.includes('sheet') ||
             app?.constructor?.DEFAULT_OPTIONS?.classes?.includes('actor') ||
             app?.constructor?.DEFAULT_OPTIONS?.classes?.includes('item') ||
             app?.constructor?.DEFAULT_OPTIONS?.classes?.includes('theme-manager') ||
             app?.constructor?.DEFAULT_OPTIONS?.classes?.includes('accessibility-settings')),
            
            // Element-based checks - has .avant class (more permissive)
            targetElement?.classList?.contains('avant'),
            
            // Template-based check - Avant templates
            (app?.template?.includes?.('actor-sheet') && app?.template?.includes?.('avant')) ||
            (app?.template?.includes?.('item-sheet') && app?.template?.includes?.('avant')) ||
            (app?.template?.includes?.('theme-manager') && app?.template?.includes?.('avant')) ||
            (app?.template?.includes?.('accessibility-settings') && app?.template?.includes?.('avant')),
            
            // ID-based check for specific Avant applications
            app?.id === 'avant-theme-manager' ||
            app?.id === 'avant-accessibility-settings'
        ];
        
        const isAvant = checks.some(check => Boolean(check));
        
        if (isAvant) {
            logger.log(`Avant Theme Manager | Detected Avant application: ${app?.constructor?.name || 'unknown'}`);
            console.log(`🎨 [THEME DEBUG] | Avant application detected - app: ${app?.constructor?.name}, element classes: ${targetElement?.className}`);
        }
        
        return isAvant;
    }
    
    /**
     * Initialize the theme manager
     * 
     * This method sets up the theme system with hooks for FoundryVTT sheet rendering.
     * No mutation observer needed - we only theme when sheets actually render.
     * 
     * @description Initializes the simplified theme system using only render hooks
     */
    async init() {
        logger.log('Avant Theme Manager | Initializing theme system...');
        console.log(`🎨 [THEME DEBUG] | ========== THEME MANAGER INITIALIZATION ==========`);
        
        // Load the current theme from settings properly
        try {
            const savedTheme = await this._loadSavedThemePreference();
            this.currentTheme = savedTheme;
            console.log(`🎨 [THEME DEBUG] | Current theme loaded from settings: ${this.currentTheme}`);
        } catch (error) {
            console.warn(`🎨 [THEME DEBUG] | Could not load theme from settings, using default:`, error);
            this.currentTheme = 'dark';
        }
        
        // Set up simplified theme system (no mutation observer)
        this._setupSimplifiedThemeSystem();
        
        // Apply theme to any existing Avant sheets
        this._applyThemeToExistingSheets();
        
        console.log(`🎨 [THEME DEBUG] | Theme Manager initialized successfully`);
        console.log(`🎨 [THEME DEBUG] | ========== THEME MANAGER READY ==========`);
        logger.log('Avant Theme Manager | Theme system ready');
    }
    
    /**
     * Apply theme to any existing Avant sheets
     * 
     * This method finds and themes any Avant sheets that are already in the DOM
     * during initialization. Much simpler than a mutation observer.
     * 
     * @private
     * @description Applies theme to existing .avant elements during initialization
     */
    _applyThemeToExistingSheets() {
        console.log(`🎨 [THEME DEBUG] | Checking for existing Avant sheets to theme`);
        
        const existingSheets = document.querySelectorAll('.avant');
        console.log(`🎨 [THEME DEBUG] | Found ${existingSheets.length} existing .avant elements`);
        
        if (existingSheets.length > 0) {
            existingSheets.forEach((sheet, index) => {
                console.log(`🎨 [THEME DEBUG] | Theming existing sheet ${index + 1}: ${sheet.tagName} with classes: ${sheet.className}`);
                this.applyThemeToElement(sheet, this.currentTheme);
            });
        }
        
        console.log(`🎨 [THEME DEBUG] | Existing sheets themed successfully`);
    }

    /**
     * Schedule theme applications (simplified)
     * 
     * This method is now much simpler - it just applies themes to current elements.
     * No more complex scheduling or mutation observation needed.
     * 
     * @description Simplified theme application for existing elements
     */
    scheduleThemeApplications() {
        console.log(`🎨 [THEME DEBUG] | Running simplified theme application`);
        
        // Just apply theme to any current .avant elements
        this._applyThemeToExistingSheets();
        
        logger.log('Avant Theme Manager | Simplified theme application completed');
    }
    
    /**
     * Cleanup method to remove observers when needed
     */
    cleanup() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
            logger.log('Avant Theme Manager | MutationObserver cleaned up');
        }
    }
    
    /**
     * Register game settings for themes
     */
    static registerSettings() {
        
        game.settings.register('avant', 'selectedTheme', {
            name: game.i18n?.localize('AVANT.settings.selectedTheme.name') || 'Selected Theme',
            hint: game.i18n?.localize('AVANT.settings.selectedTheme.hint') || 'Choose the active theme for Avant character sheets',
            scope: 'client',
            config: false, // We'll create a custom UI
            type: String,
            default: 'dark',
            onChange: value => {
                AvantThemeManager.getInstance().setTheme(value);
            }
        });
        
        game.settings.register('avant', 'customThemes', {
            name: 'Custom Themes',
            scope: 'client',
            config: false,
            type: Object,
            default: {},
            onChange: value => {
                AvantThemeManager.getInstance().loadCustomThemes();
            }
        });
        
        game.settings.registerMenu('avant', 'themeManager', {
            name: game.i18n?.localize('AVANT.settings.themeManager.name') || 'Theme Manager',
            label: game.i18n?.localize('AVANT.settings.themeManager.label') || 'Manage Themes',
            hint: game.i18n?.localize('AVANT.settings.themeManager.hint') || 'Switch themes and upload custom themes',
            icon: 'fas fa-palette',
            type: AvantThemeManagerApp,
            restricted: false
        });
    }
    
    /**
     * Register game settings for accessibility features
     * @static
     */
    static registerAccessibilitySettings() {
        // Auto-contrast setting - automatically generate accessible text colors for trait chips
        game.settings.register('avant', 'accessibility.autoContrast', {
            name: game.i18n?.localize('AVANT.settings.accessibility.autoContrast.name') || 'Auto-Contrast',
            hint: game.i18n?.localize('AVANT.settings.accessibility.autoContrast.hint') || 'Automatically generate accessible text colors that meet WCAG AA standards for trait chips and UI elements',
            scope: 'client',
            config: false,
            type: Boolean,
            default: false,
            onChange: value => {
                // Re-render any open sheets to apply new accessibility settings
                console.log(`Avant | Accessibility auto-contrast setting changed: ${value}`);
                
                // Trigger a hook for other components to react to accessibility changes
                if (typeof Hooks !== 'undefined' && Hooks.callAll) {
                    Hooks.callAll('avantAccessibilitySettingsChanged', {
                        autoContrast: value,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        // High contrast mode setting
        game.settings.register('avant', 'accessibility.highContrast', {
            name: game.i18n?.localize('AVANT.settings.accessibility.highContrast.name') || 'High Contrast Mode',
            hint: game.i18n?.localize('AVANT.settings.accessibility.highContrast.hint') || 'Enable high contrast mode for better visibility',
            scope: 'client',
            config: false,
            type: Boolean,
            default: false,
            onChange: value => {
                console.log(`Avant | Accessibility high contrast setting changed: ${value}`);
                
                // Apply high contrast changes immediately
                const elements = document.querySelectorAll('.avant');
                elements.forEach(element => {
                    if (value) {
                        element.classList.add('high-contrast');
                    } else {
                        element.classList.remove('high-contrast');
                    }
                });
                
                // Trigger accessibility change hook
                if (typeof Hooks !== 'undefined' && Hooks.callAll) {
                    Hooks.callAll('avantAccessibilitySettingsChanged', {
                        highContrast: value,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        // Reduced motion setting
        game.settings.register('avant', 'accessibility.reducedMotion', {
            name: game.i18n?.localize('AVANT.settings.accessibility.reducedMotion.name') || 'Reduced Motion',
            hint: game.i18n?.localize('AVANT.settings.accessibility.reducedMotion.hint') || 'Reduce animations and motion effects for better accessibility',
            scope: 'client',
            config: false,
            type: Boolean,
            default: false,
            onChange: value => {
                console.log(`Avant | Accessibility reduced motion setting changed: ${value}`);
                
                // Apply reduced motion changes immediately
                const elements = document.querySelectorAll('.avant');
                elements.forEach(element => {
                    if (value) {
                        element.classList.add('reduced-motion');
                    } else {
                        element.classList.remove('reduced-motion');
                    }
                });
                
                // Trigger accessibility change hook
                if (typeof Hooks !== 'undefined' && Hooks.callAll) {
                    Hooks.callAll('avantAccessibilitySettingsChanged', {
                        reducedMotion: value,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        // WCAG compliance level setting
        game.settings.register('avant', 'accessibility.contrastLevel', {
            name: game.i18n?.localize('AVANT.settings.accessibility.contrastLevel.name') || 'Contrast Level',
            hint: game.i18n?.localize('AVANT.settings.accessibility.contrastLevel.hint') || 'Set the WCAG contrast compliance level for accessibility features',
            scope: 'client',
            config: false,
            type: String,
            choices: {
                'AA': 'WCAG AA (4.5:1 normal, 3:1 large text)',
                'AAA': 'WCAG AAA (7:1 normal, 4.5:1 large text)'
            },
            default: 'AA',
            onChange: value => {
                console.log(`Avant | Accessibility contrast level setting changed: ${value}`);
                
                // Trigger accessibility change hook
                if (typeof Hooks !== 'undefined' && Hooks.callAll) {
                    Hooks.callAll('avantAccessibilitySettingsChanged', {
                        contrastLevel: value,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        // Accessibility settings menu
        game.settings.registerMenu('avant', 'accessibilitySettings', {
            name: game.i18n?.localize('AVANT.settings.accessibilitySettings.name') || 'Accessibility Settings',
            label: game.i18n?.localize('AVANT.settings.accessibilitySettings.label') || 'Configure Accessibility',
            hint: game.i18n?.localize('AVANT.settings.accessibilitySettings.hint') || 'Configure accessibility features for better usability',
            icon: 'fas fa-universal-access',
            type: AvantAccessibilitySettingsApp,
            restricted: false
        });
    }
    
    /**
     * Get all available themes
     */
    getAllThemes() {
        const themes = { ...this.builtInThemes };
        
        // Add custom themes
        for (const [id, theme] of this.customThemes) {
            themes[id] = { ...theme, isBuiltIn: false };
        }
        
        return themes;
    }
    
    /**
     * Apply theme to all matching elements in the document
     * 
     * This method finds all elements with the .avant class and applies the specified
     * theme to each one. Simple and direct - no batching or complex logic needed.
     * 
     * @param {string} themeId - The ID of the theme to apply
     * @description Applies the specified theme to all .avant elements in the document
     */
    applyTheme(themeId) {
        console.log(`🎨 [THEME DEBUG] | ========== SIMPLE THEME APPLICATION ==========`);
        console.log(`🎨 [THEME DEBUG] | Applying theme: ${themeId}`);
        logger.log(`Avant Theme Manager | Applying theme: ${themeId}`);
        
        // Find all .avant elements - this covers both sheets and feature cards
        const startTime = performance.now();
        const avantElements = document.querySelectorAll('.avant');
        const findTime = performance.now() - startTime;
        
        console.log(`🎨 [THEME DEBUG] | Found ${avantElements.length} .avant elements in ${findTime.toFixed(2)}ms`);
        
        if (avantElements.length === 0) {
            console.log(`🎨 [THEME DEBUG] | No .avant elements found - nothing to theme`);
            logger.log('Avant Theme Manager | No elements found to theme');
            return;
        }
        
        // Apply theme to each element
        let themedCount = 0;
        const applyStartTime = performance.now();
        
        avantElements.forEach((element, index) => {
            console.log(`🎨 [THEME DEBUG] | Theming element ${index + 1}/${avantElements.length}: ${element.tagName}`);
            this.applyThemeToElement(element, themeId);
            themedCount++;
        });
        
        const totalTime = performance.now() - applyStartTime;
        
        console.log(`🎨 [THEME DEBUG] | Theme application completed:`);
        console.log(`🎨 [THEME DEBUG] | - Elements themed: ${themedCount}`);
        console.log(`🎨 [THEME DEBUG] | - Total time: ${totalTime.toFixed(2)}ms`);
        console.log(`🎨 [THEME DEBUG] | - Average per element: ${(totalTime / themedCount).toFixed(2)}ms`);
        console.log(`🎨 [THEME DEBUG] | ========== THEME APPLICATION COMPLETE ==========`);
        
        logger.log(`Avant Theme Manager | Theme ${themeId} applied to ${themedCount} elements`);
    }
    
    /**
     * Clear custom theme CSS variables from an element
     * 
     * This method removes all custom CSS variables that were previously applied
     * to an element as part of theme customization.
     * 
     * @param {Element} element - The DOM element to clear variables from
     * @description Removes all custom theme CSS variables from the specified element
     */
    clearCustomThemeVariables(element) {
        console.log(`🎨 [THEME DEBUG] | clearCustomThemeVariables called`);
        
        const variablesToClear = [
            '--color-primary', '--color-secondary', '--color-accent', '--color-background',
            '--color-text', '--color-border', '--color-success', '--color-warning', '--color-error',
            '--font-display', '--font-primary', '--font-secondary', '--font-size-base'
        ];
        
        console.log(`🎨 [THEME DEBUG] | Clearing ${variablesToClear.length} CSS variables`);
        
        variablesToClear.forEach(varName => {
            element.style.removeProperty(varName);
        });
        
        logger.log(`Avant Theme Manager | Cleared ${variablesToClear.length} custom variables from element`);
    }
    
    /**
     * Apply theme to a specific element with performance optimizations
     * 
     * This method applies the current theme to a DOM element, with debouncing
     * to prevent excessive theme applications and caching to avoid redundant work.
     * 
     * @param {Element} element - The DOM element to apply the theme to
     * @param {string} themeId - The ID of the theme to apply
     * @description Performance-optimized theme application with debouncing and caching
     */
    applyThemeToElement(element, themeId) {
        console.log(`🎨 [THEME DEBUG] | applyThemeToElement called for theme: ${themeId}`);
        console.log(`🎨 [THEME DEBUG] | Element:`, element?.tagName, element?.className);
        
        if (!element) {
            console.warn('🎨 [THEME DEBUG] | No element provided to applyThemeToElement');
            return;
        }
        
        // Check if theme is already applied to prevent unnecessary work
        const cachedTheme = this._appliedThemes.get(element);
        if (cachedTheme === themeId) {
            console.log(`🎨 [THEME DEBUG] | Theme ${themeId} already applied to element, skipping`);
            return;
        }
        
        // Debounce rapid theme applications to the same element
        const elementKey = element.getAttribute('data-av-element-id') || this._generateElementId(element);
        const existingTimeout = this._themeApplicationDebounce.get(elementKey);
        
        if (existingTimeout) {
            console.log(`🎨 [THEME DEBUG] | Clearing existing timeout for element: ${elementKey}`);
            clearTimeout(existingTimeout);
        }
        
        console.log(`🎨 [THEME DEBUG] | Scheduling debounced theme application (${this._debounceDelay}ms delay)`);
        
        // Schedule debounced theme application
        const timeoutId = setTimeout(() => {
            console.log(`🎨 [THEME DEBUG] | Executing debounced theme application for element: ${elementKey}`);
            this._doApplyThemeToElement(element, themeId);
            this._themeApplicationDebounce.delete(elementKey);
        }, this._debounceDelay);
        
        this._themeApplicationDebounce.set(elementKey, timeoutId);
    }
    
    /**
     * Generate unique element ID for tracking theme applications
     * 
     * @param {Element} element - The DOM element to generate an ID for
     * @returns {string} Unique element ID
     * @private
     */
    _generateElementId(element) {
        const id = `av-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        element.setAttribute('data-av-element-id', id);
        console.log(`🎨 [THEME DEBUG] | Generated element ID: ${id}`);
        return id;
    }
    
    /**
     * Execute the actual theme application (called after debounce)
     * 
     * This method performs the actual DOM manipulation to apply the theme,
     * including class management, CSS variable application, and forced repaint.
     * 
     * @param {Element} element - The DOM element to apply the theme to
     * @param {string} themeId - The ID of the theme to apply
     * @private
     */
    _doApplyThemeToElement(element, themeId) {
        console.log(`🎨 [THEME DEBUG] | _doApplyThemeToElement starting for theme: ${themeId}`);
        console.log(`🎨 [THEME DEBUG] | Element classes before:`, element.className);
        
        // Add or ensure the element has the 'avant' class
        if (element.classList && !element.classList.contains('avant')) {
            element.classList.add('avant');
            console.log(`🎨 [THEME DEBUG] | Added 'avant' class to element`);
        }
        
        // Remove existing theme classes efficiently
        const classesToRemove = ['theme-dark', 'theme-light', 'theme-forest-green', 'themed'];
        const removedClasses = [];
        classesToRemove.forEach(className => {
            if (element.classList && element.classList.contains(className)) {
                element.classList.remove(className);
                removedClasses.push(className);
            }
        });
        
        if (removedClasses.length > 0) {
            console.log(`🎨 [THEME DEBUG] | Removed theme classes:`, removedClasses.join(', '));
        }
        
        // Clear theme attribute
        if (element.removeAttribute) {
            element.removeAttribute('data-theme');
            console.log(`🎨 [THEME DEBUG] | Cleared data-theme attribute`);
        }
        
        // Clear existing theme variables
        console.log(`🎨 [THEME DEBUG] | Clearing existing theme variables`);
        this.clearCustomThemeVariables(element);
        
        // Apply the theme
        console.log(`🎨 [THEME DEBUG] | Applying theme logic for: ${themeId}`);
        if (this.builtInThemes[themeId]) {
            // Built-in theme
            const themeClass = `theme-${themeId}`;
            if (element.classList) {
                element.classList.add(themeClass);
                console.log(`🎨 [THEME DEBUG] | Added built-in theme class: ${themeClass}`);
            }
            
            // Special handling for built-in themes with custom colors
            if (this.builtInThemes[themeId].colors) {
                console.log(`🎨 [THEME DEBUG] | Built-in theme has custom colors, applying custom theme`);
                this.applyCustomTheme(element, themeId);
            }
        } else if (this.customThemes.has(themeId)) {
            // Custom theme
            if (element.setAttribute) {
                element.setAttribute('data-theme', 'custom');
                console.log(`🎨 [THEME DEBUG] | Set data-theme="custom" for custom theme`);
            }
            this.applyCustomTheme(element, themeId);
        } else {
            // Default theme
            if (element.classList) {
                element.classList.add('theme-dark');
                console.log(`🎨 [THEME DEBUG] | Applied default theme (theme-dark)`);
            }
        }
        
        console.log(`🎨 [THEME DEBUG] | Element classes after theme application:`, element.className);
        
        // Force repaint to ensure CSS changes take effect
        console.log(`🎨 [THEME DEBUG] | Forcing repaint...`);
        this.forceRepaint(element);
        
        // Cache the applied theme to prevent re-application
        this._appliedThemes.set(element, themeId);
        console.log(`🎨 [THEME DEBUG] | Cached applied theme: ${themeId}`);
        
        console.log(`🎨 [THEME DEBUG] | Theme ${themeId} applied successfully to element`);
    }
    
    /**
     * Force a repaint of the element to ensure theme changes are applied
     * 
     * This method forces the browser to repaint an element by temporarily
     * manipulating its display property. Optimized for performance during
     * heavy DOM operations.
     * 
     * @param {Element} element - The element to repaint
     * @description Efficiently forces element repaint with minimal performance impact
     */
    forceRepaint(element) {
        console.log(`🎨 [THEME DEBUG] | forceRepaint called - optimizing for performance`);
        
        const repaintStartTime = performance.now();
        
        // Check if element is still in DOM before repainting
        if (!document.contains(element)) {
            console.log(`🎨 [THEME DEBUG] | Skipping repaint - element no longer in DOM`);
            return;
        }
        
        // Try efficient repaint methods first
        try {
            // Method 1: Use requestAnimationFrame for optimal timing
            if (typeof requestAnimationFrame !== 'undefined') {
                const originalTransform = element.style.transform;
                
                // Minimal transform change
                element.style.transform = originalTransform + ' translateZ(0)';
                
                requestAnimationFrame(() => {
                    // Restore original transform
                    element.style.transform = originalTransform;
                    
                    const repaintDuration = performance.now() - repaintStartTime;
                    console.log(`🎨 [THEME DEBUG] | Efficient repaint completed in ${repaintDuration.toFixed(2)}ms`);
                    
                    if (repaintDuration > 8) {
                        console.warn(`🎨 [THEME DEBUG] | SLOW EFFICIENT REPAINT: ${repaintDuration.toFixed(2)}ms - consider further optimization`);
                    }
                });
                
                return;
            }
        } catch (error) {
            console.warn(`🎨 [THEME DEBUG] | Efficient repaint failed, falling back to standard method:`, error);
        }
        
        // Fallback method: Standard display manipulation
        try {
            const originalDisplay = element.style.display;
            element.style.display = 'none';
            
            // Force layout calculation
            element.offsetHeight; // This forces reflow
            
            // Restore display
            element.style.display = originalDisplay;
            
            const repaintDuration = performance.now() - repaintStartTime;
            console.log(`🎨 [THEME DEBUG] | Standard repaint completed in ${repaintDuration.toFixed(2)}ms`);
            
            if (repaintDuration > 15) {
                console.error(`🎨 [THEME DEBUG] | VERY SLOW REPAINT: ${repaintDuration.toFixed(2)}ms - this may cause jerky performance`);
            } else if (repaintDuration > 8) {
                console.warn(`🎨 [THEME DEBUG] | SLOW REPAINT: ${repaintDuration.toFixed(2)}ms - performance impact possible`);
            }
            
        } catch (error) {
            console.error(`🎨 [THEME DEBUG] | Repaint failed:`, error);
        }
    }
    
    /**
     * Apply custom theme CSS variables to an element
     * 
     * This method applies custom CSS variables for themes, either built-in themes
     * with custom colors or fully custom themes uploaded by users.
     * 
     * @param {Element} element - The DOM element to apply custom theme variables to
     * @param {string} themeId - The ID of the theme to apply
     * @description Applies custom CSS variables for theme customization
     */
    applyCustomTheme(element, themeId) {
        console.log(`🎨 [THEME DEBUG] | applyCustomTheme called for theme: ${themeId}`);
        
        // Get theme from custom themes or built-in themes
        const theme = this.customThemes.get(themeId) || this.builtInThemes[themeId];
        if (!theme) {
            console.warn(`🎨 [THEME DEBUG] | No theme found with ID: ${themeId}`);
            return;
        }
        
        console.log(`🎨 [THEME DEBUG] | Found theme:`, theme.name, 'with colors:', !!theme.colors);
        
        // Generate CSS variables using pure function
        const variableMap = applyThemeVariables(theme);
        console.log(`🎨 [THEME DEBUG] | Generated ${Object.keys(variableMap).length} CSS variables`);
        
        // Apply CSS variables to the element
        let appliedCount = 0;
        for (const [cssVar, value] of Object.entries(variableMap)) {
            element.style.setProperty(cssVar, value, 'important');
            appliedCount++;
        }
        
        console.log(`🎨 [THEME DEBUG] | Applied ${appliedCount} CSS variables to element`);
        logger.log(`Avant Theme Manager | Applied theme "${theme.name}" to .avant element`);
    }
    
    /**
     * Set the active theme for the system
     * 
     * This method changes the currently active theme, applies it to all relevant
     * elements, and saves the preference to persistent storage.
     * 
     * @param {string} themeId - The ID of the theme to activate
     * @returns {Promise<void>} Promise that resolves when theme is set
     * @description Sets the active theme and applies it throughout the system
     */
    async setTheme(themeId) {
        try {
            console.log(`🎨 [THEME DEBUG] | setTheme called with: ${themeId}`);
            logger.log(`Avant Theme Manager | Setting theme to: ${themeId}`);
            
            // Update the current theme immediately
            const previousTheme = this.currentTheme;
            this.currentTheme = themeId;
            console.log(`🎨 [THEME DEBUG] | Current theme changed from ${previousTheme} to ${themeId}`);
            
            // Apply the theme to existing elements
            console.log(`🎨 [THEME DEBUG] | Applying theme to existing elements`);
            this.applyTheme(themeId);
            
            logger.log(`Avant Theme Manager | Theme set successfully`);
            
            // Save to persistence layers
            console.log(`🎨 [THEME DEBUG] | Saving theme preference`);
            this.saveTheme(themeId);
            
            // Notify theme change
            console.log(`🎨 [THEME DEBUG] | Notifying theme change callbacks`);
            this.notifyThemeChange(themeId);
            
        } catch (error) {
            console.error('🎨 [THEME DEBUG] | Error in setTheme:', error);
            logger.error('Avant Theme Manager | Error setting theme:', error);
            throw error;
        }
    }
    
    /**
     * Upload and install a custom theme
     */
    async uploadCustomTheme(file) {
        try {
            const text = await this.readFileCompat(file);
            const theme = JSON.parse(text);
            
            // Validate theme structure
            const isValid = await this.validateTheme(theme);
            if (!isValid) {
                throw new Error('Invalid theme format - please check the theme structure');
            }
            
            // Generate unique ID
            const themeId = `custom_${theme.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
            
            // Store theme
            this.customThemes.set(themeId, theme);
            
            // Save to settings
            await this.saveCustomThemes();
            
            if (ui.notifications) {
                ui.notifications.info(`Theme "${theme.name}" uploaded successfully!`);
            }
            
            return themeId;
        } catch (error) {
            logger.error('Avant Theme Manager | Upload error:', error);
            if (ui.notifications) {
                ui.notifications.error(`Failed to upload theme: ${error.message}`);
            }
            throw error;
        }
    }
    
    /**
     * Read file content
     */
    async readFileCompat(file) {
        return await file.text();
    }
    
    /**
     * Validate theme JSON structure
     * Uses pure function logic with logging wrapper
     */
    async validateTheme(theme) {
        const validation = await validateThemeStructure(theme);
        
        if (!validation.isValid) {
            logger.error('Avant Theme Manager | Theme validation failed:');
            validation.errors.forEach(error => {
                logger.error(`  • ${error}`);
            });
        }
        
        return validation.isValid;
    }
    
    // Note: getNestedProperty is now imported from logic/theme-utils.js
    
    /**
     * Load custom themes from game settings
     */
    async loadCustomThemes() {
        try {
            const savedThemes = game.settings?.get('avant', 'customThemes') || {};
            this.customThemes.clear();
            
            for (const [id, theme] of Object.entries(savedThemes)) {
                this.customThemes.set(id, theme);
            }
            
            logger.log(`Avant Theme Manager | Loaded ${this.customThemes.size} custom themes`);
        } catch (error) {
            // If settings aren't available yet, clear custom themes and log warning
            this.customThemes.clear();
            logger.log('Avant Theme Manager | Could not load custom themes (settings not ready)');
        }
    }
    
    /**
     * Save custom themes to game settings  
     */
    async saveCustomThemes() {
        const themesObj = {};
        for (const [id, theme] of this.customThemes) {
            themesObj[id] = theme;
        }
        await game.settings.set('avant', 'customThemes', themesObj);
    }
    
    /**
     * Delete a custom theme
     */
    async deleteCustomTheme(themeId) {
        if (this.customThemes.has(themeId)) {
            this.customThemes.delete(themeId);
            await this.saveCustomThemes();
            
            // Switch to default theme if this was active
            if (this.currentTheme === themeId) {
                await this.setTheme('dark');
            }
        }
    }
    
    /**
     * Export a theme as JSON
     */
    exportTheme(themeId) {
        const theme = this.customThemes.get(themeId);
        if (!theme) return null;
        
        const dataStr = JSON.stringify(theme, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${theme.name.replace(/\s+/g, '_')}.avant-theme.json`;
        link.click();
    }
    
    /**
     * Handle application rendering to apply themes (legacy method - now handled by early hooks)
     */
    onRenderApplication(app, html) {
        // This method is kept for compatibility but the actual work is now done
        // by the early hooks in setupThemeHooks() to prevent timing issues
        logger.log(`Avant Theme Manager | Legacy onRenderApplication called for:`, app?.constructor?.name);
    }
    
    /**
     * Notify callbacks of theme change
     */
    notifyThemeChange(themeId) {
        if (this.themeChangeCallbacks.forEach) {
            this.themeChangeCallbacks.forEach(callback => {
                try {
                    callback(themeId);
                } catch (error) {
                    logger.warn('Avant Theme Manager | Theme change callback error:', error);
                }
            });
        }
    }
    
    /**
     * Add callback for theme changes
     */
    onThemeChange(callback) {
        this.themeChangeCallbacks.add(callback);
    }
    
    /**
     * Remove theme change callback
     */
    offThemeChange(callback) {
        this.themeChangeCallbacks.delete(callback);
    }
    
    /**
     * Get current theme (loads from settings if not already loaded)
     * 
     * This method ensures the current theme is loaded from settings if it hasn't
     * been loaded yet, providing a reliable way to get the active theme.
     * 
     * @returns {string} The current theme ID
     * @description Gets the current theme, loading from settings if needed
     */
    getCurrentTheme() {
        // If we have a current theme set and it's not just the default, return it
        if (this.currentTheme && this.currentTheme !== 'dark') {
            return this.currentTheme;
        }
        
        // Try to load from FoundryVTT settings first
        try {
            if (game?.settings) {
                const settingsTheme = game.settings.get('avant', 'selectedTheme');
                if (settingsTheme && (settingsTheme === 'dark' || settingsTheme === 'light' || this.customThemes.has(settingsTheme))) {
                    console.log(`🎨 [THEME DEBUG] | getCurrentTheme loaded from settings: ${settingsTheme}`);
                    this.currentTheme = settingsTheme;
                    return settingsTheme;
                }
            }
        } catch (error) {
            console.warn(`🎨 [THEME DEBUG] | Could not load from FoundryVTT settings in getCurrentTheme:`, error);
        }
        
        // Try to load from localStorage as fallback
        try {
            const localStorageTheme = localStorage.getItem('avant-theme-preference');
            if (localStorageTheme && (localStorageTheme === 'dark' || localStorageTheme === 'light')) {
                console.log(`🎨 [THEME DEBUG] | getCurrentTheme loaded from localStorage: ${localStorageTheme}`);
                this.currentTheme = localStorageTheme;
                return localStorageTheme;
            }
        } catch (error) {
            console.warn(`🎨 [THEME DEBUG] | Could not load from localStorage in getCurrentTheme:`, error);
        }
        
        // Default to dark theme
        console.log(`🎨 [THEME DEBUG] | getCurrentTheme using default: dark`);
        this.currentTheme = 'dark';
        return 'dark';
    }
    
    /**
     * Import theme (alias for uploadCustomTheme)
     */
    async importTheme(file) {
        return await this.uploadCustomTheme(file);
    }
    
    /**
     * Apply custom theme variables to an element
     */
    applyCustomThemeVariables(theme) {
        const elements = document.querySelectorAll('.avant, [data-theme]');
        for (const element of elements) {
            if (theme.colors) {
                for (const [key, value] of Object.entries(theme.colors)) {
                    element.style.setProperty(`--color-${key}`, value);
                }
            }
            if (theme.fonts) {
                for (const [key, value] of Object.entries(theme.fonts)) {
                    element.style.setProperty(`--font-${key}`, value);
                }
            }
        }
    }
    
    /**
     * Load custom themes from settings (alias for loadCustomThemes)
     */
    async loadCustomThemesFromSettings() {
        return await this.loadCustomThemes();
    }
    
    /**
     * Save custom themes to settings (alias for saveCustomThemes)
     */
    async saveCustomThemesToSettings() {
        return await this.saveCustomThemes();
    }

    /**
     * Save theme to persistent storage
     * @param {string} themeId - Theme ID to save
     */
    saveTheme(themeId) {
        // Save to localStorage immediately for instant persistence
        try {
            localStorage.setItem('avant-theme-preference', themeId);
            logger.log(`Avant Theme Manager | Theme saved to localStorage: ${themeId}`);
        } catch (localStorageError) {
            logger.warn('Avant Theme Manager | Could not save to localStorage:', localStorageError);
        }
        
        // Try to save to FoundryVTT settings if available
        if (game.settings) {
            try {
                // Use async/await but don't block the UI
                game.settings.set('avant', 'selectedTheme', themeId).then(() => {
                    logger.log(`Avant Theme Manager | Theme successfully saved to FoundryVTT settings: ${themeId} ✅`);
                }).catch(settingsError => {
                    logger.warn('Avant Theme Manager | Could not save to FoundryVTT settings:', settingsError);
                });
            } catch (settingsError) {
                logger.warn('Avant Theme Manager | Could not save to FoundryVTT settings:', settingsError);
            }
        } else {
            logger.warn('Avant Theme Manager | FoundryVTT settings not available, using localStorage backup');
        }
    }

    /**
     * Set up simplified theme system without mutation observer overhead
     * 
     * Instead of watching every DOM change, we'll only apply themes when
     * FoundryVTT explicitly tells us a sheet is rendering.
     * 
     * @private
     * @description Sets up lightweight theme system using only render hooks
     */
    _setupSimplifiedThemeSystem() {
        console.log(`🎨 [THEME DEBUG] | Setting up SIMPLIFIED theme system (no mutation observer)`);
        
        // Remove the mutation observer entirely - it's causing more problems than it solves
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
            console.log(`🎨 [THEME DEBUG] | Disconnected mutation observer - good riddance!`);
        }
        
        // Clear any batching state since we're not using it anymore
        this._batchingState = null;
        
        console.log(`🎨 [THEME DEBUG] | Theme system simplified - only hooks will apply themes`);
    }
}

/**
 * Theme Manager Application UI
 */
class AvantThemeManagerApp extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'avant-theme-manager',
            title: game.i18n?.localize('AVANT.themeManager.title') || 'Avant Theme Manager',
            template: 'systems/avant/templates/theme-manager.html',
            width: 700,
            height: 600,
            classes: ['avant', 'theme-manager'],
            resizable: true,
            closeOnSubmit: false,
            submitOnChange: false
        });
    }
    
    getData() {
        const themeManager = AvantThemeManager.getInstance();
        if (!themeManager) {
            return { themes: [] };
        }
        
        const allThemes = themeManager.getAllThemes();
        const currentTheme = themeManager.currentTheme;
        
        return {
            themes: Object.entries(allThemes).map(([id, theme]) => ({
                id,
                ...theme,
                active: id === currentTheme,
                isCustom: !theme.isBuiltIn
            }))
        };
    }
    
    /**
     * Activate event listeners
     */
    activateListeners(html) {
        super.activateListeners(html);
        
        html.find('.theme-select').click(this._onThemeSelect.bind(this));
        html.find('.theme-upload').change(this._onThemeUpload.bind(this));
        html.find('.theme-export').click(this._onThemeExport.bind(this));
        html.find('.theme-delete').click(this._onThemeDelete.bind(this));
    }
    
    async _onThemeSelect(event) {
        event.preventDefault();
        const themeId = event.currentTarget.dataset.themeId;
        await AvantThemeManager.getInstance().setTheme(themeId);
        this.render();
    }
    
    async _onThemeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            await AvantThemeManager.getInstance().uploadCustomTheme(file);
            this.render();
        } catch (error) {
            // Error already handled in uploadCustomTheme
        }
        
        // Clear the input
        event.target.value = '';
    }
    
    _onThemeExport(event) {
        event.preventDefault();
        const themeId = event.currentTarget.dataset.themeId;
        AvantThemeManager.getInstance().exportTheme(themeId);
    }
    
    /**
     * Handle theme deletion with confirmation
     */
    async _onThemeDelete(event) {
        event.preventDefault();
        const themeId = event.currentTarget.dataset.themeId;
        
        const confirmed = await Dialog.confirm({
            title: game.i18n?.localize('AVANT.themeManager.deleteTitle') || 'Delete Theme',
            content: `<p>${game.i18n?.localize('AVANT.themeManager.deleteConfirm') || 'Are you sure you want to delete this theme? This action cannot be undone.'}</p>`,
            defaultYes: false
        });
        
        if (confirmed) {
            await AvantThemeManager.getInstance().deleteCustomTheme(themeId);
            this.render();
        }
    }
}

/**
 * Accessibility Settings Application UI (Placeholder)
 * Simple form application for configuring accessibility settings
 */
class AvantAccessibilitySettingsApp extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'avant-accessibility-settings',
            title: game.i18n?.localize('AVANT.accessibilitySettings.title') || 'Avant Accessibility Settings',
            template: 'systems/avant/templates/accessibility-settings.html',
            width: 600,
            height: 500,
            classes: ['avant', 'accessibility-settings'],
            resizable: true,
            closeOnSubmit: false,
            submitOnChange: true
        });
    }
    
    getData() {
        // Get current accessibility settings from game settings
        const data = {
            autoContrast: game.settings?.get('avant', 'accessibility.autoContrast') || false,
            highContrast: game.settings?.get('avant', 'accessibility.highContrast') || false,
            reducedMotion: game.settings?.get('avant', 'accessibility.reducedMotion') || false,
            contrastLevel: game.settings?.get('avant', 'accessibility.contrastLevel') || 'AA'
        };
        
        return data;
    }
    
    /**
     * Handle form submission - update settings
     */
    async _updateObject(event, formData) {
        console.log('Avant | Updating accessibility settings:', formData);
        
        // Update each setting individually with proper error handling
        const settingsToUpdate = [
            ['accessibility.autoContrast', 'autoContrast'],
            ['accessibility.highContrast', 'highContrast'], 
            ['accessibility.reducedMotion', 'reducedMotion'],
            ['accessibility.contrastLevel', 'contrastLevel']
        ];
        
        for (const [settingKey, formKey] of settingsToUpdate) {
            try {
                await game.settings.set('avant', settingKey, formData[formKey]);
                console.log(`Avant | Successfully updated ${settingKey}: ${formData[formKey]}`);
            } catch (error) {
                console.error(`Avant | Failed to update ${settingKey}:`, error);
                if (ui.notifications) {
                    ui.notifications.error(`Failed to update ${settingKey}: ${error.message}`);
                }
            }
        }
        
        // Show success message
        if (ui.notifications) {
            ui.notifications.info('Accessibility settings updated successfully!');
        }
    }
    
    /**
     * Activate event listeners for accessibility controls
     */
    activateListeners(html) {
        super.activateListeners(html);
        
        // Add any custom event listeners for accessibility controls here
        html.find('input[type="checkbox"], select').change(event => {
            // Auto-submit on change for immediate feedback
            this._onSubmit(event);
        });
    }
} 