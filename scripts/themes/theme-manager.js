/**
 * Avant VTT Theme Manager
 * Handles theme switching, loading, and user theme uploads
 * FoundryVTT v13+ Only
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
        
        this.currentTheme = 'dark';
        this.customThemes = new Map();
        this.themeChangeCallbacks = new Set();
        
        // v13-only version properties - fixed values since we only support v13 now
        this.foundryVersion = 13;
        this.isV13 = true;
        
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
        
        // Try to load saved theme preference immediately in constructor
        try {
            // Try to load the saved theme preference early
            const savedTheme = game.settings?.get('avant', 'selectedTheme');
            if (savedTheme) {
                this.currentTheme = savedTheme;
                logger.log('Avant Theme Manager | Early theme load:', this.currentTheme);
            } else {
                this.currentTheme = 'dark';
                logger.log('Avant Theme Manager | Using default theme (constructor):', this.currentTheme);
            }
        } catch (error) {
            // If settings aren't ready yet, try localStorage as backup
            try {
                const localStorageTheme = localStorage.getItem('avant-theme-preference');
                if (localStorageTheme && (localStorageTheme === 'dark' || localStorageTheme === 'light')) {
                    this.currentTheme = localStorageTheme;
                    logger.log('Avant Theme Manager | Loaded theme from localStorage:', this.currentTheme);
                } else {
                    this.currentTheme = 'dark';
                    logger.log('Avant Theme Manager | Settings and localStorage not available, using default theme:', this.currentTheme);
                }
            } catch (localStorageError) {
                this.currentTheme = 'dark';
                logger.log('Avant Theme Manager | All theme loading methods failed, using default:', this.currentTheme);
            }
        }
        
        // Set up early theme application hooks immediately
        this.setupEarlyThemeHooks();
        
        // Apply theme to body immediately if it has .avant class
        if (document.body && document.body.classList.contains('avant')) {
            logger.log('Avant Theme Manager | Applying theme to body element in constructor');
            this.applyTheme(this.currentTheme);
        }
        
        // Initialize non-async parts only in constructor
        logger.log('Avant Theme Manager | Constructor initialized');
    }
    
    /**
     * Set up hooks that need to be active before init() is called
     * These hooks catch applications even before full initialization
     */
    setupEarlyThemeHooks() {
        // Critical early hook - catch ALL application renders before anything else
        Hooks.on('renderApplication', (app, html, data) => {
            // Check for Avant applications by multiple criteria
            const isAvantApp = app?.constructor?.name?.includes('Avant') || 
                              app?.element?.[0]?.classList?.contains('avant') ||
                              app?.element?.classList?.contains('avant') ||
                              (html && html.find && html.find('.avant').length > 0) ||
                              (html && html.hasClass && html.hasClass('avant'));
            
            if (isAvantApp) {
                logger.log('Avant Theme Manager | Early hook - applying theme for:', app?.constructor?.name);
                // Apply theme immediately with no delay to prevent light theme flashing
                this.applyTheme(this.currentTheme);
                
                // Also apply directly to the app element
                const appElement = app?.element?.[0] || app?.element;
                if (appElement && appElement.classList) {
                    // Remove any existing theme classes that might have been added
                    appElement.classList.remove('theme-light', 'theme-dark');
                    // Apply our current theme
                    this.applyThemeToElement(appElement, this.currentTheme);
                }
            }
        });
        
        // Actor sheet specific hook - highest priority
        Hooks.on('renderActorSheet', (app, html, data) => {
            // More robust detection: check for avant class in element or defaultOptions
            const isAvantSheet = app?.constructor?.name?.includes('Avant') ||
                                app?.constructor?.defaultOptions?.classes?.includes('avant') ||
                                app?.element?.[0]?.classList?.contains('avant') ||
                                app?.element?.classList?.contains('avant');
                                
            if (isAvantSheet) {
                logger.log('Avant Theme Manager | Early actor sheet hook triggered');
                // Immediate application with no timeout
                const appElement = app?.element?.[0] || app?.element;
                if (appElement && appElement.classList) {
                    // Force remove any light theme that might have been applied
                    appElement.classList.remove('theme-light');
                    // Ensure avant class is present
                    if (!appElement.classList.contains('avant')) {
                        appElement.classList.add('avant');
                    }
                    // Apply saved theme immediately
                    this.applyThemeToElement(appElement, this.currentTheme);
                }
            }
        });

        // Item sheet specific hook
        Hooks.on('renderItemSheet', (app, html, data) => {
            // More robust detection: check for avant class in element or defaultOptions
            const isAvantSheet = app?.constructor?.name?.includes('Avant') ||
                                app?.constructor?.defaultOptions?.classes?.includes('avant') ||
                                app?.element?.[0]?.classList?.contains('avant') ||
                                app?.element?.classList?.contains('avant');
                                
            if (isAvantSheet) {
                logger.log('Avant Theme Manager | Early item sheet hook triggered');
                const appElement = app?.element?.[0] || app?.element;
                if (appElement) {
                    // Force remove any light theme that might have been applied
                    if (appElement.classList) {
                        appElement.classList.remove('theme-light');
                        // Ensure the element has the avant class for theming
                        if (!appElement.classList.contains('avant')) {
                            appElement.classList.add('avant');
                        }
                    }
                    this.applyThemeToElement(appElement, this.currentTheme);
                }
            }
        });
        
        // Catch theme manager dialog specifically
        Hooks.on('renderApplication', (app, html, data) => {
            if (app?.constructor?.name === 'AvantThemeManagerApp') {
                logger.log('Avant Theme Manager | Early theme manager dialog hook');
                const appElement = app?.element?.[0] || app?.element;
                if (appElement) {
                    if (appElement.classList) {
                        appElement.classList.remove('theme-light');
                        if (!appElement.classList.contains('avant')) {
                            appElement.classList.add('avant');
                        }
                    }
                    this.applyThemeToElement(appElement, this.currentTheme);
                }
            }
        });
    }
    
    /**
     * Initialize the theme manager (must be called manually after game is ready)
     */
    async init() {
        logger.log('Avant Theme Manager | Initializing');
        
        // Re-check saved theme preference now that settings should be fully available
        try {
            const savedTheme = game.settings?.get('avant', 'selectedTheme');
            if (savedTheme && savedTheme !== this.currentTheme) {
                logger.log('Avant Theme Manager | Correcting theme during init:', savedTheme);
                this.currentTheme = savedTheme;
            }
            logger.log('Avant Theme Manager | Loaded saved theme preference:', this.currentTheme);
        } catch (error) {
            logger.log('Avant Theme Manager | Settings still not ready during init, keeping current theme:', this.currentTheme);
        }
        
        // Load custom themes from settings
        await this.loadCustomThemes();
        
        // Apply current theme immediately to any existing elements
        this.applyTheme(this.currentTheme);
        
        // Set up a setup hook to double-check theme once settings are fully loaded
        if (!this._settingsReadyHandled) {
            Hooks.once('setup', () => {
                logger.log('Avant Theme Manager | Setup hook - final theme check');
                try {
                    const actualSavedTheme = game.settings.get('avant', 'selectedTheme');
                    if (actualSavedTheme && actualSavedTheme !== this.currentTheme) {
                        logger.log('Avant Theme Manager | Final theme correction to saved preference:', actualSavedTheme);
                        this.currentTheme = actualSavedTheme;
                        this.applyTheme(this.currentTheme);
                    }
                } catch (error) {
                    logger.warn('Avant Theme Manager | Could not load theme preference on setup:', error);
                }
            });
            this._settingsReadyHandled = true;
        }
        
        // Force theme application when the DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                logger.log('Avant Theme Manager | DOM loaded, applying theme');
                this.applyTheme(this.currentTheme);
            });
        } else {
            // DOM already loaded - apply immediately
            logger.log('Avant Theme Manager | DOM already ready, applying theme');
            this.applyTheme(this.currentTheme);
        }
        
        // Add periodic theme application to catch any missed elements
        setTimeout(() => {
            logger.log('Avant Theme Manager | Performing delayed theme application (500ms)');
            this.applyTheme(this.currentTheme);
        }, 500);
        
        // Add a second delayed application to catch late-rendered elements
        setTimeout(() => {
            logger.log('Avant Theme Manager | Performing final delayed theme application (1000ms)');
            this.applyTheme(this.currentTheme);
        }, 1000);
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
     * Apply a theme to all Avant elements
     */
    applyTheme(themeId) {
        logger.log(`Avant Theme Manager | Applying theme: ${themeId}`);
        logger.log(`Avant Theme Manager | Found ${document.querySelectorAll('*').length} elements`);
        
        const avantElements = document.querySelectorAll('.avant, .themed');
        logger.log(`Avant Theme Manager | Found ${avantElements.length} .avant/.themed elements`);
        
        avantElements.forEach((element, index) => {
            // Remove existing theme classes more thoroughly, including 'themed' which causes FoundryVTT interference
            const classesToRemove = ['theme-dark', 'theme-light', 'theme-forest-green', 'themed'];
            classesToRemove.forEach(className => {
                if (element.classList.contains(className)) {
                    element.classList.remove(className);
                    logger.log(`Avant Theme Manager | Removed class: ${className}`);
                }
            });
            
            // Remove existing theme attribute
            if (element.removeAttribute) {
                element.removeAttribute('data-theme');
            }
            
            // Clear all custom theme CSS variables first
            this.clearCustomThemeVariables(element);
            
            if (this.builtInThemes[themeId]) {
                // Built-in theme
                logger.log(`Avant Theme Manager | Applying built-in theme: ${themeId}`);
                const themeClass = `theme-${themeId}`;
                element.classList.add(themeClass);
                logger.log(`Avant Theme Manager | Added class: ${themeClass}`);
                
                // Special handling for built-in themes with custom colors (like forest-green)
                if (this.builtInThemes[themeId].colors) {
                    this.applyCustomTheme(element, themeId);
                    logger.log(`🎨 Avant Theme Manager | Applied custom colors for built-in theme "${themeId}"`);
                }
            } else if (this.customThemes.has(themeId)) {
                // Custom theme
                logger.log(`Avant Theme Manager | Applying custom theme: ${themeId}`);
                if (element.setAttribute) {
                    element.setAttribute('data-theme', 'custom');
                }
                this.applyCustomTheme(element, themeId);
            }
        });
        
        this.currentTheme = themeId;
        this.notifyThemeChange(themeId);
        logger.log(`Avant Theme Manager | Theme ${themeId} applied successfully`);
    }
    
    /**
     * Clear all custom theme CSS variables from an element
     * Uses pure function logic with DOM manipulation wrapper
     */
    clearCustomThemeVariables(element) {
        // Get variables to clear using pure function
        const variablesToClear = clearThemeVariables();
        
        // Apply DOM manipulation
        variablesToClear.forEach(varName => {
            element.style.removeProperty(varName);
        });
        
        logger.log(`Avant Theme Manager | Cleared ${variablesToClear.length} custom variables from element`);
    }
    
    /**
     * Apply custom theme CSS variables
     * Uses pure function logic with DOM manipulation wrapper
     */
    applyCustomTheme(element, themeId) {
        // Get theme from custom themes or built-in themes
        const theme = this.customThemes.get(themeId) || this.builtInThemes[themeId];
        if (!theme) return;
        
        // Generate CSS variables using pure function
        const variableMap = applyThemeVariables(theme);
        
        // Apply DOM manipulation
        for (const [cssVar, value] of Object.entries(variableMap)) {
            element.style.setProperty(cssVar, value);
        }
        
        logger.log(`Avant Theme Manager | Applied theme "${theme.name}" using pure function logic`);
    }
    
    /**
     * Set the active theme
     */
    async setTheme(themeId) {
        try {
            logger.log(`Avant Theme Manager | Setting theme to: ${themeId}`);
            
            // Update the current theme immediately
            this.currentTheme = themeId;
            
            // Apply the theme to existing elements immediately - no delays
            this.applyTheme(themeId);
            
            // Force application to all .avant/.themed elements specifically
            const avantElements = document.querySelectorAll('.avant, .themed');
            avantElements.forEach(element => {
                // Remove any existing theme classes that might interfere
                element.classList.remove('theme-light', 'theme-dark');
                this.applyThemeToElement(element, themeId);
            });
            
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
                    await game.settings.set('avant', 'selectedTheme', themeId);
                    logger.log(`Avant Theme Manager | Theme successfully saved to FoundryVTT settings: ${themeId}`);
                } catch (settingsError) {
                    logger.warn('Avant Theme Manager | Could not save to FoundryVTT settings:', settingsError);
                    // localStorage backup already saved above
                }
            } else {
                logger.warn('Avant Theme Manager | FoundryVTT settings not available, using localStorage backup');
            }
            
            // Notify callbacks
            this.notifyThemeChange(themeId);
            
        } catch (error) {
            logger.error('Avant Theme Manager | Error setting theme:', error);
            // Still apply the theme even if saving fails
            this.currentTheme = themeId;
            this.applyTheme(themeId);
            this.notifyThemeChange(themeId);
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
            if (!this.validateTheme(theme)) {
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
    validateTheme(theme) {
        const validation = validateThemeStructure(theme);
        
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
        // by the early hooks in setupEarlyThemeHooks() to prevent timing issues
        logger.log(`Avant Theme Manager | Legacy onRenderApplication called for:`, app?.constructor?.name);
    }
    
    /**
     * Apply theme to a specific element
     * @param {HTMLElement} element - The element to apply theme to
     * @param {string} themeId - The theme ID to apply
     */
    applyThemeToElement(element, themeId) {
        if (!element) {
            logger.log('Avant Theme Manager | applyThemeToElement called with null element');
            return;
        }
        
        logger.log(`🎨 Avant Theme Manager | Applying theme ${themeId} to specific element:`, element);
        
        // Log current element state
        if (element.classList) {
            const currentClasses = Array.from(element.classList);
            logger.log(`🎨 Avant Theme Manager | Element classes BEFORE theme application:`, currentClasses);
        }
        
        // Add or ensure the element has the 'avant' class
        if (element.classList && !element.classList.contains('avant')) {
            element.classList.add('avant');
            logger.log('Avant Theme Manager | Added "avant" class to element');
        }
        
        // Remove existing theme classes more thoroughly, including 'themed' which causes FoundryVTT interference
        const classesToRemove = ['theme-dark', 'theme-light', 'theme-forest-green', 'themed'];
        classesToRemove.forEach(className => {
            if (element.classList && element.classList.contains(className)) {
                element.classList.remove(className);
                logger.log(`🎨 Avant Theme Manager | Removed class "${className}" from element`);
            }
        });
        
        // Clear theme attribute
        if (element.removeAttribute) {
            element.removeAttribute('data-theme');
        }
        
        // Clear existing theme variables
        this.clearCustomThemeVariables(element);
        
        if (this.builtInThemes[themeId]) {
            // Built-in theme
            const themeClass = `theme-${themeId}`;
            if (element.classList) {
                element.classList.add(themeClass);
                logger.log(`🎨 Avant Theme Manager | Added class "${themeClass}" to element`);
            }
            
            // Special handling for built-in themes with custom colors (like forest-green)
            if (this.builtInThemes[themeId].colors) {
                this.applyCustomTheme(element, themeId);
                logger.log(`🎨 Avant Theme Manager | Applied custom colors for built-in theme "${themeId}"`);
            }
        } else if (this.customThemes.has(themeId)) {
            // Custom theme
            if (element.setAttribute) {
                element.setAttribute('data-theme', 'custom');
            }
            this.applyCustomTheme(element, themeId);
            logger.log(`🎨 Avant Theme Manager | Applied custom theme "${themeId}" to element`);
        } else {
            logger.log(`🎨 Avant Theme Manager | Unknown theme ID: ${themeId}, applying default dark theme`);
            if (element.classList) {
                element.classList.add('theme-dark');
            }
        }
        
        // Log final element state
        if (element.classList) {
            const finalClasses = Array.from(element.classList);
            logger.log(`🎨 Avant Theme Manager | Element classes AFTER theme application:`, finalClasses);
        }
        
        logger.log(`🎨 Avant Theme Manager | ✅ Theme ${themeId} applied successfully to element`);
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
     * Get current theme (alias for currentTheme property)
     */
    getCurrentTheme() {
        return this.currentTheme;
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