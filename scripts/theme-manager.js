/**
 * Avant VTT Theme Manager
 * Handles theme switching, loading, and user theme uploads
 * Compatible with FoundryVTT v12 and v13
 */

import { ThemeConfigUtil } from './theme-config.js';

export class AvantThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.customThemes = new Map();
        this.themeChangeCallbacks = new Set();
        
        // Check Foundry version for compatibility
        this.foundryVersion = parseInt(game.version?.split('.')[0] || '12');
        this.isV13 = this.foundryVersion >= 13;
        
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
        
        this.init();
    }
    
    /**
     * Initialize the theme manager
     */
    async init() {
        console.log('Avant Theme Manager | Initializing for Foundry v' + this.foundryVersion);
        
        // Load saved theme preference
        this.currentTheme = game.settings.get('avant', 'selectedTheme') || 'dark';
        console.log('Avant Theme Manager | Loaded theme preference:', this.currentTheme);
        
        // Load custom themes from settings
        await this.loadCustomThemes();
        
        // Apply current theme immediately to any existing elements
        this.applyTheme(this.currentTheme);
        
        // Listen for application renders to apply themes
        Hooks.on('renderApplication', this.onRenderApplication.bind(this));
        
        // Also listen specifically for actor sheet renders
        Hooks.on('renderActorSheet', (app, html, data) => {
            console.log('Avant Theme Manager | renderActorSheet hook triggered');
            if (app?.constructor?.name?.includes('Avant')) {
                console.log('Avant Theme Manager | Applying theme to Avant actor sheet');
                setTimeout(() => {
                    this.applyTheme(this.currentTheme);
                    const appElement = app?.element?.[0] || app?.element;
                    if (appElement && appElement.classList && appElement.classList.contains('avant')) {
                        this.applyThemeToElement(appElement, this.currentTheme);
                    }
                }, 100);
            }
        });
        
        // Force theme application when the DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('Avant Theme Manager | DOM loaded, applying theme');
                setTimeout(() => this.applyTheme(this.currentTheme), 100);
            });
        } else {
            // DOM already loaded
            setTimeout(() => {
                console.log('Avant Theme Manager | DOM already ready, applying theme');
                this.applyTheme(this.currentTheme);
            }, 100);
        }
    }
    
    /**
     * Register game settings for themes - v12/v13 compatible
     */
    static registerSettings() {
        // Use appropriate merge function based on version
        const mergeFunction = foundry?.utils?.mergeObject || mergeObject;
        
        game.settings.register('avant', 'selectedTheme', {
            name: game.i18n?.localize('AVANT.settings.selectedTheme.name') || 'Selected Theme',
            hint: game.i18n?.localize('AVANT.settings.selectedTheme.hint') || 'Choose the active theme for Avant character sheets',
            scope: 'client',
            config: false, // We'll create a custom UI
            type: String,
            default: 'dark',
            onChange: value => {
                // Safe navigation for v12
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
     * Apply a theme to all Avant elements - v12/v13 compatible
     */
    applyTheme(themeId) {
        console.log(`Avant Theme Manager | Applying theme: ${themeId}`);
        
        const avantElements = document.querySelectorAll('.avant');
        console.log(`Avant Theme Manager | Found ${avantElements.length} .avant elements`);
        
        avantElements.forEach(element => {
            console.log(`Avant Theme Manager | Processing element:`, element);
            
            // Remove existing theme classes more thoroughly
            const classesToRemove = ['theme-dark', 'theme-light'];
            classesToRemove.forEach(className => {
                if (element.classList.contains(className)) {
                    element.classList.remove(className);
                    console.log(`Avant Theme Manager | Removed class: ${className}`);
                }
            });
            
            // V12 compatible attribute handling
            if (element.removeAttribute) {
                element.removeAttribute('data-theme');
            }
            
            // Clear all custom theme CSS variables first
            this.clearCustomThemeVariables(element);
            
            if (this.builtInThemes[themeId]) {
                // Built-in theme
                console.log(`Avant Theme Manager | Applying built-in theme: ${themeId}`);
                const themeClass = `theme-${themeId}`;
                element.classList.add(themeClass);
                console.log(`Avant Theme Manager | Added class: ${themeClass}`);
            } else if (this.customThemes.has(themeId)) {
                // Custom theme
                console.log(`Avant Theme Manager | Applying custom theme: ${themeId}`);
                if (element.setAttribute) {
                    element.setAttribute('data-theme', 'custom');
                }
                this.applyCustomTheme(element, themeId);
            }
        });
        
        this.currentTheme = themeId;
        this.notifyThemeChange(themeId);
        console.log(`Avant Theme Manager | Theme ${themeId} applied successfully`);
    }
    
    /**
     * Clear all custom theme CSS variables from an element
     * Now uses the centralized configuration for automatic variable discovery
     */
    clearCustomThemeVariables(element) {
        // Get all CSS variables from the configuration automatically
        const customVars = ThemeConfigUtil.getAllCSSVariables();
        
        customVars.forEach(varName => {
            element.style.removeProperty(varName);
        });
        
        console.log(`Avant Theme Manager | Cleared ${customVars.length} custom variables from element`);
    }
    
    /**
     * Apply custom theme CSS variables
     * Now uses the centralized configuration for automatic mapping
     */
    applyCustomTheme(element, themeId) {
        const theme = this.customThemes.get(themeId);
        if (!theme) return;
        
        // Get the automatic JSON-to-CSS mapping from configuration
        const mapping = ThemeConfigUtil.getJSONToCSSMapping();
        
        // Apply variables automatically based on configuration
        for (const [jsonPath, cssVar] of Object.entries(mapping)) {
            const value = ThemeConfigUtil.getNestedProperty(theme, jsonPath);
            if (value !== undefined && value !== null) {
                // Handle special cases for metadata that need quotes
                if (cssVar.includes('name') || cssVar.includes('author') || cssVar.includes('version')) {
                    element.style.setProperty(cssVar, `"${value}"`);
                } else {
                    element.style.setProperty(cssVar, value);
                }
            }
        }
        
        console.log(`Avant Theme Manager | Applied custom theme "${theme.name}" using configuration-based mapping`);
    }
    
    /**
     * Set the active theme
     */
    async setTheme(themeId) {
        await game.settings.set('avant', 'selectedTheme', themeId);
        this.applyTheme(themeId);
    }
    
    /**
     * Upload and install a custom theme - v12/v13 compatible
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
            console.error('Avant Theme Manager | Upload error:', error);
            if (ui.notifications) {
                ui.notifications.error(`Failed to upload theme: ${error.message}`);
            }
            throw error;
        }
    }
    
    /**
     * V12 compatible file reading
     */
    async readFileCompat(file) {
        // Modern browsers (including v12/v13 electron)
        if (file.text) {
            return await file.text();
        }
        
        // Fallback for older environments
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
    
    /**
     * Validate theme JSON structure
     * Now uses the centralized configuration for validation
     */
    validateTheme(theme) {
        const validation = ThemeConfigUtil.validateTheme(theme);
        
        if (!validation.isValid) {
            console.error('Avant Theme Manager | Theme validation failed:');
            validation.errors.forEach(error => {
                console.error(`  • ${error}`);
            });
        }
        
        return validation.isValid;
    }
    
    /**
     * Helper to get nested object properties
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
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
        console.log(`Avant Theme Manager | onRenderApplication called for:`, app?.constructor?.name);
        
        // Check if this is an Avant-related application
        const isAvantApp = app?.constructor?.name?.includes('Avant') || 
                          app?.element?.hasClass?.('avant') ||
                          (html && html.find && html.find('.avant').length > 0) ||
                          (html && html.hasClass && html.hasClass('avant'));
        
        if (isAvantApp) {
            console.log(`Avant Theme Manager | Applying theme to ${app?.constructor?.name || 'application'}`);
            
            // Wait a tick to ensure DOM is ready, then apply theme
            setTimeout(() => {
                this.applyTheme(this.currentTheme);
                
                // Also apply directly to the application element if it has .avant class
                const appElement = app?.element?.[0] || app?.element;
                if (appElement && appElement.classList && appElement.classList.contains('avant')) {
                    console.log(`Avant Theme Manager | Applying theme directly to app element:`, appElement);
                    this.applyThemeToElement(appElement, this.currentTheme);
                }
            }, 50); // Increased delay to ensure DOM is fully ready
        }
    }
    
    /**
     * Apply theme to a specific element
     */
    applyThemeToElement(element, themeId) {
        console.log(`Avant Theme Manager | Applying theme ${themeId} to specific element:`, element);
        
        // Remove existing theme classes more thoroughly
        const classesToRemove = ['theme-dark', 'theme-light'];
        classesToRemove.forEach(className => {
            if (element.classList.contains(className)) {
                element.classList.remove(className);
                console.log(`Avant Theme Manager | Removed class ${className} from element`);
            }
        });
        
        // V12 compatible attribute handling
        if (element.removeAttribute) {
            element.removeAttribute('data-theme');
        }
        
        // Clear all custom theme CSS variables first
        this.clearCustomThemeVariables(element);
        
        if (this.builtInThemes[themeId]) {
            // Built-in theme
            const themeClass = `theme-${themeId}`;
            element.classList.add(themeClass);
            console.log(`Avant Theme Manager | Added class ${themeClass} to element`);
        } else if (this.customThemes.has(themeId)) {
            // Custom theme
            if (element.setAttribute) {
                element.setAttribute('data-theme', 'custom');
            }
            this.applyCustomTheme(element, themeId);
        }
    }
    
    /**
     * V12 compatible callback notification
     */
    notifyThemeChange(themeId) {
        if (this.themeChangeCallbacks.forEach) {
            this.themeChangeCallbacks.forEach(callback => {
                try {
                    callback(themeId);
                } catch (error) {
                    console.warn('Avant Theme Manager | Theme change callback error:', error);
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
}

/**
 * Theme Manager Application UI - v12/v13 Compatible
 */
class AvantThemeManagerApp extends FormApplication {
    static get defaultOptions() {
        // V12/V13 compatible mergeObject
        const mergeFunction = foundry?.utils?.mergeObject || mergeObject;
        
        return mergeFunction(super.defaultOptions, {
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
     * V12 compatible event handling
     */
    activateListeners(html) {
        super.activateListeners(html);
        
        // V12 compatible jQuery usage
        const jq = html.find ? html : $(html);
        
        jq.find('.theme-select').click(this._onThemeSelect.bind(this));
        jq.find('.theme-upload').change(this._onThemeUpload.bind(this));
        jq.find('.theme-export').click(this._onThemeExport.bind(this));
        jq.find('.theme-delete').click(this._onThemeDelete.bind(this));
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
     * V12 compatible dialog confirmation
     */
    async _onThemeDelete(event) {
        event.preventDefault();
        const themeId = event.currentTarget.dataset.themeId;
        
        // V12/V13 compatible dialog
        const DialogClass = Dialog;
        const confirmed = await DialogClass.confirm({
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