/**
 * @fileoverview Fortune Point Reroll Dialog for Avant Native System
 * @version 2.1.0
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
export class AvantRerollDialog extends (globalThis as any).Application {
    /** The original roll to reroll from */
    private originalRoll: any;
    
    /** The actor using Fortune Points */
    private actor: any;
    
    /** The original roll's flavor text */
    private originalFlavor: string;
    
    /** Set of selected dice indices */
    private selectedDice: Set<number>;
    
    /** Extracted d10 results from the original roll */
    private d10Results: any[];
    
    /** Static modifiers from the original roll */
    private staticModifiers: number;

    /**
     * Create a new reroll dialog
     * @param originalRoll - The original roll to reroll from
     * @param actor - The actor using Fortune Points
     * @param rollName - Clean name of the roll (e.g. "New Weapon Attack")
     * @param options - Application options
     */
    constructor(
        originalRoll: any, 
        actor: any, 
        rollName: string, 
        options: any = {}
    ) {
        super(options);
        this.originalRoll = originalRoll;
        this.actor = actor;
        this.originalFlavor = rollName; // Store clean roll name
        this.selectedDice = new Set<number>();
        
        // Extract d10 dice results using pure functions
        this.d10Results = extractD10Results(originalRoll);
        this.staticModifiers = extractStaticModifiers(originalRoll);
    }
    
    /**
     * Define default options for the reroll dialog
     * @static
     * @returns Application configuration options
     * @override
     */
    static get defaultOptions(): any {
        const mergeObject = (globalThis as any).foundry?.utils?.mergeObject || Object.assign;
        return mergeObject(super.defaultOptions, {
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
     * @returns The context data for template rendering
     * @override
     */
    getData(): any {
        // Use pure functions to build dialog data
        const dialogData = buildDialogData(
            this.originalRoll,
            this.actor,
            this.d10Results,
            this.staticModifiers,
            this.originalFlavor
        ) as any;
        
        // Update with current selection state
        const updatedD10Results = dialogData.d10Results.map((result: any) => ({
            ...result,
            selected: this.selectedDice.has(result.index)
        }));
        
        const selectedCount = this.selectedDice.size;
        const canReroll = dialogData.fortunePoints > 0 && selectedCount > 0;
        const costMessage = getCostMessage(dialogData.fortunePoints, selectedCount);
        
        // Get the roll calculation from the Roll object
        const rollCalculation = this.originalRoll?.result || 'Unknown';
        const rollName = this.originalFlavor || 'Roll';
        
        return {
            ...dialogData,
            d10Results: updatedD10Results,
            selectedCount,
            canReroll,
            costMessage,
            rollCalculation,
            rollName
        };
    }
    
    /**
     * Activate event listeners for the dialog
     * @param html - The rendered HTML
     * @override
     */
    activateListeners(html: any): void {
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
     * @param event - The click event
     * @private
     */
    private async _onDieClick(event: Event): Promise<void> {
        const target = event.currentTarget as HTMLElement;
        const dieIndex = parseInt(target.dataset.index || '0');
        const fortunePoints = this.actor.system.fortunePoints || 0;
        const dieData = this.d10Results[dieIndex];
        
        // Prevent selection of already rerolled dice
        if (dieData?.wasRerolled) {
            (globalThis as any).ui?.notifications?.warn("This die has already been rerolled and cannot be rerolled again!");
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
                (globalThis as any).ui?.notifications?.warn("Not enough Fortune Points to select more dice!");
                return;
            }
        }
        
        // Use partial refresh to prevent theming flicker
        this._updateDiceSelection();
        this._updateButtonStates();
    }
    
    /**
     * Handle reroll confirmation
     * @param event - The click event
     * @private
     */
    private async _onRerollConfirm(event: Event): Promise<void> {
        const selectedDiceArray = Array.from(this.selectedDice);
        
        // Use pure function to validate the reroll request
        const validation = validateRerollRequest(
            { rolls: [this.originalRoll] }, // Mock message structure for validation
            this.actor,
            selectedDiceArray
        ) as any;
        
        if (!validation.isValid) {
            const notifications = (globalThis as any).ui?.notifications;
            notifications?.warn(validation.error);
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
                speaker: (globalThis as any).ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `${this.originalFlavor} (Rerolled with ${selectedCount} Fortune Point${selectedCount > 1 ? 's' : ''})`,
                rollMode: (globalThis as any).game.settings.get('core', 'rollMode'),
            });
            
            const notifications = (globalThis as any).ui?.notifications;
            notifications?.info(outcomeMessage);
            this.close();
            
        } catch (error) {
            logger.error('Avant | Error in reroll:', error);
            const notifications = (globalThis as any).ui?.notifications;
            notifications?.error(`Reroll failed: ${(error as Error).message}`);
        }
    }
    
    /**
     * Handle cancel button
     * @param event - The click event
     * @private
     */
    private _onCancel(event: Event): void {
        this.close();
    }
    
    /**
     * Create a new roll with rerolled dice
     * @returns New roll with rerolled dice
     * @private
     */
    private async _createReroll(): Promise<any> {
        const newD10Results = [...this.d10Results];
        
        // Reroll selected dice
        for (const dieIndex of this.selectedDice) {
            const Roll = (globalThis as any).Roll;
            const newRoll = await new Roll("1d10").evaluate();
            newD10Results[dieIndex] = {
                value: newRoll.total,
                wasRerolled: true, // Mark this die as rerolled
                index: dieIndex // Include index for type safety
            };
        }
        
        // Use pure function to build the formula
        const rollFormula = buildRerollFormula(newD10Results, this.staticModifiers);
        const Roll = (globalThis as any).Roll;
        const roll = new Roll(rollFormula);
        
        // Calculate new total
        const diceTotal = newD10Results.reduce((sum, die) => sum + die.value, 0);
        const newTotal = diceTotal + this.staticModifiers;
        
        // Manually set the evaluated state and total
        roll._evaluated = true;
        roll._total = newTotal;
        
        // Create the roll terms manually to show individual dice
        const diceTerms = [];
        const foundry = (globalThis as any).foundry;
        
        for (let i = 0; i < newD10Results.length; i++) {
            if (i > 0) {
                const OperatorTerm = foundry?.dice?.terms?.OperatorTerm;
                if (OperatorTerm) {
                    diceTerms.push(new OperatorTerm({ operator: '+' }));
                }
            }
            
            const DieTerm = foundry?.dice?.terms?.Die;
            if (DieTerm) {
                const dieTerm = new DieTerm({ 
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
        }
        
        if (this.staticModifiers !== 0) {
            const OperatorTerm = foundry?.dice?.terms?.OperatorTerm;
            const NumericTerm = foundry?.dice?.terms?.NumericTerm;
            
            if (OperatorTerm && NumericTerm) {
                diceTerms.push(new OperatorTerm({ operator: '+' }));
                diceTerms.push(new NumericTerm({ number: this.staticModifiers }));
            }
        }
        
        roll.terms = diceTerms;
        
        return roll;
    }
    
    /**
     * Apply theme to dialog immediately to prevent flickering
     * @private
     */
    private _applyThemeToDialog(): void {
        // Get the dialog element
        const dialogElement = this.element?.[0] || this.element;
        
        if (dialogElement && (globalThis as any).game.avant?.themeManager) {
            logger.log('Avant | Applying theme to reroll dialog');
            
            // Ensure the dialog has the avant class for theming
            if (!dialogElement.classList.contains('avant')) {
                dialogElement.classList.add('avant');
            }
            
            // Apply current theme directly to this dialog
            (globalThis as any).game.avant.themeManager.applyThemeToElement(
                dialogElement, 
                (globalThis as any).game.avant.themeManager.currentTheme
            );
        }
    }
    
    /**
     * Update dice selection visual states without full re-render
     * @private
     */
    private _updateDiceSelection(): void {
        const dialogElement = this.element?.[0] || this.element;
        if (!dialogElement) return;
        
        const diceElements = dialogElement.querySelectorAll('.reroll-die');
        
        diceElements.forEach((dieElement: any, index: number) => {
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
    private _updateButtonStates(): void {
        const dialogElement = this.element?.[0] || this.element;
        if (!dialogElement) return;
        
        const confirmButton = dialogElement.querySelector('.reroll-confirm') as HTMLButtonElement;
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