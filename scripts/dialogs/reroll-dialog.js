/**
 * @fileoverview Fortune Point Reroll Dialog for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Dialog for rerolling individual d10s using Fortune Points
 */

import { logger } from '../utils/logger.js';
import {
    extractD10Results,
    extractStaticModifiers,
    buildDialogData,
    getCostMessage,
    validateRerollRequest,
    buildRerollFormula,
    formatOutcomeString,
    hasAvailableFortunePoints
} from '../logic/dialog-utils.js';

/**
 * Fortune Point Reroll Dialog
 * Allows players to reroll individual d10s from their previous roll
 * @class AvantRerollDialog
 * @extends {Application}
 * @description Provides UI for selecting dice to reroll with Fortune Points
 */
export class AvantRerollDialog extends Application {
    /**
     * Create a new reroll dialog
     * @param {Roll} originalRoll - The original roll to reroll from
     * @param {Actor} actor - The actor using Fortune Points
     * @param {string} originalFlavor - The original roll's flavor text
     * @param {Object} options - Application options
     */
    constructor(originalRoll, actor, originalFlavor, options = {}) {
        super(options);
        this.originalRoll = originalRoll;
        this.actor = actor;
        this.originalFlavor = originalFlavor;
        this.selectedDice = new Set();
        
        // Extract d10 dice results using pure functions
        this.d10Results = extractD10Results(originalRoll);
        this.staticModifiers = extractStaticModifiers(originalRoll);
    }
    
    /**
     * Define default options for the reroll dialog
     * @static
     * @returns {Object} Application configuration options
     * @override
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "avant-reroll-dialog",
            classes: ["avant", "dialog", "reroll-dialog"],
            title: "Fortune Point Reroll",
            template: "systems/avant/templates/reroll-dialog.html",
            width: 400,
            height: 300,
            resizable: false
        });
    }
    
    /**
     * Prepare data for rendering the dialog
     * @returns {Object} The context data for template rendering
     * @override
     */
    getData() {
        // Use pure functions to build dialog data
        const dialogData = buildDialogData(
            this.originalRoll,
            this.actor,
            this.d10Results,
            this.staticModifiers,
            this.originalFlavor
        );
        
        // Update with current selection state
        dialogData.d10Results = dialogData.d10Results.map(result => ({
            ...result,
            selected: this.selectedDice.has(result.index)
        }));
        
        dialogData.selectedCount = this.selectedDice.size;
        dialogData.canReroll = dialogData.fortunePoints > 0 && this.selectedDice.size > 0;
        dialogData.costMessage = getCostMessage(dialogData.fortunePoints, this.selectedDice.size);
        
        return dialogData;
    }
    
    /**
     * Activate event listeners for the dialog
     * @param {jQuery} html - The rendered HTML
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
        
        // Apply theme immediately after render to prevent flickering
        this._applyThemeToDialog();
        
        // Dice selection
        html.find('.reroll-die').click(this._onDieClick.bind(this));
        
        // Reroll button
        html.find('.reroll-confirm').click(this._onRerollConfirm.bind(this));
        
        // Cancel button
        html.find('.reroll-cancel').click(this._onCancel.bind(this));
    }
    
    /**
     * Handle die selection/deselection
     * @param {Event} event - The click event
     * @returns {Promise<void>}
     * @private
     */
    async _onDieClick(event) {
        const dieIndex = parseInt(event.currentTarget.dataset.index);
        const fortunePoints = this.actor.system.fortunePoints || 0;
        const dieData = this.d10Results[dieIndex];
        
        // Prevent selection of already rerolled dice
        if (dieData.wasRerolled) {
            ui.notifications.warn("This die has already been rerolled and cannot be rerolled again!");
            return;
        }
        
        if (this.selectedDice.has(dieIndex)) {
            // Deselect die
            this.selectedDice.delete(dieIndex);
        } else {
            // Select die if we have enough Fortune Points
            if (this.selectedDice.size < fortunePoints) {
                this.selectedDice.add(dieIndex);
            } else {
                ui.notifications.warn("Not enough Fortune Points to select more dice!");
                return;
            }
        }
        
        // Use partial refresh to prevent theming flicker
        this._updateDiceSelection();
        this._updateButtonStates();
    }
    
    /**
     * Handle reroll confirmation
     * @param {Event} event - The click event
     * @returns {Promise<void>}
     * @private
     */
    async _onRerollConfirm(event) {
        const selectedDiceArray = Array.from(this.selectedDice);
        
        // Use pure function to validate the reroll request
        const validation = validateRerollRequest(
            { rolls: [this.originalRoll] }, // Mock message structure for validation
            this.actor,
            selectedDiceArray
        );
        
        if (!validation.isValid) {
            ui.notifications.warn(validation.error);
            return;
        }
        
        try {
            const selectedCount = selectedDiceArray.length;
            const fortunePoints = this.actor.system.fortunePoints || 0;
            
            // Create new roll with rerolled dice
            const newRoll = await this._createReroll();
            
            // Calculate new fortune points
            const newFortunePoints = Math.max(0, fortunePoints - selectedCount);
            
            // Deduct Fortune Points
            await this.actor.update({
                "system.fortunePoints": newFortunePoints
            });
            
            // Use pure function to format outcome message
            const outcomeMessage = formatOutcomeString({
                diceCount: selectedCount,
                fortunePointsUsed: selectedCount,
                remainingPoints: newFortunePoints
            });
            
            // Post new roll to chat
            await newRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `${this.originalFlavor} (Rerolled with ${selectedCount} Fortune Point${selectedCount > 1 ? 's' : ''})`,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            
            ui.notifications.info(outcomeMessage);
            this.close();
            
        } catch (error) {
            logger.error('Avant | Error in reroll:', error);
            ui.notifications.error(`Reroll failed: ${error.message}`);
        }
    }
    
    /**
     * Handle cancel button
     * @param {Event} event - The click event
     * @private
     */
    _onCancel(event) {
        this.close();
    }
    
    /**
     * Create a new roll with rerolled dice
     * @returns {Promise<Roll>} New roll with rerolled dice
     * @private
     */
    async _createReroll() {
        const newD10Results = [...this.d10Results];
        
        // Reroll selected dice
        for (const dieIndex of this.selectedDice) {
            const newRoll = await new Roll("1d10").evaluate();
            newD10Results[dieIndex] = {
                value: newRoll.total,
                wasRerolled: true // Mark this die as rerolled
            };
        }
        
        // Use pure function to build the formula
        const rollFormula = buildRerollFormula(newD10Results, this.staticModifiers);
        const roll = new Roll(rollFormula);
        
        // Calculate new total
        const diceTotal = newD10Results.reduce((sum, die) => sum + die.value, 0);
        const newTotal = diceTotal + this.staticModifiers;
        
        // Manually set the evaluated state and total
        roll._evaluated = true;
        roll._total = newTotal;
        
        // Create the roll terms manually to show individual dice
        const diceTerms = [];
        for (let i = 0; i < newD10Results.length; i++) {
            if (i > 0) diceTerms.push(new foundry.dice.terms.OperatorTerm({ operator: '+' }));
            
            const dieTerm = new foundry.dice.terms.Die({ 
                number: 1, 
                faces: 10 
            });
            dieTerm.results = [{
                result: newD10Results[i].value,
                active: true,
                rerolled: newD10Results[i].wasRerolled
            }];
            dieTerm._evaluated = true;
            diceTerms.push(dieTerm);
        }
        
        if (this.staticModifiers !== 0) {
            diceTerms.push(new foundry.dice.terms.OperatorTerm({ operator: '+' }));
            diceTerms.push(new foundry.dice.terms.NumericTerm({ number: this.staticModifiers }));
        }
        
        roll.terms = diceTerms;
        
        return roll;
    }
    
    /**
     * Apply theme to dialog immediately to prevent flickering
     * @private
     */
    _applyThemeToDialog() {
        // Get the dialog element
        const dialogElement = this.element?.[0] || this.element;
        
        if (dialogElement && game.avant?.themeManager) {
            logger.log('Avant | Applying theme to reroll dialog');
            
            // Ensure the dialog has the avant class for theming
            if (!dialogElement.classList.contains('avant')) {
                dialogElement.classList.add('avant');
            }
            
            // Apply current theme directly to this dialog
            game.avant.themeManager.applyThemeToElement(dialogElement, game.avant.themeManager.currentTheme);
        }
    }
    
    /**
     * Update dice selection visual states without full re-render
     * @private
     */
    _updateDiceSelection() {
        const dialogElement = this.element?.[0] || this.element;
        if (!dialogElement) return;
        
        const diceElements = dialogElement.querySelectorAll('.reroll-die');
        
        diceElements.forEach((dieElement, index) => {
            const isSelected = this.selectedDice.has(index);
            
            if (isSelected) {
                dieElement.classList.add('selected');
            } else {
                dieElement.classList.remove('selected');
            }
        });
    }
    
    /**
     * Update button states without full re-render
     * @private
     */
    _updateButtonStates() {
        const dialogElement = this.element?.[0] || this.element;
        if (!dialogElement) return;
        
        const confirmButton = dialogElement.querySelector('.reroll-confirm');
        const fortunePoints = this.actor.system.fortunePoints || 0;
        const selectedCount = this.selectedDice.size;
        const canReroll = fortunePoints > 0 && selectedCount > 0;
        
        if (confirmButton) {
            confirmButton.disabled = !canReroll;
            
            // Update button text  
            const buttonIcon = '<i class="fas fa-dice"></i>';
            if (selectedCount > 0) {
                confirmButton.innerHTML = `${buttonIcon} Reroll ${selectedCount} (${selectedCount} FP)`;
            } else {
                confirmButton.innerHTML = `${buttonIcon} Select Dice`;
            }
        }
    }
} 