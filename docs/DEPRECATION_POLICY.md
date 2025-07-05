# Deprecation Policy for AvantVTT

**Version**: 1.0.0  
**Effective Date**: 2025-01-17  
**Scope**: All code components, services, and features in the AvantVTT system

## 🎯 Overview

This document establishes the standardized process for deprecating and removing code components from the AvantVTT system. The policy ensures safe, documented, and reversible deprecation while maintaining system stability.

## 📋 Deprecation Philosophy

**Principles:**
- **Safe First**: Never break existing builds or runtime functionality during deprecation
- **Transparent**: All deprecation activities must be documented and trackable
- **Reversible**: Deprecated code must remain accessible for restoration if needed
- **Automated**: Use tooling to prevent accidental reintroduction of deprecated code

## 🔄 Four-Phase Deprecation Process

### **Phase 1: Quarantine**
**Objective**: Isolate deprecated code while maintaining build compatibility

#### Required Steps:
1. **Move to Archive**: 
   ```bash
   mkdir -p deprecated/[component-name]/
   mv [original-files] deprecated/[component-name]/
   ```

2. **Create Stub**: Create minimal stub at original location to prevent build failures

3. **Update Build Configuration**:
   - Exclude deprecated tests from Jest configuration
   - Update import paths if necessary

4. **Document Archive**: Create `deprecated/[component-name]/README.md` with:
   - Deprecation date and reason
   - Original functionality description
   - Restoration procedures
   - Dependencies and configuration details

#### Success Criteria:
- ✅ All builds pass without errors
- ✅ All tests pass (deprecated tests excluded)
- ✅ Runtime behavior unchanged
- ✅ Archive documentation complete

### **Phase 2: Clean Runtime**
**Objective**: Remove all runtime references while preserving compile-time safety

#### Required Steps:
1. **Remove Service Registration**: Update initialization managers and service indexes

2. **Disable CLI Commands**: Replace functionality with helpful error messages

3. **Clean Import References**: Remove or comment out imports in active code

4. **Verify Distribution**: Ensure no deprecated references appear in `dist/` package

#### Success Criteria:
- ✅ Zero runtime references in active codebase
- ✅ `dist/` package contains no deprecated code
- ✅ Helpful error messages guide users to alternatives
- ✅ All integration tests pass

### **Phase 3: Repository Hygiene**
**Objective**: Remove build-time artifacts and establish protective tooling

#### Required Steps:
1. **Remove Stub Files**: Delete temporary compatibility stubs

2. **Clean Dead Imports**: Remove commented-out or unused import statements

3. **Implement Pre-commit Guards**: 
   ```bash
   # Create .git/hooks/pre-commit
   # Add checks for deprecated folder modifications
   # Require restoration keyword for intentional edits
   ```

4. **Update Jest Configuration**: Add explicit comments explaining deprecated exclusions

#### Success Criteria:
- ✅ No stub files remaining in active codebase
- ✅ Pre-commit guard blocks accidental deprecated edits
- ✅ Build artifacts reduced (no unnecessary stub compilation)
- ✅ All documentation updated

### **Phase 4: Long-Term Safeguards**
**Objective**: Establish automated governance and monitoring

#### Required Steps:
1. **CI Enforcement**: Add GitHub Actions jobs that fail on:
   - Deprecated folder edits without restoration keyword
   - Import statements referencing deprecated code

2. **Dead-Code Monitoring**: Integrate automated scanning:
   ```bash
   npm run lint:deadcode
   ```

3. **Weekly Monitoring**: Scheduled CI job to verify guard integrity

4. **Documentation Updates**: 
   - Add deprecation badge to README
   - Update system diagrams
   - Mark phase completion in archive documentation

#### Success Criteria:
- ✅ CI pipeline enforces deprecation guards
- ✅ Automated dead-code detection active
- ✅ Weekly monitoring operational
- ✅ All documentation reflects deprecation status

## 🛡️ Required Tooling

### **Pre-commit Hook Template**
```bash
#!/bin/sh
# Deprecation Guard Pre-commit Hook

DEPRECATED_CHANGES=$(git diff --cached --name-only | grep "^deprecated/" || true)

if [ -n "$DEPRECATED_CHANGES" ]; then
    if ! git log -1 --pretty=%B | grep -q "restore-[component-name]"; then
        echo "❌ Deprecated folder modification blocked"
        echo "🔧 Add 'restore-[component-name]' to commit message to proceed"
        exit 1
    fi
fi
```

### **CI Guard Script Template**
```yaml
- name: Check deprecated modifications
  run: |
    DEPRECATED_CHANGES=$(git diff --name-only HEAD~1 | grep "^deprecated/" || true)
    if [ -n "$DEPRECATED_CHANGES" ] && ! git log -1 --pretty=%B | grep -q "restore-"; then
        echo "❌ Deprecated folder modified without restoration keyword"
        exit 1
    fi
```

## 📊 Naming Conventions

### **Archive Directory Structure**
```
deprecated/
├── [component-name]/
│   ├── README.md           # Deprecation documentation
│   ├── [original-files]    # Preserved source code
│   └── [test-files]        # Preserved test suites
└── [other-deprecated]/
```

### **Documentation Naming**
- **Archive README**: `deprecated/[component-name]/README.md`
- **Changelog Entry**: `changelogs/YYYY-MM-DD_[component-name]-deprecation.md`
- **Progress Report**: `reports/YYYY-MM-DD_[component-name]-phase[N]-completion.md`

### **Git Commit Conventions**
- **Phase 1**: `deprecate: quarantine [ComponentName] (phase 1)`
- **Phase 2**: `deprecate: clean runtime [ComponentName] (phase 2)`
- **Phase 3**: `deprecate: repository hygiene [ComponentName] (phase 3)`
- **Phase 4**: `deprecate: long-term safeguards [ComponentName] (phase 4)`
- **Restoration**: `restore-[component-name]: [reason for restoration]`

## 🔧 Restoration Procedure

### **Quick Restoration Checklist**
1. **Copy Files**: Move from `deprecated/[component-name]/` back to original locations
2. **Restore Exports**: Update service indexes and module exports
3. **Re-enable Registration**: Add back to initialization managers
4. **Update Tests**: Include test files in Jest configuration
5. **Verify Build**: Run `npm run build` and `npm test`
6. **Update Documentation**: Remove deprecation notices

### **Restoration Keywords**
Use these exact keywords in commit messages to bypass pre-commit guards:
- `restore-remote-trait-service`
- `restore-[future-component-name]`

## 📋 Approval Requirements

### **Deprecation Initiation**
- **Minor Components**: Lead developer approval
- **Major Services**: Team consensus + documentation review
- **Core Systems**: Architecture review + user impact assessment

### **Phase Advancement**
- **Phase 1→2**: Automated testing + code review
- **Phase 2→3**: Integration testing + deployment verification  
- **Phase 3→4**: CI setup + monitoring verification

### **Restoration Decisions**
- **Emergency**: Lead developer can restore immediately
- **Planned**: Requires architecture review + impact assessment
- **External Request**: User justification + maintenance commitment

## 🚨 Risk Mitigation

### **Common Risks & Mitigations**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Accidental re-import | Medium | High | CI guards + pre-commit hooks |
| Archive corruption | Low | Medium | Git history preservation + external backup |
| Restoration complexity | Medium | Medium | Detailed README + step-by-step procedures |
| Tool integration breaks | Low | High | Weekly monitoring + manual verification |

### **Emergency Procedures**
1. **Immediate Restoration**: Use `restore-[component-name]` keyword to bypass guards
2. **Guard Bypass**: Temporarily disable CI checks with maintenance mode flag  
3. **Archive Recovery**: Use git history to restore accidentally deleted archives

## 📚 Related Documentation

- **Archive Locations**: `deprecated/*/README.md`
- **Implementation Guide**: `docs/CONTRIBUTORS.md`
- **CI Configuration**: `.github/workflows/ci.yml`
- **Testing Standards**: `jest.config.js`

## 📞 Support

For questions about deprecation procedures or restoration needs:
- **Documentation**: See component-specific README in `deprecated/[component-name]/`
- **Technical Issues**: Create GitHub issue with `deprecation` label
- **Emergency Restoration**: Contact lead developer directly

---

**Last Updated**: 2025-01-17  
**Next Review**: 2025-07-17  
**Policy Version**: 1.0.0 