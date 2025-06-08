# 🔄 FRESH DEPLOYMENT - TEST INSTRUCTIONS

**Status**: ✅ Code deployed to both containers and restarted  
**Date**: 2025-01-08  
**Containers**: Both v13 and v12 running fresh with latest code

## 🚀 DEPLOYMENT CONFIRMED

### What Was Done:
1. ✅ **Stopped both containers** for clean deployment
2. ✅ **Verified code presence** in both v13 and v12 containers
3. ✅ **Restarted containers** for fresh system load
4. ✅ **Code confirmed deployed**: `getChatMessageContextOptions` hook present

### Container Status:
- **v13 Container**: ✅ Running at http://localhost:30000
- **v12 Container**: ✅ Running at http://localhost:30001
- **Code Version**: Latest with v13 native context menu implementation

## 🧪 TESTING PROTOCOL

### Step 1: Quick Hook Verification
1. **Open**: http://localhost:30000 (v13 primary)
2. **Open Browser Console**: F12 → Console tab
3. **Paste verification script**: Copy contents of `test-hook-verification.js`
4. **Check output**: Should show system loaded and hooks registered

### Step 2: Manual Context Menu Test
1. **Create/Open World**: Select Avant system
2. **Create Character**: Ensure Fortune Points > 0
3. **Make Ability Roll**: Click any ability modifier (e.g., +2 next to Might)
4. **Right-click Chat Message**: On the roll result
5. **Look for**: "Reroll with Fortune Points" in context menu

### Step 3: Console Message Verification
**During right-click, watch for ANY of these console messages:**

**🎯 v13 Native (PRIMARY TARGET):**
```
Avant | getChatMessageContextOptions hook fired for message: [id]
Avant | Processing v13 reroll option for message: [id]
Avant | Adding v13 reroll option to context menu
```

**🔄 v12 Compatibility (FALLBACK):**
```
Avant | getChatLogEntryContext hook fired (v12 compatibility)
Avant | _addRerollOption called (traditional method)
```

**🛡️ Custom Menu (ULTIMATE FALLBACK):**
```
Avant | Direct contextmenu event triggered
Avant | Custom context menu created and displayed
```

### Step 4: Functional Test
1. **Click Reroll Option**: Should open reroll dialog
2. **Select Dice**: Click on individual d10s to select
3. **Confirm Reroll**: Click "Reroll Selected Dice"
4. **Verify**: Fortune Points deducted, new roll posted

## 🔍 TROUBLESHOOTING

### If No Context Menu Option Appears:
1. **Check Console**: Look for hook firing messages
2. **Verify Fortune Points**: Character must have FP > 0
3. **Verify Roll Type**: Must be 2d10 roll (ability checks)
4. **Try v12**: Test on http://localhost:30001 for comparison

### Expected Hook Registration (Console Check):
```javascript
// Paste in console to verify
Object.keys(Hooks._hooks).filter(h => h.includes('Context'))
// Should include: getChatMessageContextOptions, getChatLogEntryContext
```

### Manual Trigger Test (Last Resort):
```javascript
// Paste in console if context menu fails
const lastMessage = document.querySelector('.message:last-child');
if (lastMessage) {
    const event = new MouseEvent('contextmenu', { 
        bubbles: true, clientX: 100, clientY: 100 
    });
    lastMessage.dispatchEvent(event);
}
```

## 📊 SUCCESS CRITERIA

### Primary Success (v13):
- [ ] System loads without errors
- [ ] Hook verification script shows all green checkmarks
- [ ] getChatMessageContextOptions hook fires on right-click
- [ ] "Reroll with Fortune Points" appears in native context menu
- [ ] Dialog opens and functions correctly

### Fallback Success (Any Version):
- [ ] At least one approach shows reroll option
- [ ] Dialog functionality works
- [ ] Fortune Points deduct correctly
- [ ] New roll posts to chat

## 🎯 WHAT TO REPORT

Please test and report:
1. **Which hooks fire** (check console messages)
2. **Where reroll option appears** (native menu vs custom menu)
3. **Any JavaScript errors** in console
4. **Functional behavior** of the reroll dialog

## 🔗 Quick Links

- **v13 Testing**: http://localhost:30000
- **v12 Testing**: http://localhost:30001  
- **Hook Verification**: Copy/paste `test-hook-verification.js`
- **Debug Guide**: See `REROLL_DEBUGGING_GUIDE.md` for detailed troubleshooting

---

**Deployment**: ✅ FRESH  
**Code**: ✅ LATEST  
**Containers**: ✅ RESTARTED  
**Status**: 🧪 READY FOR TESTING 