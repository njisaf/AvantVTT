/**
 * Component Showcase Macro
 * 
 * A storybook-style macro that renders all form component partials for visual QA.
 * This macro creates a demo sheet showing all components with sample data.
 * 
 * @author Avant VTT Team
 * @version 2.0.0
 * @since Phase 2
 */

/**
 * Sample data for showcasing components
 */
interface ComponentShowcaseData {
  // Text field examples
  sampleText: string;
  sampleTextRequired: string;
  sampleTextLong: string;
  
  // Number field examples
  sampleNumber: number;
  sampleNumberWithMin: number;
  sampleNumberWithMax: number;
  
  // Select field examples
  sampleRarity: string;
  sampleAttribute: string;
  
  // Checkbox examples
  sampleCheckboxTrue: boolean;
  sampleCheckboxFalse: boolean;
  
  // Textarea examples
  sampleTextarea: string;
  sampleTextareaLong: string;
  
  // AP/PP examples
  sampleApCost: number;
  samplePpCost: number;
  
  // Color examples
  sampleColor: string;
  sampleIcon: string;
  
  // Uses examples
  currentUses: number;
  maxUses: number;
}

/**
 * Sample traits for trait chip demonstration
 */
const SAMPLE_TRAITS = [
  {
    id: 'fire',
    name: 'Fire',
    color: '#FF4500',
    textColor: '#FFFFFF',
    icon: 'fas fa-fire',
    description: 'This item has fire properties'
  },
  {
    id: 'ice',
    name: 'Ice',
    color: '#00BFFF',
    textColor: '#000000',
    icon: 'fas fa-snowflake',
    description: 'This item has ice properties'
  },
  {
    id: 'tech',
    name: 'Tech',
    color: '#00E0DC',
    textColor: '#000000',
    icon: 'fas fa-microchip',
    description: 'This item is technological'
  }
];

/**
 * Options for select fields
 */
const RARITY_OPTIONS = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'artifact', label: 'Artifact' }
];

const ATTRIBUTE_OPTIONS = [
  { value: 'might', label: 'Might' },
  { value: 'grace', label: 'Grace' },
  { value: 'intellect', label: 'Intellect' },
  { value: 'focus', label: 'Focus' }
];

/**
 * Gets sample data for the showcase
 */
function getSampleData(): ComponentShowcaseData {
  return {
    sampleText: 'Sample text value',
    sampleTextRequired: 'Required field value',
    sampleTextLong: 'This is a longer text value that demonstrates how the component handles longer content and wrapping behavior.',
    
    sampleNumber: 42,
    sampleNumberWithMin: 5,
    sampleNumberWithMax: 95,
    
    sampleRarity: 'rare',
    sampleAttribute: 'might',
    
    sampleCheckboxTrue: true,
    sampleCheckboxFalse: false,
    
    sampleTextarea: 'This is sample textarea content that spans multiple lines and shows how the component handles longer form content.',
    sampleTextareaLong: 'This is a much longer textarea content example that demonstrates the resize behavior and how the component handles extensive content. It should wrap properly and maintain readability even with longer paragraphs of text that a user might enter when describing complex game mechanics or detailed item descriptions.',
    
    sampleApCost: 2,
    samplePpCost: 15,
    
    sampleColor: '#FF5733',
    sampleIcon: 'fas fa-sword',
    
    currentUses: 3,
    maxUses: 5
  };
}

/**
 * Renders the component showcase template
 */
async function renderComponentShowcase(): Promise<string> {
  const sampleData = getSampleData();
  
  const showcaseTemplate = `
<div class="avant component-showcase" style="padding: 20px; max-width: 800px; margin: 0 auto;">
  <header style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid var(--color-primary, #00E0DC); padding-bottom: 15px;">
    <h1 style="color: var(--color-primary, #00E0DC); font-family: 'Orbitron', monospace; margin: 0;">
      🎨 Avant Component Showcase
    </h1>
    <p style="margin: 5px 0 0; color: var(--color-text-secondary, #6c757d); font-style: italic;">
      Visual QA for reusable form components
    </p>
  </header>

  <div class="showcase-grid" style="display: grid; gap: 30px;">
    
    <!-- Text Fields Section -->
    <section class="showcase-section">
      <h2 style="color: var(--color-primary, #00E0DC); margin-bottom: 15px;">📝 Text Fields</h2>
      <div style="display: grid; gap: 15px;">
        {{> shared/partials/text-field 
            name="sample.text"
            value="${sampleData.sampleText}"
            label="Basic Text Field"
            placeholder="Enter text..."
            hint="This is a basic text input field"
        }}
        
        {{> shared/partials/text-field 
            name="sample.textRequired"
            value="${sampleData.sampleTextRequired}"
            label="Required Text Field"
            placeholder="Required field..."
            required=true
            hint="This field is required and marked with an asterisk"
        }}
        
        {{> shared/partials/text-field 
            name="sample.textLong"
            value="${sampleData.sampleTextLong}"
            label="Long Text Field"
            maxlength=200
            hint="This field has a maximum length of 200 characters"
        }}
      </div>
    </section>

    <!-- Number Fields Section -->
    <section class="showcase-section">
      <h2 style="color: var(--color-primary, #00E0DC); margin-bottom: 15px;">🔢 Number Fields</h2>
      <div style="display: grid; gap: 15px;">
        {{> shared/partials/number-field 
            name="sample.number"
            value=${sampleData.sampleNumber}
            label="Basic Number Field"
            hint="Any numeric value"
        }}
        
        {{> shared/partials/number-field 
            name="sample.numberMin"
            value=${sampleData.sampleNumberWithMin}
            label="Number with Minimum"
            min=1
            hint="Must be at least 1"
        }}
        
        {{> shared/partials/number-field 
            name="sample.numberMax"
            value=${sampleData.sampleNumberWithMax}
            label="Number with Range"
            min=0
            max=100
            hint="Must be between 0 and 100"
        }}
      </div>
    </section>

    <!-- Select Fields Section -->
    <section class="showcase-section">
      <h2 style="color: var(--color-primary, #00E0DC); margin-bottom: 15px;">📋 Select Fields</h2>
      <div style="display: grid; gap: 15px;">
        {{> shared/partials/select-field 
            name="sample.rarity"
            value="${sampleData.sampleRarity}"
            label="Rarity Selection"
            options=rarityOptions
            hint="Choose item rarity level"
        }}
        
        {{> shared/partials/select-field
            name="sample.attribute"
            value="${sampleData.sampleAttribute}"
            label="Attribute Selection"
            options=attributeOptions
            required=true
            hint="Required attribute selection"
        }}
      </div>
    </section>

    <!-- Checkbox Fields Section -->
    <section class="showcase-section">
      <h2 style="color: var(--color-primary, #00E0DC); margin-bottom: 15px;">☑️ Checkbox Fields</h2>
      <div style="display: grid; gap: 15px;">
        {{> shared/partials/checkbox-field 
            name="sample.checkboxTrue"
            checked=${sampleData.sampleCheckboxTrue}
            label="Checked Checkbox"
            hint="This checkbox is currently checked"
        }}
        
        {{> shared/partials/checkbox-field 
            name="sample.checkboxFalse"
            checked=${sampleData.sampleCheckboxFalse}
            label="Unchecked Checkbox"
            hint="This checkbox is currently unchecked"
        }}
      </div>
    </section>

    <!-- Textarea Fields Section -->
    <section class="showcase-section">
      <h2 style="color: var(--color-primary, #00E0DC); margin-bottom: 15px;">📄 Textarea Fields</h2>
      <div style="display: grid; gap: 15px;">
        {{> shared/partials/textarea-field 
            name="sample.textarea"
            value="${sampleData.sampleTextarea}"
            label="Basic Textarea"
            rows=4
            hint="Multi-line text input"
        }}
        
        {{> shared/partials/textarea-field 
            name="sample.textareaLong"
            value="${sampleData.sampleTextareaLong}"
            label="Large Textarea"
            rows=8
            maxlength=500
            hint="Larger textarea with character limit"
        }}
      </div>
    </section>

    <!-- Special Components Section -->
    <section class="showcase-section">
      <h2 style="color: var(--color-primary, #00E0DC); margin-bottom: 15px;">⚡ Special Components</h2>
      <div style="display: grid; gap: 15px;">
        {{> shared/partials/ap-selector 
            name="sample.apCost"
            value=${sampleData.sampleApCost}
            label="Action Points"
            hint="Select AP cost (0-3)"
        }}
        
        {{#> shared/partials/form-row}}
          {{> shared/partials/number-field 
              name="sample.currentUses"
              value=${sampleData.currentUses}
              label="Current Uses"
              min=0
          }}
          {{> shared/partials/number-field 
              name="sample.maxUses"
              value=${sampleData.maxUses}
              label="Maximum Uses"
              min=0
          }}
        {{/shared/partials/form-row}}
      </div>
    </section>

    <!-- Trait Fields Section -->
    <section class="showcase-section">
      <h2 style="color: var(--color-primary, #00E0DC); margin-bottom: 15px;">🏷️ Trait Components</h2>
      <div style="display: grid; gap: 15px;">
        {{> shared/partials/traits-field 
            name="sample.traits"
            displayTraits=sampleTraits
            label="Sample Traits"
            hint="Example trait chips with colors and icons"
            editable=true
        }}
        
        {{> shared/partials/traits-field 
            name="sample.traitsReadonly"
            displayTraits=sampleTraits
            label="Readonly Traits"
            hint="Same traits in readonly mode"
            editable=false
        }}
      </div>
    </section>

    <!-- Image Upload Section -->
    <section class="showcase-section">
      <h2 style="color: var(--color-primary, #00E0DC); margin-bottom: 15px;">🖼️ Image Upload</h2>
      <div style="display: grid; gap: 15px;">
        {{> shared/partials/image-upload 
            src="icons/svg/mystery-man.svg"
            alt="Sample Item"
            title="Click to upload image"
            size=64
        }}
      </div>
    </section>

  </div>

  <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--color-border, #dee2e6); color: var(--color-text-secondary, #6c757d);">
    <p>🎨 Component Showcase • Phase 2 • Use this for visual QA and component testing</p>
  </footer>
</div>
  `;

  // Render the template with the sample data
  const templateData = {
    ...sampleData,
    sampleTraits: SAMPLE_TRAITS,
    rarityOptions: RARITY_OPTIONS,
    attributeOptions: ATTRIBUTE_OPTIONS
  };

  return (foundry as any).applications.handlebars.renderTemplate(showcaseTemplate, templateData);
}

/**
 * Creates a dialog to display the component showcase
 */
async function createShowcaseDialog(): Promise<void> {
  try {
    const content = await renderComponentShowcase();
    
    new ((globalThis as any).Dialog)({
      title: "🎨 Avant Component Showcase",
      content: content,
      buttons: {
        close: {
          label: "Close",
          callback: () => {
            (ui as any).notifications.info("Component showcase closed.");
          }
        },
        refresh: {
          label: "Refresh",
          callback: () => {
            // Re-run the macro to refresh the showcase
            createShowcaseDialog();
          }
        }
      },
      default: "close",
      render: (html: any) => {
        // Apply Avant theming to the dialog
        html.closest('.dialog').addClass('avant theme-dark');
        
        // Add some custom styling for the showcase
        html.find('.component-showcase').css({
          'background': 'var(--theme-bg-primary, #1C1C1C)',
          'color': 'var(--theme-text-primary, #FFFFFF)',
          'border-radius': '8px'
        });
        
        // Log component rendering for debugging
        console.log('🎨 Avant | Component Showcase rendered successfully');
        console.log('📊 Components displayed:', {
          textFields: 3,
          numberFields: 3,
          selectFields: 2,
          checkboxFields: 2,
          textareaFields: 2,
          specialComponents: 2,
          traitComponents: 2,
          imageUpload: 1
        });
      }
    }, {
      width: 900,
      height: 700,
      resizable: true,
      classes: ['avant', 'theme-dark', 'component-showcase-dialog']
    }).render(true);
    
  } catch (error: any) {
    console.error('❌ Avant | Component Showcase error:', error);
    (ui as any).notifications?.error(`Failed to render component showcase: ${error.message}`);
  }
}

/**
 * Main macro function - executes the component showcase
 */
export async function componentShowcase(): Promise<void> {
  console.log('🎨 Avant | Starting Component Showcase...');
  
  // Check if we're in a FoundryVTT environment
  if (typeof (globalThis as any).game === 'undefined') {
    console.error('❌ Avant | Component Showcase can only be run in FoundryVTT');
    return;
  }
  
  // Check if templates are loaded
  if (typeof (globalThis as any).foundry === 'undefined' || !(globalThis as any).foundry.applications?.handlebars) {
    console.error('❌ Avant | Handlebars template system not available');
    (ui as any).notifications?.error('Template system not available. Please ensure FoundryVTT is fully loaded.');
    return;
  }
  
  try {
    await createShowcaseDialog();
    (ui as any).notifications?.info('🎨 Component Showcase opened successfully!');
  } catch (error: any) {
    console.error('❌ Avant | Component Showcase failed:', error);
    (ui as any).notifications?.error(`Component Showcase failed: ${error.message}`);
  }
}

// Auto-execute if this is being run as a macro script
if (typeof (globalThis as any).macro !== 'undefined') {
  componentShowcase();
} 