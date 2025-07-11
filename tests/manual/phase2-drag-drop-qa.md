# Phase 2 Drag-and-Drop Trait QA Testing Procedures

**Document Version**: 1.0.0  
**Created**: 2025-01-17  
**Author**: Avant VTT Development Team  
**Purpose**: Manual QA testing procedures for Phase 2 drag-and-drop trait functionality

---

## 🎯 Testing Overview

This document provides comprehensive manual testing procedures for the Phase 2 drag-and-drop trait functionality. These tests should be performed after automated testing to ensure the complete user experience works as expected.

### Prerequisites

- FoundryVTT v13+ running with Avant system
- Feature flag `avant.enableDragTraitInput` available in system settings
- Avant traits compendium populated with test traits
- Test world with various item types created

---

## 📋 Test Environment Setup

### Step 1: Enable Feature Flag
1. Open FoundryVTT as GM
2. Go to System Settings → Avant Settings
3. Enable "Enable Drag Trait Input" setting
4. Confirm setting is saved (should show checkmark)

### Step 2: Verify Compendium
1. Open Compendium tab
2. Verify "Avant Traits" pack is visible
3. Open the pack and confirm traits are present:
   - Fire (red, fire icon)
   - Ice (cyan, snowflake icon)
   - Lightning (yellow, bolt icon)
   - Tech (green, cog icon)
   - Poison (purple, skull icon)
   - Psychic (magenta, brain icon)
   - Physical (gray, fist icon)
   - Energy (orange, energy icon)

### Step 3: Create Test Items
Create one item of each type for testing:
- **Weapon**: "Test Sword" (damage: 1d8, modifier: +2)
- **Armor**: "Test Armor" (AC: 15, threshold: 2)
- **Talent**: "Test Talent" (AP cost: 2)
- **Augment**: "Test Augment" (AP cost: 1, PP cost: 3)
- **Gear**: "Test Gear" (weight: 2, cost: 50)
- **Action**: "Test Action"
- **Feature**: "Test Feature"

---

## 🧪 Core Functionality Tests

### Test 1: Feature Flag Toggle
**Objective**: Verify feature flag properly controls drag-drop functionality

**Steps**:
1. With feature flag **ENABLED**:
   - Open any item sheet
   - Verify drop zone is visible (dashed border area with "Drop trait here")
   - Verify drop zone responds to hover (cursor changes)

2. With feature flag **DISABLED**:
   - Disable the feature flag in settings
   - Refresh or reopen item sheet
   - Verify drop zone is hidden/invisible
   - Verify drag operations do nothing

**Expected Results**:
- ✅ Feature flag controls drop zone visibility
- ✅ Disabled state prevents all drag-drop operations
- ✅ No console errors when toggling

### Test 2: Basic Trait Drop
**Objective**: Verify basic drag-and-drop functionality works

**Steps**:
1. Enable feature flag
2. Open "Test Sword" item sheet
3. Open "Avant Traits" compendium
4. Drag "Fire" trait from compendium to sword sheet drop zone
5. Verify trait appears as chip in trait section
6. Save and reopen sheet
7. Verify trait persists

**Expected Results**:
- ✅ Trait appears immediately as colored chip with icon
- ✅ Trait persists after save/reopen
- ✅ Success notification appears
- ✅ Drop zone shows success animation

### Test 3: Visual Feedback
**Objective**: Verify visual feedback during drag operations

**Steps**:
1. Open item sheet with drop zone visible
2. Drag trait from compendium (don't drop yet)
3. Hover over drop zone - verify highlight appears
4. Move away from drop zone - verify highlight disappears
5. Drop trait on drop zone - verify success animation
6. Attempt to drop duplicate trait - verify error animation

**Expected Results**:
- ✅ Drop zone highlights on hover during drag
- ✅ Highlight disappears when leaving zone
- ✅ Success animation plays on successful drop
- ✅ Error animation plays on failed drop
- ✅ Animations are smooth and professional

---

## 🔍 Cross-Item Type Testing

### Test 4: All Item Types Support
**Objective**: Verify drag-drop works across all item types

**For each item type** (weapon, armor, talent, augment, gear, action, feature):

**Steps**:
1. Open item sheet
2. Verify drop zone is visible
3. Drag "Ice" trait from compendium to sheet
4. Verify trait appears as chip
5. Save and reopen sheet
6. Verify trait persists

**Expected Results**:
- ✅ All item types show drop zone
- ✅ All item types accept trait drops
- ✅ Traits display consistently across types
- ✅ No console errors for any item type

### Test 5: Item Type Specific Layouts
**Objective**: Verify drop zone integrates well with different sheet layouts

**Steps**:
1. Open each item type sheet
2. Verify drop zone position doesn't interfere with other elements
3. Verify drop zone is easily accessible
4. Verify trait chips display properly in each layout

**Expected Results**:
- ✅ Drop zone fits naturally in each sheet layout
- ✅ No overlap with other UI elements
- ✅ Drop zone is intuitive to find
- ✅ Trait chips display well in each context

---

## ⚠️ Error Handling Tests

### Test 6: Duplicate Prevention
**Objective**: Verify duplicate traits are prevented

**Steps**:
1. Open item sheet
2. Add "Fire" trait via drag-drop
3. Attempt to add "Fire" trait again
4. Verify error message appears
5. Verify trait is not duplicated
6. Verify error animation plays

**Expected Results**:
- ✅ Error message: "Trait 'Fire' is already on this item"
- ✅ No duplicate trait chips appear
- ✅ Error notification appears
- ✅ Drop zone shows error animation

### Test 7: Non-Trait Item Drop
**Objective**: Verify non-trait items are rejected

**Steps**:
1. Open item sheet
2. Drag a weapon item (not trait) from compendium
3. Drop on trait drop zone
4. Verify error message appears
5. Verify no trait chip is added

**Expected Results**:
- ✅ Error message: "Cannot add weapon items as traits. Only trait items can be dropped here."
- ✅ No trait chip appears
- ✅ Error notification appears
- ✅ Drop zone shows error animation

### Test 8: Trait Limit Enforcement
**Objective**: Verify trait limits are enforced

**Steps**:
1. Open item sheet
2. Add 10 different traits (default limit)
3. Attempt to add 11th trait
4. Verify limit error message appears
5. Verify 11th trait is not added

**Expected Results**:
- ✅ Error message: "Maximum of 10 traits allowed per item"
- ✅ 11th trait is not added
- ✅ Error notification appears
- ✅ Drop zone shows error animation

### Test 9: Invalid Drop Data
**Objective**: Verify system handles corrupt/invalid drop data

**Steps**:
1. Open item sheet
2. Drag item from invalid source (external website, file, etc.)
3. Drop on trait drop zone
4. Verify graceful error handling

**Expected Results**:
- ✅ System doesn't crash
- ✅ Appropriate error message appears
- ✅ No console errors beyond expected warnings
- ✅ Sheet remains functional

---

## 🎨 User Experience Tests

### Test 10: Mobile/Touch Support
**Objective**: Verify drag-drop works on touch devices

**Steps** (using iPad simulator or touch device):
1. Open item sheet on touch device
2. Long-press trait in compendium
3. Drag to drop zone
4. Verify touch feedback works
5. Verify drop zone responds to touch

**Expected Results**:
- ✅ Touch drag initiates properly
- ✅ Visual feedback works on touch
- ✅ Drop zone responds to touch
- ✅ Traits can be added via touch

### Test 11: Accessibility
**Objective**: Verify accessibility features work

**Steps**:
1. Use keyboard navigation to reach drop zone
2. Verify drop zone is focusable
3. Verify ARIA labels are present
4. Test with screen reader if available
5. Verify color contrast is adequate

**Expected Results**:
- ✅ Drop zone can be reached via keyboard
- ✅ ARIA labels provide context
- ✅ Screen reader announces drop zone
- ✅ Color contrast meets accessibility standards

### Test 12: Performance
**Objective**: Verify performance under various conditions

**Steps**:
1. Open item sheet with many existing traits (8-10)
2. Add additional traits via drag-drop
3. Verify responsiveness remains good
4. Test with multiple sheets open simultaneously
5. Verify no memory leaks after closing sheets

**Expected Results**:
- ✅ Operations remain responsive
- ✅ No noticeable lag or stuttering
- ✅ Multiple sheets perform well
- ✅ Memory usage stays reasonable

---

## 🔄 Integration Tests

### Test 13: Theme Compatibility
**Objective**: Verify drag-drop works with different themes

**Steps**:
1. Test with Dark theme enabled
2. Test with Light theme enabled
3. Test with custom themes if available
4. Verify drop zone colors/styles work in each theme

**Expected Results**:
- ✅ Drop zone visible in all themes
- ✅ Hover effects work in all themes
- ✅ Trait chips display properly in all themes
- ✅ No visual artifacts or overlap

### Test 14: Actor Sheet Integration
**Objective**: Verify traits added to items show up on actor sheets

**Steps**:
1. Create test actor
2. Add item with traits to actor inventory
3. Open actor sheet
4. Verify trait-enhanced items display correctly
5. Verify traits show in item tooltips/descriptions

**Expected Results**:
- ✅ Traits appear in actor sheet inventory
- ✅ Trait colors/icons display correctly
- ✅ Tooltips show trait information
- ✅ No layout issues on actor sheet

### Test 15: Chat Integration
**Objective**: Verify traits work in chat messages

**Steps**:
1. Create item with traits
2. Post item to chat
3. Verify traits appear in chat card
4. Verify trait colors/icons display
5. Test rolling item from chat

**Expected Results**:
- ✅ Traits appear in chat cards
- ✅ Trait styling preserved in chat
- ✅ Chat cards remain functional
- ✅ Rolls work from chat with traits

---

## 🏁 Final Verification

### Test 16: End-to-End Workflow
**Objective**: Verify complete user workflow

**Steps**:
1. Create new character
2. Add various items to character
3. Add traits to items via drag-drop
4. Use items in gameplay (rolls, etc.)
5. Verify traits enhance gameplay appropriately

**Expected Results**:
- ✅ Complete workflow works seamlessly
- ✅ No user confusion or friction
- ✅ Traits enhance gameplay experience
- ✅ No blocking issues discovered

### Test 17: Stress Testing
**Objective**: Verify system handles edge cases

**Steps**:
1. Add maximum traits to multiple items
2. Open many item sheets simultaneously
3. Perform rapid successive drag-drop operations
4. Test with very long trait names
5. Test with special characters in trait names

**Expected Results**:
- ✅ System remains stable under stress
- ✅ No crashes or freezes
- ✅ Error handling works under stress
- ✅ Performance degrades gracefully if at all

---

## 📊 Testing Checklist

### Pre-Testing Setup
- [ ] Feature flag enabled in system settings
- [ ] Traits compendium populated with test data
- [ ] Test items created for each type
- [ ] Testing environment configured properly

### Core Functionality
- [ ] Feature flag toggle works correctly
- [ ] Basic trait drop functionality works
- [ ] Visual feedback appears during drag operations
- [ ] All item types support drag-drop
- [ ] Layouts accommodate drop zones properly

### Error Handling
- [ ] Duplicate traits are prevented
- [ ] Non-trait items are rejected
- [ ] Trait limits are enforced
- [ ] Invalid drop data is handled gracefully

### User Experience
- [ ] Mobile/touch support works
- [ ] Accessibility features function
- [ ] Performance remains good
- [ ] Theme compatibility verified

### Integration
- [ ] Actor sheet integration works
- [ ] Chat integration works
- [ ] End-to-end workflow succeeds
- [ ] Stress testing passes

### Final Sign-off
- [ ] All critical tests pass
- [ ] No blocking issues discovered
- [ ] User experience is smooth and intuitive
- [ ] Ready for production deployment

---

## 🚨 Issue Reporting

If any test fails, report issues with:
1. **Test name and step where failure occurred**
2. **Expected vs actual behavior**
3. **Browser/device information**
4. **Console errors (if any)**
5. **Steps to reproduce**
6. **Screenshots/videos if helpful**

---

## 📈 Success Criteria

Phase 2 QA testing is considered successful when:
- ✅ All core functionality tests pass
- ✅ Error handling works as expected
- ✅ User experience is smooth and intuitive
- ✅ Cross-item type compatibility is verified
- ✅ No blocking issues are discovered
- ✅ Performance meets expectations
- ✅ Integration with other systems works

**Testing complete when all checkboxes are marked and no critical issues remain unresolved.** 