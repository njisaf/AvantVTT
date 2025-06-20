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
    constructor() {
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
        
        // Initialize non-async parts only in constructor
        logger.log('Avant Theme Manager | Constructor initialized');
    }
    
    /**
     * Initialize the theme manager (must be called manually after game is ready)
     */
    async init() {
        logger.log('Avant Theme Manager | Initializing');
        
        // Load saved theme preference (safely check if game.settings exists)
        this.currentTheme = (game.settings && game.settings.get('avant', 'selectedTheme')) || 'dark';
        logger.log('Avant Theme Manager | Loaded theme preference:', this.currentTheme);
        
        // Load custom themes from settings
        await this.loadCustomThemes();
        
        // Apply current theme immediately to any existing elements
        this.applyTheme(this.currentTheme);
        
        // Listen for application renders to apply themes
        Hooks.on('renderApplication', this.onRenderApplication.bind(this));
        
        // Also listen specifically for actor sheet renders
        Hooks.on('renderActorSheet', (app, html, data) => {
            logger.log('Avant Theme Manager | renderActorSheet hook triggered');
            if (app?.constructor?.name?.includes('Avant')) {
                logger.log('Avant Theme Manager | Applying theme to Avant actor sheet');
                setTimeout(() => {
                    this.applyTheme(this.currentTheme);
                    const appElement = app?.element?.[0] || app?.element;
                    if (appElement && appElement.classList && appElement.classList.contains('avant')) {
                        this.applyThemeToElement(appElement, this.currentTheme);
                    }
                }, 100);
            }
        });

        // Listen specifically for item sheet renders to apply theming
        Hooks.on('renderItemSheet', (app, html, data) => {
            logger.log('Avant Theme Manager | renderItemSheet hook triggered');
            if (app?.constructor?.name?.includes('Avant')) {
                logger.log('Avant Theme Manager | Applying theme to Avant item sheet');
                setTimeout(() => {
                    const appElement = app?.element?.[0] || app?.element;
                    if (appElement) {
                        // Ensure the element has the avant class for theming
                        if (!appElement.classList.contains('avant')) {
                            appElement.classList.add('avant');
                        }
                        this.applyThemeToElement(appElement, this.currentTheme);
                    }
                }, 50);
            }
        });
        
        // Listen for reroll dialog renders to apply theming immediately
        Hooks.on('renderApplication', (app, html, data) => {
            if (app?.constructor?.name === 'AvantRerollDialog') {
                logger.log('Avant Theme Manager | AvantRerollDialog detected, applying theme');
                setTimeout(() => {
                    const appElement = app?.element?.[0] || app?.element;
                    if (appElement) {
                        if (!appElement.classList.contains('avant')) {
                            appElement.classList.add('avant');
                        }
                        this.applyThemeToElement(appElement, this.currentTheme);
                    }
                }, 10); // Very short delay to prevent flicker
            }
        });
        
        // Force theme application when the DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                logger.log('Avant Theme Manager | DOM loaded, applying theme');
                setTimeout(() => this.applyTheme(this.currentTheme), 100);
            });
        } else {
            // DOM already loaded
            setTimeout(() => {
                logger.log('Avant Theme Manager | DOM already ready, applying theme');
                this.applyTheme(this.currentTheme);
            }, 100);
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
                const themeManager = game.avant?.themeManager;
                if (themeManager) {
                    themeManager.setTheme(value);
                }
            }
        });
        
        game.settings.register('avant', 'customThemes', {
            name: 'Custom Themes',
            scope: 'client',
            config: false,
            type: Object,
            default: {},
            onChange: value => {
                const themeManager = game.avant?.themeManager;
                if (themeManager) {
                    themeManager.loadCustomThemes();
                }
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
        
        const avantElements = document.querySelectorAll('.avant');
        logger.log(`Avant Theme Manager | Found ${avantElements.length} .avant elements`);
        
        avantElements.forEach(element => {
            logger.log(`Avant Theme Manager | Processing element:`, element);
            
            // Remove existing theme classes more thoroughly
            const classesToRemove = ['theme-dark', 'theme-light'];
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
        const theme = this.customThemes.get(themeId);
        if (!theme) return;
        
        // Generate CSS variables using pure function
        const variableMap = applyThemeVariables(theme);
        
        // Apply DOM manipulation
        for (const [cssVar, value] of Object.entries(variableMap)) {
            element.style.setProperty(cssVar, value);
        }
        
        logger.log(`Avant Theme Manager | Applied custom theme "${theme.name}" using pure function logic`);
    }
    
    /**
     * Set the active theme
     */
    async setTheme(themeId) {
        await game.settings.set('avant', 'selectedTheme', themeId);
        this.applyTheme(themeId);
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
        const savedThemes = game.settings.get('avant', 'customThemes') || {};
        this.customThemes.clear();
        
        for (const [id, theme] of Object.entries(savedThemes)) {
            this.customThemes.set(id, theme);
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
     * Handle application rendering to apply themes
     */
    onRenderApplication(app, html) {
        logger.log(`Avant Theme Manager | onRenderApplication called for:`, app?.constructor?.name);
        
        // Check if this is an Avant-related application
        const isAvantApp = app?.constructor?.name?.includes('Avant') || 
                          app?.element?.hasClass?.('avant') ||
                          (html && html.find && html.find('.avant').length > 0) ||
                          (html && html.hasClass && html.hasClass('avant'));
        
        if (isAvantApp) {
            logger.log(`Avant Theme Manager | Applying theme to ${app?.constructor?.name || 'application'}`);
            
            // Wait a tick to ensure DOM is ready, then apply theme
            setTimeout(() => {
                this.applyTheme(this.currentTheme);
                
                // Also apply directly to the application element if it has .avant class
                const appElement = app?.element?.[0] || app?.element;
                if (appElement && appElement.classList && appElement.classList.contains('avant')) {
                    logger.log(`Avant Theme Manager | Applying theme directly to app element:`, appElement);
                    this.applyThemeToElement(appElement, this.currentTheme);
                }
            }, 50); // Increased delay to ensure DOM is fully ready
        }
    }
    
    /**
     * Apply theme to a specific element
     */
    applyThemeToElement(element, themeId) {
        logger.log(`Avant Theme Manager | Applying theme ${themeId} to specific element:`, element);
        
        // Remove existing theme classes more thoroughly
        const classesToRemove = ['theme-dark', 'theme-light'];
        classesToRemove.forEach(className => {
            if (element.classList.contains(className)) {
                element.classList.remove(className);
                logger.log(`Avant Theme Manager | Removed class ${className} from element`);
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
            const themeClass = `theme-${themeId}`;
            element.classList.add(themeClass);
            logger.log(`Avant Theme Manager | Added class ${themeClass} to element`);
        } else if (this.customThemes.has(themeId)) {
            // Custom theme
            if (element.setAttribute) {
                element.setAttribute('data-theme', 'custom');
            }
            this.applyCustomTheme(element, themeId);
        }
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
        const themeManager = game.avant?.themeManager;
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
        await game.avant.themeManager.setTheme(themeId);
        this.render();
    }
    
    async _onThemeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            await game.avant.themeManager.uploadCustomTheme(file);
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
        game.avant.themeManager.exportTheme(themeId);
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
            await game.avant.themeManager.deleteCustomTheme(themeId);
            this.render();
        }
    }
} 