#!/usr/bin/env node

/**
 * Archive Check Script
 * 
 * Reports size and change frequency of deprecated folder to help inform
 * Q2 2025 decision on archive strategy (ADR-0008).
 * 
 * Usage:
 *   node scripts/tools/archive-check.js
 *   node scripts/tools/archive-check.js --json
 * 
 * @author AvantVTT Development Team
 * @since Phase 4 - Long-term Safeguards
 */

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const DEPRECATED_DIR = 'deprecated';

/**
 * Get size of directory in bytes
 * @param {string} dirPath - Path to directory
 * @returns {number} Size in bytes
 */
function getDirectorySize(dirPath) {
    if (!existsSync(dirPath)) {
        return 0;
    }
    
    try {
        const result = execSync(`du -sb "${dirPath}"`, { encoding: 'utf8' });
        return parseInt(result.split('\t')[0]);
    } catch (error) {
        console.warn(`Warning: Could not calculate size for ${dirPath}:`, error.message);
        return 0;
    }
}

/**
 * Get number of files in directory recursively
 * @param {string} dirPath - Path to directory
 * @returns {number} Number of files
 */
function getFileCount(dirPath) {
    if (!existsSync(dirPath)) {
        return 0;
    }
    
    try {
        const result = execSync(`find "${dirPath}" -type f | wc -l`, { encoding: 'utf8' });
        return parseInt(result.trim());
    } catch (error) {
        console.warn(`Warning: Could not count files in ${dirPath}:`, error.message);
        return 0;
    }
}

/**
 * Get git history for deprecated folder (commits in last 6 months)
 * @param {string} dirPath - Path to directory
 * @returns {Object} Git history stats
 */
function getGitHistory(dirPath) {
    if (!existsSync(dirPath)) {
        return { commits: 0, lastModified: null, authors: [] };
    }
    
    try {
        // Get commits in last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const since = sixMonthsAgo.toISOString().split('T')[0];
        
        // Count commits
        const commitCount = execSync(
            `git log --oneline --since="${since}" -- "${dirPath}" | wc -l`,
            { encoding: 'utf8' }
        );
        
        // Get last modification date
        let lastModified = null;
        try {
            const lastCommit = execSync(
                `git log -1 --format="%ai" -- "${dirPath}"`,
                { encoding: 'utf8' }
            ).trim();
            lastModified = lastCommit || null;
        } catch (e) {
            // No commits found
        }
        
        // Get unique authors
        let authors = [];
        try {
            const authorList = execSync(
                `git log --since="${since}" --format="%an" -- "${dirPath}" | sort | uniq`,
                { encoding: 'utf8' }
            ).trim();
            authors = authorList ? authorList.split('\n') : [];
        } catch (e) {
            // No authors found
        }
        
        return {
            commits: parseInt(commitCount.trim()),
            lastModified,
            authors
        };
    } catch (error) {
        console.warn(`Warning: Could not get git history for ${dirPath}:`, error.message);
        return { commits: 0, lastModified: null, authors: [] };
    }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Analyze deprecated folders
 * @returns {Object} Analysis results
 */
function analyzeDeprecatedFolders() {
    const results = {
        totalSize: 0,
        totalFiles: 0,
        folders: [],
        summary: {
            repositoryImpact: 'low',
            recommendation: 'continue-current-approach',
            concerns: []
        }
    };
    
    if (!existsSync(DEPRECATED_DIR)) {
        results.summary.recommendation = 'no-deprecated-code';
        return results;
    }
    
    try {
        const deprecatedFolders = readdirSync(DEPRECATED_DIR)
            .filter(item => statSync(join(DEPRECATED_DIR, item)).isDirectory());
        
        for (const folder of deprecatedFolders) {
            const folderPath = join(DEPRECATED_DIR, folder);
            const size = getDirectorySize(folderPath);
            const fileCount = getFileCount(folderPath);
            const gitHistory = getGitHistory(folderPath);
            
            const folderInfo = {
                name: folder,
                path: folderPath,
                size,
                sizeFormatted: formatBytes(size),
                fileCount,
                gitHistory,
                createdDate: null // Could be extracted from git if needed
            };
            
            results.folders.push(folderInfo);
            results.totalSize += size;
            results.totalFiles += fileCount;
        }
        
        // Analyze impact and make recommendations
        analyzeImpact(results);
        
    } catch (error) {
        console.error('Error analyzing deprecated folders:', error.message);
    }
    
    return results;
}

/**
 * Analyze impact and generate recommendations
 * @param {Object} results - Analysis results to update
 */
function analyzeImpact(results) {
    const { totalSize, totalFiles, folders } = results;
    
    // Size-based analysis
    const sizeMB = totalSize / (1024 * 1024);
    if (sizeMB > 50) {
        results.summary.repositoryImpact = 'high';
        results.summary.concerns.push(`Deprecated code is ${formatBytes(totalSize)} (>50MB target)`);
    } else if (sizeMB > 20) {
        results.summary.repositoryImpact = 'medium';
        results.summary.concerns.push(`Deprecated code is ${formatBytes(totalSize)} (approaching 50MB limit)`);
    }
    
    // File count analysis
    if (totalFiles > 100) {
        results.summary.concerns.push(`${totalFiles} deprecated files may impact IDE performance`);
    }
    
    // Activity analysis
    const recentActivity = folders.some(folder => folder.gitHistory.commits > 0);
    if (recentActivity) {
        results.summary.concerns.push('Recent activity in deprecated folders detected');
    }
    
    // Generate recommendation
    if (results.summary.repositoryImpact === 'high' || folders.length > 3) {
        results.summary.recommendation = 'consider-external-archive';
    } else if (results.summary.repositoryImpact === 'medium') {
        results.summary.recommendation = 'monitor-closely';
    } else {
        results.summary.recommendation = 'continue-current-approach';
    }
}

/**
 * Generate report output
 * @param {Object} results - Analysis results
 * @param {boolean} jsonOutput - Whether to output JSON
 */
function generateReport(results, jsonOutput = false) {
    if (jsonOutput) {
        console.log(JSON.stringify(results, null, 2));
        return;
    }
    
    console.log('📊 AvantVTT Archive Analysis Report');
    console.log('==================================');
    console.log();
    
    if (results.folders.length === 0) {
        console.log('✅ No deprecated code found - repository is clean');
        return;
    }
    
    console.log('📦 Overall Statistics:');
    console.log(`   Total Size: ${formatBytes(results.totalSize)}`);
    console.log(`   Total Files: ${results.totalFiles}`);
    console.log(`   Deprecated Components: ${results.folders.length}`);
    console.log();
    
    console.log('📁 Deprecated Folders:');
    results.folders.forEach(folder => {
        console.log(`   ${folder.name}:`);
        console.log(`     Size: ${folder.sizeFormatted}`);
        console.log(`     Files: ${folder.fileCount}`);
        console.log(`     Last Modified: ${folder.gitHistory.lastModified || 'Unknown'}`);
        console.log(`     Recent Commits (6mo): ${folder.gitHistory.commits}`);
        if (folder.gitHistory.authors.length > 0) {
            console.log(`     Recent Authors: ${folder.gitHistory.authors.join(', ')}`);
        }
        console.log();
    });
    
    console.log('🎯 Impact Assessment:');
    console.log(`   Repository Impact: ${results.summary.repositoryImpact.toUpperCase()}`);
    console.log(`   Recommendation: ${results.summary.recommendation.replace(/-/g, ' ').toUpperCase()}`);
    
    if (results.summary.concerns.length > 0) {
        console.log();
        console.log('⚠️  Concerns:');
        results.summary.concerns.forEach(concern => {
            console.log(`   • ${concern}`);
        });
    }
    
    console.log();
    console.log('📋 Q2 2025 Decision Framework:');
    if (results.summary.recommendation === 'consider-external-archive') {
        console.log('   ➡️  RECOMMEND: Migrate to external archive repository');
        console.log('      - Repository size or complexity exceeds thresholds');
        console.log('      - External archive will improve main repository performance');
    } else if (results.summary.recommendation === 'monitor-closely') {
        console.log('   ➡️  RECOMMEND: Continue monitoring, prepare for migration');
        console.log('      - Approaching thresholds but not critical yet');
        console.log('      - Evaluate again in Q2 2025 or if more services deprecated');
    } else {
        console.log('   ➡️  RECOMMEND: Continue current approach');
        console.log('      - Repository impact is acceptable');
        console.log('      - Current safeguards are sufficient');
    }
    
    console.log();
    console.log('📖 References:');
    console.log('   • ADR-0008: Archive Strategy for Deprecated Code');
    console.log('   • docs/DEPRECATION_POLICY.md');
    console.log('   • deprecated/*/README.md for component details');
}

/**
 * Main execution
 */
function main() {
    const args = process.argv.slice(2);
    const jsonOutput = args.includes('--json');
    
    try {
        const results = analyzeDeprecatedFolders();
        generateReport(results, jsonOutput);
        
        // Exit with appropriate code for CI/CD
        if (results.summary.repositoryImpact === 'high') {
            process.exit(1); // Indicate attention needed
        }
        
    } catch (error) {
        console.error('Error running archive check:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { analyzeDeprecatedFolders, formatBytes }; 