/**
 * @fileoverview Services Barrel Export
 * @version 1.0.0 - Stage 1: Foundation
 * @description Central export file for all service classes in the Avant system
 * @author Avant VTT Team
 */

// Trait system services
export { TraitProvider } from './trait-provider.js';
// Legacy remote trait sync service removed in Phase 3 – refer to deprecation docs for details
export { TagRegistryService } from './tag-registry-service.ts'; 