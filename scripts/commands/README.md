# Avant VTT Commands Module

## 🎯 Overview

The Commands Module provides a unified, extensible system for managing both **Chat Commands** and **Macro Commands** in the Avant VTT FoundryVTT system. This module is designed to be eventually extracted as a standalone NPM package for reuse across multiple FoundryVTT systems.

## 📁 Module Structure

```
scripts/commands/
├── README.md              # This documentation
├── index.ts               # Main module exports
├── base/                  # Shared functionality and types
│   ├── command-base.ts    # Base command interface and utilities
│   ├── macro-base.ts      # Base macro functionality
│   └── types.ts           # Shared TypeScript types
├── chat/                  # Chat command implementations
│   ├── index.ts           # Chat commands export
│   └── help.ts            # Help command implementation
└── macros/                # Macro command implementations
    ├── index.ts           # Macros export
    ├── create-custom-trait.ts     # Create Custom Trait macro
    ├── export-custom-traits.ts    # Export Custom Traits macro
    └── import-traits.ts           # Import Traits macro
```

## 🏗️ Architecture Principles

### **Separation of Concerns**
- **Chat Commands**: User-triggered via `/command` in chat
- **Macro Commands**: Executable scripts via compendium or hotbar
- **Base Functionality**: Shared utilities, validation, and types

### **Extensibility**
- Easy addition of new commands without modifying core files
- Consistent patterns for command registration and execution
- Type-safe interfaces for all command types

### **Future NPM Module Preparation**
- Self-contained with minimal external dependencies
- Clear export structure for external consumption
- Comprehensive documentation for API usage
- Consistent coding patterns and error handling

## 🎮 Chat Commands

Chat commands are triggered by typing `/commandname` in the FoundryVTT chat.

### **Current Commands**

#### `/help` - System Help
- **Purpose**: Display available commands and usage instructions
- **Permission**: All users
- **Implementation**: `chat/help.ts`
- **Features**:
  - Dynamic permission checking
  - Comprehensive trait management guidance
  - Links to macro alternatives for complex operations

### **Adding New Chat Commands**

1. Create a new file in `chat/` directory
2. Implement the `ChatCommand` interface
3. Export from `chat/index.ts`
4. Command is automatically registered

**Example**:
```typescript
// chat/my-command.ts
import type { ChatCommand } from '../base/types';

export const myCommand: ChatCommand = {
    name: 'mycommand',
    description: 'Does something useful',
    permission: 'PLAYER',
    handler: async (args: string[], rawMessage: string) => {
        // Implementation here
        return true;
    }
};
```

## 🔧 Macro Commands

Macro commands are JavaScript scripts executed via FoundryVTT's macro system.

### **Current Macros**

#### Create Custom Trait
- **File**: `macros/create-custom-trait.ts`
- **Purpose**: One-click custom trait creation with automatic compendium setup
- **Features**:
  - Auto-creates 'Custom Traits' compendium if needed
  - Auto-unlocks compendium for editing
  - Opens trait sheet immediately for editing
  - Integrates with trait provider cache system

#### Export Custom Traits
- **File**: `macros/export-custom-traits.ts`
- **Purpose**: Export only custom/world traits (excludes system built-ins)
- **Features**:
  - Filters custom vs system traits
  - Browser download with timestamped filename
  - Comprehensive metadata in export format
  - Integration with TraitProvider service

#### Import Traits
- **File**: `macros/import-traits.ts`
- **Purpose**: Import traits from JSON files with file dialog interface
- **Features**:
  - File selection dialog
  - JSON validation and error handling
  - Conflict resolution (overwrite options)
  - Progress feedback and batch processing

### **Adding New Macros**

1. Create a new file in `macros/` directory
2. Implement the `MacroCommand` interface
3. Export from `macros/index.ts`
4. Macro is automatically included in build process

**Example**:
```typescript
// macros/my-macro.ts
import type { MacroCommand } from '../base/types';

export const myMacro: MacroCommand = {
    name: 'My Macro',
    type: 'script',
    scope: 'global',
    command: `
        // Macro implementation here
        console.log('Hello from my macro!');
    `,
    img: 'icons/svg/dice-target.svg',
    sort: 100,
    flags: {
        avant: {
            description: 'My custom macro',
            version: '1.0.0',
            category: 'utility'
        }
    }
};
```

## 🔄 Integration Points

### **System Integration**
- **Initialization**: `scripts/avant.ts` imports and initializes the commands module
- **Build Process**: `scripts/build-packs.js` uses macro definitions for compendium generation
- **Type Safety**: Full TypeScript integration with FoundryVTT types

### **FoundryVTT Integration**
- **Chat System**: Hooks into FoundryVTT's `chatMessage` event
- **Macro System**: Generates both compendium and world-level macros
- **Permission System**: Uses FoundryVTT's native user role system
- **Notification System**: Integrates with `ui.notifications` for user feedback

## 🛠️ Technical Implementation

### **Command Registration**
```typescript
// Automatic registration pattern
import { chatCommands } from './chat';
import { macroCommands } from './macros';

// Chat commands auto-register via Hooks.on('chatMessage')
export function initializeChatCommands() {
    Hooks.on('chatMessage', processChatMessage);
}

// Macro commands auto-register during world creation
export async function createWorldMacros() {
    for (const macro of macroCommands) {
        await createMacroIfNotExists(macro);
    }
}
```

### **Error Handling**
- **Graceful Degradation**: Commands fail safely without breaking the system
- **User Feedback**: Clear error messages via FoundryVTT notifications
- **Logging**: Comprehensive console logging for debugging
- **Permission Checking**: Automatic permission validation

### **Type Safety**
- **Interfaces**: Strict TypeScript interfaces for all command types
- **Validation**: Runtime validation where necessary
- **IDE Support**: Full IntelliSense and type checking

## 🚀 Future NPM Module Plans

### **Extraction Strategy**
1. **Dependencies**: Minimize FoundryVTT-specific dependencies
2. **Configuration**: Externalize system-specific configuration
3. **Plugin System**: Allow system-specific command extensions
4. **Testing**: Comprehensive test suite for standalone operation

### **API Design**
```typescript
// Future NPM module usage
import { FoundryCommandsModule } from '@avant-vtt/foundry-commands';

const commandsModule = new FoundryCommandsModule({
    systemId: 'avant',
    chatCommands: [...],
    macroCommands: [...],
    permissions: {...}
});

await commandsModule.initialize();
```

### **Compatibility**
- **FoundryVTT Versions**: Support for v12+ with version-specific adapters
- **System Agnostic**: Work with any FoundryVTT system
- **Backward Compatibility**: Maintain API stability across versions

## 📋 Development Guidelines

### **Code Style**
- **TypeScript**: Strict typing throughout
- **ES Modules**: Modern import/export syntax
- **Async/Await**: Consistent async patterns
- **Error Handling**: Comprehensive try/catch blocks

### **Testing Strategy**
- **Unit Tests**: Individual command functionality
- **Integration Tests**: FoundryVTT system integration
- **E2E Tests**: Complete user workflow testing

### **Documentation**
- **JSDoc**: Comprehensive inline documentation
- **README**: Usage examples and API reference
- **Changelog**: Version history and breaking changes

## 🔧 Debugging

### **Common Issues**
- **Permission Errors**: Check user role assignments
- **Timing Issues**: Ensure proper FoundryVTT initialization
- **Macro Failures**: Verify compendium access and permissions

### **Debug Tools**
- **Console Logging**: Use `console.log` with prefixes for filtering
- **FoundryVTT Console**: Access commands via browser developer tools
- **Fallback Functions**: Manual command execution for troubleshooting

## 📚 References

- [FoundryVTT API Documentation](https://foundryvtt.com/api/)
- [FoundryVTT Macro Documentation](https://foundryvtt.com/article/macros/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Avant VTT System Documentation](../README.md)

---

*This module represents a significant architectural improvement in the Avant VTT system, providing a foundation for extensible, maintainable command management that can grow with the system's needs.* 