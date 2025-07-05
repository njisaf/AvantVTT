---
name: Deprecation Request
about: Request deprecation of a component, service, or feature
title: '[DEPRECATION] Component Name - Brief Description'
labels: deprecation, technical-debt
assignees: ''

---

## Component Information

**Component Name**: 
**Component Type**: (Service/Utility/Feature/etc.)
**File Location(s)**: 
**Estimated Lines of Code**: 
**Last Active Use**: 

## Deprecation Justification

**Primary Reason**: 
- [ ] Superseded by newer implementation
- [ ] Security vulnerability
- [ ] Performance issues
- [ ] Architectural inconsistency
- [ ] Unused/obsolete functionality
- [ ] Other (specify below)

**Detailed Justification**:
<!-- Explain why this component should be deprecated -->

**Replacement Strategy**:
<!-- Describe what will replace this component, if anything -->

## Impact Assessment

**Current Usage**:
- [ ] Used in active code
- [ ] Referenced in tests
- [ ] Documented in user guides
- [ ] Has external dependencies
- [ ] Required for backward compatibility

**Breaking Changes**:
- [ ] Will break existing functionality
- [ ] Requires migration guide
- [ ] Affects public API
- [ ] Impacts user workflows

## Deprecation Plan

### Phase 1: Quarantine ✅
- [ ] Move component to `deprecated/[component-name]/` folder
- [ ] Create comprehensive archival README with:
  - [ ] Original functionality documentation
  - [ ] Deprecation reasoning
  - [ ] Migration instructions
  - [ ] Restoration procedures
- [ ] Update relevant documentation
- [ ] Verify build and tests still pass

### Phase 2: Stub Replacement ✅
- [ ] Create minimal stub/shim to maintain compatibility
- [ ] Add deprecation warnings/logging
- [ ] Update imports to use stub
- [ ] Ensure zero breaking changes for existing users
- [ ] Test stub functionality

### Phase 3: Local Safeguards ✅
- [ ] Add pre-commit hooks to prevent accidental edits
- [ ] Create local guard scripts
- [ ] Update development documentation
- [ ] Add deprecation badges to README
- [ ] Test guard effectiveness

### Phase 4: CI Enforcement ✅
- [ ] Add CI guards to prevent deprecated folder modifications
- [ ] Implement automated scanning for re-imports
- [ ] Add dead-code detection for related dependencies
- [ ] Create weekly monitoring workflow
- [ ] Update deprecation policy documentation

## Testing Strategy

**Test Coverage**:
- [ ] All tests passing before deprecation
- [ ] Stub functionality tested
- [ ] Guard mechanisms tested
- [ ] Integration tests updated

**Validation Plan**:
- [ ] Build system validates no deprecated imports
- [ ] CI properly blocks unauthorized edits
- [ ] Dead-code scanning detects unused dependencies
- [ ] Documentation links are valid

## Timeline

**Proposed Start Date**: 
**Expected Completion**: 
**Urgency Level**: 
- [ ] Low (can wait for next sprint)
- [ ] Medium (should complete this sprint)
- [ ] High (blocking other work)
- [ ] Critical (security/stability issue)

## Dependencies

**Blocks**: 
**Blocked By**: 
**Related Issues**: 

## Acceptance Criteria

- [ ] All four phases completed successfully
- [ ] No breaking changes introduced
- [ ] Build and test pipeline passes
- [ ] Documentation updated
- [ ] Guards prevent accidental restoration
- [ ] Team reviewed and approved approach

## Additional Notes

<!-- Any additional context, concerns, or requirements -->

---

**Deprecation Policy**: See [docs/DEPRECATION_POLICY.md](../docs/DEPRECATION_POLICY.md)  
**Example**: See [deprecated/remote-trait-service/README.md](../deprecated/remote-trait-service/README.md) 