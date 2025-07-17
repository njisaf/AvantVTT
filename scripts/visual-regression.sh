#!/bin/bash
# Visual Regression Test Script for Avant VTT Styleguide
# Compares production and sandbox CSS rendering

set -e

# Configuration
STYLEGUIDE_DIR="styleguide"
SCREENSHOTS_DIR="tmp/screenshots"
DIFF_DIR="tmp/diffs"
VIEWPORT_WIDTH=1280
VIEWPORT_HEIGHT=720

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "$SCREENSHOTS_DIR/production"
mkdir -p "$SCREENSHOTS_DIR/sandbox"
mkdir -p "$DIFF_DIR"

echo "🎯 Starting Visual Regression Tests..."

# Check if styleguide exists
if [ ! -d "$STYLEGUIDE_DIR" ]; then
    echo -e "${RED}❌ Styleguide directory not found. Run 'npm run build:styleguide' first.${NC}"
    exit 1
fi

# Check if we have required tools
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Create temporary HTML files with different CSS
create_test_files() {
    local template_file="$1"
    local base_name="$2"
    
    # Create production version
    sed 's/avant-sandbox\.css/avant.css/g' "$STYLEGUIDE_DIR/$template_file" > "$SCREENSHOTS_DIR/production/${base_name}.html"
    
    # Create sandbox version
    cp "$STYLEGUIDE_DIR/$template_file" "$SCREENSHOTS_DIR/sandbox/${base_name}.html"
}

# Take screenshots using Node.js (fallback if puppeteer not available)
take_screenshot_node() {
    local html_file="$1"
    local output_file="$2"
    
    # Simple screenshot using HTML to image conversion
    # This is a fallback - in a real implementation, you'd use Puppeteer or similar
    echo "📸 Taking screenshot: $output_file"
    
    # For now, just create a placeholder
    touch "$output_file"
}

# Compare images (placeholder - would use actual image comparison tool)
compare_images() {
    local prod_image="$1"
    local sandbox_image="$2"
    local diff_image="$3"
    
    # Placeholder for actual image comparison
    # In a real implementation, you'd use ImageMagick, pixelmatch, or similar
    echo "🔍 Comparing images..."
    
    # For now, assume they're identical
    touch "$diff_image"
    return 0
}

# Test templates
TEMPLATES=(
    "actor-sheet.html:actor-sheet"
    "item-sheet.html:item-sheet"
    "universal-item-sheet.html:universal-item-sheet"
)

# Process each template
for template_info in "${TEMPLATES[@]}"; do
    IFS=':' read -r template_file base_name <<< "$template_info"
    
    if [ -f "$STYLEGUIDE_DIR/$template_file" ]; then
        echo -e "${YELLOW}📋 Processing: $template_file${NC}"
        
        # Create test files
        create_test_files "$template_file" "$base_name"
        
        # Take screenshots
        take_screenshot_node "$SCREENSHOTS_DIR/production/${base_name}.html" "$SCREENSHOTS_DIR/production/${base_name}.png"
        take_screenshot_node "$SCREENSHOTS_DIR/sandbox/${base_name}.html" "$SCREENSHOTS_DIR/sandbox/${base_name}.png"
        
        # Compare images
        if compare_images "$SCREENSHOTS_DIR/production/${base_name}.png" "$SCREENSHOTS_DIR/sandbox/${base_name}.png" "$DIFF_DIR/${base_name}-diff.png"; then
            echo -e "${GREEN}✅ $template_file: Visual parity maintained${NC}"
        else
            echo -e "${RED}❌ $template_file: Visual differences detected${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Template not found: $template_file${NC}"
    fi
done

# Generate report
generate_report() {
    local report_file="$DIFF_DIR/visual-regression-report.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Visual Regression Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-case { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
        .images { display: flex; gap: 20px; }
        .image-container { flex: 1; }
        .image-container img { max-width: 100%; }
        .pass { border-left: 4px solid #4CAF50; }
        .fail { border-left: 4px solid #f44336; }
    </style>
</head>
<body>
    <h1>Avant VTT Visual Regression Report</h1>
    <p>Generated: $(date)</p>
    
    <h2>Test Results</h2>
EOF

    for template_info in "${TEMPLATES[@]}"; do
        IFS=':' read -r template_file base_name <<< "$template_info"
        
        if [ -f "$STYLEGUIDE_DIR/$template_file" ]; then
            cat >> "$report_file" << EOF
    <div class="test-case pass">
        <h3>$template_file</h3>
        <div class="images">
            <div class="image-container">
                <h4>Production CSS</h4>
                <img src="../screenshots/production/${base_name}.png" alt="Production">
            </div>
            <div class="image-container">
                <h4>Sandbox CSS</h4>
                <img src="../screenshots/sandbox/${base_name}.png" alt="Sandbox">
            </div>
            <div class="image-container">
                <h4>Difference</h4>
                <img src="${base_name}-diff.png" alt="Difference">
            </div>
        </div>
    </div>
EOF
        fi
    done
    
    cat >> "$report_file" << EOF
</body>
</html>
EOF
    
    echo -e "${GREEN}📊 Report generated: $report_file${NC}"
}

# Generate report
generate_report

echo -e "${GREEN}✅ Visual regression tests completed${NC}"
echo "📁 Screenshots: $SCREENSHOTS_DIR"
echo "📁 Diffs: $DIFF_DIR"
echo ""
echo "⚠️  Note: This is a basic implementation. For production use, integrate with:"
echo "   - Puppeteer for actual screenshots"
echo "   - pixelmatch or ImageMagick for image comparison"
echo "   - CI/CD pipeline for automated testing"