# AvantVTT Migration Guide

## Overview

This guide provides step-by-step instructions for applying the refactoring patterns developed for the Item Sheet to other large classes in the AvantVTT system. It serves as a practical roadmap for systematic code improvement.

## 🎯 **When to Apply These Patterns**

### Refactoring Candidates

Apply these patterns when a class exhibits:

- **Size**: >500 lines or >20 methods
- **Complexity**: Methods >50 lines with multiple responsibilities
- **Testability**: Difficult to unit test due to tight coupling
- **Maintainability**: Changes require understanding the entire class
- **Performance**: Slow operations that could benefit from optimization

### Priority Assessment

**High Priority Candidates:**
- `ActorSheet` classes (likely >1000 lines)
- `ChatHandler` classes with complex message processing
- `ServiceManager` classes with multiple responsibilities
- `DataProcessor` classes with complex transformations

**Medium Priority Candidates:**
- Utility classes with mixed responsibilities
- Helper classes that have grown beyond their original scope
- Configuration classes with complex logic

**Low Priority Candidates:**
- Small, focused classes (<200 lines)
- Classes with single, clear responsibilities
- Classes that are rarely modified

## 📋 **Pre-Migration Checklist**

Before starting any refactoring, ensure:

- [ ] **Full test coverage** of existing functionality
- [ ] **Performance baseline** measurements
- [ ] **Documentation** of current behavior
- [ ] **Team alignment** on refactoring goals
- [ ] **Backup/branch** strategy in place
- [ ] **Time allocation** for 6-phase approach

## 🔄 **Phase-by-Phase Migration Steps**

### Phase 0: Audit & Analysis

#### Step 1: Analyze Current State

```bash
# Measure current complexity
wc -l scripts/sheets/actor-sheet.ts
find scripts/sheets/ -name "*.ts" -exec wc -l {} \; | sort -n

# Identify complex methods
grep -n "function\|async" scripts/sheets/actor-sheet.ts | head -20
```

#### Step 2: Document Dependencies

```typescript
// Create dependency map
const dependencies = {
    services: ['traitProvider', 'serviceManager', 'dataProcessor'],
    utilities: ['validationUtils', 'formatUtils', 'helperUtils'],
    externals: ['foundryAPI', 'handlebarsHelpers']
};
```

#### Step 3: Performance Baseline

```typescript
// Add performance monitoring
const performanceBaseline = {
    renderTime: 0, // ms
    contextPreparation: 0, // ms
    dataProcessing: 0, // ms
    memoryUsage: 0 // MB
};
```

#### Step 4: Create Audit Report

```markdown
# ActorSheet Audit Report

## Metrics
- Total lines: 1,847
- Methods: 34
- Complex methods (>50 lines): 8
- Service dependencies: 5
- External dependencies: 12

## Problem Areas
- `_prepareContext()`: 234 lines, multiple responsibilities
- `_processFormData()`: 178 lines, complex validation
- `_handleChatIntegration()`: 156 lines, mixed concerns

## Refactoring Priority
1. Context preparation (high complexity, frequent use)
2. Form data processing (high complexity, error-prone)
3. Chat integration (moderate complexity, growing)
```

### Phase 1: Interface Design

#### Step 1: Design Module Structure

```typescript
// Proposed module structure
scripts/logic/actor/
├── context-preparation.ts      # Actor context logic
├── form-processing.ts          # Form handling and validation
├── chat-integration.ts         # Chat message handling
├── skill-calculations.ts       # Skill and attribute calculations
└── data-transformation.ts      # Data formatting and transformation
```

#### Step 2: Define Interfaces

```typescript
// Context preparation interface
export interface ActorContextConfig {
    enableSkillCalculations: boolean;
    enableAttributeModifiers: boolean;
    enableChatIntegration: boolean;
    performanceMode: boolean;
}

export interface ActorContextResult {
    success: boolean;
    context?: ActorSheetContext;
    error?: string;
    metadata: {
        processingTime: number;
        skillsProcessed: number;
        attributesCalculated: number;
    };
}

// Form processing interface
export interface ActorFormData {
    attributes: Record<string, number>;
    skills: Record<string, number>;
    biography: string;
    traits: string[];
}

export interface FormProcessingResult {
    success: boolean;
    validatedData?: ActorFormData;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
```

#### Step 3: Plan Error Handling

```typescript
// Consistent error handling pattern
export type ActorResult<T> = {
    success: true;
    data: T;
    metadata?: any;
} | {
    success: false;
    error: string;
    fallback?: T;
};
```

### Phase 2: Pure Logic Extraction

#### Step 1: Extract Calculation Logic

```typescript
// Extract skill calculations
export function calculateSkillModifiers(
    skills: Record<string, number>,
    attributes: Record<string, number>,
    config: SkillCalculationConfig
): ActorResult<Record<string, number>> {
    try {
        const modifiers: Record<string, number> = {};
        
        for (const [skillName, skillValue] of Object.entries(skills)) {
            const attributeBonus = getAttributeBonus(skillName, attributes, config);
            const traitBonus = getTraitBonus(skillName, config);
            
            modifiers[skillName] = skillValue + attributeBonus + traitBonus;
        }
        
        return { success: true, data: modifiers };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

#### Step 2: Extract Validation Logic

```typescript
// Extract form validation
export function validateActorFormData(
    formData: any,
    config: ValidationConfig
): FormProcessingResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Validate attributes
    const attributeValidation = validateAttributes(formData.attributes);
    if (!attributeValidation.success) {
        errors.push(...attributeValidation.errors);
    }
    
    // Validate skills
    const skillValidation = validateSkills(formData.skills);
    if (!skillValidation.success) {
        errors.push(...skillValidation.errors);
    }
    
    return {
        success: errors.length === 0,
        validatedData: errors.length === 0 ? formData : undefined,
        errors,
        warnings
    };
}
```

#### Step 3: Extract Business Logic

```typescript
// Extract data transformation logic
export function transformActorDataForTemplate(
    actorData: any,
    config: TransformationConfig
): ActorResult<ActorTemplateData> {
    try {
        const transformedData: ActorTemplateData = {
            attributes: transformAttributes(actorData.attributes, config),
            skills: transformSkills(actorData.skills, config),
            biography: enrichBiography(actorData.biography, config),
            traits: transformTraits(actorData.traits, config)
        };
        
        return { success: true, data: transformedData };
    } catch (error) {
        return { 
            success: false, 
            error: error.message,
            fallback: createFallbackTemplateData(actorData)
        };
    }
}
```

### Phase 3: Stateful/UI Helper Extraction

#### Step 1: Extract UI Helpers

```typescript
// Extract UI manipulation helpers
export function updateSkillDisplays(
    container: HTMLElement,
    skills: Record<string, number>,
    config: UIConfig
): void {
    const skillElements = container.querySelectorAll('.skill-display');
    
    skillElements.forEach(element => {
        const skillName = element.dataset.skill;
        if (skillName && skills[skillName] !== undefined) {
            updateSkillElement(element as HTMLElement, skills[skillName], config);
        }
    });
}

export function updateAttributeDisplays(
    container: HTMLElement,
    attributes: Record<string, number>,
    config: UIConfig
): void {
    // Similar pattern for attributes
}
```

#### Step 2: Extract State Management

```typescript
// Extract state management helpers
export function updateActorState(
    currentState: ActorState,
    updates: Partial<ActorState>,
    config: StateConfig
): ActorResult<ActorState> {
    try {
        const newState = {
            ...currentState,
            ...updates,
            lastModified: Date.now()
        };
        
        // Validate state consistency
        const validation = validateActorState(newState, config);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }
        
        return { success: true, data: newState };
    } catch (error) {
        return { 
            success: false, 
            error: error.message,
            fallback: currentState
        };
    }
}
```

### Phase 4: Thin Wrapper Refactor

#### Step 1: Convert Context Preparation

```typescript
// Before: Monolithic context preparation
async _prepareContext(options: any): Promise<ActorSheetContext> {
    // 234 lines of complex logic
}

// After: Thin wrapper
async _prepareContext(options: any): Promise<ActorSheetContext> {
    const timer = createPerformanceTimer('actor-context-preparation');
    timer.start();
    
    try {
        const contextResult = await prepareActorContext(
            this.actor,
            options,
            DEFAULT_ACTOR_CONTEXT_CONFIG
        );
        
        if (contextResult.success) {
            const duration = timer.stop();
            if (duration > 5) { // 5ms threshold for actors
                logger.warn('Slow actor context preparation:', duration);
            }
            return contextResult.context!;
        } else {
            logger.error('Actor context preparation failed:', contextResult.error);
            return this._createFallbackContext(options);
        }
    } catch (error) {
        timer.stop();
        logger.error('Actor context preparation error:', error);
        return this._createFallbackContext(options);
    }
}
```

#### Step 2: Convert Form Processing

```typescript
// Before: Complex form processing
async _processFormData(formData: any): Promise<void> {
    // 178 lines of validation and processing
}

// After: Thin wrapper
async _processFormData(formData: any): Promise<void> {
    const processingResult = await processActorFormData(
        formData,
        this.actor,
        DEFAULT_FORM_CONFIG
    );
    
    if (processingResult.success) {
        await this.actor.update(processingResult.validatedData);
        this._showSuccessMessage('Actor updated successfully');
    } else {
        this._showValidationErrors(processingResult.errors);
        this._showValidationWarnings(processingResult.warnings);
    }
}
```

#### Step 3: Convert Chat Integration

```typescript
// Before: Complex chat handling
async _handleChatIntegration(data: any): Promise<void> {
    // 156 lines of chat logic
}

// After: Thin wrapper
async _handleChatIntegration(data: any): Promise<void> {
    const chatResult = await processActorChatIntegration(
        data,
        this.actor,
        DEFAULT_CHAT_CONFIG
    );
    
    if (chatResult.success) {
        await this._displayChatMessage(chatResult.message);
    } else {
        logger.warn('Chat integration failed:', chatResult.error);
        this._showFallbackMessage();
    }
}
```

### Phase 5: Comprehensive Testing

#### Step 1: Create Unit Tests

```typescript
// Test pure functions
describe('calculateSkillModifiers', () => {
    it('should calculate modifiers correctly', () => {
        const skills = { athletics: 3, stealth: 2 };
        const attributes = { strength: 4, dexterity: 3 };
        const config = DEFAULT_SKILL_CONFIG;
        
        const result = calculateSkillModifiers(skills, attributes, config);
        
        expect(result.success).toBe(true);
        expect(result.data!.athletics).toBe(7); // 3 + 4 (strength bonus)
        expect(result.data!.stealth).toBe(5); // 2 + 3 (dexterity bonus)
    });
});
```

#### Step 2: Create Integration Tests

```typescript
// Test sheet integration
describe('Actor Sheet Integration', () => {
    beforeEach(async () => {
        const { createAvantActorSheet } = await import('../../scripts/sheets/actor-sheet.js');
        const AvantActorSheet = createAvantActorSheet();
        actorSheet = new AvantActorSheet(mockActor, {});
    });
    
    it('should handle skill updates correctly', async () => {
        const skillUpdate = { athletics: 5 };
        
        await actorSheet._processSkillUpdate(skillUpdate);
        
        expect(mockActor.update).toHaveBeenCalledWith({
            'system.skills.athletics': 5
        });
    });
});
```

#### Step 3: Performance Testing

```typescript
// Test performance requirements
describe('Performance Requirements', () => {
    it('should prepare context within 5ms', async () => {
        const startTime = performance.now();
        
        await actorSheet._prepareContext({});
        
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(5);
    });
});
```

### Phase 6: Documentation & Knowledge Transfer

#### Step 1: Update Documentation

```typescript
// Update CLAUDE.md with new patterns
#### 6. Actor Sheet (Refactored Architecture)
- `scripts/sheets/actor-sheet.ts` - Thin wrapper for actor functionality
- `scripts/logic/actor/context-preparation.ts` - Actor context processing
- `scripts/logic/actor/form-processing.ts` - Form validation and processing
- `scripts/logic/actor/chat-integration.ts` - Chat message handling
- `scripts/logic/actor/skill-calculations.ts` - Skill and attribute calculations
```

#### Step 2: Create Migration Summary

```markdown
# Actor Sheet Migration Summary

## Results
- Original size: 1,847 lines → Final size: 1,234 lines (33% reduction)
- Complex methods: 8 → 2 (75% reduction)
- Test coverage: 45% → 92% (47% improvement)
- Performance: Context preparation 12ms → 3ms (75% improvement)

## New Modules Created
- `context-preparation.ts` - 234 lines → 89 lines (62% reduction)
- `form-processing.ts` - 178 lines → 67 lines (62% reduction)
- `chat-integration.ts` - 156 lines → 45 lines (71% reduction)

## Benefits Achieved
- ✅ Improved testability (92% coverage)
- ✅ Better performance (75% faster context preparation)
- ✅ Enhanced maintainability (smaller, focused methods)
- ✅ Easier debugging (clear separation of concerns)
```

## 🚀 **Quick Start Template**

For common refactoring scenarios, use these templates:

### Template 1: Large Sheet Class

```bash
# Create module structure
mkdir -p scripts/logic/[sheet-name]
touch scripts/logic/[sheet-name]/context-preparation.ts
touch scripts/logic/[sheet-name]/form-processing.ts
touch scripts/logic/[sheet-name]/data-transformation.ts

# Create test structure
mkdir -p tests/unit/logic/[sheet-name]
touch tests/unit/logic/[sheet-name]/context-preparation.simple.test.ts
touch tests/unit/logic/[sheet-name]/form-processing.simple.test.ts
```

### Template 2: Service Class

```bash
# Create module structure
mkdir -p scripts/logic/[service-name]
touch scripts/logic/[service-name]/data-processing.ts
touch scripts/logic/[service-name]/validation.ts
touch scripts/logic/[service-name]/integration.ts

# Create test structure
mkdir -p tests/unit/logic/[service-name]
touch tests/unit/logic/[service-name]/data-processing.simple.test.ts
touch tests/unit/logic/[service-name]/validation.simple.test.ts
```

### Template 3: Utility Class

```bash
# Create module structure
mkdir -p scripts/logic/[utility-name]
touch scripts/logic/[utility-name]/core-functions.ts
touch scripts/logic/[utility-name]/helpers.ts
touch scripts/logic/[utility-name]/validation.ts

# Create test structure
mkdir -p tests/unit/logic/[utility-name]
touch tests/unit/logic/[utility-name]/core-functions.simple.test.ts
```

## 📊 **Success Metrics**

Track these metrics for each migration:

### Code Quality Metrics
- **Lines of Code**: Target 20-40% reduction
- **Cyclomatic Complexity**: Target 50%+ reduction
- **Method Size**: Target <50 lines per method
- **Test Coverage**: Target ≥90% for new modules

### Performance Metrics
- **Execution Time**: Target 50%+ improvement for critical paths
- **Memory Usage**: Target stable or reduced memory usage
- **Error Rate**: Target reduced error frequency

### Maintainability Metrics
- **Time to Fix Bugs**: Target 50% reduction
- **Time to Add Features**: Target 30% reduction
- **Code Review Time**: Target 40% reduction

## 🛠️ **Tools and Automation**

### Refactoring Tools

```bash
# Analyze code complexity
npx @typescript-eslint/eslint-plugin --rules complexity
npx madge --circular --extensions ts scripts/

# Extract function candidates
grep -n "function\|async" scripts/sheets/*.ts | grep -v "^.*:.* [a-zA-Z_][a-zA-Z0-9_]*(" | head -20

# Measure method sizes
awk '/function|async/ {start=NR} /^}/ {if (start) print FILENAME ":" start "-" NR " (" (NR-start) " lines)"; start=0}' scripts/sheets/*.ts
```

### Migration Scripts

```bash
#!/bin/bash
# migration-helper.sh

# Create directory structure
create_structure() {
    local module_name=$1
    mkdir -p "scripts/logic/$module_name"
    mkdir -p "tests/unit/logic/$module_name"
    mkdir -p "tests/integration/$module_name"
    
    echo "Created structure for $module_name"
}

# Generate boilerplate
generate_boilerplate() {
    local module_name=$1
    local file_name=$2
    
    cat > "scripts/logic/$module_name/$file_name.ts" << EOF
/**
 * @fileoverview $module_name $file_name Module
 * @description Extracted from monolithic class during refactoring
 */

import { logger } from '../../utils/logger.js';

export interface ${file_name^}Config {
    enableDebugLogging: boolean;
    // Add configuration options
}

export const DEFAULT_${file_name^^}_CONFIG: ${file_name^}Config = {
    enableDebugLogging: true
};

export interface ${file_name^}Result<T> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: any;
}

// TODO: Implement extracted functions
EOF
    
    echo "Generated boilerplate for $module_name/$file_name"
}

# Usage
create_structure "actor"
generate_boilerplate "actor" "context-preparation"
generate_boilerplate "actor" "form-processing"
```

## 🔄 **Continuous Improvement**

### Monthly Reviews
- **Review refactoring progress** against metrics
- **Identify new refactoring candidates** using complexity analysis
- **Update migration patterns** based on lessons learned
- **Share successes and challenges** with the team

### Quarterly Assessments
- **Measure overall code quality** improvement
- **Evaluate performance** gains across refactored modules
- **Assess developer productivity** improvements
- **Plan next phase** of refactoring initiatives

### Annual Planning
- **Strategic refactoring roadmap** for the next year
- **Resource allocation** for major refactoring efforts
- **Training and skill development** for the team
- **Tool and process improvements** based on experience

## 🎯 **Conclusion**

This migration guide provides a systematic approach to applying the successful Item Sheet refactoring patterns to other parts of the AvantVTT codebase. The key to success is:

1. **Follow the phases systematically** - Don't skip steps
2. **Maintain backward compatibility** - Never break existing functionality
3. **Test thoroughly** - Validate each phase before proceeding
4. **Document everything** - Enable future maintenance
5. **Measure success** - Track improvements quantitatively

By following this guide, teams can safely and effectively improve code quality, performance, and maintainability across the entire codebase.

---

*For questions about applying these patterns to specific classes, please refer to the team documentation or create an issue in the project repository.*