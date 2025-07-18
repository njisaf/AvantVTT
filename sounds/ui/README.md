# UI Sound Assets

⚠️ **IMPORTANT**: This directory is deprecated. Custom sound files should now be placed in `assets/sounds/ui/` instead.

## 📁 New Directory Structure

```
assets/
├── sounds/
│   ├── ui/                    # UI interaction sounds (NEW LOCATION)
│   │   ├── talent-chat.wav   # Talent card posting
│   │   ├── augment-chat.wav  # Augment card posting
│   │   ├── spend-pp.wav      # Power point spending
│   │   ├── button-click.wav  # Generic button clicks
│   │   ├── success.wav       # Success/confirmation
│   │   └── error.wav         # Error/failure
│   ├── dice/                 # Dice roll sounds (future)
│   └── ambient/              # Ambient sounds (future)
```

## 🔄 Migration Instructions

If you have custom sound files in this directory, please move them to the new location:

**Windows:**
```cmd
mkdir assets\sounds\ui
move sounds\ui\*.* assets\sounds\ui\
```

**Mac/Linux:**
```bash
mkdir -p assets/sounds/ui
mv sounds/ui/*.* assets/sounds/ui/
```

This directory will be removed in a future version of the system.

## 🎵 Adding Custom Sounds

1. **Place your sound files** in the `assets/sounds/ui/` directory
2. **Use the exact filename** specified in the UISound enum
3. **Restart FoundryVTT** (or refresh the world) to load new sounds
4. **Test in-game** by clicking the relevant buttons

## 🔧 Automatic Detection

The system automatically detects available sound files on startup and uses them instead of fallback sounds. If a file doesn't exist, it falls back gracefully to the dice roll sound.

## 📋 Technical Notes

- **File Formats**: WAV (recommended), MP3, OGG
- **Sample Rate**: 44.1kHz recommended
- **Bit Depth**: 16-bit recommended
- **Duration**: Keep under 2 seconds for UI sounds
- **Volume**: System will normalize, but aim for consistent levels

## 🎯 Sound Guidelines

- **Talent Chat**: Light, positive tone (card placement)
- **Augment Chat**: Slightly different from talent (technological enhancement)
- **Spend PP**: Distinctive resource expenditure sound (coins, energy)
- **Button Click**: Subtle, crisp click sound
- **Success**: Uplifting confirmation tone
- **Error**: Gentle warning tone (not harsh)

For full documentation, see `docs/CUSTOM_SOUNDS.md` 