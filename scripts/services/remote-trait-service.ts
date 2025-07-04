/**
 * Stub for deprecated RemoteTraitService.
 * The full implementation was moved to deprecated/remote-trait-service/.
 * 
 * @deprecated This service has been deprecated and will be removed in a future version.
 * @see deprecated/remote-trait-service/README.md for restoration instructions.
 */

// Export minimal types needed for compilation compatibility
export interface RemoteTraitConfig {
  defaultUrl: string;
  fetchTimeout: number;
  verifyIntegrity: boolean;
  createCompendiumPack: boolean;
  compendiumPackName: string;
  compendiumPackLabel: string;
}

export interface RemoteSyncResult {
  success: boolean;
  synced: number;
  skipped: number;
  failed: number;
  error?: string;
  sourceUrl?: string;
  compendiumUpdated?: boolean;
  details: RemoteSyncDetail[];
}

export interface RemoteSyncDetail {
  traitId: string;
  traitName: string;
  action: 'synced' | 'skipped' | 'failed';
  reason?: string;
  error?: string;
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
  traitCount: number;
  formatVersion?: string;
  integrityHash?: string;
}

/**
 * Deprecated stub for RemoteTraitService.
 * This service has been moved to deprecated/remote-trait-service/.
 */
export class RemoteTraitService {
  private static _instance: RemoteTraitService | undefined;
  
  constructor(config?: Partial<RemoteTraitConfig>) {
    console.warn('⚠️  RemoteTraitService has been deprecated. See deprecated/remote-trait-service/README.md for more information.');
    
    if (RemoteTraitService._instance) {
      return RemoteTraitService._instance;
    }
    
    RemoteTraitService._instance = this;
  }
  
  static getInstance(config?: Partial<RemoteTraitConfig>): RemoteTraitService {
    throw new Error(
      'RemoteTraitService has been deprecated. See deprecated/remote-trait-service/README.md for restoration instructions.'
    );
  }
  
  async syncFromDefault(): Promise<RemoteSyncResult> {
    throw new Error(
      'RemoteTraitService has been deprecated. See deprecated/remote-trait-service/README.md for restoration instructions.'
    );
  }
  
  async syncFromUrl(url: string): Promise<RemoteSyncResult> {
    throw new Error(
      'RemoteTraitService has been deprecated. See deprecated/remote-trait-service/README.md for restoration instructions.'
    );
  }
  
  async getRemoteSourceInfo(): Promise<any> {
    throw new Error(
      'RemoteTraitService has been deprecated. See deprecated/remote-trait-service/README.md for restoration instructions.'
    );
  }
}

/**
 * Deprecated stub for createRemoteTraitCommands.
 * This function has been moved to deprecated/remote-trait-service/.
 */
export function createRemoteTraitCommands(remoteService: RemoteTraitService): any {
  throw new Error(
    'createRemoteTraitCommands has been deprecated. See deprecated/remote-trait-service/README.md for restoration instructions.'
  );
} 