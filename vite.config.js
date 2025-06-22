import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

// Helper function to recursively copy directories
function copyDirSync(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Custom plugin to copy system files
function copySystemFiles() {
  return {
    name: 'copy-system-files',
    writeBundle() {
      console.log('📦 Copying system files to dist/...');
      
      // Copy manifest files
      copyFileSync('system.json', 'dist/system.json');
      copyFileSync('template.json', 'dist/template.json');
      
      // Copy templates directory
      copyDirSync('templates', 'dist/templates');
      
      // Copy lang directory  
      copyDirSync('lang', 'dist/lang');
      
      // Copy assets directory (if it exists and has content)
      try {
        const assetsStat = statSync('assets');
        if (assetsStat.isDirectory()) {
          copyDirSync('assets', 'dist/assets');
        }
      } catch (e) {
        // assets directory doesn't exist, skip
      }
      
      // CSS files are built directly to dist/styles/ by build:scss:dist
      // No need to copy them here
      
      // Copy any theme files
      try {
        copyDirSync('styles/themes', 'dist/styles/themes');
      } catch (e) {
        // themes directory might not exist
      }
      
      console.log('✅ System files copied successfully');
    }
  };
}

export default defineConfig({
  build: {
    lib: {
      entry: 'scripts/avant.js',
      formats: ['es']
    },
    rollupOptions: {
      external: ['foundry'],
      output: {
        dir: 'dist/scripts',
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'scripts'
      }
    },
    target: 'es2022',
    sourcemap: true,
    emptyOutDir: true  // Clean dist/ before building
  },
  plugins: [copySystemFiles()]
}); 