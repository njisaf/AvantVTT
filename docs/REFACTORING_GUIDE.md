# AvantVTT Item Sheet Refactoring Guide

## Overview

This document provides a comprehensive guide for refactoring large monolithic classes in the AvantVTT system, based on the successful transformation of the 2,500+ line `AvantItemSheet` class into a well-organized, maintainable architecture.

## 📋 **Refactoring Methodology**

### Phase-Based Approach

Our refactoring follows a systematic 6-phase approach that ensures zero downtime and maintains backward compatibility:

1. **Phase 0: Audit & Analysis** - Understand the current state
2. **Phase 1: Interface Design** - Define the target architecture  
3. **Phase 2: Pure Logic Extraction** - Extract business logic into testable functions
4. **Phase 3: Stateful/UI Helper Extraction** - Separate UI and state management
5. **Phase 4: Thin Wrapper Refactor** - Convert monolithic methods to orchestration
6. **Phase 5: Comprehensive Testing** - Ensure robustness and performance
7. **Phase 6: Documentation & Knowledge Transfer** - Enable team maintenance

### Key Principles

- **No Big-Bang Rewrites**: Incremental changes that can be validated at each step
- **Backward Compatibility**: All existing functionality must continue to work
- **Testability First**: Every extracted function should be easily testable
- **Performance Neutral**: Refactoring should not degrade performance
- **Progressive Enhancement**: Each phase builds on the previous one

## 🔍 **Phase 0: Audit & Analysis**

### Purpose
Understand the current codebase structure, identify pain points, and establish baseline metrics.

### Activities

1. **Line Count Analysis**
   ```bash
   wc -l scripts/sheets/item-sheet.ts
   # Before: 2,461 lines
   ```

2. **Method Complexity Analysis**
   - Identify methods over 50 lines
   - Flag methods with multiple responsibilities
   - Document coupling between methods

3. **Dependency Mapping**
   - Map all imports and external dependencies
   - Identify circular dependencies
   - Document service integrations

4. **Performance Baseline**
   - Measure current render times
   - Identify bottlenecks
   - Document memory usage patterns

### Deliverables
- **Audit Report**: Current state analysis
- **Complexity Metrics**: Method sizes, coupling analysis
- **Performance Baseline**: Current performance measurements
- **Refactoring Scope**: Identified areas for improvement

## 🎯 **Phase 1: Interface Design**

### Purpose
Define the target architecture and create clear interfaces for extracted functionality.

### Activities

1. **Module Structure Design**
   ```
   scripts/logic/
   ├── context-preparation.ts     # Template context logic
   ├── trait-data-preparation.ts  # Trait display logic
   ├── trait-suggestions.ts       # Trait suggestion algorithms
   ├── item-form.ts              # Form handling logic
   └── drag-drop/                # Drag-drop functionality
   ```

2. **Interface Definition**
   ```typescript
   // Example: Clean, typed interfaces
   export interface TraitSuggestionResult {
       success: boolean;
       suggestions: TraitSuggestionData[];
       error?: string;
       metadata: SuggestionMetadata;
   }
   ```

3. **Error Handling Strategy**
   - Implement `Result<T, E>` pattern for robust error handling
   - Define fallback mechanisms for service failures
   - Plan graceful degradation strategies

### Deliverables
- **Architecture Diagram**: Target module structure
- **Interface Specifications**: TypeScript interfaces for all modules
- **Error Handling Plan**: Comprehensive error scenarios and responses
- **API Documentation**: Expected function signatures and behaviors

## ⚡ **Phase 2: Pure Logic Extraction**

### Purpose
Extract business logic into pure functions that can be tested independently.

### Extraction Patterns

1. **Pure Function Pattern**
   ```typescript
   // Before: Mixed logic in sheet method
   private _processTraitSuggestions(query: string): any[] {
       // 150+ lines of mixed logic
   }

   // After: Pure function with clear inputs/outputs
   export function filterAndScoreTraits(
       allTraits: Trait[],
       query: string,
       existingTraitIds: string[],
       config: TraitSuggestionConfig
   ): TraitSuggestionData[] {
       // Pure logic with no side effects
   }
   ```

2. **Configuration Objects**
   ```typescript
   // Always provide configurable behavior
   export const DEFAULT_TRAIT_SUGGESTION_CONFIG = {
       maxSuggestions: 10,
       minQueryLength: 1,
       enableService: true,
       serviceTimeout: 2000
   };
   ```

3. **Comprehensive Validation**
   ```typescript
   // Validate all inputs
   export function validateTraitInput(input: any): ValidationResult {
       if (!input || typeof input !== 'object') {
           return { success: false, error: 'Invalid input' };
       }
       // ... detailed validation
   }
   ```

### Best Practices

- **Single Responsibility**: Each function should have one clear purpose
- **Immutability**: Never mutate input parameters
- **Type Safety**: Use TypeScript interfaces for all parameters
- **Error Handling**: Return `Result<T, E>` objects, never throw exceptions
- **Configurability**: Make behavior customizable through configuration objects

### Deliverables
- **Pure Function Modules**: Extracted business logic
- **Configuration Objects**: Customizable behavior patterns
- **Validation Functions**: Input validation and sanitization
- **Unit Tests**: Comprehensive test coverage for pure functions

## 🔧 **Phase 3: Stateful/UI Helper Extraction**

### Purpose
Separate UI manipulation and state management from business logic.

### Extraction Patterns

1. **UI Helper Functions**
   ```typescript
   // Extract DOM manipulation
   export function updateTraitChipDisplay(
       container: HTMLElement,
       traits: TraitDisplayData[]
   ): void {
       // Pure UI logic
   }
   ```

2. **State Management Helpers**
   ```typescript
   // Extract state transitions
   export function updateFormState(
       form: HTMLFormElement,
       newData: any,
       config: FormConfig
   ): StateUpdateResult {
       // State management logic
   }
   ```

3. **Event Handling Abstractions**
   ```typescript
   // Abstract event handling patterns
   export function createEventHandler<T>(
       handler: (event: Event, data: T) => void,
       dataExtractor: (event: Event) => T
   ): (event: Event) => void {
       // Event handling abstraction
   }
   ```

### Best Practices

- **Separation of Concerns**: UI logic separate from business logic
- **Testable UI**: UI functions should be easily mockable
- **Event Abstraction**: Create reusable event handling patterns
- **State Immutability**: Never mutate state directly

### Deliverables
- **UI Helper Modules**: Extracted UI manipulation logic
- **State Management Utilities**: State transition helpers
- **Event Abstractions**: Reusable event handling patterns
- **Integration Tests**: UI and state management test coverage

## 📦 **Phase 4: Thin Wrapper Refactor**

### Purpose
Convert monolithic methods into thin orchestration layers that coordinate extracted modules.

### Refactoring Patterns

1. **Orchestration Pattern**
   ```typescript
   // Before: Monolithic method (150+ lines)
   async _prepareContext(options: any): Promise<ItemSheetContext> {
       // Massive implementation
   }

   // After: Thin wrapper (15 lines)
   async _prepareContext(options: any): Promise<ItemSheetContext> {
       const contextResult = await prepareCompleteContext(
           itemDataForContext,
           baseContext,
           displayTraits,
           DEFAULT_CONTEXT_CONFIG
       );
       
       return contextResult.success 
           ? contextResult.context! 
           : this._createFallbackContext(baseContext, itemData);
   }
   ```

2. **Error Handling Patterns**
   ```typescript
   // Consistent error handling in wrappers
   async _handleTraitSuggestions(query: string): Promise<void> {
       try {
           const result = await generateTraitSuggestions(query, context, config);
           if (result.success) {
               this._displaySuggestions(result.suggestions);
           } else {
               this._showFallbackMessage(result.error);
           }
       } catch (error) {
           logger.error('Trait suggestions failed:', error);
           this._showFallbackMessage('Suggestion system unavailable');
       }
   }
   ```

3. **Performance Monitoring**
   ```typescript
   // Add performance monitoring to wrappers
   async _renderHTML(context: any, options: any): Promise<string> {
       const timer = createPerformanceTimer('template-render');
       timer.start();
       
       try {
           const result = await this._renderTemplate(context, options);
           const duration = timer.stop();
           
           if (duration > 1000) {
               logger.warn('Slow template render detected:', duration);
           }
           
           return result;
       } catch (error) {
           timer.stop();
           throw error;
       }
   }
   ```

### Best Practices

- **Minimal Logic**: Wrappers should contain minimal logic
- **Clear Orchestration**: The flow should be obvious from reading the wrapper
- **Consistent Error Handling**: All wrappers should handle errors the same way
- **Performance Awareness**: Monitor critical paths
- **Backward Compatibility**: Maintain existing method signatures

### Deliverables
- **Refactored Sheet Class**: Thin wrapper methods
- **Performance Monitoring**: Instrumented critical paths
- **Error Handling**: Consistent error patterns
- **Integration Validation**: Verify all functionality works

## 🧪 **Phase 5: Comprehensive Testing**

### Purpose
Ensure robustness, performance, and maintainability through comprehensive testing.

### Testing Strategy

1. **Unit Tests for Pure Functions**
   ```typescript
   describe('filterAndScoreTraits', () => {
       it('should filter traits by query correctly', () => {
           const result = filterAndScoreTraits(
               mockTraits,
               'fire',
               existingIds,
               config
           );
           
           expect(result).toHaveLength(1);
           expect(result[0].name).toBe('Fire');
           expect(result[0].matchScore).toBeGreaterThan(0.8);
       });
   });
   ```

2. **Integration Tests for Wrappers**
   ```typescript
   describe('Item Sheet Integration', () => {
       it('should handle tag button clicks correctly', async () => {
           const button = { dataset: { tag: 'weapon' } };
           const mockEvent = { currentTarget: button };
           
           await itemSheet.onTagExampleClick(mockEvent, button);
           
           expect(tagsInput.value).toBe('weapon');
       });
   });
   ```

3. **Performance Tests**
   ```typescript
   describe('Performance Requirements', () => {
       it('should render context within 1ms', async () => {
           const startTime = performance.now();
           await itemSheet._prepareContext({});
           const duration = performance.now() - startTime;
           
           expect(duration).toBeLessThan(1);
       });
   });
   ```

### Testing Best Practices

- **Test Environment**: Use proper FoundryVTT v13 ApplicationV2 mocking
- **Coverage Goals**: Aim for ≥90% coverage on new modules
- **Performance Monitoring**: Validate performance requirements
- **Regression Testing**: Ensure existing functionality remains intact

### Deliverables
- **Unit Test Suite**: Comprehensive pure function tests
- **Integration Tests**: End-to-end functionality validation
- **Performance Tests**: Performance requirement validation
- **Test Documentation**: Testing patterns and best practices

## 📚 **Phase 6: Documentation & Knowledge Transfer**

### Purpose
Ensure the refactored architecture can be maintained and extended by the team.

### Documentation Requirements

1. **Architecture Documentation**
   - Module dependency diagrams
   - Data flow documentation
   - Interface specifications
   - Error handling patterns

2. **Developer Guidelines**
   - Coding standards for new modules
   - Testing requirements
   - Performance guidelines
   - Review checklists

3. **Migration Guides**
   - How to apply these patterns to other classes
   - Common pitfalls and solutions
   - Tools and utilities for refactoring

### Knowledge Transfer Activities

1. **Code Review Sessions**
   - Walk through the refactored architecture
   - Explain key design decisions
   - Demonstrate testing patterns

2. **Documentation Updates**
   - Update CLAUDE.md with new patterns
   - Create developer onboarding guides
   - Document troubleshooting procedures

3. **Training Materials**
   - Best practices documentation
   - Example implementations
   - Common patterns and anti-patterns

### Deliverables
- **Architecture Documentation**: Complete system documentation
- **Developer Guidelines**: Standards and practices
- **Migration Guides**: How to apply patterns elsewhere
- **Training Materials**: Team enablement resources

## 🎯 **Success Metrics**

### Quantitative Metrics

- **Code Reduction**: 9% reduction in main class size (2,461 → 2,242 lines)
- **Test Coverage**: ≥90% coverage for new modules
- **Performance**: Render times ≤1ms for critical paths
- **Maintainability**: Reduced cyclomatic complexity

### Qualitative Metrics

- **Readability**: Code is easier to understand and navigate
- **Testability**: Business logic is fully testable
- **Maintainability**: Changes can be made with confidence
- **Extensibility**: New features can be added easily

## 🛠 **Tools and Utilities**

### Development Tools

```bash
# Code analysis
npm run lint           # Code quality
npm run lint:deadcode  # Dead code detection
npm run validate:templates  # Template validation

# Testing
npm run test          # Full test suite
npm run test:watch    # Watch mode
npm run test:coverage # Coverage analysis

# Performance
npm run build         # Production build
npm run dev          # Development mode
```

### Recommended Extensions

- **TypeScript**: Strong typing and IDE support
- **Jest**: Testing framework with ES modules support
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting

## 🚨 **Common Pitfalls & Solutions**

### Pitfall 1: Breaking Backward Compatibility
**Solution**: Always maintain existing method signatures and behavior

### Pitfall 2: Over-Engineering
**Solution**: Extract only what needs to be extracted, keep it simple

### Pitfall 3: Inadequate Testing
**Solution**: Test every extracted function, maintain high coverage

### Pitfall 4: Performance Degradation
**Solution**: Monitor performance at every step, optimize critical paths

### Pitfall 5: Poor Error Handling
**Solution**: Use consistent `Result<T, E>` patterns throughout

## 🔄 **Continuous Improvement**

### Regular Reviews
- Monthly architecture reviews
- Quarterly performance assessments
- Annual refactoring planning

### Metrics Tracking
- Code complexity trends
- Test coverage evolution
- Performance benchmarks
- Developer satisfaction surveys

### Knowledge Sharing
- Regular tech talks on refactoring patterns
- Documentation of lessons learned
- Best practices sharing across teams

## 🎉 **Conclusion**

This refactoring approach has successfully transformed a monolithic 2,500+ line class into a maintainable, testable, and extensible architecture. The key to success is the systematic, phase-based approach that ensures backward compatibility while enabling progressive enhancement.

The patterns and practices documented here can be applied to other large classes in the system, enabling continuous improvement of the codebase quality and maintainability.

---

*For questions or clarifications about this refactoring guide, please refer to the team documentation or create an issue in the project repository.*