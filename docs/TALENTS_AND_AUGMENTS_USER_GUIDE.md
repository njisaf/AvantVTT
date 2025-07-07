# Talents & Augments User Guide

> **Version**: 1.0.0 - Phase 3: TypeScript Conversion & Documentation  
> **System**: Avant VTT for FoundryVTT v13+  
> **Last Updated**: 2025-01-17

## 📖 Overview

The Talents & Augments system in Avant VTT provides a comprehensive framework for managing character abilities, talents, and augmentations. This system includes:

- **Talent Items**: Special abilities, skills, and powers
- **Augment Items**: Character modifications and enhancements  
- **Chat Integration**: Rich chat cards with power point spending
- **Compendium Framework**: Version-controlled content packs
- **Import/Export Utilities**: JSON-based data management
- **Power Point System**: Resource management for abilities

## 🎮 User Features

### Creating Talents and Augments

#### Method 1: Direct Item Creation
1. Open your character sheet
2. Navigate to the **Items** tab
3. Click **Create Item**
4. Select **Talent** or **Augment** as the item type
5. Fill in the details:
   - **Name**: The ability name
   - **Description**: What the ability does
   - **Power Point Cost**: PP required to use (0 for passive abilities)
   - **Traits**: Add descriptive traits (Fire, Ice, Tech, etc.)
   - **Tier/Type**: Classification and power level

#### Method 2: Compendium Drag & Drop
1. Open the **Compendium Packs** sidebar
2. Browse **Avant Talents** or **Avant Augments** packs
3. Drag desired items directly to your character sheet
4. Customize as needed for your character

### Using Chat Cards

#### Posting Ability Cards
Talents and augments can be posted to chat as rich, interactive cards:

1. **From Character Sheet**: Click the chat bubble icon next to any talent/augment
2. **From Macros**: Use the provided "Post Talent Card" macro
3. **Via API**: Use the chat integration API (see Developer Guide)

#### Chat Card Features
- **Visual Design**: Themed cards matching your UI
- **Trait Display**: Color-coded trait chips with icons
- **Power Point Buttons**: Interactive PP spending (owner-only)
- **Metadata**: Tier, type, rarity, prerequisites
- **Accessibility**: Screen reader friendly with ARIA labels

#### Power Point System
- **Spending**: Click the "Spend X PP" button on chat cards
- **Validation**: System checks ownership and available points
- **Feedback**: Visual and notification feedback on success/failure
- **Persistence**: PP deductions are immediately saved to character

### Import/Export Features

#### Exporting Talents/Augments
1. Run the **"Export Selected Talents"** macro from your hotbar
2. Select which talents to export via checkboxes
3. Choose export format and metadata options
4. Click **Export** to download JSON file

#### Importing Talents/Augments
1. Run the **"Import Avant Talents"** macro from your hotbar
2. Select JSON file using the file picker
3. Review import preview and resolve conflicts
4. Confirm import to add talents to your world

#### File Format
JSON exports include full metadata:
```json
{
  "name": "Flame Strike",
  "type": "talent",
  "system": {
    "description": "Unleash a burst of flame energy",
    "powerPointCost": 3,
    "tier": "Advanced",
    "traits": ["fire", "energy"],
    "prerequisites": "Fire Affinity"
  }
}
```

## 🛠️ Developer Guide

### Chat Integration API

The system exposes a rich chat API via `game.avant.chat`:

#### Core Functions

```javascript
// Post a talent card to chat
const result = await game.avant.chat.postTalentCard(itemId, actorId, options);

// Post an augment card to chat  
const result = await game.avant.chat.postAugmentCard(itemId, actorId, options);

// Post any feature card to chat
const result = await game.avant.chat.postFeatureCard(itemId, actorId, options);

// Build card HTML without posting
const result = await game.avant.chat.buildFeatureCardHtml(itemId, actorId);
```

#### Parameters
- **itemId** `string`: The ID of the talent/augment item
- **actorId** `string|null`: Actor ID (optional, searches all actors if null)
- **options** `object`: Additional chat message options

#### Return Values
All functions return a result object:
```typescript
interface PostFeatureCardResult {
  success: boolean;
  messageId?: string;    // Chat message ID if successful
  message?: object;      // Full chat message object
  error?: string;        // Error description if failed
}
```

#### Usage Examples

```javascript
// Basic usage - post talent card
const talent = actor.items.find(i => i.name === "Fire Blast");
const result = await game.avant.chat.postTalentCard(talent.id, actor.id);

if (result.success) {
  console.log("Posted chat card:", result.messageId);
} else {
  ui.notifications.error(result.error);
}

// Advanced usage - custom chat options
const options = {
  whisper: [game.user.id],  // Whisper to current user only
  blind: false,             // Not a blind roll
  type: 1                   // Chat message type
};

await game.avant.chat.postAugmentCard(augmentId, actorId, options);
```

### TypeScript Integration

The system is fully typed for TypeScript development:

```typescript
import { 
  PostFeatureCardResult,
  ChatAPI,
  PowerPointValidationResult 
} from 'scripts/logic/chat/feature-card-builder';

import { TraitProvider } from 'scripts/services/trait-provider';
```

#### Key Types

```typescript
// Feature card posting result
interface PostFeatureCardResult {
  success: boolean;
  messageId?: string;
  message?: any;
  error?: string;
}

// Chat API interface
interface ChatAPI {
  postTalentCard: (itemId: string, actorId?: string | null) => Promise<PostFeatureCardResult>;
  postAugmentCard: (itemId: string, actorId?: string | null) => Promise<PostFeatureCardResult>;
  postFeatureCard: (itemId: string, actorId?: string | null) => Promise<PostFeatureCardResult>;
  buildFeatureCardHtml: (itemId: string, actorId?: string | null) => Promise<BuildFeatureCardResult>;
}

// Power point validation
interface PowerPointValidationResult {
  valid: boolean;
  error?: string;
  currentPP?: number;
  newValue?: number;
}
```

### Macro Development

#### Creating Custom Talent Macros

```javascript
// Basic talent posting macro
const actorId = canvas.tokens.controlled[0]?.actor?.id;
const talentName = "Fire Blast";

if (!actorId) {
  ui.notifications.warn("Please select a token");
  return;
}

const actor = game.actors.get(actorId);
const talent = actor.items.find(i => i.name === talentName && i.type === "talent");

if (!talent) {
  ui.notifications.warn(`Talent "${talentName}" not found`);
  return;
}

await game.avant.chat.postTalentCard(talent.id, actor.id);
```

#### Advanced Macro with PP Validation

```javascript
// Macro with power point checking
const actorId = canvas.tokens.controlled[0]?.actor?.id;
const talentName = "Expensive Ability";

if (!actorId) {
  ui.notifications.warn("Please select a token");
  return;
}

const actor = game.actors.get(actorId);
const talent = actor.items.find(i => i.name === talentName);

if (!talent) {
  ui.notifications.warn(`Talent "${talentName}" not found`);
  return;
}

// Check if actor has enough PP before posting
const ppCost = talent.system.powerPointCost || 0;
const currentPP = actor.system.powerPoints?.value || 0;

if (ppCost > 0 && currentPP < ppCost) {
  ui.notifications.warn(`Insufficient power points. Need ${ppCost}, have ${currentPP}`);
  return;
}

await game.avant.chat.postTalentCard(talent.id, actor.id);
```

### Custom Chat Card Styling

#### SCSS Customization

The chat cards use BEM methodology and CSS custom properties:

```scss
// Customize card appearance
.avant-feature-card {
  // Override theme colors
  --theme-primary: #your-color;
  --theme-surface: #your-background;
  
  // Custom card styling
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

// Style power point buttons
.pp-spend {
  background: linear-gradient(45deg, #00ff88, #00cc66);
  border: none;
  
  &:hover {
    transform: scale(1.05);
  }
}
```

#### JavaScript Card Customization

```javascript
// Build custom card with additional options
const customOptions = {
  flavor: "🔥 Special Ability Activated!",
  sound: "sounds/fire-blast.wav",
  content: await game.avant.chat.buildFeatureCardHtml(talentId, actorId)
};

ChatMessage.create(customOptions);
```

### Power Point System Integration

#### Validation Functions

```javascript
import { 
  validatePowerPointSpend,
  handlePowerPointSpend,
  getPowerPointButtonData 
} from 'scripts/logic/chat/power-point-handler';

// Validate before spending
const validation = validatePowerPointSpend(actor, cost, game.user);
if (!validation.valid) {
  ui.notifications.warn(validation.error);
  return;
}

// Spend power points programmatically  
const result = await handlePowerPointSpend(actor, cost, game.user);
if (result.success) {
  ui.notifications.info(`Spent ${cost} PP. Remaining: ${result.newValue}`);
}
```

#### Custom PP Button Creation

```javascript
// Get button data for custom UI
const buttonData = getPowerPointButtonData(talent, actor, game.user);

const button = document.createElement('button');
button.className = `pp-spend ${buttonData.disabled ? 'disabled' : ''}`;
button.textContent = buttonData.buttonText;
button.setAttribute('aria-label', buttonData.ariaLabel);
button.title = buttonData.tooltip;

if (!buttonData.disabled) {
  button.addEventListener('click', async () => {
    const result = await handlePowerPointSpend(actor, buttonData.cost);
    // Handle result...
  });
}
```

## 🎨 Styling & Theming

### Theme Integration

Chat cards automatically adapt to your selected UI theme:

- **Dark Theme**: Default cyberpunk styling with cyan accents
- **Light Theme**: Clean, professional appearance  
- **Custom Themes**: Inherit your theme's color scheme

### Accessibility Features

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: ARIA labels and semantic markup
- **High Contrast**: Automatic adjustments for high contrast mode
- **Reduced Motion**: Respects user motion preferences
- **Color Contrast**: WCAG AA compliant color combinations

### Responsive Design

- **Mobile Friendly**: Cards adapt to smaller screen sizes
- **Flexible Layout**: CSS Grid ensures proper scaling
- **Print Support**: Optimized appearance when printed

## 🔧 Troubleshooting

### Common Issues

#### Chat Cards Not Appearing
1. Check browser console for JavaScript errors
2. Verify item has valid ID and type
3. Ensure actor ownership permissions
4. Try refreshing the page

#### Power Point Buttons Not Working  
1. **Ownership Check**: Verify you own the character (you must have OWNER permission level)
2. **Power Points Data**: Check that actor has `powerPoints` in system data structure
3. **Sufficient PP**: Ensure sufficient PP available (button should show "Insufficient PP" if not)
4. **Event Handlers**: Power point handlers are initialized via `renderChatMessage` hook - try reloading the page
5. **JavaScript Errors**: Look for JavaScript errors in console that might prevent click handling
6. **Data Attributes**: Verify chat card HTML includes `data-pp`, `data-actor-id`, and `data-item-id` attributes
7. **DOM Delegation**: Click handlers use document-level delegation - ensure `.pp-spend` class is present

#### Import/Export Problems
1. Validate JSON file format
2. Check file size limits (< 10MB recommended)
3. Ensure proper file permissions
4. Verify compendium pack accessibility

#### Styling Issues
1. **Missing Card Styles**: If chat cards appear unstyled, verify `_cards.scss` is imported in `avant.scss`
2. **Build Process**: Ensure `npm run build` was run to compile SCSS to CSS
3. **CSS Deployment**: Verify compiled CSS was deployed to FoundryVTT (`dist/styles/avant.css`)
4. **Browser Cache**: Clear browser cache and force reload (Ctrl+F5 or Cmd+Shift+R)
5. **CSS Conflicts**: Check for CSS conflicts with other modules or themes
6. **Theme Integration**: Verify theme is properly applied and card inherits theme variables
7. **Fallback Testing**: Test with modules disabled to isolate conflicts

### Debug Information

Enable debug logging in the browser console:

```javascript
// Enable debug mode
CONFIG.debug.chat = true;
CONFIG.debug.avant = true;

// Test chat integration
console.log("Chat API:", game.avant.chat);

// Test trait provider
const traitProvider = game.avant.initializationManager.getService('traitProvider');
console.log("Trait Provider:", traitProvider);
```

### Performance Optimization

- **Cache Management**: Clear trait provider cache if experiencing slowdowns
- **Large Imports**: Split large JSON files into smaller batches
- **Memory Usage**: Reload page after extensive testing sessions

## 📝 Change Log

### Version 1.0.0 - Phase 3: TypeScript Conversion
- Full TypeScript conversion with strict typing
- Enhanced documentation and examples
- Improved accessibility features
- WCAG AA compliant styling
- Comprehensive error handling

### Future Enhancements
- Cross-world synchronization
- Advanced trait filtering
- Batch operations for large datasets
- REST API integration
- Mobile application support

---

## 🤝 Contributing

For developers looking to extend or modify the system:

1. Follow the TypeScript-first approach
2. Maintain comprehensive JSDoc documentation
3. Include unit tests for pure functions
4. Follow SCSS-first styling methodology
5. Ensure accessibility compliance

## 📖 Additional Resources

- **System Documentation**: `/docs/` directory
- **Type Definitions**: `/scripts/types/` directory  
- **Example Code**: `/scripts/examples/` directory
- **Test Suite**: `/tests/` directory

---

**Need Help?** Check the troubleshooting section above or review the system logs in the browser console. 