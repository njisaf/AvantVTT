/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './scripts/**/*.{js,ts}',
    './templates/**/*.{html,hbs}',
    './styles/**/*.{css,scss}',
    './tests/**/*.{js,ts}'
  ],
  
  // Enable JIT mode for production builds
  mode: 'jit',
  
  // No prefix for now - we'll scope manually with CSS
  // prefix: 'avant-',
  
  theme: {
    extend: {
      // Map existing SCSS variables to Tailwind theme
      colors: {
        'avant': {
          'bg': {
            'primary': '#1C1C1C',     // $bg-primary
            'secondary': '#2A2A2A',   // $bg-secondary  
            'tertiary': '#333333',    // $bg-tertiary
          },
          'text': {
            'primary': '#FFFFFF',     // $text-primary
            'secondary': '#BFBFBF',   // $grey-cool / $text-secondary
            'muted': '#808080',       // $text-muted
          },
          'accent': {
            'primary': '#00E0DC',     // $accent-cyan
            'secondary': '#4CE2E1',   // $aqua-muted
          },
          'border': {
            'primary': '#404040',     // $border-primary
            'secondary': '#555555',   // Common secondary border
          }
        }
      },
      
      fontFamily: {
        'avant': {
          'primary': ['Exo 2', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
          'display': ['Orbitron', 'monospace'],
          'mono': ['Roboto Mono', 'monospace'],
        }
      },
      
      fontSize: {
        'avant': {
          'xs': '10px',
          'sm': '12px', 
          'base': '14px',
          'lg': '16px',
          'xl': '18px',
        }
      },
      
      spacing: {
        'avant': {
          'xs': '4px',
          'sm': '8px',
          'md': '12px',
          'lg': '16px',
          'xl': '20px',
          'xxl': '30px',
        }
      },
      
      borderRadius: {
        'avant': {
          'sm': '4px',
          'md': '6px',
        }
      },
      
      boxShadow: {
        'avant': {
          'primary': '0 4px 20px rgba(0, 224, 220, 0.1)',
          'accent': '0 0 20px rgba(0, 224, 220, 0.3)',
          'deep': '0 8px 32px rgba(0, 0, 0, 0.6)',
        }
      },
      
      // Custom utilities for item cards
      gridTemplateColumns: {
        'item-card': 'auto 1fr auto',
      },
      
      gridTemplateAreas: {
        'item-card': '"left center right"',
      }
    },
  },
  
  plugins: [
    require('@tailwindcss/typography'),
    
    // Custom plugin for Avant-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Grid areas for item cards
        '.avant-grid-area-left': {
          'grid-area': 'left'
        },
        '.avant-grid-area-center': {
          'grid-area': 'center'
        },
        '.avant-grid-area-right': {
          'grid-area': 'right'
        },
        
        // Common transition
        '.avant-transition': {
          'transition': 'all 0.3s ease'
        },
        
        // Text utilities matching existing patterns
        '.avant-orbitron-header': {
          'font-family': theme('fontFamily.avant.display'),
          'font-weight': '700',
          'text-transform': 'uppercase',
          'letter-spacing': '1px',
          'color': theme('colors.avant.accent.primary'),
        },
        
        '.avant-exo-body': {
          'font-family': theme('fontFamily.avant.primary'),
          'font-weight': '400',
          'color': theme('colors.avant.text.primary'),
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
  
  // Safelist important classes that might be generated dynamically
  safelist: [
    'avant-grid',
    'avant-grid-cols-item-card',
    'avant-transition',
    'avant-orbitron-header',
    'avant-exo-body',
    // Tailwind component classes - Item Cards
    'tw-item-card',
    'tw-item-card__left',
    'tw-item-card__center',
    'tw-item-card__right',
    'tw-field-group',
    'tw-field-label',
    'tw-field-value',
    'tw-card-roll-btn',
    'tw-card-edit-btn',
    'tw-card-delete-btn',
    'tw-card-drag-handle',
    'tw-card-icon',
    // Tailwind component classes - Item Sheets
    'tw-item-sheet',
    'tw-sheet-header',
    'tw-sheet-tabs',
    'tw-sheet-body',
    'tw-tab',
    'tw-tab-active',
    'tw-row-container',
    'tw-form-group',
    'tw-form-label',
    'tw-form-input',
    'tw-form-textarea',
    'tw-form-select',
    'tw-tab-item',
    'tw-image-upload',
    'tw-image-upload-img',
    'tw-image-upload-overlay',
    'tw-trait-chip-input',
    'tw-trait-chips',
    'tw-trait-chip',
    'tw-trait-autocomplete',
    'tw-trait-suggestions',
    'tw-hidden',
    'tw-visible',
    // Force preserve scoped image upload classes
    '.avant .tw-image-upload',
    '.avant .tw-image-upload-img',
    '.avant .tw-image-upload-overlay',
    {
      pattern: /avant-(bg|text|border)-(avant-)?(primary|secondary|tertiary|muted)/,
    },
    {
      pattern: /avant-(p|m|gap)-(avant-)?(xs|sm|md|lg|xl|xxl)/,
    },
    {
      pattern: /tw-(item-card|item-sheet|field|card|display|feature|meta|title|sheet|form|tab|trait)/,
    },
    {
      pattern: /\.avant \.tw-image-upload/,
    }
  ]
}