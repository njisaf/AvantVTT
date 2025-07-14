/**
 * @fileoverview Bulk Trait Management Dialog
 * @version 1.0.0 - Stage 5: Advanced Features
 * @description Dialog for bulk add/remove trait operations with virtualized UI
 * @author Avant VTT Team
 */

import { 
  addTraitsToList, 
  removeTraitsFromList, 
  groupTraitsByCategory,
  generateBulkOperationSummary,
  validateBulkSelectionConfig
} from '../logic/trait-bulk-utils.ts';
import { virtualizeList, calculateVirtualWindow } from '../logic/trait-utils.ts';
import { TraitProvider } from '../services/trait-provider.ts';
import type { Trait } from '../types/domain/trait.ts';
import type { 
  BulkTraitSelectionConfig,
  BulkTraitOperationResult 
} from '../logic/trait-bulk-utils.ts';

/**
 * Configuration for the bulk trait dialog
 */
export interface BulkTraitDialogConfig {
  /** Item being edited */
  item: any;
  
  /** TraitProvider instance for data access */
  traitProvider: TraitProvider;
  
  /** Current trait IDs on the item */
  currentTraits: string[];
  
  /** Callback when traits are updated */
  onUpdate: (newTraits: string[]) => Promise<void>;
  
  /** Dialog title */
  title?: string;
  
  /** Maximum dialog height */
  maxHeight?: number;
  
  /** Whether to use virtualization for large lists */
  useVirtualization?: boolean;
}

/**
 * Dialog for bulk trait management operations.
 * 
 * This dialog provides a checkbox list interface for managing multiple
 * traits at once, with search, category filtering, and virtualization
 * for performance with large trait sets.
 */
export class BulkTraitDialog extends (globalThis as any).Dialog {
  private config: BulkTraitDialogConfig;
  private availableTraits: Trait[] = [];
  private selectedTraits: Set<string> = new Set();
  private searchQuery: string = '';
  private categoryFilter: string = '';
  private isLoading: boolean = true;
  
  // Virtualization state
  private containerElement?: HTMLElement;
  private scrollTop: number = 0;
  private itemHeight: number = 32;
  private visibleStart: number = 0;
  private visibleEnd: number = 0;

  /**
   * Create a new BulkTraitDialog instance.
   * 
   * @param config - Configuration for the dialog
   */
  constructor(config: BulkTraitDialogConfig) {
    const dialogConfig = {
      title: config.title || 'Bulk Trait Management',
      content: '<div class="loading">Loading traits...</div>',
      buttons: {
        apply: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Apply Changes',
          callback: (html: any) => this._onApply(html)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
          callback: () => false
        }
      },
      default: 'apply',
      close: () => false,
      render: (html: any) => this._onRender(html)
    };
    
    super(dialogConfig);
    this.config = config;
    this.selectedTraits = new Set(config.currentTraits);
  }

  /**
   * Static factory method to create and show the dialog.
   * 
   * @param config - Configuration for the dialog
   * @returns Promise that resolves when dialog is closed
   */
  static async create(config: BulkTraitDialogConfig): Promise<void> {
    const dialog = new BulkTraitDialog(config);
    return dialog.render(true);
  }

  /**
   * Get the default dialog options.
   * 
   * @override
   */
  static get defaultOptions(): any {
    return {
      ...super.defaultOptions,
      classes: ['avant', 'dialog', 'bulk-trait-dialog'],
      width: 600,
      height: 500,
      resizable: true,
      template: 'systems/avant/templates/dialogs/bulk-trait-dialog.html'
    };
  }

  /**
   * Prepare dialog data for rendering.
   * 
   * @override
   */
  async getData(): Promise<any> {
    try {
      // Load available traits if not already loaded
      if (this.isLoading) {
        await this._loadTraits();
      }
      
      // Filter traits based on search and category
      const filteredTraits = this._filterTraits();
      
      // Group by category if enabled
      const grouped = groupTraitsByCategory(filteredTraits);
      const categories = Array.from(grouped.keys()).sort();
      
      // Prepare trait items for display
      const traitItems = filteredTraits.map(trait => ({
        id: trait.id,
        name: trait.name,
        color: trait.color,
        icon: trait.icon,
        description: trait.description || '',
        categories: trait.item.system.traitMetadata?.categories || [],
        selected: this.selectedTraits.has(trait.id),
        disabled: false
      }));
      
      // Calculate virtualization if enabled
      let virtualization = null;
      if (this.config.useVirtualization && traitItems.length > 50) {
        const containerHeight = this.config.maxHeight ? this.config.maxHeight - 200 : 300;
        const window = calculateVirtualWindow(
          this.scrollTop,
          containerHeight,
          this.itemHeight,
          traitItems.length,
          5 // buffer size
        );
        
        const virtualized = virtualizeList(
          traitItems,
          window.startIndex,
          window.endIndex,
          traitItems.length * this.itemHeight,
          this.itemHeight
        );
        
        virtualization = {
          ...virtualized,
          window,
          containerHeight,
          totalItems: traitItems.length
        };
      }
      
      return {
        item: this.config.item,
        availableTraits: traitItems,
        categories,
        selectedCount: this.selectedTraits.size,
        totalCount: filteredTraits.length,
        searchQuery: this.searchQuery,
        categoryFilter: this.categoryFilter,
        isLoading: this.isLoading,
        useVirtualization: this.config.useVirtualization && traitItems.length > 50,
        virtualization,
        config: {
          maxHeight: this.config.maxHeight || 500,
          showCategories: true,
          showSearch: true
        }
      };
      
    } catch (error) {
      console.error('Error preparing bulk trait dialog data:', error);
      return {
        item: this.config.item,
        availableTraits: [],
        categories: [],
        selectedCount: 0,
        totalCount: 0,
        isLoading: false,
        error: 'Failed to load trait data'
      };
    }
  }

  /**
   * Handle dialog rendering.
   * 
   * @private
   */
  private async _onRender(html: any): Promise<void> {
    try {
      // Set up event listeners
      this._activateListeners(html);
      
      // Initialize virtualization if enabled
      if (this.config.useVirtualization) {
        this._initializeVirtualization(html);
      }
      
      // Focus on search input with basic accessibility attributes
        const searchInput = html.find('.trait-search-input')[0] as HTMLInputElement;
        if (searchInput) {
            // Apply basic accessibility attributes directly
            if (!searchInput.hasAttribute('role')) {
                searchInput.setAttribute('role', 'searchbox');
            }
            if (!searchInput.hasAttribute('aria-label')) {
                searchInput.setAttribute('aria-label', 'Search traits for bulk operations');
            }
            if (!searchInput.hasAttribute('tabindex')) {
                searchInput.setAttribute('tabindex', '0');
            }
            
            // Focus the input
            searchInput.focus();
        }
      
    } catch (error) {
      console.error('Error rendering bulk trait dialog:', error);
    }
  }

  /**
   * Activate event listeners for the dialog.
   * 
   * @private
   */
  private _activateListeners(html: any): void {
    // Search input
    html.find('.trait-search-input').on('input', (event: Event) => {
      this.searchQuery = (event.target as HTMLInputElement).value;
      this._refreshContent();
    });
    
    // Category filter
    html.find('.trait-category-filter').on('change', (event: Event) => {
      this.categoryFilter = (event.target as HTMLSelectElement).value;
      this._refreshContent();
    });
    
    // Select all / none buttons
    html.find('.select-all-traits').on('click', () => {
      this._selectAllVisible();
    });
    
    html.find('.select-none-traits').on('click', () => {
      this._selectNone();
    });
    
    // Trait checkboxes
    html.find('.trait-checkbox').on('change', (event: Event) => {
      const checkbox = event.target as HTMLInputElement;
      const traitId = checkbox.dataset.traitId;
      if (traitId) {
        if (checkbox.checked) {
          this.selectedTraits.add(traitId);
        } else {
          this.selectedTraits.delete(traitId);
        }
        this._updateSelectedCount(html);
      }
    });
    
    // Virtualization scroll handler
    if (this.config.useVirtualization) {
      html.find('.trait-list-container').on('scroll', (event: Event) => {
        this.scrollTop = (event.target as HTMLElement).scrollTop;
        this._updateVirtualization(html);
      });
    }
  }

  /**
   * Load available traits from the provider.
   * 
   * @private
   */
  private async _loadTraits(): Promise<void> {
    try {
      this.isLoading = true;
      
      const result = await this.config.traitProvider.getAll({
        includeSystem: true,
        includeWorld: true
      });
      
      if (result.success && result.data) {
        this.availableTraits = result.data;
      } else {
        console.error('Failed to load traits:', result.error);
        this.availableTraits = [];
      }
      
      this.isLoading = false;
      
    } catch (error) {
      console.error('Error loading traits:', error);
      this.availableTraits = [];
      this.isLoading = false;
    }
  }

  /**
   * Filter traits based on current search and category filters.
   * 
   * @private
   */
  private _filterTraits(): Trait[] {
    let filtered = [...this.availableTraits];
    
    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(trait => 
        trait.name.toLowerCase().includes(query) ||
        (trait.description || '').toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (this.categoryFilter && this.categoryFilter !== 'all') {
      filtered = filtered.filter(trait => {
        const categories = trait.item.system.traitMetadata?.categories || [];
        return categories.includes(this.categoryFilter);
      });
    }
    
    return filtered;
  }

  /**
   * Refresh dialog content without re-rendering the entire dialog.
   * 
   * @private
   */
  private async _refreshContent(): Promise<void> {
    try {
      const data = await this.getData();
      const html = this.element;
      
      // Update trait list
      const traitListContainer = html.find('.trait-list-container');
      const newContent = await this._renderTraitList(data);
      traitListContainer.html(newContent);
      
      // Update counters
      html.find('.selected-count').text(data.selectedCount);
      html.find('.total-count').text(data.totalCount);
      
      // Re-activate listeners
      this._activateListeners(html);
      
    } catch (error) {
      console.error('Error refreshing bulk trait dialog content:', error);
    }
  }

  /**
   * Render the trait list HTML.
   * 
   * @private
   */
  private async _renderTraitList(data: any): Promise<string> {
    // This would normally use a Handlebars template
    // For now, generate HTML directly
    const traits = data.useVirtualization ? 
      data.virtualization.visibleItems : 
      data.availableTraits;
      
    let html = '';
    
    if (data.useVirtualization) {
      html += `<div style="height: ${data.virtualization.spacerTop}px;"></div>`;
    }
    
    for (const trait of traits) {
      html += `
        <div class="trait-item" data-trait-id="${trait.id}">
          <label class="trait-checkbox-label">
            <input type="checkbox" 
                   class="trait-checkbox" 
                   data-trait-id="${trait.id}"
                   ${trait.selected ? 'checked' : ''}>
            <span class="trait-chip" style="border-color: ${trait.color};">
              <i class="${trait.icon}"></i>
              ${trait.name}
            </span>
            ${trait.description ? `<span class="trait-description">${trait.description}</span>` : ''}
          </label>
        </div>
      `;
    }
    
    if (data.useVirtualization) {
      html += `<div style="height: ${data.virtualization.spacerBottom}px;"></div>`;
    }
    
    return html;
  }

  /**
   * Initialize virtualization for large trait lists.
   * 
   * @private
   */
  private _initializeVirtualization(html: any): void {
    this.containerElement = html.find('.trait-list-container')[0] as HTMLElement;
    if (this.containerElement) {
      this.containerElement.style.overflowY = 'auto';
      this.containerElement.style.maxHeight = `${this.config.maxHeight || 300}px`;
    }
  }

  /**
   * Update virtualization display based on scroll position.
   * 
   * @private
   */
  private _updateVirtualization(html: any): void {
    if (!this.config.useVirtualization) return;
    
    // This would trigger a re-render of just the visible items
    this._refreshContent();
  }

  /**
   * Select all visible traits.
   * 
   * @private
   */
  private _selectAllVisible(): void {
    const visible = this._filterTraits();
    for (const trait of visible) {
      this.selectedTraits.add(trait.id);
    }
    this._refreshContent();
  }

  /**
   * Deselect all traits.
   * 
   * @private
   */
  private _selectNone(): void {
    this.selectedTraits.clear();
    this._refreshContent();
  }

  /**
   * Update the selected count display.
   * 
   * @private
   */
  private _updateSelectedCount(html: any): void {
    html.find('.selected-count').text(this.selectedTraits.size);
  }

  /**
   * Handle apply button click.
   * 
   * @private
   */
  private async _onApply(html: any): Promise<boolean> {
    try {
      const currentTraits = this.config.currentTraits;
      const selectedTraits = Array.from(this.selectedTraits);
      
      // Calculate changes
      const toAdd = selectedTraits.filter(id => !currentTraits.includes(id));
      const toRemove = currentTraits.filter(id => !this.selectedTraits.has(id));
      
      let result: BulkTraitOperationResult;
      
      if (toAdd.length > 0 && toRemove.length > 0) {
        // Apply removals first, then additions
        const removeResult = removeTraitsFromList(currentTraits, toRemove);
        result = addTraitsToList(removeResult.traits, toAdd);
        result.removed = removeResult.removed;
      } else if (toAdd.length > 0) {
        result = addTraitsToList(currentTraits, toAdd);
      } else if (toRemove.length > 0) {
        result = removeTraitsFromList(currentTraits, toRemove);
      } else {
        // No changes
        return true;
      }
      
      if (result.success) {
        // Call the update callback
        await this.config.onUpdate(result.traits);
        
        // Show success message
        const summary = generateBulkOperationSummary(result);
        const ui = (globalThis as any).ui;
        if (ui && ui.notifications) {
          ui.notifications.info(summary);
        } else {
          console.log('Avant | Bulk operation success:', summary);
        }
        
        return true;
      } else {
        // Show error message
        const ui = (globalThis as any).ui;
        if (ui && ui.notifications) {
          ui.notifications.error(`Bulk operation failed: ${result.error}`);
        } else {
          console.error('Avant | Bulk operation failed:', result.error);
        }
        return false;
      }
      
    } catch (error) {
      console.error('Error applying bulk trait changes:', error);
      const ui = (globalThis as any).ui;
      if (ui && ui.notifications) {
        ui.notifications.error('Failed to apply trait changes');
      } else {
        console.error('Avant | Failed to apply trait changes:', error);
      }
      return false;
    }
  }
} 