# Custom Sounds User Guide

**Avant VTT Custom Sound System v2.0.0**

Add your own custom sound effects to enhance your Avant VTT gaming experience! This guide walks you through everything you need to know to add, manage, and troubleshoot custom UI sounds.

## 🎵 Overview

The Avant VTT system includes an automatic sound system that plays audio feedback when you interact with certain UI elements:

- **Talent Chat Buttons** (💬) - When posting talent cards to chat
- **Augment Chat Buttons** (💬) - When posting augment cards to chat  
- **Power Point Spending** - When spending power points directly from sheets
- **General UI Interactions** - Button clicks, success/error notifications

By default, these sounds use the dice roll sound from FoundryVTT. However, you can easily add your own custom sound files to create a more personalized and immersive experience.

## 📁 File Structure

### Where to Place Sound Files

All custom sound files go in the `assets/sounds/ui/` directory within your Avant VTT system folder:

```
avant-vtt-system/
├── assets/
│   └── sounds/
│       └── ui/                    # ← Your custom sounds go here
│           ├── talent-chat.wav    # Talent card posting sound
│           ├── augment-chat.wav   # Augment card posting sound
│           ├── spend-pp.wav       # Power point spending sound
│           ├── button-click.wav   # Generic button click sound
│           ├── success.wav        # Success/confirmation sound
│           └── error.wav          # Error/warning sound
├── scripts/
├── styles/
└── templates/
```

### Required Filenames

The system looks for specific filenames. Use these exact names (case-sensitive):

| Sound Type            | Filename           | When It Plays                      |
| --------------------- | ------------------ | ---------------------------------- |
| **Talent Chat**       | `talent-chat.wav`  | When posting talent cards to chat  |
| **Augment Chat**      | `augment-chat.wav` | When posting augment cards to chat |
| **Power Point Spend** | `spend-pp.wav`     | When spending power points         |
| **Button Click**      | `button-click.wav` | Generic UI button interactions     |
| **Success**           | `success.wav`      | Successful actions/confirmations   |
| **Error**             | `error.wav`        | Errors or warnings                 |

## 🎧 Audio File Requirements

### Supported Formats

The system supports multiple audio formats (in order of preference):

1. **WAV** (recommended) - `.wav`
2. **MP3** - `.mp3`
3. **OGG Vorbis** - `.ogg`

### Technical Specifications

For best results, use these specifications:

| Property        | Recommended Value | Notes                          |
| --------------- | ----------------- | ------------------------------ |
| **Format**      | WAV (16-bit)      | Best compatibility and quality |
| **Sample Rate** | 44.1 kHz          | Standard CD quality            |
| **Duration**    | Under 2 seconds   | UI sounds should be brief      |
| **File Size**   | Under 100 KB      | Keeps loading fast             |
| **Channels**    | Mono or Stereo    | Both work fine                 |

### Sound Design Guidelines

**Talent Chat Sound:**
- Light, positive tone
- Suggests card placement or magical activation
- Examples: soft chime, paper rustle, gentle sparkle

**Augment Chat Sound:**
- Slightly more technological/mechanical
- Different from talent sound for distinction
- Examples: soft beep, tech activation, subtle whir

**Power Point Spend Sound:**
- Distinctive resource expenditure feeling
- Should feel "costly" but not negative
- Examples: coin clink, energy discharge, crystal chime

**Button Click Sound:**
- Crisp, subtle, professional
- Works for various UI interactions
- Examples: soft click, tap, gentle pop

**Success Sound:**
- Uplifting, confirmatory
- Brief celebration or acknowledgment
- Examples: positive chime, soft bell, gentle ding

**Error Sound:**
- Gentle warning, not harsh or jarring
- Should indicate problem without being annoying
- Examples: soft buzz, gentle negative tone, muted beep

## 🚀 How to Add Custom Sounds

### Step 1: Create the Directory

If the `assets/sounds/ui/` directory doesn't exist, create it:

**Windows:**
```cmd
mkdir assets\sounds\ui
```

**Mac/Linux:**
```bash
mkdir -p assets/sounds/ui
```

### Step 2: Add Your Sound Files

Copy your custom sound files to the `assets/sounds/ui/` directory with the correct filenames:

**Example:**
```bash
# Copy your custom talent sound
cp my-talent-sound.wav assets/sounds/ui/talent-chat.wav

# Copy your custom spend sound
cp my-spend-sound.wav assets/sounds/ui/spend-pp.wav

# Copy your custom success sound
cp my-success-sound.wav assets/sounds/ui/success.wav
```

### Step 3: Verify File Placement

Use the built-in validation tool to check your sound files:

```bash
npm run sounds:validate
```

**Expected output when successful:**
```
🎵 Avant VTT Sound Asset Validator

✅ Found Sound Files:
  TALENT_CHAT: assets/sounds/ui/talent-chat.wav (25.3 KB)
  SPEND_PP: assets/sounds/ui/spend-pp.wav (18.7 KB)
  SUCCESS: assets/sounds/ui/success.wav (31.2 KB)

📊 Summary:
  Found: 3/7 (43%)
  Missing: 4/7

⚠️ Missing sound files will fall back to dice roll sound
```

### Step 4: Test in FoundryVTT

1. **Restart FoundryVTT** (or refresh your world)
2. **Open an actor sheet** with talents or augments
3. **Click the chat buttons** (💬) to test sounds
4. **Try spending power points** to test the spend sound

## 🔧 Troubleshooting

### Sound Not Playing

**Problem:** You added a sound file but it's not playing.

**Solutions:**
1. **Check filename** - Must be exact (case-sensitive)
2. **Verify location** - Must be in `assets/sounds/ui/` directory
3. **Check format** - Use WAV, MP3, or OGG
4. **Restart FoundryVTT** - New sounds require a restart
5. **Check file size** - Very large files may not load properly

### Sound Validation Fails

**Problem:** `npm run sounds:validate` shows errors.

**Solutions:**
1. **Check file paths** - Ensure files are in correct directory
2. **Verify filenames** - Must match exactly (e.g., `talent-chat.wav`)
3. **Check permissions** - Ensure files are readable
4. **Validate format** - Use supported audio formats

### Sound Too Loud/Quiet

**Problem:** Custom sounds don't match game volume.

**Solutions:**
1. **Use FoundryVTT volume controls** - Go to Audio settings → Interface volume
2. **Normalize your audio files** - Use audio editing software to match levels
3. **Check file quality** - Poor quality files may have volume issues

### Wrong Sound Playing

**Problem:** Different sound plays than expected.

**Solutions:**
1. **Clear browser cache** - Force refresh (Ctrl+F5 or Cmd+Shift+R)
2. **Check file names** - Ensure no typos in filenames
3. **Restart FoundryVTT** - Clear audio cache

## 📋 Validation Commands

The system includes helpful commands for managing your sound files:

### Check Sound Status
```bash
npm run sounds:validate
```
Shows which sounds are found/missing with file sizes and recommendations.

### Quick Sound Check
```bash
npm run sounds:check
```
Same as above - validates all sound assets.

## 🎨 Advanced Customization

### Creating Sound Themes

You can create different "sound themes" by organizing sets of sounds:

```
assets/
├── sounds/
│   ├── ui/                    # Current active sounds
│   │   ├── talent-chat.wav
│   │   └── spend-pp.wav
│   └── themes/
│       ├── fantasy/          # Fantasy theme sounds
│       │   ├── talent-chat.wav
│       │   └── spend-pp.wav
│       ├── sci-fi/           # Sci-fi theme sounds
│       │   ├── talent-chat.wav
│       │   └── spend-pp.wav
│       └── minimal/          # Minimal theme sounds
│           ├── talent-chat.wav
│           └── spend-pp.wav
```

To switch themes, copy files from a theme folder to the main `ui/` folder.

### Batch Processing

If you have multiple sound files to process:

**PowerShell (Windows):**
```powershell
# Convert multiple files to correct format
foreach($file in Get-ChildItem *.mp3) {
    $name = $file.BaseName
    ffmpeg -i $file "assets/sounds/ui/$name.wav"
}
```

**Bash (Mac/Linux):**
```bash
# Convert multiple files to correct format
for file in *.mp3; do
    name=$(basename "$file" .mp3)
    ffmpeg -i "$file" "assets/sounds/ui/$name.wav"
done
```

## 🔗 Resources

### Audio Editing Software

**Free Options:**
- **Audacity** - Cross-platform, full-featured
- **GarageBand** (Mac) - User-friendly with good effects
- **Reaper** (60-day free trial) - Professional features

**Online Tools:**
- **Freesound.org** - Free sound effects library
- **Online-Audio-Converter.com** - Format conversion
- **TwistedWave Online** - Simple audio editing

### Sound Libraries

**Free Sound Effects:**
- **Freesound.org** - Massive community library
- **BBC Sound Effects** - Professional quality sounds
- **YouTube Audio Library** - Royalty-free sounds

**Paid Sound Libraries:**
- **AudioJungle** - Professional sound effects
- **Epidemic Sound** - Subscription-based library
- **Adobe Stock Audio** - High-quality sounds

### Format Conversion

If you have sounds in other formats, you can convert them:

**Using FFmpeg:**
```bash
# Convert MP3 to WAV
ffmpeg -i input.mp3 output.wav

# Convert with specific settings
ffmpeg -i input.mp3 -ar 44100 -ac 2 -c:a pcm_s16le output.wav
```

**Using Online Converters:**
- CloudConvert.com
- Online-Audio-Converter.com
- Convertio.co

## 📞 Support

### Getting Help

If you encounter issues:

1. **Check this guide** - Most common issues are covered here
2. **Run validation** - Use `npm run sounds:validate` for diagnostics
3. **Check FoundryVTT console** - Look for error messages (F12 → Console)
4. **Ask the community** - Post in the Avant VTT Discord/forums

### Reporting Issues

When reporting sound-related issues, include:

- Output from `npm run sounds:validate`
- Your file structure (`ls assets/sounds/ui/` or `dir assets\sounds\ui`)
- FoundryVTT version and browser
- Any console error messages

### Contributing

Found a great set of sounds? Consider sharing them with the community:

- Create a "sound pack" with themed audio files
- Share guidelines for specific genres (fantasy, sci-fi, horror)
- Contribute to the documentation with tips and tricks

---

**Happy Gaming!** 🎲

*Your custom sounds will make every interaction feel more immersive and personal. Enjoy creating the perfect audio experience for your Avant VTT sessions!* 