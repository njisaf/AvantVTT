# ADR-0008: Archive Strategy for Deprecated Code

**Status**: Accepted  
**Date**: 2025-01-17  
**Deciders**: AvantVTT Development Team  
**Technical Context**: RemoteTraitService deprecation completed, need long-term archive strategy  
**Decision**: Keep deprecated code in main repository with monitoring

## Context

Following the successful four-phase deprecation of the RemoteTraitService, we need to decide on the long-term storage and management strategy for deprecated code. The current approach stores deprecated code in the main repository under `deprecated/` directories, but this raises questions about repository size, maintenance overhead, and access patterns.

## Decision Drivers

- **Repository Size**: Deprecated code contributes to repository bloat without providing active value
- **Maintenance Overhead**: Deprecated code requires ongoing management and protection
- **Access Frequency**: Deprecated code is rarely accessed except for restoration scenarios
- **Team Workflow**: Development team needs streamlined access to archived code when needed
- **CI Performance**: Deprecated code affects build times and CI/CD pipeline efficiency
- **Historical Preservation**: Need to maintain complete historical record for compliance/audit

## Options Considered

### Option 1: Keep in Main Repository (Status Quo)

Store deprecated code in `deprecated/` folders within the main AvantVTT repository.

**Pros:**
- ✅ Simple restoration process (files already in repository)
- ✅ No additional repository management overhead
- ✅ Complete historical context preserved in single repository
- ✅ Existing CI guards and tooling already implemented
- ✅ Zero migration effort required

**Cons:**
- ❌ Repository size grows with each deprecation
- ❌ CI pipelines must scan deprecated code for violations
- ❌ Clone times increase for new developers
- ❌ IDE search results cluttered with deprecated code
- ❌ Risk of accidental modifications despite guards

**Implementation Requirements:**
- Continue current `deprecated/` directory structure
- Maintain CI guards and pre-commit hooks
- Regular cleanup of unused deprecated folders

### Option 2: External Archive Repository

Create separate `avantVtt-archive` repository for all deprecated code.

**Pros:**
- ✅ Main repository remains clean and fast
- ✅ CI pipelines only scan active code
- ✅ Faster clone times for main development
- ✅ Clear separation between active and archived code
- ✅ Archive repository can have different access controls

**Cons:**
- ❌ More complex restoration process (requires cross-repo operations)
- ❌ Additional repository management overhead
- ❌ Need separate CI/CD pipeline for archive repository
- ❌ Risk of archive repository becoming orphaned
- ❌ Cross-repository documentation synchronization needed

**Implementation Requirements:**
- Create `avantVtt-archive` repository with proper access controls
- Develop migration scripts for moving deprecated code
- Update restoration procedures in deprecation policy
- Implement archive repository CI/CD pipeline
- Create cross-repository linking documentation

### Option 3: Hybrid Approach

Keep recent deprecations (last 6 months) in main repository, migrate older deprecations to archive repository.

**Pros:**
- ✅ Recent deprecations easily accessible for quick restoration
- ✅ Repository size controlled through automatic archival
- ✅ Balances accessibility with repository hygiene
- ✅ Progressive migration reduces disruption

**Cons:**
- ❌ Most complex implementation and maintenance
- ❌ Requires automated migration workflows
- ❌ Two different restoration procedures to maintain
- ❌ Increased cognitive overhead for developers

**Implementation Requirements:**
- Develop automated migration pipeline (6-month trigger)
- Maintain dual restoration procedures
- Create age-based CI guard logic
- Implement cross-repository synchronization

### Option 4: Archive Compression

Compress deprecated code into single archive files within main repository.

**Pros:**
- ✅ Reduced repository size impact
- ✅ Simple single-repository approach
- ✅ Complete preservation of code and context

**Cons:**
- ❌ Complex restoration process (requires decompression)
- ❌ Difficult to inspect archived code without extraction
- ❌ Version control doesn't track compressed content effectively
- ❌ Risk of archive corruption

## Decision

**DECISION: ACCEPTED - Option 1 (Status Quo)**

After comprehensive analysis, we have decided to **continue with Option 1 (Status Quo)** for the following reasons:

### **Final Decision (Phase 5 Completion)**
- **Keep current `deprecated/` directory structure** for RemoteTraitService and future deprecations
- **Maintain all Phase 4 safeguards** with current architecture  
- **Continue repository monitoring** through Q2 2025 for future evaluation

### **Evaluation Criteria for Q2 2025 Review**

| Metric | Target | Current | Q2 Review |
|--------|--------|---------|-----------|
| Repository size | <50MB | TBD | TBD |
| CI pipeline duration | <3 minutes | TBD | TBD |
| Clone time (fresh) | <30 seconds | TBD | TBD |
| Deprecation frequency | <1 per quarter | 1 in Q1 | TBD |
| Accidental edits blocked | 100% | TBD | TBD |

### **Decision Triggers for Migration**

Migrate to **Option 2 (External Archive)** if any of these conditions occur:
- Repository size exceeds 100MB due to deprecated code
- CI pipeline duration increases by >1 minute due to deprecated scanning
- More than 3 services deprecated in single quarter
- Development team consensus on productivity impact

## Implementation Plan (Current Decision)

### **Phase 4 Completion (Immediate)**
1. ✅ Implement CI guards for deprecated folder protection
2. ✅ Add dead-code scanning to pipeline
3. ✅ Create deprecation policy documentation
4. ✅ Add weekly monitoring workflow
5. ✅ Update README with deprecation badges

### **Monitoring Period (Q1-Q2 2025)**
1. **Collect Metrics**: Repository size, CI duration, developer feedback
2. **Track Violations**: Monitor guard effectiveness and false positives
3. **Document Pain Points**: Identify workflow friction from current approach
4. **Evaluate Alternatives**: Refine understanding of external archive implementation

### **Q2 2025 Review**
1. **Analyze 6 months of metrics** against evaluation criteria
2. **Survey development team** on workflow impact
3. **Make final decision** on archive strategy
4. **Implement migration** if external archive chosen

## Archive Check Script

As part of this ADR evaluation, we will implement a monitoring script:

```javascript
// scripts/tools/archive-check.js
// Reports deprecated folder size and change frequency
// Helps inform Q2 2025 decision with concrete data
```

## Consequences

### **Positive**
- Clear decision framework for archive strategy
- Data-driven approach to long-term planning
- Immediate implementation of necessary safeguards
- Preservation of all deprecated code and context

### **Negative**
- Deferred final decision creates temporary uncertainty
- Current approach may not scale if deprecation frequency increases
- Need to revisit and potentially migrate in Q2 2025

### **Neutral**
- Maintains status quo while gathering decision-making data
- Establishes clear metrics and triggers for future decisions
- Creates framework for future deprecation architecture decisions

## Related Decisions

- **ADR-0001**: TypeScript Migration Strategy (impacts code organization)
- **ADR-0002**: Testing Infrastructure (impacts CI pipeline design)
- **Phase 1-4 Deprecation**: RemoteTraitService deprecation provides precedent

## References

- **Deprecation Policy**: `docs/DEPRECATION_POLICY.md`
- **Current Archive**: `deprecated/remote-trait-service/README.md`
- **CI Implementation**: `.github/workflows/ci.yml`
- **Monitoring Script**: `scripts/tools/archive-check.js` (to be implemented)

---

**Decision Made**: 2025-01-17  
**Next Review**: 2025-07-01 (Optional: Continue monitoring metrics)  
**Decision Authority**: AvantVTT Lead Developer + Team Consensus  
**Implementation Status**: ✅ Accepted - Option 1 (Status Quo) with monitoring 