# AvantVTT Testing Guide

## Overview

This guide documents the testing patterns, best practices, and lessons learned from refactoring the AvantVTT Item Sheet system. It provides practical guidance for testing FoundryVTT v13 ApplicationV2 components and extracted business logic.

## 🏗️ **Testing Architecture**

### Test Organization

```
tests/
├── unit/                          # Unit tests for pure functions
│   ├── logic/                    # Business logic tests
│   │   ├── *.simple.test.ts      # Simple tests without complex mocking
│   │   └── *.test.ts             # Full unit tests
│   └── utils/                    # Utility function tests
├── integration/                   # Integration tests
│   ├── sheets/                   # ApplicationV2 sheet tests
│   └── services/                 # Service integration tests
├── mocks/                        # Mock factories
│   ├── actor-factory.js          # Actor mock factory
│   └── item-factory.js           # Item mock factory
└── env/                          # Test environment setup
    ├── foundry-shim.js           # FoundryVTT v13 mocking
    └── setup.js                  # Test setup utilities
```

### Test Environment Setup

The test environment provides comprehensive FoundryVTT v13 ApplicationV2 support:

```javascript
// foundry-shim.js - Enhanced for v13
global.DragEvent = class DragEvent extends Event {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.dataTransfer = eventInitDict.dataTransfer || new DataTransfer();
  }
};

global.DataTransfer = class DataTransfer {
  constructor() {
    this.data = {};
    this.files = [];
    this.types = [];
  }
  
  setData(format, data) {
    this.data[format] = data;
    if (!this.types.includes(format)) {
      this.types.push(format);
    }
  }
  
  getData(format) {
    return this.data[format] || '';
  }
};
```

## 🧪 **Unit Testing Patterns**

### Testing Pure Functions

Pure functions are the easiest to test and should have comprehensive coverage:

```typescript
// Example: Testing trait suggestion logic
describe('filterAndScoreTraits', () => {
    let mockTraits: any[];
    let mockConfig: TraitSuggestionConfig;

    beforeEach(() => {
        mockTraits = [
            { id: 'fire', name: 'Fire', description: 'Fire element' },
            { id: 'water', name: 'Water', description: 'Water element' },
            { id: 'healing', name: 'Healing', description: 'Healing ability' }
        ];
        mockConfig = { ...DEFAULT_TRAIT_SUGGESTION_CONFIG };
    });

    it('should filter traits by query correctly', () => {
        const result = filterAndScoreTraits(mockTraits, 'fi', [], mockConfig);
        
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Fire');
        expect(result[0].matchScore).toBeGreaterThan(0.8);
    });

    it('should handle empty queries', () => {
        const result = filterAndScoreTraits(mockTraits, '', [], mockConfig);
        
        expect(result).toHaveLength(0);
    });

    it('should exclude already assigned traits', () => {
        const result = filterAndScoreTraits(mockTraits, 'water', ['water'], mockConfig);
        
        const waterTrait = result.find(t => t.id === 'water');
        expect(waterTrait?.isAvailable).toBe(false);
    });
});
```

### Testing Configuration Objects

All functions should accept configuration objects:

```typescript
describe('Configuration', () => {
    it('should have valid default configuration', () => {
        expect(DEFAULT_TRAIT_SUGGESTION_CONFIG).toBeDefined();
        expect(DEFAULT_TRAIT_SUGGESTION_CONFIG.maxSuggestions).toBeGreaterThan(0);
        expect(DEFAULT_TRAIT_SUGGESTION_CONFIG.minQueryLength).toBeGreaterThan(0);
    });

    it('should accept custom configuration', () => {
        const customConfig: TraitSuggestionConfig = {
            maxSuggestions: 5,
            minQueryLength: 2,
            enableService: false,
            serviceTimeout: 1000
        };

        const result = filterAndScoreTraits(mockTraits, 'fi', [], customConfig);
        expect(result.length).toBeLessThanOrEqual(customConfig.maxSuggestions);
    });
});
```

### Testing Error Handling

Test both success and failure scenarios:

```typescript
describe('Error Handling', () => {
    it('should handle invalid input gracefully', () => {
        const result = filterAndScoreTraits(null as any, 'test', [], mockConfig);
        
        expect(result).toEqual([]);
    });

    it('should handle service timeouts', async () => {
        const slowService = {
            findByReference: jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 5000))
            )
        };

        const shortTimeoutConfig = { ...mockConfig, serviceTimeout: 100 };
        const result = await enhanceTraitWithService(traitData, slowService, shortTimeoutConfig);

        expect(result.success).toBe(true);
        expect(result.enhancedTrait.name).toBe('Fire'); // Should return original
    });
});
```

## 🔗 **Integration Testing Patterns**

### Testing ApplicationV2 Sheets

ApplicationV2 sheets require special handling due to their factory pattern:

```typescript
describe('Item Sheet Integration', () => {
    let itemSheet: any;
    let mockItem: any;
    let mockHtml: any;

    beforeEach(async () => {
        // Create mock item
        mockItem = {
            id: 'test-item',
            name: 'Test Item',
            type: 'weapon',
            system: { damage: '1d8', traits: [] },
            toObject: jest.fn().mockReturnValue({
                system: { damage: '1d8', traits: [] }
            })
        };

        // Create mock HTML with both jQuery and native DOM methods
        mockHtml = {
            find: jest.fn((selector) => {
                if (selector === 'input[name="system.tags"]') {
                    return { 0: tagsInput };
                }
                return { each: jest.fn() };
            }),
            querySelector: jest.fn((selector) => {
                if (selector === 'input[name="system.tags"]') {
                    return tagsInput;
                }
                return null;
            })
        };

        // Import and create sheet using factory pattern
        const { createAvantItemSheet } = await import('../../../scripts/sheets/item-sheet.ts');
        const AvantItemSheet = createAvantItemSheet();
        itemSheet = new AvantItemSheet(mockItem, {});
        itemSheet.element = mockHtml;
    });

    it('should handle tag button clicks correctly', async () => {
        const button = {
            dataset: { tag: 'weapon' },
            classList: { add: jest.fn(), remove: jest.fn() }
        };
        const mockEvent = {
            preventDefault: jest.fn(),
            stopPropagation: jest.fn(),
            currentTarget: button
        };

        await itemSheet.onTagExampleClick(mockEvent, mockEvent.currentTarget);

        expect(tagsInput.value).toBe('weapon');
        expect(button.classList.add).toHaveBeenCalledWith('selected');
    });
});
```

### Testing Drag-and-Drop Functionality

Drag-and-drop requires proper event mocking:

```typescript
describe('Drag-and-Drop Integration', () => {
    it('should handle trait drops correctly', async () => {
        const dropEvent = new DragEvent('drop', {
            dataTransfer: new DataTransfer()
        });
        
        dropEvent.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'Item',
            uuid: 'Compendium.avant.traits.fire-trait'
        }));

        // Mock currentTarget
        Object.defineProperty(dropEvent, 'currentTarget', {
            value: mockDropZone,
            writable: false
        });

        await itemSheet._onDrop(dropEvent);

        expect(mockItem.update).toHaveBeenCalledWith({
            'system.traits': expect.arrayContaining(['fire-trait'])
        });
    });
});
```

## 🚀 **Performance Testing**

### Testing Performance Requirements

Critical paths should meet performance requirements:

```typescript
describe('Performance Requirements', () => {
    it('should render context within 1ms', async () => {
        const startTime = performance.now();
        
        const context = await itemSheet._prepareContext({});
        
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(1);
    });

    it('should handle trait suggestions quickly', async () => {
        const startTime = performance.now();
        
        const result = await generateTraitSuggestions(
            'fire',
            mockItemContext,
            DEFAULT_TRAIT_SUGGESTION_CONFIG
        );
        
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(100); // 100ms threshold
        expect(result.success).toBe(true);
    });
});
```

### Memory Leak Testing

Test for proper cleanup:

```typescript
describe('Memory Management', () => {
    it('should cleanup properly after sheet destruction', () => {
        const initialMemory = process.memoryUsage().heapUsed;
        
        // Create and destroy multiple sheets
        for (let i = 0; i < 100; i++) {
            const sheet = new AvantItemSheet(mockItem, {});
            sheet.close();
        }
        
        // Force garbage collection (if available)
        if (global.gc) {
            global.gc();
        }
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryGrowth = finalMemory - initialMemory;
        
        // Should not grow significantly
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB threshold
    });
});
```

## 📊 **Coverage Requirements**

### Coverage Targets

- **Pure Functions**: ≥90% statement coverage
- **Integration Tests**: ≥80% statement coverage
- **Critical Paths**: 100% coverage (context preparation, trait processing)

### Coverage Analysis

```bash
# Run tests with coverage
npm run test -- --coverage

# Generate coverage report
npm run test -- --coverage --collectCoverageFrom="scripts/logic/**/*.ts"

# Check specific module coverage
npm run test -- --coverage --testPathPattern="trait-suggestions" --collectCoverageFrom="scripts/logic/trait-suggestions.ts"
```

### Coverage Reporting

```typescript
// Add to jest.config.js
module.exports = {
    collectCoverageFrom: [
        'scripts/logic/**/*.ts',
        'scripts/sheets/**/*.ts',
        '!scripts/**/*.d.ts',
        '!scripts/**/index.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        },
        'scripts/logic/': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        }
    }
};
```

## 🐛 **Common Testing Pitfalls**

### Pitfall 1: Complex FoundryVTT Mocking

**Problem**: Trying to mock entire FoundryVTT APIs for unit tests

**Solution**: Test pure functions with simple mocks, use integration tests for complex interactions

```typescript
// ❌ Bad: Complex mocking for unit tests
const mockGame = {
    avant: {
        initializationManager: {
            getService: jest.fn().mockReturnValue(mockTraitProvider)
        }
    }
};

// ✅ Good: Simple data mocking for pure functions
const mockTraits = [
    { id: 'fire', name: 'Fire', color: '#ff0000' }
];
```

### Pitfall 2: Testing Implementation Details

**Problem**: Testing internal implementation instead of behavior

**Solution**: Test public interfaces and expected outcomes

```typescript
// ❌ Bad: Testing implementation details
expect(mockService.findByReference).toHaveBeenCalledWith('fire');

// ✅ Good: Testing behavior and outcomes
expect(result.success).toBe(true);
expect(result.suggestions).toHaveLength(1);
expect(result.suggestions[0].name).toBe('Fire');
```

### Pitfall 3: Inconsistent Test Data

**Problem**: Using different test data across tests

**Solution**: Use consistent mock factories

```typescript
// ✅ Good: Consistent mock factory
function createMockTrait(overrides = {}) {
    return {
        id: 'test-trait',
        name: 'Test Trait',
        description: 'Test description',
        color: '#6c757d',
        icon: 'fas fa-tag',
        ...overrides
    };
}
```

### Pitfall 4: Async Test Issues

**Problem**: Not properly handling async operations

**Solution**: Use proper async/await patterns

```typescript
// ❌ Bad: Not waiting for async operations
it('should process async data', () => {
    const result = processAsyncData(mockData);
    expect(result.success).toBe(true); // May fail randomly
});

// ✅ Good: Proper async handling
it('should process async data', async () => {
    const result = await processAsyncData(mockData);
    expect(result.success).toBe(true);
});
```

## 🔧 **Test Utilities**

### Mock Factories

Create reusable mock factories:

```typescript
// tests/mocks/trait-factory.js
export function createMockTrait(overrides = {}) {
    return {
        id: 'test-trait',
        name: 'Test Trait',
        description: 'Test description',
        color: '#6c757d',
        icon: 'fas fa-tag',
        category: 'test',
        ...overrides
    };
}

export function createMockTraitList(count = 3) {
    return Array.from({ length: count }, (_, i) => 
        createMockTrait({
            id: `trait-${i}`,
            name: `Trait ${i}`,
            description: `Test trait ${i}`
        })
    );
}
```

### Test Helpers

Create common test utilities:

```typescript
// tests/utils/test-helpers.js
export function expectResultSuccess(result) {
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
}

export function expectResultFailure(result, expectedError) {
    expect(result.success).toBe(false);
    expect(result.error).toContain(expectedError);
}

export function createMockEvent(type, overrides = {}) {
    return {
        type,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: null,
        ...overrides
    };
}
```

## 📈 **Continuous Integration**

### Test Automation

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run test -- --coverage --ci
      - run: npm run lint
      - run: npm run validate:templates
```

### Quality Gates

```json
{
  "scripts": {
    "test:ci": "jest --coverage --ci --watchAll=false",
    "test:coverage": "jest --coverage --coverageReporters=text-lcov | coveralls",
    "quality:check": "npm run lint && npm run test:ci && npm run validate:templates"
  }
}
```

## 🎯 **Best Practices Summary**

### Do's ✅

1. **Test Pure Functions Thoroughly** - They're easy to test and critical
2. **Use Simple Mocks** - Avoid complex FoundryVTT mocking for unit tests
3. **Test Configuration Objects** - Ensure customizable behavior works
4. **Handle Async Properly** - Use async/await consistently
5. **Test Error Scenarios** - Include failure cases and edge conditions
6. **Use Mock Factories** - Create consistent test data
7. **Test Performance** - Validate critical path performance
8. **Maintain High Coverage** - Aim for ≥90% on pure functions

### Don'ts ❌

1. **Don't Test Implementation Details** - Test behavior, not internals
2. **Don't Use Complex Mocking** - Keep mocks simple and focused
3. **Don't Ignore Async Issues** - Properly handle promises and timers
4. **Don't Skip Error Testing** - Test failure scenarios
5. **Don't Test Everything** - Focus on business logic and critical paths
6. **Don't Use Inconsistent Data** - Use mock factories for consistency
7. **Don't Forget Performance** - Include performance tests for critical paths
8. **Don't Skip Integration Tests** - Test component interactions

## 📚 **Additional Resources**

- [Jest Testing Framework](https://jestjs.io/)
- [FoundryVTT v13 Documentation](https://foundryvtt.com/api/v13/)
- [TypeScript Testing Best Practices](https://typescript-testing.guide/)
- [ApplicationV2 Testing Patterns](https://foundryvtt.com/article/app-v2/)

---

*This guide is based on the successful refactoring of the AvantVTT Item Sheet system. For questions or improvements, please contribute to the project documentation.*