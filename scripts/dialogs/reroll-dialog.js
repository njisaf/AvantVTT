/**
 * @fileoverview Fortune Point Reroll Dialog for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Dialog for rerolling individual d10s using Fortune Points
 */

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
        
        // Extract d10 dice results from the original roll
        this.d10Results = this._extractD10Results(originalRoll);
        this.staticModifiers = this._extractStaticModifiers(originalRoll);
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
        const fortunePoints = this.actor.system.fortunePoints || 0;
        const maxRerolls = Math.min(this.d10Results.length, fortunePoints);
        
        return {
            d10Results: this.d10Results.map((result, index) => ({
                index: index,
                value: result.value,
                selected: this.selectedDice.has(index),
                wasRerolled: result.wasRerolled,
                canReroll: !result.wasRerolled // Cannot reroll if already rerolled
            })),
            selectedCount: this.selectedDice.size,
            fortunePoints: fortunePoints,
            maxRerolls: maxRerolls,
            canReroll: fortunePoints > 0 && this.selectedDice.size > 0,
            costMessage: this._getCostMessage(fortunePoints),
            originalTotal: this.originalRoll.total,
            originalFlavor: this.originalFlavor
        };
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
        const fortunePoints = this.actor.system.fortunePoints || 0;
        const selectedCount = this.selectedDice.size;
        
        if (selectedCount === 0) {
            ui.notifications.warn("Please select at least one die to reroll.");
            return;
        }
        
        if (selectedCount > fortunePoints) {
            ui.notifications.warn("Not enough Fortune Points!");
            return;
        }
        
        try {
            // Create new roll with rerolled dice
            const newRoll = await this._createReroll();
            
            // Deduct Fortune Points
            const newFortunePoints = Math.max(0, fortunePoints - selectedCount);
            await this.actor.update({
                "system.fortunePoints": newFortunePoints
            });
            
            // Post new roll to chat
            await newRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `${this.originalFlavor} (Rerolled with ${selectedCount} Fortune Point${selectedCount > 1 ? 's' : ''})`,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            
            ui.notifications.info(`Rerolled ${selectedCount} die with Fortune Points. Remaining: ${newFortunePoints}`);
            this.close();
            
        } catch (error) {
            console.error('Avant | Error in reroll:', error);
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
     * Extract d10 results from the original roll
     * @param {Roll} roll - The original roll
     * @returns {Array} Array of d10 die data with values and reroll status
     * @private
     */
    _extractD10Results(roll) {
        const d10Results = [];
        
        // Navigate through the roll terms to find d10 dice
        for (const term of roll.terms) {
            if (term instanceof foundry.dice.terms.Die && term.faces === 10) {
                // Extract individual die results with reroll status
                for (const result of term.results) {
                    if (result.active) {
                        d10Results.push({
                            value: result.result,
                            wasRerolled: result.rerolled || false
                        });
                    }
                }
            }
        }
        
        return d10Results;
    }
    
    /**
     * Extract static modifiers from the original roll (level, ability mod, etc.)
     * @param {Roll} roll - The original roll
     * @returns {number} Total static modifiers
     * @private
     */
    _extractStaticModifiers(roll) {
        let staticModifiers = 0;
        
        for (const term of roll.terms) {
            if (term instanceof foundry.dice.terms.NumericTerm) {
                staticModifiers += term.number;
            }
        }
        
        return staticModifiers;
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
        
        // Calculate new total
        const diceTotal = newD10Results.reduce((sum, die) => sum + die.value, 0);
        const newTotal = diceTotal + this.staticModifiers;
        
        // Create a new Roll object with the new results
        // We'll create a simple roll that represents the final result
        const rollFormula = `${newD10Results.map(die => die.value).join(' + ')} + ${this.staticModifiers}`;
        const roll = new Roll(rollFormula);
        
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
     * Generate cost message based on current Fortune Points
     * @param {number} fortunePoints - Current Fortune Points
     * @returns {string} Cost message
     * @private
     */
    _getCostMessage(fortunePoints) {
        if (fortunePoints === 0) {
            return "No Fortune Points available!";
        }
        
        const selectedCount = this.selectedDice.size;
        if (selectedCount === 0) {
            return `Select dice to reroll (${fortunePoints} Fortune Point${fortunePoints > 1 ? 's' : ''} available)`;
        }
        
        return `Reroll for ${selectedCount} Fortune Point${selectedCount > 1 ? 's' : ''}`;
    }
    
    /**
     * Apply theme to dialog immediately to prevent flickering
     * @private
     */
    _applyThemeToDialog() {
        // Get the dialog element
        const dialogElement = this.element?.[0] || this.element;
        
        if (dialogElement && game.avant?.themeManager) {
            console.log('Avant | Applying theme to reroll dialog');
            
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