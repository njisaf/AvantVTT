# Service Dependency Hardening Documentation

## 🎯 Overview

This document describes the multi-layer hardening approach implemented to prevent race conditions in service initialization, specifically the actor sheet stub rendering issue that was resolved on 2025-01-17.

## 🚨 The Problem We Solved

**Issue**: Actor sheets would randomly open as stubs (icon + title only) instead of showing full content.

**Root Cause**: Race condition where `sheetRegistration` completed before `templates` were loaded, causing FoundryVTT to fall back to empty `<form>` stubs when users opened actor sheets.

**Solution**: Multi-layer hardening approach that makes this race condition impossible to accidentally reintroduce.

## 🛡️ Hardening Layers

### **Layer 1: Centralized Configuration**
- **File**: `scripts/utils/service-dependency-config.ts`
- **Purpose**: Single source of truth for all service dependencies
- **Prevents**: Accidental modification of critical dependency order

```typescript
// The critical dependency that prevents race conditions
{
    id: 'sheetRegistration',
    dependencies: ['dataModels', 'templates'], // templates MUST be first
    phase: 'init',
    critical: true,
    description: 'Registers ApplicationV2 actor and item sheets',
    dependencyReason: '🚨 CRITICAL: Depends on templates (prevents stub rendering)'
}
```

### **Layer 2: Automated Validation**
- **Function**: `validateServiceDependencies()`
- **Purpose**: Catches invalid configurations at startup
- **Prevents**: Systems starting with broken dependency chains

```typescript
// Specific validation for the race condition
if (!sheetRegistration.dependencies.includes('templates')) {
    errors.push('🚨 RACE CONDITION RISK: sheetRegistration must depend on templates');
}
```

### **Layer 3: Comprehensive Testing**
- **File**: `tests/unit/utils/service-dependency-config.test.ts`
- **Purpose**: Automated tests that prevent regression
- **Prevents**: Shipping code that would cause race conditions

```typescript
test('CRITICAL: prevents actor sheet stub rendering race condition', () => {
    // This test specifically validates the templates → sheetRegistration order
    expect(sheetRegistration.dependencies).toContain('templates');
});
```

### **Layer 4: Runtime Enforcement**
- **Location**: `InitializationManager.registerService()`
- **Purpose**: Prevents services from being registered with wrong dependencies
- **Prevents**: Developer errors during registration

```typescript
if (JSON.stringify(configDeps) !== JSON.stringify(providedDeps)) {
    throw new Error('🚨 RACE CONDITION RISK: Dependencies don\'t match configuration');
}
```

### **Layer 5: Safe Registration Helper**
- **Method**: `registerServiceFromConfig()`
- **Purpose**: Impossible to get dependencies wrong
- **Prevents**: Human error when registering services

```typescript
// This method automatically uses the correct dependencies
manager.registerServiceFromConfig('sheetRegistration', initFunction);
```

## 🔧 How to Use This System

### **Adding New Services**

1. **Add to centralized configuration first**:
   ```typescript
   // In service-dependency-config.ts
   {
       id: 'myNewService',
       dependencies: ['requiredService'],
       phase: 'init',
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

3. **Write tests**:
   ```typescript
   // In service-dependency-config.test.ts
   test('myNewService should have correct dependencies', () => {
       const service = getServiceConfig('myNewService');
       expect(service.dependencies).toContain('requiredService');
   });
   ```

### **Modifying Existing Services**

⚠️ **NEVER modify dependencies directly in the registration code!**

1. **Update the centralized configuration**
2. **Update the tests**
3. **Run the full test suite**
4. **Test manually 10+ times**

## 🧪 Testing Requirements

Any change to service dependencies must pass these tests:

### **Automated Tests**
```bash
npm test -- service-dependency-config.test.ts
```

### **Manual Testing**
1. **Fresh browser window** (incognito)
2. **Clear cache** completely
3. **Open actor sheet 10+ times** consecutively
4. **100% success rate** required

### **Regression Testing**
- Test the specific race condition scenario
- Verify templates load before sheet registration
- Confirm no stub rendering occurs

## 📋 Maintenance Guide

### **Monthly Review**
- [ ] Run dependency validation tests
- [ ] Review service configuration for optimization
- [ ] Update documentation if needed

### **Before Major Releases**
- [ ] Full regression test suite
- [ ] Manual testing in fresh environment
- [ ] Performance impact assessment

### **When Adding Team Members**
- [ ] Review this document together
- [ ] Explain the race condition history
- [ ] Practice safe service registration

## 🚨 Emergency Procedures

### **If Race Condition Returns**
1. **Identify** which service dependencies changed
2. **Revert** to last known working configuration
3. **Validate** using the centralized configuration
4. **Test** thoroughly before redeployment

### **If Tests Fail**
1. **DO NOT** ignore failing tests
2. **DO NOT** modify tests to pass
3. **Investigate** why the configuration is invalid
4. **Fix** the root cause, not the symptom

## 📊 Success Metrics

This hardening approach is successful when:

- ✅ **Zero actor sheet stub rendering** incidents
- ✅ **100% test coverage** for critical dependencies
- ✅ **Automated validation** catches all misconfigurations
- ✅ **Documentation** is kept current
- ✅ **Team members** understand the system

## 🔗 Related Files

- `scripts/utils/service-dependency-config.ts` - Centralized configuration
- `scripts/utils/initialization-manager.ts` - Service registration
- `tests/unit/utils/service-dependency-config.test.ts` - Automated tests
- `changelogs/2025-01-17_actor-sheet-race-condition-fix.md` - Original fix
- `reports/2025-01-17_actor-sheet-race-condition-analysis-and-fix.md` - Analysis

## 💡 Key Principles

1. **Centralization**: One source of truth for all dependencies
2. **Validation**: Multiple layers of checking
3. **Testing**: Automated prevention of regression
4. **Documentation**: Clear understanding for all team members
5. **Enforcement**: Runtime prevention of errors

This approach ensures that the race condition cannot accidentally be reintroduced, making the system robust and maintainable for years to come. 