/**
 * Avant Theme Configuration
 * Centralized theme variable definitions for easy management
 * 
 * This file defines all available theme variables that can be customized.
 * Each variable has:
 * - cssVar: The CSS custom property name
 * - description: What this variable controls
 * - category: Grouping for organization
 * - required: Whether this must be included in themes
 * - example: Sample value to use
 * 
 * To add new theme variables, simply add them to the appropriate section below.
 */

export const THEME_CONFIG = {
    // Core color variables - these are essential and should always be present
    colors: {
        backgrounds: {
            primary: {
                cssVar: '--theme-bg-primary',
                description: 'Main background color for sheet body and primary areas',
                category: 'backgrounds',
                required: true,
                example: '#1C1C1C'
            },
            secondary: {
                cssVar: '--theme-bg-secondary',
                description: 'Secondary backgrounds like sidebars and headers',
                category: 'backgrounds',
                required: true,
                example: '#2A2A2A'
            },
            tertiary: {
                cssVar: '--theme-bg-tertiary',
                description: 'UI element backgrounds like buttons and tiles',
                category: 'backgrounds',
                required: true,
                example: '#333333'
            },
            // SCSS compatibility variables
            surface: {
                cssVar: '--theme-surface',
                description: 'Surface/background color for feature cards (SCSS compatibility)',
                category: 'backgrounds',
                required: true,
                example: '#1a1a1a'
            },
            surfaceVariant: {
                cssVar: '--theme-surface-variant',
                description: 'Variant surface color for UI elements (SCSS compatibility)',
                category: 'backgrounds',
                required: false,
                example: '#2a2a2a'
            }
        },
        text: {
            primary: {
                cssVar: '--theme-text-primary',
                description: 'Main text color with high contrast',
                category: 'text',
                required: true,
                example: '#FFFFFF'
            },
            secondary: {
                cssVar: '--theme-text-secondary',
                description: 'Secondary text with medium contrast',
                category: 'text',
                required: true,
                example: '#BFBFBF'
            },
            muted: {
                cssVar: '--theme-text-muted',
                description: 'Subtle text with low contrast',
                category: 'text',
                required: false,
                example: '#808080'
            },
            // SCSS compatibility variables
            main: {
                cssVar: '--theme-text',
                description: 'Main text color for feature cards (SCSS compatibility)',
                category: 'text',
                required: true,
                example: '#e0e0e0'
            },
            onPrimary: {
                cssVar: '--theme-text-on-primary',
                description: 'Text color on primary background (SCSS compatibility)',
                category: 'text',
                required: false,
                example: '#000'
            },
            onSecondary: {
                cssVar: '--theme-text-on-secondary',
                description: 'Text color on secondary background (SCSS compatibility)',
                category: 'text',
                required: false,
                example: '#000'
            }
        },
        accents: {
            primary: {
                cssVar: '--theme-accent-primary',
                description: 'Main accent color for borders, highlights, and active states',
                category: 'accents',
                required: true,
                example: '#00E0DC'
            },
            secondary: {
                cssVar: '--theme-accent-secondary',
                description: 'Secondary accent for alternative highlights',
                category: 'accents',
                required: false,
                example: '#4CE2E1'
            },
            tertiary: {
                cssVar: '--theme-accent-tertiary',
                description: 'Additional accent color for variety',
                category: 'accents',
                required: false,
                example: '#00B8B5'
            },
            // SCSS compatibility variables  
            themePrimary: {
                cssVar: '--theme-primary',
                description: 'Primary theme color for feature cards (SCSS compatibility)',
                category: 'accents',
                required: true,
                example: '#00E0DC'
            },
            themeSecondary: {
                cssVar: '--theme-secondary',
                description: 'Secondary theme color for feature cards (SCSS compatibility)',
                category: 'accents',
                required: true,
                example: '#4CE2E1'
            }
        },
        borders: {
            primary: {
                cssVar: '--theme-border-primary',
                description: 'Primary border color for UI elements',
                category: 'borders',
                required: true,
                example: '#404040'
            },
            accent: {
                cssVar: '--theme-border-accent',
                description: 'Accent border color for highlights',
                category: 'borders',
                required: false,
                example: '#00E0DC'
            },
            // SCSS compatibility variables
            main: {
                cssVar: '--theme-border',
                description: 'Main border color for feature cards (SCSS compatibility)',
                category: 'borders',
                required: true,
                example: '#333'
            }
        },
        states: {
            success: {
                cssVar: '--theme-success',
                description: 'Success state color (green)',
                category: 'states',
                required: false,
                example: '#10B981'
            },
            warning: {
                cssVar: '--theme-warning',
                description: 'Warning state color (yellow/orange)',
                category: 'states',
                required: false,
                example: '#F59E0B'
            },
            error: {
                cssVar: '--theme-error',
                description: 'Error state color (red)',
                category: 'states',
                required: false,
                example: '#EF4444'
            },
            info: {
                cssVar: '--theme-info',
                description: 'Info state color (blue)',
                category: 'states',
                required: false,
                example: '#3B82F6'
            },
            // SCSS compatibility variables
            colorSuccess: {
                cssVar: '--color-success',
                description: 'Success color for PP buttons (SCSS compatibility)',
                category: 'states',
                required: false,
                example: '#22c55e'
            },
            colorSuccessText: {
                cssVar: '--color-success-text',
                description: 'Success text color (SCSS compatibility)',
                category: 'states',
                required: false,
                example: '#000'
            },
            colorError: {
                cssVar: '--color-error',
                description: 'Error color for invalid states (SCSS compatibility)',
                category: 'states',
                required: false,
                example: '#ff4444'
            },
            colorErrorBg: {
                cssVar: '--color-error-bg',
                description: 'Error background color (SCSS compatibility)',
                category: 'states',
                required: false,
                example: 'rgba(255, 68, 68, 0.1)'
            }
        }
    },
    
    // Typography variables
    typography: {
        fontPrimary: {
            cssVar: '--theme-font-primary',
            description: 'Primary font family for body text',
            category: 'typography',
            required: false,
            example: "'Exo 2', sans-serif"
        },
        fontDisplay: {
            cssVar: '--theme-font-display',
            description: 'Display font family for headers and titles',
            category: 'typography',
            required: false,
            example: "'Orbitron', monospace"
        }
    },
    
    // Effects and visual enhancements
    effects: {
        shadows: {
            primary: {
                cssVar: '--theme-shadow-primary',
                description: 'Primary shadow for subtle depth',
                category: 'effects',
                required: false,
                example: '0 4px 20px rgba(0, 224, 220, 0.1)'
            },
            accent: {
                cssVar: '--theme-shadow-accent',
                description: 'Accent shadow for highlights and focus states',
                category: 'effects',
                required: false,
                example: '0 0 20px rgba(0, 224, 220, 0.3)'
            },
            deep: {
                cssVar: '--theme-shadow-deep',
                description: 'Deep shadow for elevated elements',
                category: 'effects',
                required: false,
                example: '0 8px 32px rgba(0, 0, 0, 0.6)'
            }
        },
        gradients: {
            primary: {
                cssVar: '--theme-gradient-primary',
                description: 'Primary gradient for backgrounds',
                category: 'effects',
                required: false,
                example: 'linear-gradient(135deg, #1C1C1C 0%, #2A2A2A 100%)'
            },
            accent: {
                cssVar: '--theme-gradient-accent',
                description: 'Accent gradient for highlights',
                category: 'effects',
                required: false,
                example: 'linear-gradient(135deg, #00E0DC 0%, #4CE2E1 100%)'
            }
        }
    },
    
    // Interface-specific variables (new additions go here)
    interface: {
        animation: {
            speed: {
                cssVar: '--theme-animation-speed',
                description: 'Default animation duration',
                category: 'interface',
                required: false,
                example: '0.3s'
            }
        },
        layout: {
            borderRadius: {
                cssVar: '--theme-border-radius',
                description: 'Default border radius for UI elements',
                category: 'interface',
                required: false,
                example: '0px'
            }
        }
    },
    
    // Metadata variables
    metadata: {
        name: {
            cssVar: '--theme-name',
            description: 'Theme name for identification',
            category: 'metadata',
            required: false,
            example: '"My Theme"'
        },
        author: {
            cssVar: '--theme-author',
            description: 'Theme author name',
            category: 'metadata',
            required: false,
            example: '"Theme Creator"'
        },
        version: {
            cssVar: '--theme-version',
            description: 'Theme version number',
            category: 'metadata',
            required: false,
            example: '"1.0.0"'
        }
    }
}; 