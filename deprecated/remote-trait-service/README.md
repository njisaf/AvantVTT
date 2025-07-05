# Deprecated Remote Trait Service

**Status**: Deprecated and archived  
**Retirement Date**: 2025-01-17  
**Last Commit**: a7a2220 (Basic T&A functionality, but then we had to upgrade to V2 and that took two bloody days.)

## Overview

This directory contains the archived Remote Trait Service that was deprecated and removed from the active codebase. The remote trait service provided functionality for synchronizing traits from remote repositories (GitHub), but was retired as this feature was not required in the current system scope.

## What's Archived Here

- **remote-trait-service.ts**: Main service implementation with sync functionality
- **remote-trait-service.test.ts**: Comprehensive unit test suite covering all service methods
- **README.md**: This documentation file

## Service Capabilities (Archived)

The RemoteTraitService provided:

- **Remote Synchronization**: Fetch trait data from GitHub repositories
- **Conflict Resolution**: Handle conflicts between local and remote traits
- **Compendium Integration**: Create/update FoundryVTT compendium packs with remote traits
- **Data Validation**: Validate remote trait manifest format and integrity
- **CLI Commands**: Command-line interface for sync operations
- **Timeout Handling**: Robust error handling and timeout management
- **Singleton Pattern**: Managed service instance with configuration support

## Retirement Phases

### Phase 1: Quarantine (2025-01-17)
- ✅ Moved RemoteTraitService implementation and tests to this deprecated directory
- ✅ Created stub file at original location to prevent build failures
- ✅ Preserved all code and documentation for future reference
- ✅ Updated Jest configuration to exclude deprecated tests

### Phase 2: Clean Runtime (2025-01-17)
- ✅ Remove initialization manager registration for 'remoteTraitService'
- ✅ Update CLI traits.ts to disable remote sync commands with helpful error messages
- ✅ Clean up remaining import references and dependencies
- ✅ Verify zero runtime references remain in built dist package
- ✅ All build and deployment tests pass successfully

### Phase 3: Repository Hygiene (2025-01-17) 
- ✅ Remove stub file and dead imports from active codebase
- ✅ Implement pre-commit guard to prevent accidental modifications  
- ✅ Enhance Jest configuration with deprecation comments
- ✅ Verify zero build-time artifacts remain

### Phase 4: Long-Term Safeguards (2025-01-17)
- ✅ Implement CI guards for deprecated folder protection
- ✅ Add automated dead-code scanning to pipeline
- ✅ Create comprehensive deprecation policy documentation
- ✅ Establish weekly monitoring workflow for guard integrity
- ✅ Update README with deprecation badges and documentation links
- ✅ Create ADR-0008 for archive strategy evaluation (deferred to Q2 2025)

## Configuration Interface (Archived)

The service supported the following configuration options:

```typescript
interface RemoteTraitConfig {
  defaultUrl: string;           // Default GitHub repository URL
  fetchTimeout: number;         // Request timeout in milliseconds
  verifyIntegrity: boolean;     // Enable data integrity verification
  createCompendiumPack: boolean; // Auto-create compendium packs
  compendiumPackName: string;   // Name for compendium pack
  compendiumPackLabel: string;  // Display label for compendium pack
}
```

## API Methods (Archived)

The service provided these key methods:

- `syncFromDefault()`: Sync from configured default repository
- `syncFromUrl(url)`: Sync from specific repository URL
- `getRemoteSourceInfo()`: Get information about configured remote sources
- `getInstance()`: Get singleton service instance

## Restoration Process

If you need to restore the RemoteTraitService in the future:

1. **Copy back the source files** from this directory:
   - `remote-trait-service.ts` → `scripts/services/remote-trait-service.ts`
   - `remote-trait-service.test.ts` → `tests/unit/services/remote-trait-service.test.ts`

2. **Restore the service export** in `scripts/services/index.ts`:
   ```typescript
   export { RemoteTraitService } from './remote-trait-service.js';
   ```

3. **Restore initialization manager registration** in `scripts/utils/initialization-manager.ts`:
   ```typescript
   manager.registerService('remoteTraitService', async () => {
     const { RemoteTraitService } = await import('../services/remote-trait-service.ts');
     return RemoteTraitService.getInstance();
   });
   ```

4. **Restore CLI commands** in `scripts/cli/traits.ts`:
   ```typescript
   import { RemoteTraitService, createRemoteTraitCommands } from '../services/remote-trait-service.ts';
   ```

5. **Update Jest configuration** to include the test file

6. **Run tests** to ensure compatibility with current system:
   ```bash
   npm run build:ts
   npm test
   ```

## Dependencies (Archived)

The RemoteTraitService relied on:

- **Trait domain types** from `scripts/types/domain/trait.ts`
- **CLI trait types** from `scripts/cli/traits.ts`
- **FoundryVTT compendium API** for pack creation/updates
- **Standard fetch API** for remote data retrieval

## Migration Information

**📖 For users who were using remote trait sync**: This feature has been removed from the system. All previously synced remote traits will remain in your compendium packs, but new sync operations are no longer supported. If you need this functionality, you can manually import trait data using the existing trait import tools.

## Original CLI Commands (Archived)

The service provided these CLI commands:

- `sync`: Synchronize traits from default or specified remote repository
- `info`: Display information about configured remote sources

## Contact

For questions about the RemoteTraitService or restoration process, contact the Avant VTT development team. 