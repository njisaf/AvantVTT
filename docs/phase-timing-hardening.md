# Phase Timing Hardening Documentation

## 🎯 Overview

This document describes the comprehensive hardening approach implemented to prevent phase timing race conditions in FoundryVTT system initialization. This approach addresses both the actor sheet stub rendering issue and the context menu race condition that were resolved.

## 🚨 The Problems We Solved

### **Problem 1: Actor Sheet Stub Rendering Race Condition**
- **Issue**: Actor sheets would randomly open as stubs (icon + title only) instead of showing full content
- **Root Cause**: `sheetRegistration` service completed before `templates` were loaded
- **Manifestation**: Users experienced random failures requiring multiple page refreshes

### **Problem 2: Context Menu Race Condition**
- **Issue**: "Reroll with Fortune Points" context menu option would not appear consistently
- **Root Cause**: `chatContextMenu` service ran in "ready" phase but needed to run in "init" phase
- **Manifestation**: Context menu options appeared only after delays or multiple refreshes

## 🛡️ Hardening Approach

### **Layer 1: Centralized Configuration**
- **File**: `scripts/utils/service-dependency-config.ts`
- **Purpose**: Single source of truth for all service dependencies and phase timing
- **Prevents**: Accidental modification of critical timing requirements

```typescript
// Example configuration that prevents race conditions
{
    id: 'chatContextMenu',
    dependencies: ['sheetRegistration'],
    phase: 'init',  // 🚨 CRITICAL: Must be init, not ready
    critical: false,
    description: 'Sets up chat context menu for Fortune Point rerolls',
    dependencyReason: '🚨 CRITICAL: Must run in init phase to override method BEFORE FoundryVTT creates ChatLog context menu'
}
```

### **Layer 2: Enhanced Validation**
- **Function**: `validateServiceDependencies()` and `validatePhaseOrdering()`
- **Purpose**: Catches invalid configurations and phase timing issues at startup
- **Prevents**: Systems starting with broken timing configurations

```typescript
// Phase timing validation rules
function validatePhaseOrdering(): string[] {
    const errors: string[] = [];
    
    // Rule 1: Context menu services must run in init phase
    // Rule 2: Sheet registration services must run in init phase
    // Rule 3: Template services must run in init phase
    
    return errors;
}
```

### **Layer 3: Comprehensive Testing**
- **File**: `tests/unit/utils/service-dependency-config.test.ts`
- **Purpose**: Automated tests that prevent regression
- **Coverage**: Critical timing relationships and dependency chains

```typescript
test('CRITICAL: prevents context menu race condition', () => {
    const chatContextMenu = getServiceConfig('chatContextMenu');
    
    // 🚨 CRITICAL: This prevents the race condition where context menu doesn't work
    expect(chatContextMenu!.phase).toBe('init');
});
```

### **Layer 4: Runtime Enforcement**
- **Location**: `InitializationManager.registerService()`
- **Purpose**: Prevents services from being registered with wrong dependencies
- **Mechanism**: Validates provided dependencies against centralized configuration

```typescript
if (JSON.stringify(configDeps) !== JSON.stringify(providedDeps)) {
    throw new Error('🚨 RACE CONDITION RISK: Dependencies don\'t match configuration');
}
```

### **Layer 5: Safe Registration Helper**
- **Method**: `registerServiceFromConfig()`
- **Purpose**: Impossible to get dependencies or phase timing wrong
- **Usage**: Automatically uses correct configuration from centralized source

```typescript
// Automatically uses correct dependencies and phase from configuration
manager.registerServiceFromConfig('chatContextMenu', initFunction);
```

## 📋 Critical Timing Requirements

### **Init Phase Services (Must Run Early)**
These services **MUST** run in the "init" phase to prevent race conditions:

1. **`templates`** - Load templates before sheets become available
2. **`sheetRegistration`** - Register sheets after templates are loaded
3. **`chatContextMenu`** - Override methods before FoundryVTT creates ChatLog

### **Ready Phase Services (Can Run Later)**
These services can safely run in the "ready" phase:

1. **`traitProvider`** - Data provider, no timing dependencies
2. **`compendiumValidation`** - Validation service, no timing dependencies
3. **`traitSeeder`** - Data seeding, no timing dependencies

## 🔧 Implementation Guidelines

### **When Adding New Services**

1. **Add to centralized configuration first**:
   ```typescript
   // In service-dependency-config.ts
   {
       id: 'myNewService',
       dependencies: ['requiredService'],
       phase: 'init', // Choose init or ready carefully
       critical: false,
       description: 'What this service does',
       dependencyReason: 'Why it has these dependencies'
   }
   ```

2. **Use the safe registration method**:
   ```typescript
   // In initialization-manager.ts
   manager.registerServiceFromConfig('myNewService', async () => {
       // Service initialization logic
   });
   ```

3. **Write comprehensive tests**:
   ```typescript
   // In service-dependency-config.test.ts
   test('myNewService should have correct phase timing', () => {
       const service = getServiceConfig('myNewService');
       expect(service.phase).toBe('init');
   });
   ```

### **When Modifying Existing Services**

⚠️ **NEVER modify dependencies directly in the registration code!**

1. **Update the centralized configuration**
2. **Update the tests to reflect changes**
3. **Run the full test suite**
4. **Test manually 10+ times**

## 🚨 Critical Phase Timing Rules

### **Rule 1: UI Services Must Run in Init Phase**
Any service that affects UI components (sheets, context menus, templates) must run in the "init" phase:

```typescript
// ✅ CORRECT
const contextMenuService = { phase: 'init' };
const sheetService = { phase: 'init' };
const templateService = { phase: 'init' };

// ❌ INCORRECT - Will cause race conditions
const contextMenuService = { phase: 'ready' };
```

### **Rule 2: Templates Must Load Before Sheets**
Templates must always be loaded before sheet registration:

```typescript
// ✅ CORRECT dependency chain
templates: { dependencies: [] }
sheetRegistration: { dependencies: ['templates'] }

// ❌ INCORRECT - Will cause stub rendering
sheetRegistration: { dependencies: [] }
templates: { dependencies: ['sheetRegistration'] }
```

### **Rule 3: Method Overrides Must Happen Before Object Creation**
Services that override FoundryVTT methods must run before those objects are created:

```typescript
// ✅ CORRECT - Override in init phase
chatContextMenu: { phase: 'init' }

// ❌ INCORRECT - Override too late
chatContextMenu: { phase: 'ready' }
```

## 🧪 Testing Requirements

### **Automated Tests**
All phase timing changes must pass:
```bash
npm test -- service-dependency-config.test.ts
```

### **Manual Testing**
Before deploying phase timing changes:

1. **Fresh browser window** (incognito mode)
2. **Clear cache** completely
3. **Test functionality 10+ times** consecutively
4. **100% success rate** required

### **Specific Test Cases**

**Actor Sheet Testing:**
1. Create new actor
2. Open actor sheet immediately after creation
3. Verify full content loads (not stub)
4. Repeat 10+ times

**Context Menu Testing:**
1. Make dice roll
2. Right-click on chat message immediately
3. Verify "Reroll with Fortune Points" option appears
4. Repeat 10+ times

## 🚨 Emergency Procedures

### **If Race Condition Returns**
1. **Identify** which service configuration changed
2. **Revert** to last known working configuration
3. **Validate** using automated tests
4. **Test** manually before redeployment

### **If Tests Fail**
1. **DO NOT** ignore failing tests
2. **DO NOT** modify tests to pass
3. **Investigate** the root cause
4. **Fix** the configuration, not the test

## 📊 Success Metrics

This hardening approach is successful when:

- ✅ **Zero race condition incidents**
- ✅ **100% test coverage** for critical timing
- ✅ **Automated validation** catches all misconfigurations
- ✅ **Documentation** is kept current
- ✅ **Team members** understand the timing requirements

## 🔗 Related Files

- `scripts/utils/service-dependency-config.ts` - Centralized configuration
- `scripts/utils/initialization-manager.ts` - Service registration
- `tests/unit/utils/service-dependency-config.test.ts` - Automated tests
- `scripts/chat/context-menu.ts` - Context menu implementation
- `changelogs/2025-01-17_chat-context-menu-init-phase-fix.md` - Context menu fix
- `changelogs/2025-01-17_actor-sheet-race-condition-fix.md` - Actor sheet fix

## 💡 Key Principles

1. **Centralization**: One source of truth for all timing requirements
2. **Validation**: Multiple layers of checking at different stages
3. **Testing**: Automated prevention of regression
4. **Documentation**: Clear understanding for all team members
5. **Enforcement**: Runtime prevention of configuration errors

## 🎯 Future Considerations

### **When Adding New FoundryVTT Features**
- Consider phase timing requirements early in design
- Add to centralized configuration immediately
- Write tests before implementation
- Document timing reasons clearly

### **When Upgrading FoundryVTT Versions**
- Revalidate all timing assumptions
- Test critical paths thoroughly
- Update documentation if timing changes
- Maintain backward compatibility where possible

---

**This hardening approach ensures that phase timing race conditions cannot accidentally be reintroduced, making the system robust and maintainable for years to come.** 