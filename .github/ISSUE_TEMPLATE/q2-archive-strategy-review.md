---
name: Q2 2025 Archive Strategy Review
about: Quarterly review of deprecated code archive strategy
title: '[Q2-2025] Archive Strategy Review - Data-Driven Decision'
labels: milestone, governance, deprecation
assignees: ''

---

## Review Overview

**Review Period**: Q1 2025 (January - March)  
**Review Date**: 2025-07-01  
**Decision Context**: ADR-0008 Archive Strategy for Deprecated Code  
**Current Status**: Option 1 (Status Quo) - In-repo storage with monitoring

## Metrics Collection

### Repository Impact
- [ ] **Repository Size**: Current total size vs. Q1 baseline
- [ ] **Deprecated Code Size**: Size of `deprecated/` folder
- [ ] **Clone Time**: Fresh clone time measurement
- [ ] **CI Duration**: Build pipeline duration vs. Q1 baseline

### Development Impact
- [ ] **Deprecation Frequency**: Number of components deprecated in Q1
- [ ] **Guard Effectiveness**: Number of violations caught by CI guards
- [ ] **Developer Feedback**: Survey results on workflow impact
- [ ] **False Positives**: Number of incorrect guard violations

### Technical Metrics
- [ ] **Dead Code Detection**: Unused dependencies and imports found
- [ ] **Search Performance**: IDE search speed with deprecated code
- [ ] **Build Performance**: Impact on build times
- [ ] **Test Coverage**: Coverage of deprecated code vs. active code

## Data Collection Commands

```bash
# Repository metrics
du -sh .                          # Total repo size
du -sh deprecated/                # Deprecated folder size
git log --since="2025-01-01" --until="2025-03-31" --oneline deprecated/ | wc -l  # Recent activity

# CI metrics
gh run list --limit 50 --json conclusion,createdAt,duration
npm run guard:deprecated --verbose  # Guard effectiveness
npm run lint:deadcode              # Dead code detection
```

## Decision Criteria (from ADR-0008)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Repository size | <50MB | TBD | ⏳ |
| CI pipeline duration | <3 minutes | TBD | ⏳ |
| Clone time (fresh) | <30 seconds | TBD | ⏳ |
| Deprecation frequency | <1 per quarter | TBD | ⏳ |
| Accidental edits blocked | 100% | TBD | ⏳ |

## Migration Triggers

**Migrate to Option 2 (External Archive)** if any of these conditions are met:
- [ ] Repository size exceeds 100MB due to deprecated code
- [ ] CI pipeline duration increases by >1 minute due to deprecated scanning
- [ ] More than 3 services deprecated in single quarter
- [ ] Development team consensus on productivity impact

## Review Process

### Phase 1: Data Collection (June 1-15)
- [ ] Collect all quantitative metrics
- [ ] Run archive analysis script
- [ ] Survey development team
- [ ] Document findings

### Phase 2: Analysis (June 16-30)
- [ ] Compare metrics against targets
- [ ] Analyze trends and patterns
- [ ] Evaluate migration triggers
- [ ] Prepare recommendation

### Phase 3: Decision (July 1-7)
- [ ] Team review of findings
- [ ] Final decision on archive strategy
- [ ] Update ADR-0008 with decision
- [ ] Plan implementation if migration needed

## Team Survey Questions

1. **Workflow Impact**: How has deprecated code affected your daily development workflow?
2. **Search Performance**: Have you noticed slower IDE search due to deprecated code?
3. **CI Experience**: Are CI builds noticeably slower due to deprecated scanning?
4. **Guard Effectiveness**: Have the deprecation guards prevented accidental edits?
5. **Overall Opinion**: Should we continue with current approach or migrate to external archive?

## Implementation Planning

### If Continuing Status Quo
- [ ] Update monitoring thresholds
- [ ] Improve guard efficiency
- [ ] Plan next review cycle

### If Migrating to External Archive
- [ ] Create `avantVtt-archive` repository
- [ ] Develop migration scripts
- [ ] Update CI/CD pipelines
- [ ] Update documentation
- [ ] Train team on new procedures

## Success Criteria

- [ ] All metrics collected and analyzed
- [ ] Team consensus on path forward
- [ ] ADR-0008 updated with final decision
- [ ] Implementation plan created (if migration)
- [ ] Documentation updated
- [ ] Next review cycle planned

## Archive Analysis Tool

Use the automated archive analysis tool:

```bash
node scripts/tools/archive-check.js
```

This tool provides:
- Deprecated folder size analysis
- File count and change frequency
- Repository impact assessment
- Data-driven recommendations

## Related Documentation

- **ADR-0008**: [docs/adr/0008-archive-deprecated-code.md](../docs/adr/0008-archive-deprecated-code.md)
- **Deprecation Policy**: [docs/DEPRECATION_POLICY.md](../docs/DEPRECATION_POLICY.md)
- **Archive Analysis**: [scripts/tools/archive-check.js](../scripts/tools/archive-check.js)
- **Current Example**: [deprecated/remote-trait-service/README.md](../deprecated/remote-trait-service/README.md)

## Stakeholders

- **Primary**: AvantVTT Development Team
- **Secondary**: Contributors and maintainers
- **Review Authority**: Lead Developer + Team Consensus

---

**Deadline**: July 1, 2025  
**Priority**: Medium  
**Type**: Governance Review 